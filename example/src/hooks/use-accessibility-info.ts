import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export const accessibilityFeatures = [
  { key: 'boldText', label: 'Bold text', method: 'isBoldTextEnabled', event: 'boldTextChanged' },
  { key: 'reduceMotion', label: 'Reduce motion', method: 'isReduceMotionEnabled', event: 'reduceMotionChanged' },
  {
    key: 'reduceTransparency',
    label: 'Reduce transparency',
    method: 'isReduceTransparencyEnabled',
    event: 'reduceTransparencyChanged',
  },
  { key: 'invertColors', label: 'Invert colors', method: 'isInvertColorsEnabled', event: 'invertColorsChanged' },
  { key: 'grayscale', label: 'Grayscale', method: 'isGrayscaleEnabled', event: 'grayscaleChanged' },
  { key: 'highContrast', label: 'High text contrast', method: 'isHighTextContrastEnabled', event: 'highTextContrastChanged' },
  {
    key: 'darkerSystemColors',
    label: 'Darker system colors',
    method: 'isDarkerSystemColorsEnabled',
    event: 'darkerSystemColorsChanged',
  },
  { key: 'screenReader', label: 'Screen reader', method: 'isScreenReaderEnabled', event: 'screenReaderChanged' },
] as const;

export type AccessibilityKey = (typeof accessibilityFeatures)[number]['key'];
export type AccessibilityState = Record<AccessibilityKey, boolean | null>;

// Some queries only exist on one platform; use a loose view of the module.
type LooseInfo = Record<string, unknown> & {
  addEventListener?: (event: string, handler: (value: boolean) => void) => { remove(): void } | undefined;
};
const info = AccessibilityInfo as unknown as LooseInfo;

const initial = Object.fromEntries(accessibilityFeatures.map((f) => [f.key, null])) as AccessibilityState;

/**
 * `AccessibilityInfo.is*Enabled()` for every feature, kept up to date with
 * `AccessibilityInfo.addEventListener`. `null` = not supported here.
 */
export function useAccessibilityInfo(): AccessibilityState {
  const [state, setState] = useState(initial);
  useEffect(() => {
    let mounted = true;
    const set = (key: AccessibilityKey, value: boolean) => {
      if (mounted) setState((s) => (s[key] === value ? s : { ...s, [key]: value }));
    };
    const subscriptions = accessibilityFeatures.map(({ key, method, event }) => {
      const query = info[method];
      if (typeof query === 'function') {
        Promise.resolve((query as () => Promise<boolean>).call(info))
          .then((value) => set(key, Boolean(value)))
          .catch(() => {});
      }
      try {
        return info.addEventListener?.(event, (value) => set(key, Boolean(value)));
      } catch {
        return undefined;
      }
    });
    return () => {
      mounted = false;
      subscriptions.forEach((s) => s?.remove());
    };
  }, []);
  return state;
}
