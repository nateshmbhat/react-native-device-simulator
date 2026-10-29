import * as React from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { ColorSchemeName, DevicePlatform, EdgeInsets } from '../../types';

export interface SimulatedKeyboardProps {
  /** Height covered by the keyboard, 0 when hidden. */
  height: number;
  /** Screen width, current orientation. */
  width: number;
  platform: DevicePlatform;
  appearance: ColorSchemeName;
  /** Safe area insets, current orientation. */
  insets: EdgeInsets;
}

interface Palette {
  background: string;
  key: string;
  special: string;
  accent: string;
  accentText: string;
  text: string;
  shadow: string;
  pressed: string;
  muted: string;
}

const PALETTES: Record<'ios' | 'android', Record<ColorSchemeName, Palette>> = {
  ios: {
    light: {
      background: '#d1d3d9',
      key: '#ffffff',
      special: '#abb0bb',
      accent: '#abb0bb',
      accentText: '#000000',
      text: '#000000',
      shadow: '#898a8d',
      pressed: '#abb0bb',
      muted: '#3c3c43',
    },
    dark: {
      background: '#252527',
      key: '#5c5c60',
      special: '#3b3b3e',
      accent: '#3b3b3e',
      accentText: '#ffffff',
      text: '#ffffff',
      shadow: '#0b0b0c',
      pressed: '#3b3b3e',
      muted: '#ebebf5',
    },
  },
  android: {
    light: {
      background: '#e9edf5',
      key: '#ffffff',
      special: '#d1d9e8',
      accent: '#0b57d0',
      accentText: '#ffffff',
      text: '#1f1f1f',
      shadow: 'transparent',
      pressed: '#c4cbd8',
      muted: '#444746',
    },
    dark: {
      background: '#1d1e21',
      key: '#3c3d42',
      special: '#2c3a4f',
      accent: '#a8c7fa',
      accentText: '#062e6f',
      text: '#e3e3e3',
      shadow: 'transparent',
      pressed: '#55575e',
      muted: '#c4c7c5',
    },
  },
};

type KeyKind =
  | { type: 'char'; label: string }
  | { type: 'label'; label: string; style: 'key' | 'special' | 'accent' }
  | { type: 'icon'; icon: IconName; style: 'key' | 'special' | 'accent' }
  | { type: 'space'; label: string }
  | { type: 'gap' };

interface KeySpec {
  kind: KeyKind;
  /** Width in letter-key units; a row adds up to 10. */
  weight: number;
}

const chars = (letters: string): KeySpec[] => [...letters].map((label) => ({ kind: { type: 'char', label }, weight: 1 }));
const gap = (weight: number): KeySpec => ({ kind: { type: 'gap' }, weight });

function rowsFor(apple: boolean, numberRow: boolean): KeySpec[][] {
  const rows: KeySpec[][] = [];
  if (numberRow) rows.push(chars('1234567890'));
  rows.push(chars('qwertyuiop'));
  rows.push([gap(0.5), ...chars('asdfghjkl'), gap(0.5)]);
  rows.push([
    { kind: { type: 'icon', icon: 'shift', style: 'special' }, weight: 1.35 },
    gap(0.15),
    ...chars('zxcvbnm'),
    gap(0.15),
    { kind: { type: 'icon', icon: 'delete', style: 'special' }, weight: 1.35 },
  ]);
  rows.push(
    apple
      ? [
          { kind: { type: 'label', label: '123', style: 'special' }, weight: 2.5 },
          { kind: { type: 'space', label: 'space' }, weight: 5 },
          { kind: { type: 'label', label: 'return', style: 'special' }, weight: 2.5 },
        ]
      : [
          { kind: { type: 'label', label: '?123', style: 'special' }, weight: 1.5 },
          { kind: { type: 'char', label: ',' }, weight: 1 },
          { kind: { type: 'icon', icon: 'emoji', style: 'key' }, weight: 1 },
          { kind: { type: 'space', label: '' }, weight: 4 },
          { kind: { type: 'char', label: '.' }, weight: 1 },
          { kind: { type: 'icon', icon: 'enter', style: 'accent' }, weight: 1.5 },
        ],
  );
  return rows;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/**
 * A software keyboard drawn over the bottom of the screen: iOS style on Apple
 * devices, Gboard style elsewhere. It swallows touches like a real keyboard
 * and slides in and out.
 */
export function SimulatedKeyboard({ height, width, platform, appearance, insets }: SimulatedKeyboardProps) {
  const visible = height > 0;
  // Keep the last height while sliding out.
  const [shownHeight, setShownHeight] = React.useState(height);
  if (visible && height !== shownHeight) setShownHeight(height);

  const [progress] = React.useState(() => new Animated.Value(visible ? 1 : 0));
  React.useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 280 : 220,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [visible, progress]);

  if (shownHeight <= 0) return null;

  const apple = platform === 'ios' || platform === 'macos';
  const palette = PALETTES[apple ? 'ios' : 'android'][appearance];
  const side = Math.max(insets.left, insets.right);
  const contentWidth = width - side * 2;
  const compact = contentWidth < 600;

  // Vertical budget: [toolbar][key rows][bottom strip (globe/mic, home indicator)]
  const bottomStrip = apple && compact && insets.bottom > 0 && shownHeight >= 280 ? insets.bottom + 40 : insets.bottom;
  const available = shownHeight - bottomStrip;
  const toolbar = available >= 240 ? 44 : available >= 170 ? 34 : 0;
  const keysArea = available - toolbar;
  const numberRow = !apple && keysArea / 4 > 56;
  const rows = rowsFor(apple, numberRow);
  const rowHeight = keysArea / rows.length;
  const gapY = clamp(rowHeight * (apple ? 0.24 : 0.2), 6, 14);
  const gapX = clamp(contentWidth * 0.013, 4, 8);
  const keyHeight = rowHeight - gapY;
  const radius = apple ? clamp(keyHeight * 0.13, 4, 8) : clamp(keyHeight * 0.16, 5, 10);
  const fontSize = clamp(keyHeight * (apple ? 0.56 : 0.46), 12, 26);
  const iconSize = clamp(keyHeight * 0.5, 14, 26);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [shownHeight, 0] });

  return (
    <Animated.View
      aria-hidden
      onStartShouldSetResponder={swallow}
      style={[
        styles.keyboard,
        {
          height: shownHeight,
          backgroundColor: palette.background,
          pointerEvents: visible ? 'auto' : 'none',
          transform: [{ translateY }],
        },
      ]}
    >
      {toolbar > 0 ? (
        <View key="toolbar" style={[styles.toolbar, { height: toolbar, paddingHorizontal: side + gapX * 2 }]}>
          {apple ? <Suggestions palette={palette} /> : <GboardToolbar palette={palette} size={clamp(toolbar * 0.5, 16, 22)} />}
        </View>
      ) : null}
      <View key="keys" style={{ height: keysArea, paddingHorizontal: side + gapX / 2 }}>
        {rows.map((row, r) => (
          <View key={r} style={[styles.row, { height: rowHeight }]}>
            {row.map((key, k) => (
              <Key
                key={k}
                spec={key}
                palette={palette}
                apple={apple}
                style={{ flex: key.weight, marginHorizontal: gapX / 2, marginVertical: gapY / 2, borderRadius: radius }}
                fontSize={fontSize}
                iconSize={iconSize}
              />
            ))}
          </View>
        ))}
      </View>
      {apple && bottomStrip > insets.bottom ? (
        <View key="strip" style={[styles.strip, { height: bottomStrip - insets.bottom, paddingHorizontal: side + gapX * 3.5 }]}>
          <Icon name="globe" color={palette.muted} size={iconSize * 1.05} />
          <Icon name="mic" color={palette.muted} size={iconSize * 1.05} />
        </View>
      ) : null}
    </Animated.View>
  );
}

const swallow = () => true;

interface KeyProps {
  spec: KeySpec;
  palette: Palette;
  apple: boolean;
  style: ViewStyle;
  fontSize: number;
  iconSize: number;
}

function Key({ spec, palette, apple, style, fontSize, iconSize }: KeyProps) {
  const { kind } = spec;
  if (kind.type === 'gap') return <View style={{ flex: spec.weight }} />;
  const tone = kind.type === 'char' || kind.type === 'space' ? 'key' : kind.style;
  const background = tone === 'accent' ? palette.accent : tone === 'special' ? palette.special : palette.key;
  const foreground = tone === 'accent' ? palette.accentText : palette.text;
  const accentShape = tone === 'accent' && !apple ? { borderRadius: 999 } : null;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.key,
        style,
        accentShape,
        { backgroundColor: pressed ? palette.pressed : background },
        apple ? { boxShadow: `0px 1px 0px ${palette.shadow}` } : null,
      ]}
    >
      {kind.type === 'char' ? (
        <Text style={[styles.label, { color: foreground, fontSize, lineHeight: fontSize * 1.2 }]}>{kind.label}</Text>
      ) : kind.type === 'label' || kind.type === 'space' ? (
        <Text style={[styles.label, { color: foreground, fontSize: Math.max(12, fontSize * 0.72), lineHeight: Math.max(15, fontSize * 0.95) }]}>
          {kind.label}
        </Text>
      ) : (
        <Icon name={kind.icon} color={foreground} size={iconSize} />
      )}
    </Pressable>
  );
}

function Suggestions({ palette }: { palette: Palette }) {
  return (
    <View style={styles.suggestions}>
      {['I', 'The', 'I’m'].map((word, index) => (
        <React.Fragment key={word}>
          {index > 0 ? <View style={[styles.divider, { backgroundColor: palette.muted }]} /> : null}
          <Text style={[styles.suggestion, { color: palette.text }]}>{word}</Text>
        </React.Fragment>
      ))}
    </View>
  );
}

function GboardToolbar({ palette, size }: { palette: Palette; size: number }) {
  return (
    <View style={styles.gboardToolbar}>
      <Icon name="grid" color={palette.muted} size={size} />
      <Icon name="emoji" color={palette.muted} size={size} />
      <Text style={[styles.gif, { color: palette.muted, fontSize: size * 0.62, borderColor: palette.muted }]}>GIF</Text>
      <Icon name="clipboard" color={palette.muted} size={size} />
      <Icon name="mic" color={palette.muted} size={size} />
    </View>
  );
}

type IconName = 'shift' | 'delete' | 'enter' | 'emoji' | 'globe' | 'mic' | 'grid' | 'clipboard';

function Icon({ name, color, size }: { name: IconName; color: string; size: number }) {
  const stroke = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'shift' ? <Path d="M12 3.5 L3.5 12.5 H8.25 V20 H15.75 V12.5 H20.5 Z" {...stroke} /> : null}
      {name === 'delete' ? (
        <>
          <Path d="M8.5 5 H19.5 A2 2 0 0 1 21.5 7 V17 A2 2 0 0 1 19.5 19 H8.5 L2.5 12 Z" {...stroke} />
          <Path d="M11.5 9 L17.5 15 M17.5 9 L11.5 15" {...stroke} />
        </>
      ) : null}
      {name === 'enter' ? <Path d="M19 6 V12.5 H5.5 M9.5 8.5 L5.5 12.5 L9.5 16.5" {...stroke} strokeWidth={2} /> : null}
      {name === 'emoji' ? (
        <>
          <Circle cx={12} cy={12} r={8.5} {...stroke} />
          <Path d="M8.5 14 A4 4 0 0 0 15.5 14" {...stroke} />
          <Circle cx={9.25} cy={10} r={1} fill={color} />
          <Circle cx={14.75} cy={10} r={1} fill={color} />
        </>
      ) : null}
      {name === 'globe' ? (
        <>
          <Circle cx={12} cy={12} r={8.5} {...stroke} />
          <Path d="M3.5 12 H20.5 M12 3.5 C7.5 8 7.5 16 12 20.5 M12 3.5 C16.5 8 16.5 16 12 20.5" {...stroke} />
        </>
      ) : null}
      {name === 'mic' ? (
        <>
          <Rect x={9} y={3} width={6} height={11} rx={3} {...stroke} />
          <Path d="M5.5 11 A6.5 6.5 0 0 0 18.5 11 M12 17.5 V21" {...stroke} />
        </>
      ) : null}
      {name === 'grid' ? (
        <>
          <Rect x={4} y={4} width={6.5} height={6.5} rx={1.5} {...stroke} />
          <Rect x={13.5} y={4} width={6.5} height={6.5} rx={1.5} {...stroke} />
          <Rect x={4} y={13.5} width={6.5} height={6.5} rx={1.5} {...stroke} />
          <Rect x={13.5} y={13.5} width={6.5} height={6.5} rx={1.5} {...stroke} />
        </>
      ) : null}
      {name === 'clipboard' ? (
        <>
          <Rect x={5.5} y={5} width={13} height={16} rx={2} {...stroke} />
          <Path d="M9 5 V3.5 H15 V5 M9 10 H15 M9 14 H13" {...stroke} />
        </>
      ) : null}
    </Svg>
  );
}

const styles = StyleSheet.create({
  keyboard: { position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  toolbar: { justifyContent: 'center' },
  row: { flexDirection: 'row' },
  key: { alignItems: 'center', justifyContent: 'center' },
  label: { textAlign: 'center', includeFontPadding: false, userSelect: 'none' },
  strip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  suggestions: { flexDirection: 'row', alignItems: 'center' },
  suggestion: { flex: 1, textAlign: 'center', fontSize: 16, userSelect: 'none' },
  divider: { width: StyleSheet.hairlineWidth, height: 22, opacity: 0.3 },
  gboardToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gif: { fontWeight: '700', borderWidth: 1.5, borderRadius: 4, paddingHorizontal: 3, overflow: 'hidden', userSelect: 'none' },
});
