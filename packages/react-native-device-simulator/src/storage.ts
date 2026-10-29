import { Platform } from 'react-native';
import type { DeviceSimulatorStorage } from './types';

let cached: DeviceSimulatorStorage | null | undefined;

/** `localStorage` on web; null (in-memory only) elsewhere. Stable across calls. */
export function defaultStorage(): DeviceSimulatorStorage | null {
  if (cached === undefined) cached = createDefaultStorage();
  return cached;
}

function createDefaultStorage(): DeviceSimulatorStorage | null {
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
