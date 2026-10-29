/** Pure helpers behind the toolbar (filtering, grouping, layout). */
import type { DeviceKind, DevicePreset, Orientation, ToolbarPosition } from '../../types';

// -----------------------------------------------------------------------------
// Devices

export type KindFilter = DeviceKind | 'all';

export const KIND_FILTERS: readonly { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'phone', label: 'Phone' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'foldable', label: 'Foldable' },
  { value: 'desktop', label: 'Desktop' },
];

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Presets matching a free-text query and a kind. Every whitespace-separated
 * word of the query must match the name, brand or year.
 */
export function filterDevices(presets: readonly DevicePreset[], query: string, kind: KindFilter): DevicePreset[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return presets.filter((p) => {
    if (kind !== 'all' && p.kind !== kind) return false;
    if (words.length === 0) return true;
    const haystack = normalize(`${p.name} ${p.brand ?? ''} ${p.year ?? ''} ${p.platform}`);
    return words.every((w) => haystack.includes(w));
  });
}

export interface DeviceGroup {
  brand: string;
  devices: DevicePreset[];
}

/**
 * Groups presets by brand, keeping the order in which brands first appear;
 * inside a brand, newest first (stable for equal years).
 */
export function groupByBrand(presets: readonly DevicePreset[]): DeviceGroup[] {
  const groups = new Map<string, DevicePreset[]>();
  for (const p of presets) {
    const brand = p.brand ?? 'Other';
    const list = groups.get(brand);
    if (list) list.push(p);
    else groups.set(brand, [p]);
  }
  return [...groups].map(([brand, devices]) => ({
    brand,
    devices: devices
      .map((d, i) => ({ d, i }))
      .sort((a, b) => (b.d.year ?? 0) - (a.d.year ?? 0) || a.i - b.i)
      .map((x) => x.d),
  }));
}

const PLATFORM_LABELS: Record<string, string> = {
  ios: 'iOS',
  android: 'Android',
  macos: 'macOS',
  windows: 'Windows',
  web: 'Web',
  linux: 'Linux',
};

export function platformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] ?? platform;
}

export function kindLabel(kind: string): string {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

/** A logical length with at most `decimals` decimals: `411.43`, `402`. */
export function lengthLabel(n: number, decimals = 2): string {
  return String(Number(n.toFixed(decimals)));
}

/** `402 × 874` for the logical size in the given orientation (rounded to whole points by default). */
export function sizeLabel(preset: Pick<DevicePreset, 'portraitSize'>, orientation: Orientation = 'portrait', decimals = 0): string {
  const w = lengthLabel(preset.portraitSize.width, decimals);
  const h = lengthLabel(preset.portraitSize.height, decimals);
  return orientation === 'portrait' ? `${w} × ${h}` : `${h} × ${w}`;
}

/** `@3x`, `@2.625x`. */
export function pixelRatioLabel(ratio: number): string {
  return `@${Number(ratio.toFixed(3))}x`;
}

// -----------------------------------------------------------------------------
// Text scale

export const TEXT_SCALE_PRESETS: readonly number[] = [0.8, 0.9, 1, 1.15, 1.3, 1.5, 2, 2.5, 3];
export const TEXT_SCALE_MIN = 0.5;
export const TEXT_SCALE_MAX = 3.5;
export const TEXT_SCALE_STEP = 0.05;

/** Steps a text scale, clamped and rounded to the step grid. `null` starts from 1. */
export function stepTextScale(current: number | null, direction: 1 | -1): number {
  const base = current ?? 1;
  const next = Math.round((base + direction * TEXT_SCALE_STEP) / TEXT_SCALE_STEP) * TEXT_SCALE_STEP;
  return Math.min(TEXT_SCALE_MAX, Math.max(TEXT_SCALE_MIN, Number(next.toFixed(2))));
}

export function textScaleLabel(scale: number): string {
  return `${Number(scale.toFixed(2))}×`;
}

// -----------------------------------------------------------------------------
// Layout

export type ToolbarPlacement = 'left' | 'right' | 'bottom';

/** Below this real window width, `auto` puts the toolbar at the bottom. */
export const SIDE_PANEL_MIN_WIDTH = 720;
export const SIDE_PANEL_WIDTH = 300;

export function resolveToolbarPlacement(position: ToolbarPosition, availableWidth: number): ToolbarPlacement {
  if (position !== 'auto') return position;
  return availableWidth >= SIDE_PANEL_MIN_WIDTH ? 'right' : 'bottom';
}

/** Flex direction of the preview root: stage first, toolbar second. */
export function rootDirection(placement: ToolbarPlacement): 'row' | 'row-reverse' | 'column' {
  return placement === 'left' ? 'row-reverse' : placement === 'right' ? 'row' : 'column';
}
