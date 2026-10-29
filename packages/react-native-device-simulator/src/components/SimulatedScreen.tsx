import * as React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { PreviewScreenContext, type PreviewScreenContextValue } from '../context';
import { screenViewRef } from '../core/refs';
import type { ResolvedSimulation } from '../types';

type SafeAreaModule = typeof import('react-native-safe-area-context');

let SafeArea: SafeAreaModule | null = null;
try {
  // Optional peer dependency.
  SafeArea = require('react-native-safe-area-context') as SafeAreaModule;
} catch {
  SafeArea = null;
}

const FallbackContext = React.createContext<unknown>(null);
const InsetsContext = (SafeArea?.SafeAreaInsetsContext ?? FallbackContext) as React.Context<unknown>;
const FrameContext = (SafeArea?.SafeAreaFrameContext ?? FallbackContext) as React.Context<unknown>;

export interface SimulatedScreenProps {
  active: boolean;
  simulation: ResolvedSimulation;
  /** The host's real text scale. */
  realFontScale: number;
  children: React.ReactNode;
}

/**
 * The root of the app inside the device screen. Provides the simulated safe
 * area to `react-native-safe-area-context` consumers (React Navigation, Expo
 * Router, `useSafeAreaInsets`, ...). The element tree is identical whether or
 * not a device is simulated, so toggling never remounts the app.
 */
export function SimulatedScreen({ active, simulation, realFontScale, children }: SimulatedScreenProps) {
  const parentInsets = React.useContext(InsetsContext);
  const parentFrame = React.useContext(FrameContext);
  const { screenSize, insets } = simulation;

  const insetsValue = React.useMemo(
    () => (active ? { ...insets } : parentInsets),
    [active, insets.top, insets.right, insets.bottom, insets.left, parentInsets],
  );
  const frameValue = React.useMemo(
    () => (active ? { x: 0, y: 0, width: screenSize.width, height: screenSize.height } : parentFrame),
    [active, screenSize.width, screenSize.height, parentFrame],
  );

  const screenValue = React.useMemo<PreviewScreenContextValue>(
    () => ({
      active,
      simulation,
      fontScaleMultiplier: active && simulation.fontScale != null ? simulation.fontScale / realFontScale : 1,
      boldText: active && simulation.accessibility.boldText === true,
    }),
    [active, simulation, realFontScale],
  );

  const a11y = simulation.accessibility;
  const filters: string[] = [];
  if (active && a11y.invertColors) filters.push('invert(1) hue-rotate(180deg)');
  if (active && a11y.grayscale) filters.push('grayscale(1)');
  const style: ViewStyle = {
    direction: active && simulation.isRTL ? 'rtl' : 'inherit',
    // `filter` is supported on web and Android; ignored elsewhere.
    ...(filters.length ? ({ filter: filters.join(' ') } as ViewStyle) : null),
  };

  return (
    <View ref={screenViewRef} collapsable={false} style={[styles.fill, style]}>
      <PreviewScreenContext.Provider value={screenValue}>
        <FrameContext.Provider value={frameValue}>
          <InsetsContext.Provider value={insetsValue}>{children}</InsetsContext.Provider>
        </FrameContext.Provider>
      </PreviewScreenContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignSelf: 'stretch' },
});
