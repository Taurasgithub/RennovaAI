import { createClient } from '@supabase/supabase-js';
import * as ExpoCrypto from 'expo-crypto';
import { AppState, Platform } from 'react-native';
import { config } from '../config';
import { authStorage } from './authStorage';

export type Role = 'customer' | 'vendor' | 'admin';
export type AccountStatus = 'active' | 'suspended';
export type VendorStatus = 'pending' | 'approved' | 'rejected';

/** Row of public.profiles (see supabase/migrations). */
export type Profile = {
  id: string;
  email: string;
  role: Role;
  full_name: string;
  phone: string;
  city: string;
  status: AccountStatus;
  created_at: string;
  // Personal profile (0002_profiles.sql)
  avatar_url: string | null;
  bio: string;
  area: string;
  preferred_styles: string[];
  budget_range: BudgetRange | null;
  job_title: string;
};

export type BudgetRange = 'lt100k' | '100k_300k' | '300k_500k' | 'gt500k';
export const BUDGET_RANGES: BudgetRange[] = ['lt100k', '100k_300k', '300k_500k', 'gt500k'];

/** Row of public.vendor_profiles. */
export type VendorProfile = {
  user_id: string;
  business_name: string;
  owner_name: string;
  phone: string;
  city: string;
  services: string[];
  years_experience: number | null;
  about: string;
  status: VendorStatus;
  verification_step: number;
  review_note: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  // Public business profile (0002_profiles.sql)
  logo_url: string | null;
  cover_url: string | null;
  service_areas: string[];
  working_hours: string;
  whatsapp: string;
  portfolio_urls: string[];
};

/** Accounts are on when the Supabase URL and publishable key are set in .env; otherwise the app runs on-device only. */
export const accountsEnabled = () => config.supabaseUrl.length > 0 && config.supabaseKey.length > 0;

// Phones (Hermes) have crypto.getRandomValues but no crypto.subtle, so sign-in would fall back to the
// weaker "plain" PKCE method. Expo's native SHA-256 lets Supabase use S256, as on the web.
if (Platform.OS !== 'web' && typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.subtle === 'undefined') {
  Object.defineProperty(globalThis.crypto, 'subtle', {
    value: { digest: (algorithm: string, data: BufferSource) => ExpoCrypto.digest(algorithm as ExpoCrypto.CryptoDigestAlgorithm, data) },
    configurable: true,
  });
}

export const supabase = createClient(config.supabaseUrl || 'http://localhost', config.supabaseKey || 'missing-key', {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce', // OAuth returns ?code=… which auth/callback exchanges for a session
  },
});

// Only refresh tokens while the app is in the foreground (Expo's recommendation for mobile).
if (Platform.OS !== 'web' && accountsEnabled()) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
