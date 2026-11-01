import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { accountsEnabled, supabase, type Profile, type Role, type VendorProfile } from '../lib/supabase';
import { useApp } from '../store/useApp';

// Role picked on the Welcome screen before an OAuth redirect (Google/Apple can't carry sign-up metadata).
export const PENDING_ROLE_KEY = 'rennovaai.pendingRole';

type AuthState = {
  /** False when Supabase isn't configured: the app then runs in on-device mode with no sign-in. */
  enabled: boolean;
  /** True once the stored session (if any) and its profile have been loaded. */
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  vendor: VendorProfile | null;
  /** Set when a suspended account was signed out, so the Welcome screen can explain why. */
  notice: 'suspended' | null;
  refresh: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<Profile, 'full_name' | 'phone' | 'city' | 'role'>>) => Promise<string | null>;
  signOut: () => Promise<void>;
  clearNotice: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Clears on-device designs/projects so the next account on this phone starts clean; keeps the language. */
function resetLocalData() {
  const { language, resetAll, setLanguage } = useApp.getState();
  resetAll();
  setLanguage(language);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const enabled = accountsEnabled();
  const [ready, setReady] = useState(!enabled);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [notice, setNotice] = useState<'suspended' | null>(null);
  const userId = useRef<string | null>(null);

  const load = useCallback(async (s: Session | null) => {
    setSession(s);
    userId.current = s?.user.id ?? null;
    if (!s) {
      setProfile(null);
      setVendor(null);
      setReady(true);
      return;
    }
    const [{ data: p }, { data: v }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', s.user.id).maybeSingle<Profile>(),
      supabase.from('vendor_profiles').select('*').eq('user_id', s.user.id).maybeSingle<VendorProfile>(),
    ]);
    if (userId.current !== s.user.id) return; // signed out / switched while loading

    let prof = p ?? null;
    if (prof?.status === 'suspended') {
      setNotice('suspended');
      await supabase.auth.signOut();
      return;
    }
    // Brand-new OAuth account that chose "service vendor" before the redirect.
    const pending = (await AsyncStorage.getItem(PENDING_ROLE_KEY)) as Role | null;
    if (pending) await AsyncStorage.removeItem(PENDING_ROLE_KEY);
    if (prof && pending === 'vendor' && prof.role === 'customer' && !prof.full_name) {
      const { data } = await supabase.from('profiles').update({ role: 'vendor' }).eq('id', prof.id).select().single<Profile>();
      if (data) prof = data;
    }

    setProfile(prof);
    setVendor(v ?? null);
    // Customer screens read name/phone/city from the local store.
    if (prof?.full_name) {
      const app = useApp.getState();
      app.setUser({ name: prof.full_name, phone: prof.phone, city: prof.city });
      app.completeOnboarding();
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    supabase.auth.getSession().then(({ data }) => load(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      // TOKEN_REFRESHED keeps the same user — no need to refetch the profile.
      if (event === 'TOKEN_REFRESHED' && s?.user.id === userId.current) return setSession(s);
      if (event === 'SIGNED_OUT') resetLocalData();
      // Supabase advises against awaiting other Supabase calls inside this callback.
      setTimeout(() => load(s), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [enabled, load]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await load(data.session);
  }, [load]);

  const updateProfile = useCallback<AuthState['updateProfile']>(
    async (patch) => {
      if (!profile) return 'not-signed-in';
      const { data, error } = await supabase.from('profiles').update(patch).eq('id', profile.id).select().single<Profile>();
      if (error) return error.message;
      setProfile(data);
      if (data.full_name) useApp.getState().setUser({ name: data.full_name, phone: data.phone, city: data.city });
      return null;
    },
    [profile],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthState>(
    () => ({ enabled, ready, session, profile, vendor, notice, refresh, updateProfile, signOut, clearNotice: () => setNotice(null) }),
    [enabled, ready, session, profile, vendor, notice, refresh, updateProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
