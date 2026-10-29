import type { CustomDeviceSpec, DevicePreset } from '../types';
import { generatedPresets } from './generated';

export * from './generated';

/** Id of the user-editable custom device. */
export const CUSTOM_DEVICE_ID = 'custom';

/** Every built-in device, grouped by brand, newest first. */
export const allPresets: readonly DevicePreset[] = generatedPresets;

/** Default custom device: a generic modern phone. */
export const defaultCustomDevice: CustomDeviceSpec = {
  name: 'Custom device',
  platform: 'ios',
  kind: 'phone',
  portraitSize: { width: 390, height: 844 },
  devicePixelRatio: 3,
  portraitPadding: { top: 47, right: 0, bottom: 34, left: 0 },
  portraitKeyboardHeight: 336,
  landscapeKeyboardHeight: 252,
};

/** Builds a frameless preset from a custom device spec. */
export function presetFromCustomDevice(spec: CustomDeviceSpec): DevicePreset {
  return { id: CUSTOM_DEVICE_ID, brand: 'Custom', ...spec };
}
