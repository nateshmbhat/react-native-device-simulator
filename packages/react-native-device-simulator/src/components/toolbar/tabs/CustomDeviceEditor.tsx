import { StyleSheet, Text, View } from 'react-native';
import { useDeviceSimulatorSettings } from '../../../context';
import { deviceSimulator } from '../../../core/store';
import type { CustomDeviceSpec, DeviceKind, DevicePlatform, EdgeInsets } from '../../../types';
import { NumberField, SegmentedControl, TextField, type SegmentOption } from '../controls';
import { radius, space, type, useToolbarTheme } from '../theme';

const PLATFORMS: readonly SegmentOption<DevicePlatform>[] = [
  { value: 'ios', label: 'iOS' },
  { value: 'android', label: 'Android' },
  { value: 'web', label: 'Web' },
  { value: 'macos', label: 'macOS' },
  { value: 'windows', label: 'Win', accessibilityLabel: 'Windows' },
];

const KINDS: readonly SegmentOption<DeviceKind>[] = [
  { value: 'phone', label: 'Phone' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'foldable', label: 'Fold', accessibilityLabel: 'Foldable' },
  { value: 'desktop', label: 'Desktop' },
];

const INSET_KEYS: readonly (keyof EdgeInsets)[] = ['top', 'bottom', 'left', 'right'];

function updateCustom(patch: Partial<CustomDeviceSpec>) {
  deviceSimulator.update((s) => ({ customDevice: { ...s.customDevice, ...patch } }));
}

/** Editor bound to `settings.customDevice`. */
export function CustomDeviceEditor() {
  const p = useToolbarTheme();
  const { customDevice: d } = useDeviceSimulatorSettings();

  return (
    <View style={[styles.editor, { backgroundColor: p.surface, borderColor: p.border }]}>
      <TextField label="Name" value={d.name} onChangeText={(name) => updateCustom({ name })} />

      <Label text="Platform" />
      <SegmentedControl compact accessibilityLabel="Platform" options={PLATFORMS} value={d.platform} onChange={(platform) => updateCustom({ platform })} />

      <Label text="Kind" />
      <SegmentedControl compact accessibilityLabel="Kind" options={KINDS} value={d.kind} onChange={(kind) => updateCustom({ kind })} />

      <Label text="Screen (portrait, logical px)" />
      <View style={styles.fields}>
        <NumberField
          style={styles.flex}
          label="Width"
          min={100}
          max={4000}
          value={d.portraitSize.width}
          onChange={(width) => updateCustom({ portraitSize: { ...d.portraitSize, width } })}
        />
        <NumberField
          style={styles.flex}
          label="Height"
          min={100}
          max={4000}
          value={d.portraitSize.height}
          onChange={(height) => updateCustom({ portraitSize: { ...d.portraitSize, height } })}
        />
        <NumberField
          style={styles.flex}
          label="Pixel ratio"
          min={0.5}
          max={5}
          decimals={3}
          value={d.devicePixelRatio}
          onChange={(devicePixelRatio) => updateCustom({ devicePixelRatio })}
        />
      </View>

      <Label text="Safe area (portrait)" />
      <View style={styles.fields}>
        {INSET_KEYS.map((key) => (
          <NumberField
            key={key}
            style={styles.flex}
            label={key.charAt(0).toUpperCase() + key.slice(1)}
            max={500}
            value={d.portraitPadding[key]}
            onChange={(v) => updateCustom({ portraitPadding: { ...d.portraitPadding, [key]: v }, landscapePadding: undefined })}
          />
        ))}
      </View>
    </View>
  );
}

function Label({ text }: { text: string }) {
  const p = useToolbarTheme();
  return <Text style={[type.small, styles.label, { color: p.textMuted }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  editor: {
    marginTop: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  label: { marginTop: space.sm },
  fields: { flexDirection: 'row', gap: space.sm },
  flex: { flex: 1 },
});
