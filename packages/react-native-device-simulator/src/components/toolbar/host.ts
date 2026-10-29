import { useSyncExternalStore } from 'react';
import { Dimensions, Platform } from 'react-native';
import { getRealDimensions } from '../../environment';
import { deviceSimulator } from '../../core/store';
import type { DevicePreset, EdgeInsets, Size } from '../../types';

type SafeAreaModule = typeof import('react-native-safe-area-context');

const ZERO: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };

let hostInsets: EdgeInsets = ZERO;
if (Platform.OS !== 'web') {
  try {
    // Optional peer dependency. The initial metrics are the REAL host insets
    // (the simulated ones are only provided inside the device screen).
    const SafeArea = require('react-native-safe-area-context') as SafeAreaModule;
    hostInsets = SafeArea.initialWindowMetrics?.insets ?? ZERO;
  } catch {
    hostInsets = ZERO;
  }
}

/** Safe area of the real host window, so the toolbar avoids notches and home indicators. */
export function getHostInsets(): EdgeInsets {
  return hostInsets;
}

/** Every device the picker offers, updated when presets are registered. */
export function useDevicePresets(): readonly DevicePreset[] {
  return useSyncExternalStore(deviceSimulator.subscribe, deviceSimulator.getPresets, deviceSimulator.getPresets);
}

let windowSnapshot: Size = { width: 0, height: 0 };
function getWindowSnapshot(): Size {
  const { width, height } = getRealDimensions('window');
  if (width !== windowSnapshot.width || height !== windowSnapshot.height) windowSnapshot = { width, height };
  return windowSnapshot;
}

/** Assumed during server rendering and hydration (a desktop browser window). */
const SERVER_WINDOW: Size = { width: 1024, height: 768 };
const getServerWindow = () => SERVER_WINDOW;

function subscribeToWindow(onChange: () => void): () => void {
  // The listener may receive simulated metrics; it is only used as a signal.
  const sub = Dimensions.addEventListener('change', onChange);
  return () => sub?.remove();
}

/**
 * The REAL host window size (never the simulated one). Hydration-safe: uses a
 * fixed size while hydrating server-rendered HTML.
 */
export function useRealWindowSize(): Size {
  return useSyncExternalStore(subscribeToWindow, getWindowSnapshot, getServerWindow);
}
