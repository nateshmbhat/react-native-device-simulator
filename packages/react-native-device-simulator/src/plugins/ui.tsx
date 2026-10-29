import * as React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { DeviceSimulatorPluginContext } from './types';

/** Small building blocks shared by the built-in plugin panels. */

type Theme = DeviceSimulatorPluginContext['theme'];

export function PanelSection({ title, theme, children }: { title?: string; theme: Theme; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      {title ? <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{title.toUpperCase()}</Text> : null}
      {children}
    </View>
  );
}

export function PanelButton({
  label,
  onPress,
  theme,
  variant = 'secondary',
  disabled,
  style,
  testID,
}: {
  label: string;
  onPress: () => void;
  theme: Theme;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary
          ? { backgroundColor: theme.accent, borderColor: theme.accent }
          : { backgroundColor: theme.surface, borderColor: theme.border },
        (pressed || disabled) && styles.dimmed,
        style,
      ]}
    >
      <Text numberOfLines={1} style={[styles.buttonText, { color: primary ? '#ffffff' : theme.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function KeyValueRow({ label, value, theme }: { label: string; value: string; theme: Theme }) {
  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <Text style={[styles.rowLabel, { color: theme.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.rowValue, { color: theme.text }]} selectable numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function Notice({ theme, children, tone = 'info' }: { theme: Theme; children: React.ReactNode; tone?: 'info' | 'error' }) {
  return (
    <View
      style={[
        styles.notice,
        { borderColor: tone === 'error' ? '#e5484d' : theme.border, backgroundColor: theme.surface },
      ]}
    >
      <Text style={[styles.noticeText, { color: tone === 'error' ? '#e5484d' : theme.textMuted }]}>{children}</Text>
    </View>
  );
}

export const panelStyles = StyleSheet.create({
  buttonRow: { flexDirection: 'row', gap: 8 },
  grow: { flex: 1 },
  code: { fontFamily: 'monospace', fontSize: 12 },
});

const styles = StyleSheet.create({
  section: { gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.6 },
  button: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 13, fontWeight: '600' },
  dimmed: { opacity: 0.6 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { fontSize: 12, flexShrink: 0 },
  rowValue: { fontSize: 12, fontWeight: '500', textAlign: 'right', flexShrink: 1 },
  notice: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 10 },
  noticeText: { fontSize: 12, lineHeight: 17 },
});
