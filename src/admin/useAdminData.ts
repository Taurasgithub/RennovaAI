import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { supabase, type AccountStatus, type Profile, type Role, type VendorProfile } from '../lib/supabase';

/**
 * Admin data + actions. Reads every profile and vendor application (allowed only for admins by
 * row-level security) and reloads whenever an admin screen comes into focus.
 * Rows are fetched in pages, so nothing is silently cut off; the screens render them in virtualized lists.
 */

const PAGE = 1000; // Supabase's default maximum rows per request

/** Every row of an admin-readable table, newest first, in pages of PAGE. */
async function fetchAll<T>(table: 'profiles' | 'vendor_profiles', orderBy: string): Promise<{ rows: T[]; error: string }> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select('*').order(orderBy, { ascending: false }).range(from, from + PAGE - 1);
    if (error) return { rows, error: error.message };
    rows.push(...((data as T[]) ?? []));
    if (!data || data.length < PAGE) return { rows, error: '' };
  }
}
export function useAdminData() {
  const { profile: me } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setError('');
    const [p, v] = await Promise.all([fetchAll<Profile>('profiles', 'created_at'), fetchAll<VendorProfile>('vendor_profiles', 'submitted_at')]);
    if (p.error || v.error) setError(p.error || v.error);
    setProfiles(p.rows);
    setVendors(v.rows);
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

  // Actions keep the same identity between renders, so memoized list rows don't re-render on every reload.
  const meId = me?.id;
  const actions = useMemo(() => {
    const review = () => ({ reviewed_at: new Date().toISOString(), reviewed_by: meId ?? null });
    return {
      approveVendor: (userId: string) =>
        run(supabase.from('vendor_profiles').update({ status: 'approved', verification_step: 4, review_note: null, ...review() }).eq('user_id', userId)),
      rejectVendor: (userId: string, note: string) =>
        run(supabase.from('vendor_profiles').update({ status: 'rejected', review_note: note.trim() || null, ...review() }).eq('user_id', userId)),
      reopenVendor: (userId: string) => run(supabase.from('vendor_profiles').update({ status: 'pending', ...review() }).eq('user_id', userId)),
      advanceVendor: (v: VendorProfile) =>
        run(supabase.from('vendor_profiles').update({ verification_step: Math.min(4, v.verification_step + 1), ...review() }).eq('user_id', v.user_id)),
      setRole: (userId: string, role: Role) => run(supabase.from('profiles').update({ role }).eq('id', userId)),
      setStatus: (userId: string, status: AccountStatus) => run(supabase.from('profiles').update({ status }).eq('id', userId)),
    };
  }, [run, meId]);

  return { me, profiles, vendors, loading, error, reload, actions, ...actions };
}

export type AdminActions = ReturnType<typeof useAdminData>['actions'];
