import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useDeviceSimulator } from 'react-native-device-simulator';

import { Card, ValueRow } from '@/components/card';
import { ResponsiveGrid } from '@/components/responsive-grid';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Breakpoints, Spacing } from '@/constants/theme';
import { languages, strings } from '@/i18n/strings';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';

const avatarColors = ['#7C66DC', '#2B9A66', '#E5484D'];

function safeFormat(format: () => string, fallback: string): string {
  try {
    return format();
  } catch {
    return fallback;
  }
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: selected ? theme.text : theme.background, borderColor: theme.border }]}>
      <ThemedText type="small" style={{ color: selected ? theme.background : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/** Lets you switch the simulated locale and clock from inside the app. */
function PreviewControls() {
  const { settings, controller, isActive } = useDeviceSimulator();
  if (!isActive) return null;
  return (
    <Card title="Preview controls" caption="useDeviceSimulator().controller">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="System" selected={settings.locale == null} onPress={() => controller.setLocale(null)} />
        {languages.map((language) => (
          <Chip
            key={language}
            label={strings[language].languageName}
            selected={settings.locale === strings[language].locale}
            onPress={() => controller.setLocale(strings[language].locale)}
          />
        ))}
      </ScrollView>
      <View style={styles.chips}>
        <Chip label="Auto clock" selected={settings.use24HourClock == null} onPress={() => controller.update({ use24HourClock: null })} />
        <Chip label="12-hour" selected={settings.use24HourClock === false} onPress={() => controller.update({ use24HourClock: false })} />
        <Chip label="24-hour" selected={settings.use24HourClock === true} onPress={() => controller.update({ use24HourClock: true })} />
      </View>
    </Card>
  );
}

export default function WorldScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { locale, t, isRTL, hour12, isSimulated } = useLocale();
  const now = new Date();
  const columns = width >= Breakpoints.medium ? 2 : 1;

  const date = safeFormat(() => new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(now), now.toDateString());
  const time = safeFormat(
    () => new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12 }).format(now),
    now.toTimeString().slice(0, 5),
  );
  const dinner = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 30);
  const dinnerTime = safeFormat(
    () => new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12 }).format(dinner),
    '19:30',
  );
  const trip = safeFormat(
    () => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(3, 'day'),
    'in 3 days',
  );
  const number = (value: number, options?: Intl.NumberFormatOptions) =>
    safeFormat(() => new Intl.NumberFormat(locale, options).format(value), String(value));

  const directionLabel = isRTL ? 'RTL' : 'LTR';
  const clockLabel = hour12 == null ? 'auto' : hour12 ? '12h' : '24h';

  return (
    <Screen
      title={t.greeting}
      subtitle={t.subtitle}
      headerAccessory={
        <ThemedView type="backgroundElement" style={styles.badge}>
          <ThemedText type="code">{locale}</ThemedText>
          <ThemedText type="code" themeColor="tint">
            {directionLabel} · {clockLabel}
          </ThemedText>
        </ThemedView>
      }>
      <PreviewControls />

      <ResponsiveGrid columns={columns}>
        <Card title={t.today} caption={isSimulated ? 'simulated locale' : 'device locale'}>
          <ThemedText type="subtitle" style={styles.clock}>
            {time}
          </ThemedText>
          <ThemedText themeColor="textSecondary">{date}</ThemedText>
          <View style={[styles.event, { borderColor: theme.border }]}>
            <View style={[styles.eventBar, { backgroundColor: theme.tint }]} />
            <View style={styles.flex}>
              <ThemedText type="smallBold">Mesa · {dinnerTime}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t.nextTrip}: {t.inDays} · {trip}
              </ThemedText>
            </View>
          </View>
        </Card>

        <Card title={t.numbers}>
          <ValueRow label={t.balance} value={number(12345.67, { style: 'currency', currency: t.currency })} />
          <ValueRow label={t.growth} value={number(0.234, { style: 'percent', signDisplay: 'always', maximumFractionDigits: 1 })} />
          <ValueRow label={t.followers} value={number(1234567, { notation: 'compact' })} />
          <ValueRow label="1234567.89" value={number(1234567.89)} />
          <View style={styles.progressHeader}>
            <ThemedText type="small" themeColor="textSecondary">
              {t.storageUsed}
            </ThemedText>
            <ThemedText type="small">{number(0.72, { style: 'percent' })}</ThemedText>
          </View>
          {/* The fill starts at the leading edge: left in LTR, right in RTL. */}
          <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
            <View style={[styles.fill, { backgroundColor: theme.tint }]} />
          </View>
        </Card>
      </ResponsiveGrid>

      <Card title={t.inbox} caption={t.newMessages(t.contacts.length)}>
        {t.contacts.map((contact, i) => (
          <View key={contact.name} style={[styles.contact, i > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.avatar, { backgroundColor: avatarColors[i % avatarColors.length] }]}>
              <ThemedText type="smallBold" style={styles.avatarText}>
                {contact.name.slice(0, 1)}
              </ThemedText>
            </View>
            <View style={styles.flex}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {contact.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {contact.message}
              </ThemedText>
            </View>
            <SymbolView
              name={
                isRTL
                  ? { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }
                  : { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }
              }
              size={16}
              tintColor={theme.textSecondary}
            />
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  badge: {
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 10,
    marginBottom: Spacing.two,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: 6, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  clock: { fontSize: 40, lineHeight: 48 },
  event: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'stretch',
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  eventBar: { width: 4, borderRadius: 2 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.two },
  track: { height: 8, borderRadius: 4, flexDirection: 'row', overflow: 'hidden' },
  fill: { width: '72%', borderRadius: 4 },
  contact: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#ffffff', fontSize: 16 },
});
