import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useDeviceSimulatorSettings } from '../../../context';
import { deviceSimulator } from '../../../core/store';
import type { AccessibilityOverrides } from '../../../types';
import { Button, Section, SegmentedControl, type SegmentOption } from '../controls';
import { space, type, useToolbarTheme } from '../theme';

type Tri = 'device' | 'on' | 'off';

const TRI_OPTIONS: readonly SegmentOption<Tri>[] = [
  { value: 'device', label: 'Device', accessibilityLabel: 'Use device setting' },
  { value: 'on', label: 'On' },
  { value: 'off', label: 'Off' },
];

export const ACCESSIBILITY_ITEMS: readonly { key: keyof AccessibilityOverrides; label: string; description: string }[] = [
  { key: 'boldText', label: 'Bold text', description: 'Heavier font weights (iOS setting).' },
  { key: 'reduceMotion', label: 'Reduce motion', description: 'Apps should minimise animations.' },
  { key: 'reduceTransparency', label: 'Reduce transparency', description: 'Blurs and translucency become opaque.' },
  { key: 'invertColors', label: 'Invert colors', description: 'Smart invert of the screen colours.' },
  { key: 'grayscale', label: 'Grayscale', description: 'Renders the screen without colour.' },
  { key: 'highContrast', label: 'Increase contrast', description: 'Higher contrast between colours.' },
  { key: 'darkerSystemColors', label: 'Darker system colors', description: 'Darker system tints (iOS).' },
  { key: 'screenReader', label: 'Screen reader', description: 'Reports VoiceOver / TalkBack as running.' },
];

const toTri = (v: boolean | null): Tri => (v === null ? 'device' : v ? 'on' : 'off');
const fromTri = (v: Tri): boolean | null => (v === 'device' ? null : v === 'on');

function setOverride(key: keyof AccessibilityOverrides, value: boolean | null) {
  deviceSimulator.update((s) => ({ accessibility: { ...s.accessibility, [key]: value } }));
}

export function AccessibilityTab() {
  const { accessibility } = useDeviceSimulatorSettings();
  const p = useToolbarTheme();
  const overridden = ACCESSIBILITY_ITEMS.filter((i) => accessibility[i.key] !== null).length;
  return (
    <View>
      <Section
        title="Overrides"
        right={
          <Text style={[type.small, { color: overridden ? p.accent : p.textFaint }]}>
            {overridden ? `${overridden} active` : 'None'}
          </Text>
        }
      >
        <View style={styles.list}>
          {ACCESSIBILITY_ITEMS.map((item) => (
            <AccessibilityRow
              key={item.key}
              id={item.key}
              label={item.label}
              description={item.description}
              value={toTri(accessibility[item.key])}
            />
          ))}
        </View>
      </Section>
      {overridden ? (
        <Button
          icon="reset"
          label="Use device settings for all"
          onPress={() =>
            deviceSimulator.update((s) => ({
              accessibility: Object.fromEntries(Object.keys(s.accessibility).map((k) => [k, null])) as unknown as AccessibilityOverrides,
            }))
          }
        />
      ) : null}
    </View>
  );
}

const AccessibilityRow = React.memo(function AccessibilityRow({
  id,
  label,
  description,
  value,
}: {
  id: keyof AccessibilityOverrides;
  label: string;
  description: string;
  value: Tri;
}) {
  const p = useToolbarTheme();
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={[type.body, styles.label, { color: p.text }]} numberOfLines={1}>
          {label}
        </Text>
        <SegmentedControl compact accessibilityLabel={label} options={TRI_OPTIONS} value={value} onChange={(v) => setOverride(id, fromTri(v))} style={styles.tri} />
      </View>
      <Text style={[type.small, { color: p.textMuted }]} numberOfLines={2}>
        {description}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  list: { gap: space.md + 2 },
  row: { gap: 2 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  label: { flex: 1, minWidth: 0 },
  tri: { width: 116 },
});
