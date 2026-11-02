import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export type Bucket = 'avatars' | 'vendor-media';

/** Opens the photo library; returns the picked image's local uri, or null if cancelled. */
export async function pickImage(aspect: [number, number] = [1, 1]): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect });
  return res.canceled ? null : res.assets[0]?.uri ?? null;
}

/**
 * Uploads a local image to Supabase Storage under `<userId>/<name>-<timestamp>.<ext>` (the storage
 * policies only allow writing into your own folder) and returns its public URL.
 */
export async function uploadImage(bucket: Bucket, userId: string, name: string, uri: string): Promise<string> {
  const blob = await (await fetch(uri)).blob();
  const contentType = blob.type || 'image/jpeg';
  const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  // Timestamped path so a replaced photo gets a new URL and caches don't show the old one.
  const path = `${userId}/${name}-${Date.now()}.${ext}`;
  const body = await blob.arrayBuffer();
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType, upsert: true });
  if (error) throw new Error(error.message);
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
