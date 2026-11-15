import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { uid } from './id';

/**
 * Where design photos and AI renders live, so the saved store only holds a short reference.
 *  - Phone: a JPEG file in the app's document folder (the picker's cache copy can be wiped by the OS).
 *  - Web: a compressed data URI. Picked photos arrive as `blob:` URLs, which die on reload, and the
 *    store itself lives in IndexedDB on the web (see storage.ts), which has room for these.
 */
const folder = () => new Directory(Paths.document, 'designs');
const ours = (uri: string) => Platform.OS !== 'web' && uri.startsWith(folder().uri);

/** Web: a freshly picked photo → compressed JPEG data URI that survives reloads. Phone: unchanged. */
export async function preparePhoto(uri: string): Promise<string> {
  if (Platform.OS !== 'web' || uri.startsWith('data:')) return uri;
  const image = await ImageManipulator.manipulate(uri).resize({ width: 1280 }).renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: true });
  return `data:image/jpeg;base64,${saved.base64}`;
}

/** Makes an image permanent for a saved design and returns the URI to store. Remote http(s) URLs are kept as they are. */
export async function keepImage(uri: string | null): Promise<string | null> {
  if (!uri || Platform.OS === 'web' || /^https?:/.test(uri) || ours(uri)) return uri;
  const dir = folder();
  dir.create({ intermediates: true, idempotent: true });
  const file = new File(dir, `${uid()}.jpg`);
  const m = /^data:[^;]+;base64,(.*)$/s.exec(uri);
  if (m) await file.write(m[1], { encoding: 'base64' });
  else await new File(uri).copy(file);
  return file.uri;
}

/** The raw bytes of a stored image (file or data URI), for uploading. */
export async function readImageBytes(uri: string): Promise<Uint8Array> {
  if (Platform.OS !== 'web' && uri.startsWith('file:')) return new File(uri).bytes();
  return new Uint8Array(await (await fetch(uri)).arrayBuffer());
}

/** Downloads an image (e.g. a signed Supabase URL) so it is stored like a locally created one. */
export async function saveRemoteImage(url: string): Promise<string> {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(url)).blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
  const dir = folder();
  dir.create({ intermediates: true, idempotent: true });
  const file = await File.downloadFileAsync(url, new File(dir, `${uid()}.jpg`));
  return file.uri;
}

/** Deletes a stored image file (phone only; web images are part of the store and go with it). */
export function dropImage(uri: string | null | undefined) {
  if (!uri || !ours(uri)) return;
  try {
    new File(uri).delete();
  } catch {
    // Already gone.
  }
}

/** Deletes every stored design image (sign-out / delete my data). */
export function dropAllImages() {
  if (Platform.OS === 'web') return;
  try {
    const dir = folder();
    if (dir.exists) dir.delete();
  } catch {
    // Nothing to remove.
  }
}
