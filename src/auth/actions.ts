import AsyncStorage from '@react-native-async-storage/async-storage';
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
  if (/provider is not enabled|unsupported provider/i.test(error.message)) return { error: 'provider_disabled' };
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
