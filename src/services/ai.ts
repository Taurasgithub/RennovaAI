import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { config } from '../config';
import { accountsEnabled, supabase } from '../lib/supabase';
import type { Draft, ResultMode } from '../store/useApp';

export type GenerateResult = { mode: ResultMode; uri: string | null; message?: string };

export const aiServerConfigured = () => config.apiUrl.length > 0;

/**
 * Room photo → upload part, shrunk so its longest side is 512 px (what FLUX.2 on Workers AI expects;
 * smaller uploads are also faster on mobile data). Always JPEG, which also covers WebP/AVIF/HEIC
 * images saved from the web.
 * Phones: Expo's fetch takes { name, type, bytes() } parts ("Unsupported FormDataPart implementation"
 * for React Native's old { uri, name, type }). Web: a Blob.
 */
async function photoPart(uri: string): Promise<Blob> {
  const ctx = ImageManipulator.manipulate(uri);
  const original = await ctx.renderAsync();
  const landscape = original.width >= original.height;
  const image = await ImageManipulator.manipulate(uri).resize(landscape ? { width: 512 } : { height: 512 }).renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.88 });
  if (Platform.OS === 'web') return (await fetch(saved.uri)).blob();
  const file = new File(saved.uri);
  return { name: 'room.jpg', type: 'image/jpeg', bytes: () => file.bytes() } as unknown as Blob;
}

/**
 * Generates the renovated-room preview.
 *  - Sample room (no photo)       → vector illustration rendered on-device.
 *  - Photo + API server configured → photorealistic AI render via /server.
 *  - Photo, no server             → on-device colour preview (labelled in the UI).
 */
export async function generateDesign(draft: Draft, seed = 0): Promise<GenerateResult> {
  if (!draft.photoUri) return { mode: 'illustration', uri: null };
  if (!aiServerConfigured()) {
    await new Promise((r) => setTimeout(r, 1400));
    return { mode: 'preview', uri: null, message: 'Preview mode — connect the RennovaAI server for photorealistic renders.' };
  }

  const form = new FormData();
  const part = await photoPart(draft.photoUri);
  if (Platform.OS === 'web') form.append('image', part, 'room.jpg');
  else form.append('image', part);
  const { photoUri, ...choices } = draft;
  form.append('choices', JSON.stringify({ ...choices, seed }));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);
  try {
    // The AI API only serves signed-in users (worker/src/index.js checks this token with Supabase).
    const token = accountsEnabled() ? (await supabase.auth.getSession()).data.session?.access_token : undefined;
    const res = await fetch(`${config.apiUrl}/api/visualize`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const json = (await res.json()) as { image?: string; error?: string };
    if (!res.ok || !json.image) throw new Error(json.error ?? `Server error ${res.status}`);
    return { mode: 'ai', uri: json.image };
  } finally {
    clearTimeout(timer);
  }
}
