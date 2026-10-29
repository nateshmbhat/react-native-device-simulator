import { StyleSheet, Text, View } from 'react-native';
import { useDeviceSimulatorSettings } from '../../../context';
import { deviceSimulator } from '../../../core/store';
import type { ColorSchemeName, DeviceSimulatorSettings, ToolbarPosition } from '../../../types';
import { Button, Section, SegmentedControl } from '../controls';
import { space, type, useToolbarTheme } from '../theme';

type Background = DeviceSimulatorSettings['background'];

export function SettingsTab() {
  const settings = useDeviceSimulatorSettings();
  const p = useToolbarTheme();
  return (
    <View>
      <Section title="Toolbar position">
        <SegmentedControl<ToolbarPosition>
          accessibilityLabel="Toolbar position"
          value={settings.toolbar.position}
          onChange={(position) => deviceSimulator.update((s) => ({ toolbar: { ...s.toolbar, position } }))}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
            { value: 'bottom', label: 'Bottom' },
          ]}
        />
        <Text style={[type.small, { color: p.textFaint }]}>Auto uses a side panel on wide windows and a bottom bar on narrow ones.</Text>
      </Section>

      <Section title="Panel theme">
        <SegmentedControl<ColorSchemeName>
          accessibilityLabel="Panel theme"
          value={settings.theme}
          onChange={(theme) => deviceSimulator.update({ theme })}
          options={[
            { value: 'dark', label: 'Dark', icon: 'moon' },
            { value: 'light', label: 'Light', icon: 'sun' },
          ]}
        />
      </Section>

      <Section title="Background">
        <SegmentedControl<Background>
          accessibilityLabel="Background"
          value={settings.background}
          onChange={(background) => deviceSimulator.update({ background })}
          options={[
            { value: 'dots', label: 'Dots' },
            { value: 'plain', label: 'Plain' },
            { value: 'gradient', label: 'Gradient' },
          ]}
        />
      </Section>

      <Section title="Reset">
        <Text style={[type.small, { color: p.textMuted }]}>
          Restores the default device, display and accessibility settings. Toolbar preferences are kept.
        </Text>
        <Button variant="danger" icon="reset" label="Reset all settings" onPress={deviceSimulator.reset} style={styles.reset} />
      </Section>

      <View style={[styles.footer, { borderTopColor: p.divider }]}>
        <Text style={[type.small, { color: p.textFaint }]}>react-native-device-simulator</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  reset: { alignSelf: 'flex-start' },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.md, alignItems: 'center' },
});
