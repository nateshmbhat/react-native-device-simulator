import { useSyncExternalStore } from 'react';
import { devicePreview, type DevicePreviewController } from './core/store';
import type { DevicePreviewSettings, ResolvedSimulation } from './types';

export { PreviewScreenContext, usePreviewScreen, type PreviewScreenContextValue } from './previewScreenContext';

export function useDevicePreviewSettings(): DevicePreviewSettings {
  return useSyncExternalStore(devicePreview.subscribe, devicePreview.getSettings, devicePreview.getSettings);
}

export function useDevicePreviewSimulation(): ResolvedSimulation {
  return useSyncExternalStore(devicePreview.subscribe, devicePreview.getSimulation, devicePreview.getSimulation);
}

/**
 * Reads and controls the preview from anywhere in the tree.
 *
 * ```tsx
 * const { simulation, controller } = useDevicePreview();
 * i18n.changeLanguage(simulation.locale ?? deviceLocale);
 * ```
 */
export function useDevicePreview(): {
  settings: DevicePreviewSettings;
  simulation: ResolvedSimulation;
  /** Whether a device is currently simulated. */
  isActive: boolean;
  controller: DevicePreviewController;
} {
  const settings = useDevicePreviewSettings();
  const simulation = useDevicePreviewSimulation();
  const isActive = useDevicePreviewActive();
  return { settings, simulation, isActive, controller: devicePreview };
}

/**
 * Whether a device is being simulated right now: a `<DevicePreview>` is
 * mounted and enabled (false in release builds) and the simulation is on.
 */
export function useDevicePreviewActive(): boolean {
  return useSyncExternalStore(devicePreview.subscribe, devicePreview.isActive, () => false);
}

/** The simulated locale (BCP-47), or null when the real device locale applies. */
export function useDevicePreviewLocale(): string | null {
  const settings = useDevicePreviewSettings();
  const isActive = useDevicePreviewActive();
  return isActive ? settings.locale : null;
}
