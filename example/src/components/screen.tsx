import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTabBarInsets } from '@/hooks/use-tab-bar-insets';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from './themed-text';

/** Padding that keeps content inside the safe area and clear of the tab bar. */
export function useScreenPadding() {
  const insets = useSafeAreaInsets();
  const bar = useTabBarInsets();
  return {
    paddingTop: insets.top + bar.top + Spacing.three,
    paddingBottom: insets.bottom + bar.bottom + Spacing.four,
    paddingLeft: insets.left + Spacing.three,
    paddingRight: insets.right + Spacing.three,
  };
}

export function ScreenHeader({ title, subtitle, accessory }: { title: string; subtitle?: string; accessory?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <ThemedText type="subtitle" style={styles.title}>
          {title}
        </ThemedText>
        {subtitle ? <ThemedText themeColor="textSecondary">{subtitle}</ThemedText> : null}
      </View>
      {accessory}
    </View>
  );
}

type ScreenProps = Omit<ScrollViewProps, 'children'> & {
  title?: string;
  subtitle?: string;
  headerAccessory?: ReactNode;
  maxWidth?: number;
  children: ReactNode;
};

/** A scrolling, safe-area aware screen with a large title. */
export function Screen({ title, subtitle, headerAccessory, maxWidth = MaxContentWidth, children, ...rest }: ScreenProps) {
  const theme = useTheme();
  const padding = useScreenPadding();
  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.content, padding]}
      keyboardShouldPersistTaps="handled"
      {...rest}>
      <View style={[styles.inner, { maxWidth }]}>
        {title ? <ScreenHeader title={title} subtitle={subtitle} accessory={headerAccessory} /> : null}
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { alignItems: 'center', flexGrow: 1 },
  inner: { width: '100%', gap: Spacing.four },
  header: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.three },
  headerText: { flex: 1, gap: Spacing.one },
  title: { fontSize: 34, lineHeight: 40, fontWeight: 700 },
});
