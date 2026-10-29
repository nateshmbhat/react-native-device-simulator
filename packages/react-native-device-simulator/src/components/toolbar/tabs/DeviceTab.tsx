import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useDeviceSimulatorSettings, useDeviceSimulatorSimulation } from '../../../context';
import { keyboardHeightFor } from '../../../core/geometry';
import { deviceSimulator } from '../../../core/store';
import { CUSTOM_DEVICE_ID } from '../../../presets';
import type { DevicePreset } from '../../../types';
import { IconButton, ListItem, SearchInput, Section, SegmentedControl, SwitchRow } from '../controls';
import { useDevicePresets } from '../host';
import { Icon, kindIcon } from '../icons';
import {
  filterDevices,
  groupByBrand,
  KIND_FILTERS,
  kindLabel,
  lengthLabel,
  pixelRatioLabel,
  platformLabel,
  sizeLabel,
  type KindFilter,
} from '../logic';
import { radius, space, type, useToolbarTheme } from '../theme';
import { CustomDeviceEditor } from './CustomDeviceEditor';

const selectDevice = (id: string) => deviceSimulator.setDevice(id);

export function DeviceTab() {
  const settings = useDeviceSimulatorSettings();
  const simulation = useDeviceSimulatorSimulation();
  const p = useToolbarTheme();
  const { preset, orientation, screenSize } = simulation;
  // Desktop windows are never turned on their side.
  const canRotate = preset.kind !== 'desktop';
  const hasKeyboard = (keyboardHeightFor(preset, orientation) ?? 0) > 0;

  return (
    <View>
      <View style={[styles.summary, { backgroundColor: p.surface, borderColor: p.border }]}>
        <View style={[styles.summaryIcon, { backgroundColor: p.accentSoft }]}>
          <Icon name={kindIcon(preset.kind)} size={20} color={p.accent} />
        </View>
        <View style={styles.summaryText}>
          <Text style={[type.title, { color: p.text }]} numberOfLines={1}>
            {preset.name}
          </Text>
          <Text style={[type.mono, { color: p.textMuted, marginTop: 2 }]} numberOfLines={1}>
            {lengthLabel(screenSize.width)} × {lengthLabel(screenSize.height)} {pixelRatioLabel(preset.devicePixelRatio)}
          </Text>
          <Text style={[type.small, { color: p.textFaint, marginTop: 1 }]} numberOfLines={1}>
            {platformLabel(preset.platform)} · {kindLabel(preset.kind)}
            {preset.year ? ` · ${preset.year}` : ''}
          </Text>
        </View>
        {canRotate ? (
          <IconButton
            icon="rotate"
            size={32}
            iconSize={17}
            onPress={deviceSimulator.toggleOrientation}
            accessibilityLabel={`Rotate to ${orientation === 'portrait' ? 'landscape' : 'portrait'}`}
          />
        ) : null}
      </View>

      <Section>
        {canRotate ? (
          <SegmentedControl
            accessibilityLabel="Orientation"
            value={orientation}
            onChange={deviceSimulator.setOrientation}
            options={[
              { value: 'portrait', label: 'Portrait', icon: 'phone' },
              { value: 'landscape', label: 'Landscape', icon: 'rotate' },
            ]}
          />
        ) : null}
        <View style={styles.switches}>
          <SwitchRow
            icon="power"
            label="Simulate device"
            value={settings.isEnabled}
            onValueChange={deviceSimulator.setEnabled}
          />
          <SwitchRow
            icon="frame"
            label="Device frame"
            value={settings.isFrameVisible}
            onValueChange={(isFrameVisible) => deviceSimulator.update({ isFrameVisible })}
          />
          <SwitchRow
            icon="statusBar"
            label="System UI"
            description="Status bar and home indicator"
            value={settings.showSystemUi}
            onValueChange={(showSystemUi) => deviceSimulator.update({ showSystemUi })}
          />
          <SwitchRow
            icon="keyboard"
            label="Virtual keyboard"
            description={hasKeyboard ? undefined : 'Not available on this device'}
            value={settings.keyboardVisible && hasKeyboard}
            disabled={!hasKeyboard}
            onValueChange={deviceSimulator.setKeyboardVisible}
          />
        </View>
      </Section>

      <DevicePicker selectedId={settings.deviceId} customSize={sizeLabel(settings.customDevice)} />
    </View>
  );
}

function DevicePicker({ selectedId, customSize }: { selectedId: string; customSize: string }) {
  const p = useToolbarTheme();
  const presets = useDevicePresets();
  const [query, setQuery] = React.useState('');
  const [kind, setKind] = React.useState<KindFilter>('all');
  const groups = React.useMemo(() => groupByBrand(filterDevices(presets, query, kind)), [presets, query, kind]);
  const customSelected = selectedId === CUSTOM_DEVICE_ID;
  const showCustom = query.trim() === '' || 'custom device'.includes(query.trim().toLowerCase());

  return (
    <Section title="Devices">
      <SearchInput value={query} onChangeText={setQuery} placeholder="Search name, brand or year" accessibilityLabel="Search devices" />
      <SegmentedControl compact accessibilityLabel="Device kind" options={KIND_FILTERS} value={kind} onChange={setKind} />
      <View style={styles.list}>
        {groups.map((g) => (
          <View key={g.brand} style={styles.group}>
            <Text style={[type.caption, styles.groupTitle, { color: p.textFaint }]}>{g.brand}</Text>
            {g.devices.map((d) => (
              <DeviceRow key={d.id} device={d} selected={d.id === selectedId} />
            ))}
          </View>
        ))}
        {groups.length === 0 && !showCustom ? (
          <Text style={[type.small, styles.empty, { color: p.textFaint }]}>No device matches “{query}”.</Text>
        ) : null}
        {showCustom ? (
          <View style={styles.group}>
            <Text style={[type.caption, styles.groupTitle, { color: p.textFaint }]}>Custom</Text>
            <ListItem icon="edit" title="Custom device" subtitle={customSize} selected={customSelected} onPress={() => selectDevice(CUSTOM_DEVICE_ID)} />
            {customSelected ? <CustomDeviceEditor /> : null}
          </View>
        ) : null}
      </View>
    </Section>
  );
}

const DeviceRow = React.memo(function DeviceRow({ device, selected }: { device: DevicePreset; selected: boolean }) {
  return (
    <ListItem
      icon={kindIcon(device.kind)}
      title={device.name}
      subtitle={sizeLabel(device)}
      trailing={device.year ? String(device.year) : undefined}
      selected={selected}
      onPress={() => selectDevice(device.id)}
    />
  );
});

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: space.md,
  },
  summaryIcon: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  summaryText: { flex: 1, minWidth: 0 },
  switches: { marginTop: space.xs },
  list: { marginTop: space.xs, gap: space.md },
  group: { gap: 1 },
  groupTitle: { paddingHorizontal: space.sm + 2, paddingBottom: 3 },
  empty: { textAlign: 'center', paddingVertical: space.lg },
});
