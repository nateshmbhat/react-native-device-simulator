import { useSyncExternalStore } from 'react';
import { deviceSimulator, type DeviceSimulatorController } from './core/store';
import type { DeviceSimulatorSettings, ResolvedSimulation } from './types';

export { PreviewScreenContext, usePreviewScreen, type PreviewScreenContextValue } from './previewScreenContext';

export function useDeviceSimulatorSettings(): DeviceSimulatorSettings {
  return useSyncExternalStore(deviceSimulator.subscribe, deviceSimulator.getSettings, deviceSimulator.getSettings);
}

export function useDeviceSimulatorSimulation(): ResolvedSimulation {
  return useSyncExternalStore(deviceSimulator.subscribe, deviceSimulator.getSimulation, deviceSimulator.getSimulation);
}

/**
 * Reads and controls the preview from anywhere in the tree.
 *
 * ```tsx
 * const { simulation, controller } = useDeviceSimulator();
 * i18n.changeLanguage(simulation.locale ?? deviceLocale);
 * ```
 */
export function useDeviceSimulator(): {
  settings: DeviceSimulatorSettings;
  simulation: ResolvedSimulation;
  /** Whether a device is currently simulated. */
  isActive: boolean;
  controller: DeviceSimulatorController;
} {
  const settings = useDeviceSimulatorSettings();
  const simulation = useDeviceSimulatorSimulation();
  const isActive = useDeviceSimulatorActive();
  return { settings, simulation, isActive, controller: deviceSimulator };
}

/**
 * Whether a device is being simulated right now: a `<DeviceSimulator>` is
 * mounted and enabled (false in release builds) and the simulation is on.
 */
export function useDeviceSimulatorActive(): boolean {
  return useSyncExternalStore(deviceSimulator.subscribe, deviceSimulator.isActive, () => false);
}

/** The simulated locale (BCP-47), or null when the real device locale applies. */
export function useDeviceSimulatorLocale(): string | null {
  const settings = useDeviceSimulatorSettings();
  const isActive = useDeviceSimulatorActive();
  return isActive ? settings.locale : null;
}
