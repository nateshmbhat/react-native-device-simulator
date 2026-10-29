import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { ScreenHeader, useScreenPadding } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxGridWidth, Spacing } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';

type Category = 'Beaches' | 'Mountains' | 'Cities' | 'Food' | 'Design';

interface Place {
  id: string;
  title: string;
  location: string;
  emoji: string;
  color: string;
  category: Category;
  rating: number;
  saves: number;
}

const categories: ('All' | Category)[] = ['All', 'Beaches', 'Mountains', 'Cities', 'Food', 'Design'];

const seeds: Omit<Place, 'id' | 'rating' | 'saves'>[] = [
  { title: 'Praia da Marinha', location: 'Algarve, Portugal', emoji: '🏖️', color: '#F4A259', category: 'Beaches' },
  { title: 'Dolomites Loop', location: 'South Tyrol, Italy', emoji: '🏔️', color: '#5B8E7D', category: 'Mountains' },
  { title: 'Shibuya at Night', location: 'Tokyo, Japan', emoji: '🌃', color: '#3D348B', category: 'Cities' },
  { title: 'Masala Dosa', location: 'Bengaluru, India', emoji: '🥞', color: '#E8A33D', category: 'Food' },
  { title: 'Casa Batlló', location: 'Barcelona, Spain', emoji: '🏛️', color: '#2EC4B6', category: 'Design' },
  { title: 'Bondi Sunrise', location: 'Sydney, Australia', emoji: '🌅', color: '#FF7F51', category: 'Beaches' },
  { title: 'Torres del Paine', location: 'Patagonia, Chile', emoji: '⛰️', color: '#4F6D7A', category: 'Mountains' },
  { title: 'Old Town Lanes', location: 'Prague, Czechia', emoji: '🏰', color: '#9C6644', category: 'Cities' },
  { title: 'Ramen Counter', location: 'Fukuoka, Japan', emoji: '🍜', color: '#D1495B', category: 'Food' },
  { title: 'Bauhaus Archive', location: 'Berlin, Germany', emoji: '📐', color: '#EDAE49', category: 'Design' },
  { title: 'Navagio Cove', location: 'Zakynthos, Greece', emoji: '🐚', color: '#00A6A6', category: 'Beaches' },
  { title: 'Matterhorn Trail', location: 'Zermatt, Switzerland', emoji: '🗻', color: '#6C757D', category: 'Mountains' },
  { title: 'Medina Rooftops', location: 'Marrakesh, Morocco', emoji: '🕌', color: '#C8553D', category: 'Cities' },
  { title: 'Pastel de Nata', location: 'Lisbon, Portugal', emoji: '🥧', color: '#F2CC8F', category: 'Food' },
  { title: 'Louisiana Museum', location: 'Humlebæk, Denmark', emoji: '🖼️', color: '#81B29A', category: 'Design' },
  { title: 'Anse Source d’Argent', location: 'La Digue, Seychelles', emoji: '🌴', color: '#06D6A0', category: 'Beaches' },
];

const places: Place[] = Array.from({ length: 64 }, (_, i) => {
  const seed = seeds[i % seeds.length]!;
  return {
    ...seed,
    id: String(i),
    rating: 4 + ((i * 7) % 10) / 10,
    saves: 120 + ((i * 7919) % 9000),
  };
});

/** Columns for the available content width. */
function columnsFor(width: number): number {
  if (width < 300) return 1;
  if (width < 560) return 2;
  if (width < 860) return 3;
  return 4;
}

function PlaceCard({ place, locale }: { place: Place; locale: string }) {
  const [saved, setSaved] = useState(false);
  const saves = new Intl.NumberFormat(locale, { notation: 'compact' }).format(place.saves + (saved ? 1 : 0));
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={[styles.cover, { backgroundColor: place.color }]}>
        <View style={styles.coverBlob} />
        <ThemedText style={styles.emoji}>{place.emoji}</ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from saved' : 'Save'}
          onPress={() => setSaved((s) => !s)}
          style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
          <SymbolView
            name={{ ios: saved ? 'heart.fill' : 'heart', android: 'favorite', web: 'favorite' }}
            size={16}
            tintColor={saved ? '#E5484D' : '#1c1c1e'}
          />
        </Pressable>
      </View>
      <View style={styles.cardBody}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {place.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {place.location}
        </ThemedText>
        <View style={styles.meta}>
          <ThemedText type="small">★ {place.rating.toFixed(1)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {saves}
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

export default function GalleryScreen() {
  const theme = useTheme();
  const { locale } = useLocale();
  const { width } = useWindowDimensions();
  const padding = useScreenPadding();
  const [category, setCategory] = useState<(typeof categories)[number]>('All');
  const [query, setQuery] = useState('');

  // Center the grid on wide screens.
  const extra = Math.max(0, (width - padding.paddingLeft - padding.paddingRight - MaxGridWidth) / 2);
  const contentWidth = width - padding.paddingLeft - padding.paddingRight - extra * 2;
  const columns = columnsFor(contentWidth);

  const q = query.trim().toLowerCase();
  const data = places.filter(
    (p) =>
      (category === 'All' || p.category === category) &&
      (!q || p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)),
  );

  return (
    <FlatList
      key={columns}
      style={{ flex: 1, backgroundColor: theme.background }}
      data={data}
      numColumns={columns}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={[
        padding,
        { paddingLeft: padding.paddingLeft + extra, paddingRight: padding.paddingRight + extra, gap: Spacing.three },
      ]}
      columnWrapperStyle={columns > 1 ? { gap: Spacing.three } : undefined}
      ListHeaderComponent={
        <View style={styles.header}>
          <ScreenHeader
            title="Discover"
            subtitle={`${data.length} places · ${columns} ${columns === 1 ? 'column' : 'columns'} at ${Math.round(width)} pt`}
          />
          <ThemedView type="backgroundElement" style={styles.search}>
            <SymbolView
              name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              size={18}
              tintColor={theme.textSecondary}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search places"
              placeholderTextColor={theme.textSecondary}
              returnKeyType="search"
              style={[styles.searchInput, { color: theme.text }]}
            />
          </ThemedView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {categories.map((c) => {
              const selected = c === category;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[
                    styles.chip,
                    { backgroundColor: selected ? theme.text : theme.backgroundElement },
                  ]}>
                  <ThemedText type="small" style={{ color: selected ? theme.background : theme.text }}>
                    {c}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      }
      ListEmptyComponent={
        <ThemedText themeColor="textSecondary" style={styles.empty}>
          No places match “{query}”.
        </ThemedText>
      }
      renderItem={({ item, index }) => {
        // Keep the last row's cards the same width as the others.
        const isLastRow = index >= data.length - (data.length % columns || columns);
        return (
          <View style={[styles.cell, isLastRow && { maxWidth: `${100 / columns}%` }]}>
            <PlaceCard place={item} locale={locale} />
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.three, marginBottom: Spacing.one },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 14,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 16, height: 44, outlineWidth: 0 },
  chips: { gap: Spacing.two },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: 6, borderRadius: 999 },
  cell: { flex: 1 },
  card: { borderRadius: 18, overflow: 'hidden' },
  cover: { aspectRatio: 4 / 3, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  coverBlob: {
    position: 'absolute',
    width: '90%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    top: '-30%',
    end: '-30%',
  },
  emoji: { fontSize: 48, lineHeight: 60 },
  saveButton: {
    position: 'absolute',
    top: Spacing.two,
    end: Spacing.two,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  cardBody: { padding: Spacing.three, gap: 2 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.one },
  empty: { textAlign: 'center', paddingVertical: Spacing.five },
});
