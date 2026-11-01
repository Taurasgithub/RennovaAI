import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { supabase, type AccountStatus, type Profile, type Role, type VendorProfile } from '../lib/supabase';

/**
 * Admin data + actions. Reads every profile and vendor application (allowed only for admins by
 * row-level security) and reloads whenever an admin screen comes into focus.
 */
export function useAdminData() {
  const { profile: me } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setError('');
    const [p, v] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('vendor_profiles').select('*').order('submitted_at', { ascending: false }).limit(500),
    ]);
    if (p.error || v.error) setError((p.error ?? v.error)!.message);
    setProfiles((p.data as Profile[]) ?? []);
    setVendors((v.data as VendorProfile[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const run = useCallback(
    async (op: PromiseLike<{ error: { message: string } | null }>) => {
      const { error: err } = await op;
      if (err) setError(err.message);
      await reload();
      return !err;
    },
    [reload],
  );

  const review = { reviewed_at: new Date().toISOString(), reviewed_by: me?.id ?? null };

  return {
    me,
    profiles,
    vendors,
    loading,
    error,
    reload,
    approveVendor: (userId: string) =>
      run(supabase.from('vendor_profiles').update({ status: 'approved', verification_step: 4, review_note: null, ...review }).eq('user_id', userId)),
    rejectVendor: (userId: string, note: string) =>
      run(supabase.from('vendor_profiles').update({ status: 'rejected', review_note: note.trim() || null, ...review }).eq('user_id', userId)),
    reopenVendor: (userId: string) => run(supabase.from('vendor_profiles').update({ status: 'pending', ...review }).eq('user_id', userId)),
    advanceVendor: (v: VendorProfile) =>
      run(supabase.from('vendor_profiles').update({ verification_step: Math.min(4, v.verification_step + 1), ...review }).eq('user_id', v.user_id)),
    setRole: (userId: string, role: Role) => run(supabase.from('profiles').update({ role }).eq('id', userId)),
    setStatus: (userId: string, status: AccountStatus) => run(supabase.from('profiles').update({ status }).eq('id', userId)),
  };
}
