import { useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { useDevicePreview, useDevicePreviewLocale } from 'react-native-device-simulator';
import { useSafeAreaFrame, useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';

import { Card, ValueRow } from '@/components/card';
import { ResponsiveGrid } from '@/components/responsive-grid';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Breakpoints, MaxGridWidth, Spacing } from '@/constants/theme';
import { accessibilityFeatures, useAccessibilityInfo } from '@/hooks/use-accessibility-info';
import { useDisplayMetrics } from '@/hooks/use-display-metrics';
import { useKeyboard } from '@/hooks/use-keyboard';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';

const VERTICAL_BAND = 'rgba(229, 72, 77, 0.32)';
const HORIZONTAL_BAND = 'rgba(47, 111, 235, 0.32)';

function round(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/** Colored bands over the unsafe edges of the screen. */
function SafeAreaOverlay({ insets }: { insets: EdgeInsets }) {
  const label = (value: number) =>
    value > 0 ? (
      <ThemedText type="code" style={styles.bandLabel}>
        {round(value)}
      </ThemedText>
    ) : null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.band, styles.bandTop, { height: insets.top, backgroundColor: VERTICAL_BAND }]}>
        {label(insets.top)}
      </View>
      <View style={[styles.band, styles.bandBottom, { height: insets.bottom, backgroundColor: VERTICAL_BAND }]}>
        {label(insets.bottom)}
      </View>
      <View
        style={[
          styles.band,
          styles.bandLeft,
          { width: insets.left, top: insets.top, bottom: insets.bottom, backgroundColor: HORIZONTAL_BAND },
        ]}>
        {label(insets.left)}
      </View>
      <View
        style={[
          styles.band,
          styles.bandRight,
          { width: insets.right, top: insets.top, bottom: insets.bottom, backgroundColor: HORIZONTAL_BAND },
        ]}>
        {label(insets.right)}
      </View>
    </View>
  );
}

/** A miniature screen with the inset values on each edge. */
function SafeAreaDiagram({ insets, width, height }: { insets: EdgeInsets; width: number; height: number }) {
  const theme = useTheme();
  const scale = 120 / Math.max(width, height);
  return (
    <View style={styles.diagramWrap}>
      <View
        style={[
          styles.diagram,
          { width: width * scale, height: height * scale, borderColor: theme.textSecondary, backgroundColor: theme.background },
        ]}>
        <View
          style={{
            position: 'absolute',
            top: insets.top * scale,
            bottom: insets.bottom * scale,
            left: insets.left * scale,
            right: insets.right * scale,
            backgroundColor: theme.backgroundSelected,
            borderRadius: 4,
          }}
        />
        <View style={[StyleSheet.absoluteFill, { borderTopWidth: insets.top * scale, borderBottomWidth: insets.bottom * scale, borderColor: VERTICAL_BAND }]} />
        <View style={[StyleSheet.absoluteFill, { borderLeftWidth: insets.left * scale, borderRightWidth: insets.right * scale, borderColor: HORIZONTAL_BAND }]} />
      </View>
      <View style={styles.diagramValues}>
        <ValueRow label="top" value={round(insets.top)} />
        <ValueRow label="right" value={round(insets.right)} />
        <ValueRow label="bottom" value={round(insets.bottom)} />
        <ValueRow label="left" value={round(insets.left)} />
      </View>
    </View>
  );
}

function onOff(value: boolean | null) {
  return value == null ? '—' : value ? 'on' : 'off';
}

export default function InspectorScreen() {
  const theme = useTheme();
  const window = useWindowDimensions();
  const metrics = useDisplayMetrics();
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();
  const accessibility = useAccessibilityInfo();
  const keyboard = useKeyboard(6);
  const previewLocale = useDevicePreviewLocale();
  const appLocale = useLocale();
  const { isActive, simulation } = useDevicePreview();
  const [overlay, setOverlay] = useState(true);
  const columns = window.width >= Breakpoints.medium ? 2 : 1;

  return (
    <View style={styles.flex}>
      <Screen
        title="Inspector"
        subtitle="What React Native's APIs report right now."
        maxWidth={MaxGridWidth}
        headerAccessory={
          <View style={styles.overlayToggle}>
            <ThemedText type="small" themeColor="textSecondary">
              Safe area
            </ThemedText>
            <Switch value={overlay} onValueChange={setOverlay} trackColor={{ true: theme.tint }} />
          </View>
        }>
        <ResponsiveGrid columns={columns}>
          <Card title="Window" caption="useWindowDimensions()">
            <ValueRow label="width" value={round(window.width)} highlight />
            <ValueRow label="height" value={round(window.height)} highlight />
            <ValueRow label="scale" value={round(window.scale)} />
            <ValueRow label="fontScale" value={round(window.fontScale)} />
          </Card>

          <Card title="Screen" caption="Dimensions.get('screen')">
            <ValueRow label="width" value={round(metrics.screen.width)} />
            <ValueRow label="height" value={round(metrics.screen.height)} />
            <ValueRow label="scale" value={round(metrics.screen.scale)} />
            <ValueRow label="fontScale" value={round(metrics.screen.fontScale)} />
          </Card>

          <Card title="Pixel ratio" caption="PixelRatio">
            <ValueRow label="get()" value={round(metrics.pixelRatio)} highlight />
            <ValueRow label="getFontScale()" value={round(metrics.fontScale)} />
            <ValueRow label="100 pt in px" value={round(metrics.px100)} />
            <ValueRow
              label="resolution"
              value={`${Math.round(window.width * metrics.pixelRatio)} × ${Math.round(window.height * metrics.pixelRatio)}`}
            />
          </Card>

          <Card title="Appearance" caption="useColorScheme()">
            <ValueRow label="useColorScheme()" value={String(scheme)} highlight />
            <ValueRow label="Appearance.getColorScheme()" value={String(metrics.appearance)} />
          </Card>

          <Card title="Safe area" caption="useSafeAreaInsets()">
            <SafeAreaDiagram insets={insets} width={frame.width} height={frame.height} />
            <ValueRow label="frame" value={`${round(frame.width)} × ${round(frame.height)}`} />
          </Card>

          <Card title="Accessibility" caption="AccessibilityInfo">
            {accessibilityFeatures.map((feature) => (
              <ValueRow
                key={feature.key}
                label={feature.label}
                value={onOff(accessibility[feature.key])}
                highlight={accessibility[feature.key] === true}
              />
            ))}
          </Card>

          <Card title="Locale" caption="useDevicePreviewLocale()">
            <ValueRow label="useDevicePreviewLocale()" value={String(previewLocale)} highlight />
            <ValueRow label="app locale" value={appLocale.locale} />
            <ValueRow label="direction" value={appLocale.isRTL ? 'rtl' : 'ltr'} />
            <ValueRow label="clock" value={appLocale.hour12 == null ? 'locale default' : appLocale.hour12 ? '12-hour' : '24-hour'} />
          </Card>

          <Card title="Platform" caption="Platform / useDevicePreview()">
            <ValueRow label="Platform.OS" value={Platform.OS} />
            <ValueRow label="Platform.Version" value={String(Platform.Version ?? '—')} />
            <ValueRow label="preview active" value={String(isActive)} />
            <ValueRow label="simulated device" value={isActive ? simulation.preset.name : '—'} highlight />
          </Card>
        </ResponsiveGrid>

        <Card title="Keyboard" caption="Keyboard.addListener()">
          <View style={styles.keyboardRow}>
            <TextInput
              placeholder="Tap to open the keyboard"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            />
            <Pressable
              onPress={() => Keyboard.dismiss()}
              style={({ pressed }) => [styles.dismiss, { backgroundColor: theme.backgroundSelected }, pressed && styles.pressed]}>
              <ThemedText type="small">Dismiss</ThemedText>
            </Pressable>
          </View>
          <ValueRow label="visible" value={keyboard.visible ? `yes · ${round(keyboard.height)} pt` : 'no'} highlight={keyboard.visible} />
          {keyboard.log.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              No keyboard events yet.
            </ThemedText>
          ) : (
            keyboard.log.map((entry) => (
              <ValueRow key={entry.id} label={`${entry.time}  ${entry.event}`} value={`${round(entry.height)} pt`} />
            ))
          )}
        </Card>
      </Screen>
      {overlay ? <SafeAreaOverlay insets={insets} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlayToggle: { alignItems: 'center', gap: Spacing.one, marginBottom: Spacing.one },
  band: { position: 'absolute', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  bandTop: { top: 0, left: 0, right: 0 },
  bandBottom: { bottom: 0, left: 0, right: 0 },
  bandLeft: { left: 0 },
  bandRight: { right: 0 },
  bandLabel: { color: '#ffffff', fontSize: 10, fontWeight: 700 },
  diagramWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  diagram: { borderWidth: 1.5, borderRadius: 10, overflow: 'hidden' },
  diagramValues: { flex: 1 },
  keyboardRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: Spacing.three, height: 44, fontSize: 16 },
  dismiss: { paddingHorizontal: Spacing.three, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
});
