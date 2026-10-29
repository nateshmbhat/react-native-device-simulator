import { Appearance } from 'react-native';
import type { ColorSchemeName } from '../types';
import { patchProperty } from './patch';

type Preferences = { colorScheme: ColorSchemeName | null | undefined };
type Listener = (preferences: Preferences) => void;

interface PatchableAppearance {
  getColorScheme(): ColorSchemeName | null | undefined;
  addChangeListener(listener: Listener): { remove(): void } | undefined;
}

const A = Appearance as unknown as PatchableAppearance;

let installed = false;
let override: ColorSchemeName | null = null;
let originalGet: () => ColorSchemeName | null | undefined = () => A.getColorScheme();
interface Entry {
  listener: Listener;
  active: boolean;
}
const entries = new Set<Entry>();
/** The scheme listeners were last told about (undefined until first use). */
let notified: ColorSchemeName | null | undefined;

export function getRealColorScheme(): ColorSchemeName | null | undefined {
  return originalGet();
}

/** Routes `Appearance.getColorScheme` and `useColorScheme` through the simulation. */
export function installAppearancePatch(): void {
  if (installed) return;
  installed = true;
  const get = A.getColorScheme.bind(A);
  const add = A.addChangeListener.bind(A);
  originalGet = get;

  patchProperty(A, 'getColorScheme', () => override ?? get());
  patchProperty(A, 'addChangeListener', (listener: Listener) => {
    const entry: Entry = { listener, active: true };
    entries.add(entry);
    const sub = add((prefs: Preferences) => {
      if (!entry.active) return;
      // Real changes are hidden behind the simulated scheme while one is set.
      if (override) {
        listener({ colorScheme: override });
        return;
      }
      notified = prefs?.colorScheme ?? get();
      listener(prefs);
    });
    return {
      remove() {
        if (!entry.active) return;
        entry.active = false;
        entries.delete(entry);
        sub?.remove();
      },
    };
  });
}

export function setColorSchemeOverride(next: ColorSchemeName | null, notify = true): void {
  installAppearancePatch();
  if (notified === undefined) notified = originalGet();
  override = next;
  if (!notify) return;
  const after = override ?? originalGet();
  if (notified === after) return;
  notified = after;
  Array.from(entries).forEach((entry) => {
    if (!entry.active) return;
    try {
      entry.listener({ colorScheme: after });
    } catch (e) {
      console.error('[device-simulator] Appearance listener threw', e);
    }
  });
}
