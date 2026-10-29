import { Dimensions } from 'react-native';
import { patchProperty } from './patch';

export interface DisplayMetrics {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

export interface DimensionsOverride {
  window: DisplayMetrics;
  screen: DisplayMetrics;
}

type Payload = { window: DisplayMetrics; screen: DisplayMetrics };
type Handler = (payload: Payload) => void;
type Subscription = { remove(): void };

// Loosely typed view of the Dimensions module so it can be patched on both
// react-native and react-native-web (which also has `removeEventListener`).
interface PatchableDimensions {
  get(dim: string): DisplayMetrics;
  addEventListener(type: 'change', handler: Handler): Subscription | undefined;
  removeEventListener?(type: 'change', handler: Handler): void;
}

interface Entry {
  handler: Handler;
  wrapped: Handler;
  active: boolean;
}

const D = Dimensions as unknown as PatchableDimensions;

let installed = false;
let override: DimensionsOverride | null = null;
let originalGet: PatchableDimensions['get'] = (dim) => D.get(dim);
const entries = new Set<Entry>();
/** What listeners were last told (null until the first notification). */
let lastNotified: Payload | null = null;

/** The host's real window/screen metrics, unaffected by the simulation. */
export function getRealDimensions(dim: 'window' | 'screen'): DisplayMetrics {
  return originalGet(dim);
}

function realPayload(): Payload {
  return { window: originalGet('window'), screen: originalGet('screen') };
}

/**
 * Routes `Dimensions.get`, `useWindowDimensions` and `PixelRatio` through the
 * simulation. Idempotent.
 */
export function installDimensionsPatch(): void {
  if (installed) return;
  installed = true;
  const get = D.get.bind(D);
  const add = D.addEventListener.bind(D);
  const remove = D.removeEventListener?.bind(D);
  originalGet = get;

  patchProperty(D, 'get', (dim: string) => {
    if (override && (dim === 'window' || dim === 'screen')) return override[dim];
    return get(dim);
  });

  patchProperty(D, 'addEventListener', (type: 'change', handler: Handler): Subscription => {
    const entry: Entry = {
      handler,
      active: true,
      // Real changes (host window resize) reach the app as the simulated
      // metrics while a simulation is active.
      wrapped: (payload) => {
        if (!entry.active) return;
        if (!override) lastNotified = payload;
        handler(override ?? payload);
      },
    };
    entries.add(entry);
    const sub = add(type, entry.wrapped);
    return {
      remove() {
        if (!entry.active) return;
        entry.active = false;
        entries.delete(entry);
        if (sub && typeof sub.remove === 'function') sub.remove();
        else remove?.(type, entry.wrapped);
      },
    };
  });

  if (remove) {
    // react-native-web still supports the legacy `removeEventListener`.
    patchProperty(D, 'removeEventListener', (type: 'change', handler: Handler) => {
      const entry = Array.from(entries).find((e) => e.handler === handler);
      if (!entry) {
        remove(type, handler);
        return;
      }
      entry.active = false;
      entries.delete(entry);
      remove(type, entry.wrapped);
    });
  }
}

function sameMetrics(a: DisplayMetrics, b: DisplayMetrics) {
  return a.width === b.width && a.height === b.height && a.scale === b.scale && a.fontScale === b.fontScale;
}

function samePayload(a: Payload, b: Payload) {
  return sameMetrics(a.window, b.window) && sameMetrics(a.screen, b.screen);
}

/**
 * Sets (or clears with `null`) the simulated metrics. Listeners are notified
 * when what they see changed; with `notify = false` the notification is
 * deferred to the next notifying call (used while rendering).
 */
export function setDimensionsOverride(next: DimensionsOverride | null, notify = true): void {
  installDimensionsPatch();
  lastNotified ??= realPayload();
  const unchanged = override === next || (!!override && !!next && samePayload(override, next));
  if (!unchanged) override = next ? { window: { ...next.window }, screen: { ...next.screen } } : null;
  if (!notify) return;
  const payload = override ?? realPayload();
  if (samePayload(payload, lastNotified)) return;
  lastNotified = payload;
  Array.from(entries).forEach((entry) => {
    if (!entry.active) return;
    try {
      entry.handler(payload);
    } catch (e) {
      console.error('[device-simulator] Dimensions listener threw', e);
    }
  });
}

export function getDimensionsOverride(): DimensionsOverride | null {
  return override;
}
