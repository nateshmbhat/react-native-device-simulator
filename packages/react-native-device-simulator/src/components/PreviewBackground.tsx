import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { ColorSchemeName, DeviceSimulatorSettings } from '../types';
import { palettes } from './toolbar/theme';

export interface PreviewBackgroundProps {
  variant: DeviceSimulatorSettings['background'];
  theme: ColorSchemeName;
}

/** The surface behind the device: a dot grid, a plain colour or a gradient. Never receives touches. */
export const PreviewBackground = React.memo(function PreviewBackground({ variant, theme }: PreviewBackgroundProps) {
  const p = palettes[theme] ?? palettes.dark;
  // Deterministic ids (stable across server rendering and hydration). Two
  // instances with the same variant and theme define identical paint servers.
  const id = `rnds-bg-${variant}-${theme}`;
  return (
    <View style={[StyleSheet.absoluteFill, styles.noTouch, { backgroundColor: p.stage }]}>
      {variant === 'plain' ? null : (
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            {variant === 'dots' ? (
              <Pattern id={`${id}-dots`} x={0} y={0} width={18} height={18} patternUnits="userSpaceOnUse">
                <Circle cx={9} cy={9} r={1} fill={p.stageDot} />
              </Pattern>
            ) : (
              <LinearGradient id={`${id}-linear`} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={p.stageGradient[0]} />
                <Stop offset="1" stopColor={p.stageGradient[1]} />
              </LinearGradient>
            )}
            <RadialGradient id={`${id}-glow`} cx="50%" cy="45%" r="65%">
              <Stop offset="0" stopColor={p.accent} stopOpacity={theme === 'dark' ? 0.1 : 0.07} />
              <Stop offset="1" stopColor={p.accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={variant === 'dots' ? `url(#${id}-dots)` : `url(#${id}-linear)`} />
          {variant === 'gradient' ? <Rect width="100%" height="100%" fill={`url(#${id}-glow)`} /> : null}
        </Svg>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  noTouch: { pointerEvents: 'none' },
});
