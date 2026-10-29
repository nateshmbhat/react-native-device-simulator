import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ColorSchemeName, DevicePreset, EdgeInsets, Orientation, Size } from '../../types';
import { frameBodyDocument, frameMaskDocument } from './documents';
import { FoldIndicator } from './FoldIndicator';
import { computeFrameLayout, systemUiFor } from './layout';
import { SimulatedKeyboard } from './SimulatedKeyboard';
import { SvgArtwork } from './SvgArtwork';
import { SystemUiOverlay } from './SystemUiOverlay';

export interface DeviceFrameProps {
  preset: DevicePreset;
  orientation: Orientation;
  /** Logical screen size in the current orientation. */
  screenSize: Size;
  insets: EdgeInsets;
  /** Draw the device body. When false only the bare screen is rendered. */
  showFrame: boolean;
  showSystemUi: boolean;
  keyboardHeight: number;
  /** Tint of status bar / navigation bar artwork. */
  systemUiColor: string;
  /**
   * Colour scheme of the simulated OS: keyboard appearance and default screen
   * background. Derived from `systemUiColor` when absent (light artwork means
   * dark mode).
   */
  colorScheme?: ColorSchemeName | null;
  /** Colour behind the app. Defaults to black in dark mode, white otherwise. */
  screenBackgroundColor?: string;
  /** The app. Must stay at the same position in the element tree in every mode. */
  children: React.ReactNode;
}

/**
 * Natural (unscaled) size of what `DeviceFrame` draws: the body when the frame
 * is shown (rotated in landscape), the bare screen otherwise.
 */
export function getDeviceOuterSize(preset: DevicePreset, orientation: Orientation, screenSize: Size, showFrame: boolean): Size {
  return computeFrameLayout(preset, orientation, screenSize, showFrame).outer;
}

/**
 * A device: body artwork, the app's screen, and overlays (system UI, keyboard,
 * fold crease, bezel mask). Layers, back to front:
 *
 * 1. `body`    drop shadow + body SVG (behind the screen)
 * 2. `screen`  the app, laid out unrotated at the current screen size
 * 3. `overlay` keyboard, fold crease, status/navigation bars
 * 4. `mask`    bezel parts covering the screen rectangle (corners, island, notch)
 *
 * The element tree is identical in every mode, so `children` keeps its
 * position and the app is never remounted: only styles and the content of the
 * sibling layers change.
 */
export function DeviceFrame({
  preset,
  orientation,
  screenSize,
  insets,
  showFrame,
  showSystemUi,
  keyboardHeight,
  systemUiColor,
  colorScheme,
  screenBackgroundColor,
  children,
}: DeviceFrameProps) {
  // Deterministic (not useId) so server-rendered and hydrated SVG ids match.
  // A document only ever hosts one simulated device.
  const idPrefix = 'rnds-device';
  const { width: screenWidth, height: screenHeight } = screenSize;
  const layout = React.useMemo(
    () => computeFrameLayout(preset, orientation, { width: screenWidth, height: screenHeight }, showFrame),
    [preset, orientation, screenWidth, screenHeight, showFrame],
  );
  const { frame, frameOrientation, frameScreen, frameScreenRadii, outer, screen, portraitScreen, bodyRadius, screenRadii } = layout;
  const bodyXml = React.useMemo(
    () => (frame ? frameBodyDocument(frame, frameOrientation, `${idPrefix}b`) : null),
    [frame, frameOrientation, idPrefix],
  );
  const maskXml = React.useMemo(
    () => (frame ? frameMaskDocument(frame, frameScreen, frameScreenRadii, frameOrientation, `${idPrefix}m`) : null),
    [frame, frameScreen, frameScreenRadii, frameOrientation, idPrefix],
  );

  const scheme: ColorSchemeName = colorScheme ?? (isLightColor(systemUiColor) ? 'dark' : 'light');
  const keyboardVisible = keyboardHeight > 0;
  // The home indicator / gesture pill sits on the keyboard while it is up.
  const navigationBarColor = keyboardVisible ? (scheme === 'dark' ? '#ffffff' : '#000000') : systemUiColor;
  const screenRect = { left: screen.x, top: screen.y, width: screen.width, height: screen.height };
  const screenCorners = {
    borderTopLeftRadius: screenRadii.topLeft,
    borderTopRightRadius: screenRadii.topRight,
    borderBottomRightRadius: screenRadii.bottomRight,
    borderBottomLeftRadius: screenRadii.bottomLeft,
  };

  return (
    <View style={[styles.root, { width: outer.width, height: outer.height }]}>
      <View key="body" aria-hidden style={[StyleSheet.absoluteFill, styles.noTouch]}>
        {frame ? <View key="shadow" style={[StyleSheet.absoluteFill, styles.shadow, { borderRadius: bodyRadius }]} /> : null}
        {bodyXml ? <SvgArtwork key="artwork" xml={bodyXml} width={outer.width} height={outer.height} style={StyleSheet.absoluteFill} /> : null}
      </View>
      <View
        key="screen"
        style={[styles.screen, screenRect, screenCorners, { backgroundColor: screenBackgroundColor ?? (scheme === 'dark' ? '#000000' : '#ffffff') }]}
      >
        {children}
      </View>
      <View key="overlay" style={[styles.overlay, screenRect, screenCorners]}>
        <SimulatedKeyboard
          key="keyboard"
          height={keyboardHeight}
          width={screen.width}
          platform={preset.platform}
          appearance={scheme}
          insets={insets}
        />
        {frame ? (
          <FoldIndicator
            key="fold"
            features={preset.displayFeatures}
            portraitScreen={portraitScreen}
            orientation={orientation}
            idPrefix={`${idPrefix}f`}
          />
        ) : null}
        {showSystemUi ? (
          <SystemUiOverlay
            key="systemUi"
            spec={systemUiFor(preset)}
            screenSize={screenSize}
            insets={insets}
            statusBarColor={systemUiColor}
            navigationBarColor={navigationBarColor}
          />
        ) : null}
      </View>
      <View key="mask" aria-hidden style={[StyleSheet.absoluteFill, styles.noTouch]}>
        {maskXml ? <SvgArtwork key="artwork" xml={maskXml} width={outer.width} height={outer.height} style={StyleSheet.absoluteFill} /> : null}
      </View>
    </View>
  );
}

/** Whether a CSS colour is light (relative luminance above 0.5). Unknown formats count as dark. */
export function isLightColor(color: string): boolean {
  const value = color.trim().toLowerCase();
  if (value === 'white') return true;
  let rgb: number[] | null = null;
  const hex = /^#([0-9a-f]{3,8})$/.exec(value)?.[1];
  if (hex) {
    const full = hex.length <= 4 ? [...hex.slice(0, 3)].map((c) => c + c).join('') : hex.slice(0, 6);
    rgb = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  } else {
    const fn = /^rgba?\(([^)]+)\)$/.exec(value)?.[1];
    if (fn) rgb = fn.split(/[\s,/]+/).slice(0, 3).map(Number);
  }
  if (!rgb || rgb.length < 3 || rgb.some((c) => Number.isNaN(c))) return false;
  const [r, g, b] = rgb as [number, number, number];
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.5;
}

const styles = StyleSheet.create({
  root: { position: 'relative' },
  noTouch: { pointerEvents: 'none' },
  shadow: { boxShadow: '0px 24px 48px rgba(0, 0, 0, 0.32), 0px 4px 12px rgba(0, 0, 0, 0.22)' },
  screen: { position: 'absolute', overflow: 'hidden' },
  overlay: { position: 'absolute', overflow: 'hidden', pointerEvents: 'box-none' },
});
