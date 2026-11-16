import { supabase } from '../lib/supabase';
import { startDesignSync } from './designSync';

/** Every file path the user owns in a bucket (their folder, one level of subfolders for designs). */
async function listOwn(bucket: string, uid: string): Promise<string[]> {
  const { data } = await supabase.storage.from(bucket).list(uid, { limit: 1000 });
  const paths: string[] = [];
  for (const item of data ?? []) {
    // Folders come back without an id.
    if (item.id) paths.push(`${uid}/${item.name}`);
    else {
      const { data: inner } = await supabase.storage.from(bucket).list(`${uid}/${item.name}`, { limit: 1000 });
      for (const f of inner ?? []) paths.push(`${uid}/${item.name}/${f.name}`);
    }
  }
  return paths;
}

/**
 * Permanently deletes the signed-in account: stored photos first, then the account itself
 * (profile, designs, bookings as customer and chat cascade in the database). Signs out afterwards.
 * Required by Google Play for apps that let people create accounts.
 */
export async function deleteAccount(): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error('not signed in');
  startDesignSync(null); // stop pushing while everything is removed
  for (const bucket of ['designs', 'avatars', 'vendor-media']) {
    const paths = await listOwn(bucket, uid);
    if (paths.length) await supabase.storage.from(bucket).remove(paths);
  }
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw new Error(error.message);
  await supabase.auth.signOut().catch(() => {});
}
