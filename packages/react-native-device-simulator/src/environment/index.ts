import type { AccessibilityOverrides, ResolvedSimulation } from '../types';
import { setAccessibilityOverrides } from './accessibility';
import { setColorSchemeOverride } from './appearance';
import { getRealDimensions, setDimensionsOverride } from './dimensions';
import { setKeyboardOverride } from './keyboard';

export { getRealDimensions } from './dimensions';
export { getRealColorScheme } from './appearance';

const NO_ACCESSIBILITY_OVERRIDES: AccessibilityOverrides = {
  boldText: null,
  reduceMotion: null,
  reduceTransparency: null,
  invertColors: null,
  grayscale: null,
  highContrast: null,
  darkerSystemColors: null,
  screenReader: null,
};

/**
 * Makes React Native's global APIs (Dimensions, useWindowDimensions, PixelRatio,
 * Appearance, useColorScheme, AccessibilityInfo, Keyboard) report the
 * simulated device. `null` restores the real values.
 */
export function applyEnvironment(simulation: ResolvedSimulation | null, options: { silent?: boolean } = {}): void {
  const notify = !options.silent;
  if (!simulation) {
    setDimensionsOverride(null, notify);
    setColorSchemeOverride(null, notify);
    if (!notify) return;
    setAccessibilityOverrides(NO_ACCESSIBILITY_OVERRIDES);
    setKeyboardOverride(null);
    return;
  }
  const real = getRealDimensions('window');
  const metrics = {
    width: simulation.screenSize.width,
    height: simulation.screenSize.height,
    scale: simulation.pixelRatio,
    fontScale: simulation.fontScale ?? real.fontScale ?? 1,
  };
  setDimensionsOverride({ window: metrics, screen: metrics }, notify);
  setColorSchemeOverride(simulation.colorScheme, notify);
  // Accessibility and keyboard listeners are only notified asynchronously or
  // from effects, so they need no silent mode.
  if (!notify) return;
  setAccessibilityOverrides(simulation.accessibility);
  setKeyboardOverride(
    simulation.keyboardHeight > 0
      ? { height: simulation.keyboardHeight, screenWidth: simulation.screenSize.width, screenHeight: simulation.screenSize.height }
      : null,
  );
}
