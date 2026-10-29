import * as React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDevicePreviewSettings } from '../../../context';
import { devicePreview } from '../../../core/store';
import type { StatusBarStyleOverride } from '../../../types';
import { Chip, ListItem, Row, SearchInput, Section, SegmentedControl, Stepper } from '../controls';
import { filterLocales, localeLabel, LOCALES } from '../locales';
import { stepTextScale, TEXT_SCALE_MAX, TEXT_SCALE_MIN, TEXT_SCALE_PRESETS, textScaleLabel } from '../logic';
import { radius, space, type, useToolbarTheme } from '../theme';

type Scheme = 'system' | 'light' | 'dark';
type Clock = 'system' | '12' | '24';

export function DisplayTab() {
  const settings = useDevicePreviewSettings();
  const p = useToolbarTheme();
  const { fontScale } = settings;
  const clock: Clock = settings.use24HourClock === null ? 'system' : settings.use24HourClock ? '24' : '12';

  return (
    <View>
      <Section title="Appearance">
        <SegmentedControl<Scheme>
          accessibilityLabel="Color scheme"
          value={settings.colorScheme ?? 'system'}
          onChange={(v) => devicePreview.setColorScheme(v === 'system' ? null : v)}
          options={[
            { value: 'system', label: 'System', icon: 'display' },
            { value: 'light', label: 'Light', icon: 'sun' },
            { value: 'dark', label: 'Dark', icon: 'moon' },
          ]}
        />
      </Section>

      <Section
        title="Text size"
        right={
          <Text style={[type.mono, { color: fontScale === null ? p.textFaint : p.accent }]}>
            {fontScale === null ? 'System' : textScaleLabel(fontScale)}
          </Text>
        }
      >
        <View style={styles.chips}>
          <Chip label="System" selected={fontScale === null} onPress={() => devicePreview.setFontScale(null)} />
          {TEXT_SCALE_PRESETS.map((s) => (
            <Chip
              key={s}
              label={textScaleLabel(s)}
              accessibilityLabel={`Text scale ${s}`}
              selected={fontScale !== null && Math.abs(fontScale - s) < 0.001}
              onPress={() => devicePreview.setFontScale(s)}
            />
          ))}
        </View>
        <Row icon="textSize" label="Fine tune">
          <Stepper
            accessibilityLabel="text scale"
            value={textScaleLabel(fontScale ?? 1)}
            canDecrement={(fontScale ?? 1) > TEXT_SCALE_MIN}
            canIncrement={(fontScale ?? 1) < TEXT_SCALE_MAX}
            onDecrement={() => devicePreview.setFontScale(stepTextScale(fontScale, -1))}
            onIncrement={() => devicePreview.setFontScale(stepTextScale(fontScale, 1))}
          />
        </Row>
      </Section>

      <LocalePicker locale={settings.locale} />

      <Section title="Clock">
        <SegmentedControl<Clock>
          accessibilityLabel="Clock format"
          value={clock}
          onChange={(v) => devicePreview.update({ use24HourClock: v === 'system' ? null : v === '24' })}
          options={[
            { value: 'system', label: 'System' },
            { value: '12', label: '12-hour' },
            { value: '24', label: '24-hour' },
          ]}
        />
      </Section>

      <Section title="Status bar content">
        <SegmentedControl<StatusBarStyleOverride>
          accessibilityLabel="Status bar style"
          value={settings.statusBarStyle}
          onChange={(statusBarStyle) => devicePreview.update({ statusBarStyle })}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'light-content', label: 'Light', accessibilityLabel: 'Light content' },
            { value: 'dark-content', label: 'Dark', accessibilityLabel: 'Dark content' },
          ]}
        />
      </Section>
    </View>
  );
}

function LocalePicker({ locale }: { locale: string | null }) {
  const p = useToolbarTheme();
  const [query, setQuery] = React.useState('');
  const results = React.useMemo(() => filterLocales(LOCALES, query), [query]);
  const showSystem = query.trim() === '' || 'system default'.includes(query.trim().toLowerCase());
  return (
    <Section
      title="Language & region"
      right={
        <Text style={[type.small, { color: locale ? p.accent : p.textFaint }]} numberOfLines={1}>
          {/* LRM keeps the label left-to-right when it starts with an RTL name. */}
          {locale ? `\u200E${localeLabel(locale)}` : 'System'}
        </Text>
      }
    >
      <SearchInput value={query} onChangeText={setQuery} placeholder="Search languages" accessibilityLabel="Search locales" />
      <View style={[styles.localeBox, { borderColor: p.border }]}>
        <ScrollView nestedScrollEnabled style={styles.localeScroll} contentContainerStyle={styles.localeList}>
          {showSystem ? (
            <ListItem icon="globe" title="System default" selected={locale === null} onPress={() => devicePreview.setLocale(null)} />
          ) : null}
          {results.map((l) => (
            <ListItem
              key={l.tag}
              title={l.native}
              subtitle={l.tag}
              trailing={l.rtl ? 'RTL' : undefined}
              selected={locale !== null && locale.toLowerCase() === l.tag.toLowerCase()}
              onPress={() => devicePreview.setLocale(l.tag)}
            />
          ))}
          {results.length === 0 && !showSystem ? (
            <Text style={[type.small, styles.empty, { color: p.textFaint }]}>No language matches “{query}”.</Text>
          ) : null}
        </ScrollView>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  localeBox: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, overflow: 'hidden' },
  localeScroll: { maxHeight: 224, ...(Platform.OS === 'web' ? ({ overscrollBehavior: 'contain' } as object) : null) },
  localeList: { padding: 3 },
  empty: { textAlign: 'center', paddingVertical: space.lg },
});
