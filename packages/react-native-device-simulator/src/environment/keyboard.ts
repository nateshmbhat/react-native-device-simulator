import { Keyboard } from 'react-native';
import { devicePreview } from '../core/store';
import { patchProperty } from './patch';

/** The simulated software keyboard, in simulated screen coordinates. */
export interface KeyboardOverride {
  height: number;
  screenWidth: number;
  screenHeight: number;
}

export interface SimulatedKeyboardMetrics {
  screenX: number;
  screenY: number;
  width: number;
  height: number;
}

/** Same shape as React Native's (iOS) `KeyboardEvent`. */
export interface SimulatedKeyboardEvent {
  duration: number;
  easing: 'keyboard';
  startCoordinates: SimulatedKeyboardMetrics;
  endCoordinates: SimulatedKeyboardMetrics;
  isEventFromThisApp: boolean;
}

type EventName =
  | 'keyboardWillShow'
  | 'keyboardDidShow'
  | 'keyboardWillHide'
  | 'keyboardDidHide'
  | 'keyboardWillChangeFrame'
  | 'keyboardDidChangeFrame';

type Listener = (...args: unknown[]) => unknown;
type Subscription = { remove(): void };

// Loose view of `Keyboard` so it can be patched on react-native (a class
// instance) and react-native-web (a plain object without events).
interface PatchableKeyboard {
  addListener(type: string, listener: Listener, context?: unknown): Subscription | undefined;
  removeAllListeners?(type?: string | null): void;
  dismiss(): void;
  isVisible?(): boolean;
  metrics?(): SimulatedKeyboardMetrics | null | undefined;
}

interface Entry {
  listener: Listener;
  active: boolean;
}

/** Duration of the simulated show/hide animation (iOS uses ~250ms). */
export const KEYBOARD_ANIMATION_DURATION = 250;

const SHOW_EVENTS: readonly string[] = ['keyboardWillChangeFrame', 'keyboardWillShow', 'keyboardDidChangeFrame', 'keyboardDidShow'];

const K = Keyboard as unknown as PatchableKeyboard;

let installed = false;
let current: KeyboardOverride | null = null;
/** The event that showed the current simulated keyboard. */
let shownEvent: SimulatedKeyboardEvent | null = null;
const listeners = new Map<string, Set<Entry>>();
/** The "did" events of the transition in progress. */
let pending: (() => void) | null = null;
let pendingTimer: ReturnType<typeof setTimeout> | undefined;

function emit(type: EventName, event: SimulatedKeyboardEvent): void {
  const set = listeners.get(type);
  if (!set) return;
  Array.from(set).forEach((entry) => {
    if (!entry.active) return;
    try {
      entry.listener(event);
    } catch (e) {
      console.error('[device-simulator] Keyboard listener threw', e);
    }
  });
}

function flushPending(): void {
  const run = pending;
  pending = null;
  clearTimeout(pendingTimer);
  run?.();
}

function schedule(run: () => void): void {
  pending = run;
  pendingTimer = setTimeout(flushPending, KEYBOARD_ANIMATION_DURATION);
}

/**
 * Makes `Keyboard` report the simulated software keyboard: listeners get
 * show/hide/change-frame events in simulated screen coordinates,
 * `isVisible()` / `metrics()` describe it, and `dismiss()` hides it. Real
 * keyboard events still reach listeners while no simulated keyboard is shown.
 * Idempotent.
 */
export function installKeyboardPatch(): void {
  if (installed) return;
  installed = true;
  const add = K.addListener.bind(K);
  const removeAll = K.removeAllListeners?.bind(K);
  const dismiss = K.dismiss.bind(K);
  const isVisible = K.isVisible?.bind(K);
  const metrics = K.metrics?.bind(K);

  patchProperty(K, 'addListener', (type: string, listener: Listener, context?: unknown): Subscription => {
    const entry: Entry = { listener: context == null ? listener : listener.bind(context), active: true };
    let set = listeners.get(type);
    if (!set) listeners.set(type, (set = new Set()));
    set.add(entry);
    let sub: Subscription | undefined;
    try {
      // Real keyboard events are hidden while the simulated keyboard is shown:
      // their coordinates describe the host, not the simulated screen.
      sub = add(type, (...args: unknown[]) => (current ? undefined : entry.listener(...args)));
    } catch {
      // The platform does not support this event; simulated ones still fire.
    }
    // A listener added while the simulated keyboard is up (e.g. a
    // KeyboardAvoidingView on a screen pushed after the keyboard was shown)
    // learns about it, as if the keyboard had just appeared.
    if (current && shownEvent && SHOW_EVENTS.includes(type) && !(pending && type.startsWith('keyboardDid'))) {
      const event = shownEvent;
      setTimeout(() => {
        if (entry.active && shownEvent === event) {
          try {
            entry.listener(event);
          } catch (e) {
            console.error('[device-simulator] Keyboard listener threw', e);
          }
        }
      }, 0);
    }
    return {
      remove() {
        entry.active = false;
        set!.delete(entry);
        sub?.remove();
      },
    };
  });

  patchProperty(K, 'removeAllListeners', (type?: string | null) => {
    const sets = type == null ? Array.from(listeners.values()) : [listeners.get(type)];
    sets.forEach((set) => {
      set?.forEach((entry) => (entry.active = false));
      set?.clear();
    });
    removeAll?.(type);
  });

  patchProperty(K, 'isVisible', () => (current ? true : (isVisible?.() ?? false)));
  patchProperty(K, 'metrics', () => (current && shownEvent ? shownEvent.endCoordinates : metrics?.()));

  patchProperty(K, 'dismiss', () => {
    dismiss();
    if (!current) return;
    setKeyboardOverride(null);
    // Keep the toolbar in sync; DevicePreview then applies the same (hidden) state.
    if (devicePreview.getSettings().keyboardVisible) devicePreview.setKeyboardVisible(false);
  });
}

function sameKeyboard(a: KeyboardOverride | null, b: KeyboardOverride | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.height === b.height && a.screenWidth === b.screenWidth && a.screenHeight === b.screenHeight;
}

/**
 * Shows, moves or hides (`null`) the simulated keyboard, emitting the same
 * event sequence as iOS: `keyboardWillChangeFrame`, `keyboardWillShow` /
 * `keyboardWillHide` now, then `keyboardDidChangeFrame`, `keyboardDidShow` /
 * `keyboardDidHide` once the animation would be over.
 */
export function setKeyboardOverride(next: KeyboardOverride | null): void {
  installKeyboardPatch();
  const normalized = next && next.height > 0 ? { ...next } : null;
  if (sameKeyboard(current, normalized)) return;
  // Finish the previous transition first, so listeners always see pairs.
  flushPending();
  const previous = current;
  const previousEvent = shownEvent;

  if (normalized) {
    const { height, screenWidth, screenHeight } = normalized;
    const event: SimulatedKeyboardEvent = {
      duration: KEYBOARD_ANIMATION_DURATION,
      easing: 'keyboard',
      startCoordinates: previousEvent
        ? previousEvent.endCoordinates
        : { screenX: 0, screenY: screenHeight, width: screenWidth, height },
      endCoordinates: { screenX: 0, screenY: screenHeight - height, width: screenWidth, height },
      isEventFromThisApp: true,
    };
    current = normalized;
    shownEvent = event;
    emit('keyboardWillChangeFrame', event);
    emit('keyboardWillShow', event);
    schedule(() => {
      emit('keyboardDidChangeFrame', event);
      emit('keyboardDidShow', event);
    });
    return;
  }

  const { height, screenWidth, screenHeight } = previous!;
  const event: SimulatedKeyboardEvent = {
    duration: KEYBOARD_ANIMATION_DURATION,
    easing: 'keyboard',
    startCoordinates: previousEvent!.endCoordinates,
    endCoordinates: { screenX: 0, screenY: screenHeight, width: screenWidth, height },
    isEventFromThisApp: true,
  };
  current = null;
  shownEvent = null;
  emit('keyboardWillChangeFrame', event);
  emit('keyboardWillHide', event);
  schedule(() => {
    emit('keyboardDidChangeFrame', event);
    emit('keyboardDidHide', event);
  });
}

/** The simulated keyboard currently shown, or null. */
export function getKeyboardOverride(): KeyboardOverride | null {
  return current;
}
