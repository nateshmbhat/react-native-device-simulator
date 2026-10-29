import { CUSTOM_DEVICE_ID, presetFromCustomDevice } from '../presets';
import { iPhone17Pro } from '../presets/generated';
import type { DevicePreset, DevicePreviewSettings, ResolvedSimulation } from '../types';
import { keyboardHeightFor, paddingFor, screenSizeFor } from './geometry';
import { defaultCustomDevice } from '../presets';

export const DEFAULT_DEVICE: DevicePreset = iPhone17Pro;

export const defaultSettings: DevicePreviewSettings = {
  isEnabled: true,
  isFrameVisible: true,
  deviceId: DEFAULT_DEVICE.id,
  orientation: 'portrait',
  customDevice: defaultCustomDevice,
  showSystemUi: true,
  keyboardVisible: false,
  colorScheme: null,
  fontScale: null,
  locale: null,
  use24HourClock: null,
  accessibility: {
    boldText: null,
    reduceMotion: null,
    reduceTransparency: null,
    invertColors: null,
    grayscale: null,
    highContrast: null,
    darkerSystemColors: null,
    screenReader: null,
  },
  statusBarStyle: 'auto',
  toolbar: { visible: true, position: 'auto', tab: 'device' },
  background: 'dots',
  theme: 'dark',
};

const RTL_LANGUAGES = new Set(['ar', 'arc', 'ckb', 'dv', 'fa', 'ha', 'he', 'iw', 'khw', 'ks', 'ps', 'sd', 'ur', 'yi']);

/** Whether a BCP-47 locale is written right-to-left. */
export function isRTLLocale(locale: string | null | undefined): boolean {
  if (!locale) return false;
  return RTL_LANGUAGES.has(locale.split(/[-_]/)[0]!.toLowerCase());
}

export function findPreset(presets: readonly DevicePreset[], id: string): DevicePreset | undefined {
  return presets.find((p) => p.id === id);
}

/** The preset the settings point at. Falls back to the default device for unknown ids. */
export function resolvePreset(settings: DevicePreviewSettings, presets: readonly DevicePreset[]): DevicePreset {
  if (settings.deviceId === CUSTOM_DEVICE_ID) return presetFromCustomDevice(settings.customDevice);
  return findPreset(presets, settings.deviceId) ?? presets[0] ?? DEFAULT_DEVICE;
}

/** Derives what the app sees from the user settings. Pure. */
export function resolveSimulation(
  settings: DevicePreviewSettings,
  presets: readonly DevicePreset[],
): ResolvedSimulation {
  const preset = resolvePreset(settings, presets);
  const { orientation } = settings;
  const keyboard = keyboardHeightFor(preset, orientation) ?? 0;
  return {
    preset,
    orientation,
    screenSize: screenSizeFor(preset, orientation),
    pixelRatio: preset.devicePixelRatio,
    insets: paddingFor(preset, orientation),
    keyboardHeight: settings.keyboardVisible ? keyboard : 0,
    platform: preset.platform,
    colorScheme: settings.colorScheme,
    fontScale: settings.fontScale,
    locale: settings.locale,
    isRTL: isRTLLocale(settings.locale),
    use24HourClock: settings.use24HourClock,
    accessibility: settings.accessibility,
  };
}
