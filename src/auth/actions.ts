import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase, type Role } from '../lib/supabase';
import { PENDING_ROLE_KEY } from './AuthProvider';

/** `error` is either a known code (see AUTH_ERRORS) the UI translates, or Supabase's own message. */
export type AuthResult = { error?: string; needsConfirmation?: boolean };

export const AUTH_ERRORS = ['network', 'invalid_credentials', 'user_already_exists', 'email_not_confirmed', 'over_email_send_rate_limit', 'provider_disabled'] as const;

function fail(error: { message: string; code?: string; status?: number }): AuthResult {
  if (error.status === 0 || /failed to fetch|network request failed|load failed/i.test(error.message)) return { error: 'network' };
  if (/provider is not enabled|unsupported provider|unacceptable audience|invalid audience/i.test(error.message)) return { error: 'provider_disabled' };
  if (error.code && (AUTH_ERRORS as readonly string[]).includes(error.code)) return { error: error.code };
  return { error: error.message };
}

/** Where OAuth providers send the user back: rennovaai://auth/callback in the app, /auth/callback on the web. */
const redirectUrl = () =>
  Platform.OS === 'web' && typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : Linking.createURL('auth/callback');

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return error ? fail(error) : {};
}

export async function signUpWithEmail(email: string, password: string, role: Exclude<Role, 'admin'>): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    // Read by the handle_new_user trigger; the database ignores anything other than customer/vendor.
    options: { data: { role }, emailRedirectTo: redirectUrl() },
  });
  if (error) return fail(error);
  // With "Confirm email" on (Supabase default) there is no session until the link is clicked.
  return { needsConfirmation: !data.session };
}

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectUrl() });
  return error ? fail(error) : {};
}

/**
 * Apple: the native Sign in with Apple sheet on iOS (identity token → Supabase), the web OAuth flow
 * elsewhere (Apple has no native sign-in on Android or web).
 */
export async function signInWithApple(role: Exclude<Role, 'admin'>): Promise<AuthResult> {
  if (Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync())) {
    await AsyncStorage.setItem(PENDING_ROLE_KEY, role);
    // Apple gets the SHA-256 of a random nonce; Supabase gets the raw value and checks they match (blocks token replay).
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
    let credential: AppleAuthentication.AppleAuthenticationCredential;
    try {
      credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
        nonce: hashedNonce,
      });
    } catch (e) {
      if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return {};
      return { error: e instanceof Error ? e.message : 'Apple sign-in failed.' };
    }
    if (!credential.identityToken) return { error: 'Apple did not return a sign-in token.' };
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken, nonce: rawNonce });
    if (error) return fail(error);
    // Apple shares the name only on the very first sign-in; keep it so the profile step can pre-fill it.
    const fullName = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ');
    if (fullName) await supabase.auth.updateUser({ data: { full_name: fullName } });
    return {};
  }
  return signInWithProvider('apple', role);
}

/** Google / Apple via Supabase OAuth (PKCE). The provider must be enabled in the Supabase dashboard. */
export async function signInWithProvider(provider: 'google' | 'apple', role: Exclude<Role, 'admin'>): Promise<AuthResult> {
  await AsyncStorage.setItem(PENDING_ROLE_KEY, role);
  const redirectTo = redirectUrl();

  if (Platform.OS === 'web') {
    // Full-page redirect; /auth/callback finishes the sign-in.
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    return error ? fail(error) : {};
  }

  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
  if (error || !data.url) return error ? fail(error) : { error: 'network' };
  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== 'success') return {}; // user closed the browser
  const params = new URL(res.url).searchParams;
  const code = params.get('code');
  if (!code) return { error: params.get('error_description') ?? 'Sign-in was cancelled.' };
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  return exchangeError ? fail(exchangeError) : {};
}
