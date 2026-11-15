import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

/**
 * Storage for the persisted app store.
 * Phone: AsyncStorage. Web: IndexedDB, because localStorage stops at ~5 MB and saved designs carry images.
 * Data already in localStorage (older versions) is moved across on first read.
 */
const DB = 'rennovaai';
const STORE = 'kv';

let dbPromise: Promise<IDBDatabase> | null = null;
const db = () =>
  (dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));

const run = <T,>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) =>
  db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(d.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );

const indexedDbStorage: StateStorage = {
  getItem: async (name) => {
    const value = await run<string | undefined>('readonly', (s) => s.get(name));
    if (value != null) return value;
    const legacy = globalThis.localStorage?.getItem(name) ?? null;
    if (legacy != null) {
      await run('readwrite', (s) => s.put(legacy, name));
      globalThis.localStorage.removeItem(name);
    }
    return legacy;
  },
  setItem: async (name, value) => {
    await run('readwrite', (s) => s.put(value, name));
  },
  removeItem: async (name) => {
    await run('readwrite', (s) => s.delete(name));
  },
};

const canUseIndexedDb = Platform.OS === 'web' && typeof indexedDB !== 'undefined';

export const appStorage: StateStorage = canUseIndexedDb ? indexedDbStorage : AsyncStorage;
