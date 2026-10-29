import { Link, type Href } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AnimatedIcon } from '@/components/animated-icon';
import { Card } from '@/components/card';
import { HintRow } from '@/components/hint-row';
import { ResponsiveGrid } from '@/components/responsive-grid';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { Breakpoints, MaxGridWidth, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

interface Feature {
  href: Href;
  title: string;
  description: string;
  icon: SymbolViewProps['name'];
  color: string;
}

const features: Feature[] = [
  {
    href: '/inspector',
    title: 'Inspector',
    description: 'Live values your app sees: window size, pixel ratio, safe area, accessibility and keyboard events.',
    icon: { ios: 'ruler', android: 'straighten', web: 'straighten' },
    color: '#7C66DC',
  },
  {
    href: '/gallery',
    title: 'Responsive feed',
    description: 'A long scrolling grid whose columns follow the screen width — rotate or pick an iPad.',
    icon: { ios: 'square.grid.2x2.fill', android: 'grid_view', web: 'grid_view' },
    color: '#E5484D',
  },
  {
    href: '/form',
    title: 'Keyboard',
    description: 'A booking form whose fields stay above the simulated software keyboard.',
    icon: { ios: 'keyboard', android: 'keyboard', web: 'keyboard' },
    color: '#2B9A66',
  },
  {
    href: '/world',
    title: 'Languages',
    description: 'Eight locales, right-to-left layouts, dates, currencies and the 24-hour clock.',
    icon: { ios: 'globe', android: 'language', web: 'language' },
    color: '#2F6FEB',
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  const theme = useTheme();
  return (
    <Link href={feature.href} asChild>
      <Pressable style={({ pressed }) => [styles.fill, pressed && styles.pressed]}>
        <ThemedView type="backgroundElement" style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
            <SymbolView name={feature.icon} size={22} tintColor="#ffffff" />
          </View>
          <View style={styles.featureText}>
            <ThemedText type="smallBold" style={styles.featureTitle}>
              {feature.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {feature.description}
            </ThemedText>
          </View>
          <SymbolView
            name={{ ios: 'chevron.forward', android: 'chevron_right', web: 'chevron_right' }}
            size={16}
            tintColor={theme.textSecondary}
          />
        </ThemedView>
      </Pressable>
    </Link>
  );
}

export default function HomeScreen() {
  const { width, height, scale } = useWindowDimensions();
  const scheme = useColorScheme() ?? 'light';
  const wide = width >= Breakpoints.medium;
  const columns = width >= Breakpoints.expanded ? 3 : wide ? 2 : 1;

  return (
    <Screen maxWidth={MaxGridWidth}>
      <View style={[styles.hero, wide && styles.heroWide]}>
        <AnimatedIcon />
        <View style={[styles.heroText, wide && styles.heroTextWide]}>
          <ThemedText type="title" style={[styles.title, !wide && styles.center]}>
            One app,{'\n'}every screen.
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={!wide && styles.center}>
            This Expo app runs inside react-native-device-simulator. Pick a device in the toolbar — the
            app re-lays itself out without a single line of preview-specific code.
          </ThemedText>
          <ThemedView type="backgroundSelected" style={[styles.chip, !wide && styles.chipCentered]}>
            <ThemedText type="code">
              {Math.round(width)} × {Math.round(height)} pt · @{scale}x · {scheme} · {Platform.OS}
            </ThemedText>
          </ThemedView>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
          EXPLORE THE DEMO
        </ThemedText>
        <ResponsiveGrid columns={columns}>
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </ResponsiveGrid>
      </View>

      <Card title="Try it">
        <HintRow title="Switch device" hint="Toolbar › Device" />
        <HintRow title="Rotate" hint="Toolbar › Orientation" />
        <HintRow title="Dark mode, text size" hint="Toolbar › Settings" />
        <HintRow title="Edit this screen" hint={<ThemedText type="code">src/app/index.tsx</ThemedText>} />
      </Card>

      {Platform.OS === 'web' && <WebBadge />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: Spacing.four,
    paddingTop: Spacing.four,
  },
  heroWide: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  heroText: {
    gap: Spacing.three,
    alignSelf: 'stretch',
  },
  heroTextWide: {
    flex: 1,
  },
  title: {
    fontSize: 44,
    lineHeight: 50,
  },
  center: {
    textAlign: 'center',
  },
  chip: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
  },
  chipCentered: {
    alignSelf: 'center',
  },
  section: {
    gap: Spacing.three,
  },
  sectionTitle: {
    letterSpacing: 0.8,
    fontSize: 12,
  },
  fill: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  featureCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 20,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    gap: Spacing.half,
  },
  featureTitle: {
    fontSize: 16,
  },
});
