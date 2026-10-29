import { Platform } from 'react-native';
import type { DevicePreviewStorage } from './types';

let cached: DevicePreviewStorage | null | undefined;

/** `localStorage` on web; null (in-memory only) elsewhere. Stable across calls. */
export function defaultStorage(): DevicePreviewStorage | null {
  if (cached === undefined) cached = createDefaultStorage();
  return cached;
}

function createDefaultStorage(): DevicePreviewStorage | null {
  if (Platform.OS !== 'web') return null;
  try {
    const ls = (globalThis as { localStorage?: Storage }).localStorage;
    if (!ls) return null;
    return {
      getItem: (key) => ls.getItem(key),
      setItem: (key, value) => ls.setItem(key, value),
    };
  } catch {
    return null;
  }
}
