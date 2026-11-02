export { DeviceSimulator, type DeviceSimulatorProps } from './components/DeviceSimulator';
export { deviceSimulator, createDeviceSimulatorStore, type DeviceSimulatorController, type SettingsPatch } from './core/store';
export { defaultSettings, resolveSimulation, isRTLLocale } from './core/simulation';
export * from './core/geometry';
export {
  useDeviceSimulator,
  useDeviceSimulatorActive,
  useDeviceSimulatorLocale,
  useDeviceSimulatorSettings,
  useDeviceSimulatorSimulation,
  usePreviewScreen,
} from './context';
export { getRealDimensions, getRealColorScheme } from './environment';
// `import * as` + `export { }` rather than `export * as`: @react-native/babel-preset
// (bare React Native) lacks the export-namespace-from transform.
import * as Devices from './presets';
export { Devices };
export { allPresets, CUSTOM_DEVICE_ID, presetFromCustomDevice } from './presets';
export {
  screenshotPlugin,
  screenshotFileName,
  simulationInfoPlugin,
  summarizeSimulation,
  type DeviceSimulatorPlugin,
  type DeviceSimulatorPluginContext,
  type ScreenshotPluginOptions,
  type Screenshot,
  type ScreenshotTarget,
  type SimulationSummary,
} from './plugins';
export { getDeviceOuterSize } from './components/frame/DeviceFrame';
export { getKeyboardOverride, type KeyboardOverride } from './environment/keyboard';
export { deviceViewRef, screenViewRef } from './core/refs';
export type * from './types';
