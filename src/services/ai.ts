import { Platform } from 'react-native';
import { config } from '../config';
import type { Draft, ResultMode } from '../store/useApp';

export type GenerateResult = { mode: ResultMode; uri: string | null; message?: string };

export const aiServerConfigured = () => config.apiUrl.length > 0;

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
  if (Platform.OS === 'web') {
    const blob = await (await fetch(draft.photoUri)).blob();
    form.append('image', blob, 'room.jpg');
  } else {
    // React Native's FormData accepts { uri, name, type } file descriptors.
    form.append('image', { uri: draft.photoUri, name: 'room.jpg', type: 'image/jpeg' } as unknown as Blob);
  }
  const { photoUri, ...choices } = draft;
  form.append('choices', JSON.stringify({ ...choices, seed }));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);
  try {
    const res = await fetch(`${config.apiUrl}/api/visualize`, { method: 'POST', body: form, signal: controller.signal });
    const json = (await res.json()) as { image?: string; error?: string };
    if (!res.ok || !json.image) throw new Error(json.error ?? `Server error ${res.status}`);
    return { mode: 'ai', uri: json.image };
  } finally {
    clearTimeout(timer);
  }
}
