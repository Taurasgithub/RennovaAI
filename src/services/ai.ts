import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { config } from '../config';
import type { Draft, ResultMode } from '../store/useApp';

export type GenerateResult = { mode: ResultMode; uri: string | null; message?: string };

export const aiServerConfigured = () => config.apiUrl.length > 0;

/**
 * Phone photo → upload part for Expo's fetch.
 * Expo's fetch (SDK 52+) no longer accepts React Native's { uri, name, type } parts
 * ("Unsupported FormDataPart implementation"); it takes anything with name, type and bytes().
 * Converting to JPEG also handles WebP/AVIF/HEIC images (e.g. saved from Google), which the
 * server only accepts as JPG/PNG/WEBP, and shrinks large photos before uploading.
 */
async function jpegUpload(uri: string) {
  const image = await ImageManipulator.manipulate(uri).resize({ width: 1280 }).renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
  const file = new File(saved.uri);
  return { name: 'room.jpg', type: 'image/jpeg', bytes: () => file.bytes() };
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
  if (Platform.OS === 'web') {
    const blob = await (await fetch(draft.photoUri)).blob();
    form.append('image', blob, 'room.jpg');
  } else {
    form.append('image', (await jpegUpload(draft.photoUri)) as unknown as Blob);
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
