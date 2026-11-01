// Web: the browser's own localStorage (expo-sqlite on web would need extra cross-origin headers).
export const authStorage = typeof window !== 'undefined' ? window.localStorage : undefined;
