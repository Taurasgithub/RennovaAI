// Native: SQLite-backed localStorage so the session survives app restarts (per Expo's Supabase guide).
import 'expo-sqlite/localStorage/install';

export const authStorage = globalThis.localStorage;
