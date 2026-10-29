import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export function Card({
  title,
  caption,
  children,
  style,
}: {
  title?: string;
  caption?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <ThemedView type="backgroundElement" style={[styles.card, style]}>
      {title ? (
        <View style={styles.header}>
          <ThemedText type="smallBold">{title}</ThemedText>
          {caption ? (
            <ThemedText type="code" themeColor="textSecondary" numberOfLines={1} style={styles.caption}>
              {caption}
            </ThemedText>
          ) : null}
        </View>
      ) : null}
      {children}
    </ThemedView>
  );
}

/** A label/value line, value in monospace. */
export function ValueRow({ label, value, highlight }: { label: string; value: ReactNode; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.rowLabel}>
        {label}
      </ThemedText>
      <ThemedText type="code" themeColor={highlight ? 'tint' : 'text'} style={styles.rowValue} selectable>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  // flexGrow: cards in the same ResponsiveGrid row share the row height.
  card: { borderRadius: 20, padding: Spacing.three, gap: Spacing.two, flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  caption: { flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three, minHeight: 24 },
  rowLabel: { flexShrink: 1 },
  rowValue: { fontSize: 13, textAlign: 'right' },
});
