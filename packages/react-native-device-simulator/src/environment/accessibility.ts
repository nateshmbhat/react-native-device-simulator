import { AccessibilityInfo, Platform } from 'react-native';
import type { AccessibilityOverrides } from '../types';
import { patchProperty } from './patch';

type Key = keyof AccessibilityOverrides;

/** Accessibility setting -> [AccessibilityInfo query method, change event names]. */
const FEATURES: Record<Key, { method: string; events: string[] }> = {
  boldText: { method: 'isBoldTextEnabled', events: ['boldTextChanged'] },
  reduceMotion: { method: 'isReduceMotionEnabled', events: ['reduceMotionChanged'] },
  reduceTransparency: { method: 'isReduceTransparencyEnabled', events: ['reduceTransparencyChanged'] },
  invertColors: { method: 'isInvertColorsEnabled', events: ['invertColorsChanged'] },
  grayscale: { method: 'isGrayscaleEnabled', events: ['grayscaleChanged'] },
  highContrast: { method: 'isHighTextContrastEnabled', events: ['highTextContrastChanged'] },
  darkerSystemColors: { method: 'isDarkerSystemColorsEnabled', events: ['darkerSystemColorsChanged'] },
  screenReader: { method: 'isScreenReaderEnabled', events: ['screenReaderChanged', 'change'] },
};

type Handler = (value: boolean) => void;
type Info = Record<string, unknown> & {
  addEventListener?: (event: string, handler: Handler) => { remove(): void } | undefined;
  removeEventListener?: (event: string, handler: Handler) => void;
};

const info = AccessibilityInfo as unknown as Info;
let installed = false;
let overrides: Partial<AccessibilityOverrides> = {};
const originals: Partial<Record<string, () => Promise<boolean>>> = {};
interface Entry {
  handler: Handler;
  active: boolean;
}
const handlers = new Map<string, Set<Entry>>();

function keyForEvent(event: string): Key | undefined {
  return (Object.keys(FEATURES) as Key[]).find((k) => FEATURES[k].events.includes(event));
}

async function realValue(key: Key): Promise<boolean> {
  // react-native-web always reports a screen reader; a browser has no reliable signal.
  if (key === 'screenReader' && Platform.OS === 'web') return false;
  const original = originals[FEATURES[key].method];
  if (!original) return false;
  try {
    return Boolean(await original());
  } catch {
    return false;
  }
}

/** Routes `AccessibilityInfo.is*Enabled()` and its change events through the simulation. */
export function installAccessibilityPatch(): void {
  if (installed) return;
  installed = true;
  for (const key of Object.keys(FEATURES) as Key[]) {
    const { method } = FEATURES[key];
    const original = info[method];
    if (typeof original === 'function') originals[method] = original.bind(info) as () => Promise<boolean>;
    patchProperty(info, method, () => {
      const value = overrides[key];
      return value == null ? realValue(key) : Promise.resolve(value);
    });
  }

  const add = info.addEventListener?.bind(info);
  const remove = info.removeEventListener?.bind(info);
  patchProperty(info, 'addEventListener', (event: string, handler: Handler) => {
    const key = keyForEvent(event);
    if (!key) return add?.(event, handler) ?? { remove() {} };
    let set = handlers.get(event);
    if (!set) handlers.set(event, (set = new Set()));
    const entry: Entry = { handler, active: true };
    set.add(entry);
    const wrapped: Handler = (value) => {
      if (entry.active) handler(overrides[key] ?? value);
    };
    let sub: { remove(): void } | undefined;
    try {
      sub = add?.(event, wrapped);
    } catch {
      // react-native-web only supports a few events; simulated ones still fire.
    }
    return {
      remove() {
        if (!entry.active) return;
        entry.active = false;
        set!.delete(entry);
        if (sub && typeof sub.remove === 'function') sub.remove();
        else remove?.(event, wrapped);
      },
    };
  });
}

export function setAccessibilityOverrides(next: AccessibilityOverrides): void {
  installAccessibilityPatch();
  const previous = overrides;
  overrides = { ...next };
  for (const key of Object.keys(FEATURES) as Key[]) {
    if ((previous[key] ?? null) === (next[key] ?? null)) continue;
    const notify = (value: boolean) => {
      for (const event of FEATURES[key].events) {
        Array.from(handlers.get(event) ?? []).forEach((entry) => {
          if (!entry.active) return;
          try {
            entry.handler(value);
          } catch (e) {
            console.error('[device-simulator] AccessibilityInfo listener threw', e);
          }
        });
      }
    };
    const value = next[key];
    // The real value arrives asynchronously; drop it if an override was set meanwhile.
    if (value == null) void realValue(key).then((real) => overrides[key] == null && notify(real));
    else notify(value);
  }
}
