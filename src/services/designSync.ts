import { dropImage, readImageBytes, saveRemoteImage } from '../lib/images';
import { supabase } from '../lib/supabase';
import { useApp, type Design } from '../store/useApp';

/**
 * Keeps the customer's saved designs in their account (table `designs`, private bucket `designs`),
 * so they survive a reinstall or a new phone and can be shown to a booked vendor.
 * The phone's store stays the working copy; changes are pushed in the background.
 */

let userId: string | null = null;
let unsubscribe: (() => void) | null = null;
/** Last row pushed per design, to skip uploads when nothing that matters changed. */
const pushed = new Map<string, string>();

const row = (d: Design, photoPath: string | null, resultPath: string | null) => ({
  id: d.id,
  name: d.name,
  name_parts: d.nameParts ?? null,
  choices: d.choices,
  photo_path: photoPath,
  result_path: resultPath,
  result_mode: d.resultMode,
  regenerations: d.regenerations,
  premium: d.premium,
  estimate: d.estimate,
  created_at: d.createdAt,
  updated_at: new Date().toISOString(),
});

async function upload(uid: string, designId: string, kind: 'photo' | 'result', uri: string) {
  const path = `${uid}/${designId}/${kind}-${Date.now()}.jpg`;
  const bytes = await readImageBytes(uri);
  const { error } = await supabase.storage.from('designs').upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  if (error) throw new Error(error.message);
  return path;
}

async function push(d: Design) {
  const uid = userId;
  if (!uid) return;
  const r = d.remote ?? { photoPath: null, resultPath: null, photoUri: null, resultUri: null };
  const key = JSON.stringify([d.photoUri, d.resultUri, d.choices, d.regenerations, d.premium, d.resultMode, d.name]);
  if (pushed.get(d.id) === key) return;
  pushed.set(d.id, key);
  try {
    const stale: string[] = [];
    let { photoPath, resultPath } = r;
    if (d.photoUri !== r.photoUri) {
      if (photoPath) stale.push(photoPath);
      photoPath = d.photoUri ? await upload(uid, d.id, 'photo', d.photoUri) : null;
    }
    if (d.resultUri !== r.resultUri) {
      if (resultPath) stale.push(resultPath);
      resultPath = d.resultUri ? await upload(uid, d.id, 'result', d.resultUri) : null;
    }
    const { error } = await supabase.from('designs').upsert(row(d, photoPath, resultPath));
    if (error) throw new Error(error.message);
    if (stale.length) await supabase.storage.from('designs').remove(stale);
    if (userId === uid && (photoPath !== r.photoPath || resultPath !== r.resultPath || !d.remote)) {
      useApp.getState().updateDesign(d.id, { remote: { photoPath, resultPath, photoUri: d.photoUri, resultUri: d.resultUri } });
    }
  } catch (e) {
    pushed.delete(d.id); // try again on the next change or sign-in
    console.warn('[designSync] push failed', e);
  }
}

async function remove(id: string) {
  const uid = userId;
  if (!uid) return;
  pushed.delete(id);
  const { data } = await supabase.storage.from('designs').list(`${uid}/${id}`);
  if (data?.length) await supabase.storage.from('designs').remove(data.map((f) => `${uid}/${id}/${f.name}`));
  await supabase.from('designs').delete().eq('id', id);
}

type DesignRow = ReturnType<typeof row>;

/** Downloads designs saved on another phone, then uploads any that exist only on this one. */
async function pull(uid: string) {
  const { data, error } = await supabase.from('designs').select('*').order('created_at', { ascending: false });
  if (error || userId !== uid) return;
  const local = useApp.getState().designs;
  const missing = ((data ?? []) as DesignRow[]).filter((r) => !local.some((d) => d.id === r.id));
  const paths = missing.flatMap((r) => [r.photo_path, r.result_path]).filter((p): p is string => !!p);
  const signed = paths.length ? (await supabase.storage.from('designs').createSignedUrls(paths, 600)).data ?? [] : [];
  const url = (p: string | null) => (p ? signed.find((s) => s.path === p)?.signedUrl ?? null : null);
  const restored: Design[] = [];
  for (const r of missing) {
    try {
      const photoUri = url(r.photo_path) ? await saveRemoteImage(url(r.photo_path)!) : null;
      const resultUri = url(r.result_path) ? await saveRemoteImage(url(r.result_path)!) : null;
      const d: Design = {
        id: r.id,
        name: r.name,
        nameParts: r.name_parts ?? undefined,
        createdAt: r.created_at,
        choices: r.choices,
        photoUri,
        resultUri,
        resultMode: r.result_mode,
        regenerations: r.regenerations,
        premium: r.premium,
        estimate: r.estimate,
        remote: { photoPath: r.photo_path, resultPath: r.result_path, photoUri, resultUri },
      };
      pushed.set(d.id, JSON.stringify([d.photoUri, d.resultUri, d.choices, d.regenerations, d.premium, d.resultMode, d.name]));
      restored.push(d);
    } catch (e) {
      console.warn('[designSync] restore failed', r.id, e);
    }
  }
  if (userId !== uid) return restored.forEach((d) => { dropImage(d.photoUri); dropImage(d.resultUri); });
  if (restored.length) useApp.getState().addDesigns(restored);
  const remoteIds = new Set(((data ?? []) as DesignRow[]).map((r) => r.id));
  for (const d of useApp.getState().designs) if (!remoteIds.has(d.id) || !d.remote) await push(d);
}

/** Called by AuthProvider when a customer signs in (uid) or out (null). */
export function startDesignSync(uid: string | null) {
  if (uid && uid === userId && unsubscribe) return; // already syncing this account
  unsubscribe?.();
  unsubscribe = null;
  pushed.clear();
  userId = uid;
  if (!uid) return;
  unsubscribe = useApp.subscribe((s, prev) => {
    if (s.designs === prev.designs || userId !== uid) return;
    for (const d of s.designs) if (!prev.designs.includes(d)) push(d);
    for (const d of prev.designs) if (!s.designs.some((x) => x.id === d.id)) remove(d.id);
  });
  pull(uid);
}

/** Makes sure a design (and its current images) is in the account; returns the stored image paths. */
export async function ensureSynced(id: string): Promise<{ photoPath: string | null; resultPath: string | null }> {
  const d = useApp.getState().designs.find((x) => x.id === id);
  if (!d) return { photoPath: null, resultPath: null };
  const current = d.remote && d.remote.photoUri === d.photoUri && d.remote.resultUri === d.resultUri;
  if (!current) {
    pushed.delete(id);
    await push(d);
  }
  const r = useApp.getState().designs.find((x) => x.id === id)?.remote;
  return { photoPath: r?.photoPath ?? null, resultPath: r?.resultPath ?? null };
}
