import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, View, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { useCompactTabs, WebTabBarHeight } from '@/hooks/use-tab-bar-insets.web';
import { useTheme } from '@/hooks/use-theme';

import { tabRoutes } from './tab-routes';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

/**
 * Web tabs. Like a native app, phones get a bottom tab bar (above the home
 * indicator); tablets and desktop windows get a floating top bar.
 */
export default function AppTabs() {
  const { t } = useLocale();
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          {tabRoutes.map((route) => (
            <TabTrigger key={route.name} name={route.name} href={route.href} asChild>
              <TabButton icon={route.icon}>{t.tabs[route.label]}</TabButton>
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & { icon: SymbolViewProps['name'] };

// `ref` is typed for a View; the Pressable doesn't need it.
export function TabButton({ children, isFocused, icon, ref: _ref, ...props }: TabButtonProps) {
  const compact = useCompactTabs();
  const theme = useTheme();
  const color = isFocused ? theme.tint : theme.textSecondary;

  if (compact) {
    return (
      <Pressable
        {...props}
        style={({ pressed }) => [styles.bottomButton, pressed && styles.pressed]}>
        <SymbolView name={icon} size={24} tintColor={color} />
        <ThemedText
          numberOfLines={1}
          style={[styles.bottomLabel, { color }, isFocused && styles.bottomLabelFocused]}>
          {children}
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.topButton}>
        <SymbolView name={icon} size={16} tintColor={isFocused ? theme.text : theme.textSecondary} />
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const compact = useCompactTabs();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const showBrand = useWindowDimensions().width >= 760;

  if (compact) {
    return (
      <View
        {...props}
        style={[
          styles.bottomBar,
          {
            height: WebTabBarHeight.bottom + insets.bottom,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
            backgroundColor: theme.background,
            borderTopColor: theme.border,
          },
        ]}>
        {props.children}
      </View>
    );
  }

  return (
    <View
      {...props}
      style={[
        styles.topBarContainer,
        { paddingTop: insets.top + Spacing.three, paddingLeft: insets.left, paddingRight: insets.right },
      ]}>
      <ThemedView type="backgroundElement" style={styles.topBar}>
        {showBrand ? (
          <ThemedText type="smallBold" style={styles.brandText}>
            Device Simulator
          </ThemedText>
        ) : null}
        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    height: WebTabBarHeight.bottom,
  },
  bottomLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: 500,
  },
  bottomLabelFocused: {
    fontWeight: 700,
  },
  topBarContainer: {
    position: 'absolute',
    width: '100%',
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  topBar: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    marginHorizontal: Spacing.three,
  },
  brandText: {
    marginEnd: 'auto',
  },
  topButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
