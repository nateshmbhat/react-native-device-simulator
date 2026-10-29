import { allPresets } from '../../../presets';
import type { DevicePreset } from '../../../types';
import { parseNumber } from '../controls';
import { filterLocales, localeLabel, LOCALES } from '../locales';
import {
  filterDevices,
  groupByBrand,
  lengthLabel,
  pixelRatioLabel,
  resolveToolbarPlacement,
  rootDirection,
  sizeLabel,
  stepTextScale,
  TEXT_SCALE_MAX,
  TEXT_SCALE_MIN,
} from '../logic';

const device = (id: string, brand: string | undefined, year: number | undefined, kind: DevicePreset['kind'] = 'phone'): DevicePreset => ({
  id,
  name: id,
  brand,
  year,
  kind,
  platform: 'ios',
  portraitSize: { width: 100, height: 200 },
  devicePixelRatio: 2,
  portraitPadding: { top: 0, right: 0, bottom: 0, left: 0 },
});

describe('filterDevices', () => {
  it('returns everything for an empty query and "all"', () => {
    expect(filterDevices(allPresets, '  ', 'all')).toHaveLength(allPresets.length);
  });

  it('matches name, brand and year, every word, case- and accent-insensitively', () => {
    const names = filterDevices(allPresets, 'IPHONE 17', 'all').map((p) => p.name);
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((n) => /iphone 17/i.test(n))).toBe(true);
    expect(filterDevices(allPresets, 'samsung', 'all').every((p) => p.brand === 'Samsung')).toBe(true);
    const byYear = filterDevices(allPresets, '2025', 'all');
    expect(byYear.length).toBeGreaterThan(0);
    expect(byYear.every((p) => p.year === 2025)).toBe(true);
    expect(filterDevices([device('Pixél', 'Google', 2024)], 'pixel', 'all')).toHaveLength(1);
    expect(filterDevices(allPresets, 'zzz-no-such-device', 'all')).toEqual([]);
  });

  it('filters by kind', () => {
    const tablets = filterDevices(allPresets, '', 'tablet');
    expect(tablets.length).toBeGreaterThan(0);
    expect(tablets.every((p) => p.kind === 'tablet')).toBe(true);
    expect(filterDevices(allPresets, 'galaxy', 'foldable').every((p) => p.kind === 'foldable' && p.brand === 'Samsung')).toBe(true);
  });
});

describe('groupByBrand', () => {
  it('keeps brand order of first appearance and sorts newest first inside a brand (stable)', () => {
    const groups = groupByBrand([
      device('a', 'Apple', 2023),
      device('g', 'Google', 2025),
      device('b', 'Apple', 2025),
      device('c', 'Apple', 2023),
      device('x', undefined, undefined),
    ]);
    expect(groups.map((g) => g.brand)).toEqual(['Apple', 'Google', 'Other']);
    expect(groups[0]!.devices.map((d) => d.id)).toEqual(['b', 'a', 'c']);
  });

  it('covers every preset exactly once', () => {
    const groups = groupByBrand(allPresets);
    expect(groups.flatMap((g) => g.devices)).toHaveLength(allPresets.length);
  });
});

describe('labels', () => {
  it('formats sizes and pixel ratios', () => {
    expect(sizeLabel({ portraitSize: { width: 402, height: 874 } })).toBe('402 × 874');
    expect(sizeLabel({ portraitSize: { width: 402, height: 874 } }, 'landscape')).toBe('874 × 402');
    expect(sizeLabel({ portraitSize: { width: 411.43, height: 923.43 } })).toBe('411 × 923');
    expect(sizeLabel({ portraitSize: { width: 411.43, height: 923.43 } }, 'portrait', 2)).toBe('411.43 × 923.43');
    expect(lengthLabel(851.6923)).toBe('851.69');
    expect(lengthLabel(402)).toBe('402');
    expect(pixelRatioLabel(3)).toBe('@3x');
    expect(pixelRatioLabel(2.625)).toBe('@2.625x');
  });
});

describe('stepTextScale', () => {
  it('starts from 1 for the system value and stays on the step grid', () => {
    expect(stepTextScale(null, 1)).toBe(1.05);
    expect(stepTextScale(null, -1)).toBe(0.95);
    expect(stepTextScale(1.15, 1)).toBe(1.2);
    expect(stepTextScale(1.13, 1)).toBe(1.2);
  });

  it('clamps', () => {
    expect(stepTextScale(TEXT_SCALE_MAX, 1)).toBe(TEXT_SCALE_MAX);
    expect(stepTextScale(TEXT_SCALE_MIN, -1)).toBe(TEXT_SCALE_MIN);
  });
});

describe('toolbar placement', () => {
  it('auto docks right on wide windows and at the bottom on narrow ones', () => {
    expect(resolveToolbarPlacement('auto', 1280)).toBe('right');
    expect(resolveToolbarPlacement('auto', 720)).toBe('right');
    expect(resolveToolbarPlacement('auto', 390)).toBe('bottom');
  });

  it('honours forced positions', () => {
    expect(resolveToolbarPlacement('left', 390)).toBe('left');
    expect(resolveToolbarPlacement('bottom', 1600)).toBe('bottom');
  });

  it('maps placement to the root flex direction', () => {
    expect(rootDirection('right')).toBe('row');
    expect(rootDirection('left')).toBe('row-reverse');
    expect(rootDirection('bottom')).toBe('column');
  });
});

describe('locales', () => {
  it('offers ~30 locales including RTL ones, with unique tags', () => {
    expect(LOCALES.length).toBeGreaterThanOrEqual(30);
    expect(new Set(LOCALES.map((l) => l.tag)).size).toBe(LOCALES.length);
    for (const tag of ['ar', 'he', 'fa', 'ur']) expect(LOCALES.find((l) => l.tag === tag)?.rtl).toBe(true);
  });

  it('searches tags, native and English names', () => {
    expect(filterLocales(LOCALES, 'arabic').map((l) => l.tag)).toEqual(['ar']);
    expect(filterLocales(LOCALES, 'العربية').map((l) => l.tag)).toEqual(['ar']);
    expect(filterLocales(LOCALES, 'pt-br').map((l) => l.tag)).toEqual(['pt-BR']);
    expect(filterLocales(LOCALES, 'pt_BR').map((l) => l.tag)).toEqual(['pt-BR']);
    expect(filterLocales(LOCALES, 'espanol').map((l) => l.tag)).toEqual(['es-ES', 'es-MX']);
    expect(filterLocales(LOCALES, 'rtl').map((l) => l.tag).sort()).toEqual(['ar', 'fa', 'he', 'ur']);
    expect(filterLocales(LOCALES, '')).toHaveLength(LOCALES.length);
  });

  it('labels locales with their native name', () => {
    expect(localeLabel('ar')).toBe('العربية (ar)');
    expect(localeLabel('JA-jp')).toBe('日本語 (ja-JP)');
    expect(localeLabel('xx-YY')).toBe('xx-YY');
  });
});

describe('parseNumber', () => {
  const opts = { min: 1, max: 100, decimals: 0 };
  it('accepts numbers in range and rounds to the allowed decimals', () => {
    expect(parseNumber('42', opts)).toBe(42);
    expect(parseNumber(' 7 ', opts)).toBe(7);
    expect(parseNumber('2,625', { min: 0, max: 5, decimals: 3 })).toBe(2.625);
    expect(parseNumber('2.6254', { min: 0, max: 5, decimals: 3 })).toBe(2.625);
  });

  it('rejects garbage and out-of-range values', () => {
    expect(parseNumber('', opts)).toBeNull();
    expect(parseNumber('abc', opts)).toBeNull();
    expect(parseNumber('-3', opts)).toBeNull();
    expect(parseNumber('0', opts)).toBeNull();
    expect(parseNumber('101', opts)).toBeNull();
  });
});
