import { allPresets } from '../presets';
import type {
  ColorSchemeName,
  DevicePreset,
  DevicePreviewSettings,
  DevicePreviewStorage,
  Orientation,
  ResolvedSimulation,
} from '../types';
import { defaultSettings, resolveSimulation } from './simulation';

export type SettingsPatch = Partial<DevicePreviewSettings>;
export type SettingsUpdater = SettingsPatch | ((current: DevicePreviewSettings) => SettingsPatch);

type Listener = () => void;

/**
 * Programmatic control surface, the equivalent of Flutter's
 * `DevicePreview.controller`. Safe to call from anywhere (event handlers,
 * tests, dev menus). Changes propagate to every mounted `<DevicePreview>`.
 */
export interface DevicePreviewController {
  /** Current user settings. */
  getSettings(): DevicePreviewSettings;
  /** What the app currently sees (device metrics, overrides). */
  getSimulation(): ResolvedSimulation;
  /** Every device the picker offers (built-ins plus registered ones). */
  getPresets(): readonly DevicePreset[];
  /**
   * Whether a device is being simulated right now: a `<DevicePreview>` is
   * mounted and enabled, and the simulation is switched on.
   */
  isActive(): boolean;
  subscribe(listener: Listener): () => void;
  /** Partial update of the settings. */
  update(patch: SettingsUpdater): void;
  /** Selects a device by id, or registers and selects a preset object. */
  setDevice(device: string | DevicePreset): void;
  setOrientation(orientation: Orientation): void;
  toggleOrientation(): void;
  setColorScheme(scheme: ColorSchemeName | null): void;
  setFontScale(scale: number | null): void;
  setLocale(locale: string | null): void;
  setKeyboardVisible(visible: boolean): void;
  /** Turns the whole simulation on or off. The app keeps its state. */
  setEnabled(enabled: boolean): void;
  /** Adds a preset to the device picker (replaces one with the same id). */
  registerPreset(preset: DevicePreset): void;
  /** Restores the default settings, keeping the toolbar preferences. */
  reset(): void;
}

function mergeSettings(base: DevicePreviewSettings, patch: SettingsPatch): DevicePreviewSettings {
  return {
    ...base,
    ...patch,
    accessibility: { ...base.accessibility, ...patch.accessibility },
    toolbar: { ...base.toolbar, ...patch.toolbar },
    customDevice: patch.customDevice ? { ...base.customDevice, ...patch.customDevice } : base.customDevice,
  };
}

export const STORAGE_KEY = 'react-native-device-simulator/settings/v1';

export interface DevicePreviewStore extends DevicePreviewController {
  /** Replaces defaults and presets (called by `<DevicePreview>`). */
  configure(options: { defaults?: SettingsPatch; presets?: readonly DevicePreset[] }): void;
  /** Loads persisted settings, then saves every change to `storage`. */
  attachStorage(storage: DevicePreviewStorage | null): () => void;
  /** Called by each mounted, enabled `<DevicePreview>`. Returns the unregister function. */
  registerHost(): () => void;
  /** Whether at least one `<DevicePreview>` is mounted and enabled. */
  hasHost(): boolean;
}

export function createDevicePreviewStore(): DevicePreviewStore {
  let defaults: DevicePreviewSettings = defaultSettings;
  let presets: readonly DevicePreset[] = allPresets;
  let registered: DevicePreset[] = [];
  let settings: DevicePreviewSettings = defaultSettings;
  let simulation: ResolvedSimulation | null = null;
  let simulationKey = '';
  let hosts = 0;
  // Patches applied while persisted settings are loading; re-applied on top
  // of them so early changes (module-scope calls, quick taps) are not lost.
  let pendingPatches: SettingsPatch[] | null = null;
  const listeners = new Set<Listener>();

  const allKnownPresets = () => {
    if (registered.length === 0) return presets;
    const ids = new Set(registered.map((p) => p.id));
    return [...presets.filter((p) => !ids.has(p.id)), ...registered];
  };
  let presetCache: readonly DevicePreset[] = allKnownPresets();

  const emit = () => listeners.forEach((l) => l());

  // Settings the app does not see: changing them must not create a new
  // simulation object (which would re-render every scaled Text in the app).
  const simulationInputs = (s: DevicePreviewSettings) => {
    const { toolbar: _t, theme: _th, background: _b, isEnabled: _e, isFrameVisible: _f, showSystemUi: _u, ...rest } = s;
    return JSON.stringify(rest);
  };

  const set = (next: DevicePreviewSettings) => {
    if (next === settings) return;
    settings = next;
    emit();
  };

  const store: DevicePreviewStore = {
    getSettings: () => settings,
    getSimulation() {
      const key = simulationInputs(settings);
      if (!simulation || key !== simulationKey) {
        simulation = resolveSimulation(settings, presetCache);
        simulationKey = key;
      }
      return simulation;
    },
    getPresets: () => presetCache,
    isActive: () => hosts > 0 && settings.isEnabled,
    hasHost: () => hosts > 0,
    registerHost() {
      hosts += 1;
      emit();
      let done = false;
      return () => {
        if (done) return;
        done = true;
        hosts -= 1;
        emit();
      };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update(patch) {
      const p = typeof patch === 'function' ? patch(settings) : patch;
      pendingPatches?.push(p);
      set(mergeSettings(settings, p));
    },
    setDevice(device) {
      if (typeof device !== 'string') {
        store.registerPreset(device);
        device = device.id;
      }
      store.update({ deviceId: device });
    },
    setOrientation: (orientation) => store.update({ orientation }),
    toggleOrientation: () =>
      store.update((s) => ({ orientation: s.orientation === 'portrait' ? 'landscape' : 'portrait' })),
    setColorScheme: (colorScheme) => store.update({ colorScheme }),
    setFontScale: (fontScale) => store.update({ fontScale }),
    setLocale: (locale) => store.update({ locale }),
    setKeyboardVisible: (keyboardVisible) => store.update({ keyboardVisible }),
    setEnabled: (isEnabled) => store.update({ isEnabled }),
    registerPreset(preset) {
      registered = [...registered.filter((p) => p.id !== preset.id), preset];
      presetCache = allKnownPresets();
      simulation = null;
      emit();
    },
    reset() {
      const next = mergeSettings(defaults, { toolbar: settings.toolbar, theme: settings.theme, background: settings.background });
      pendingPatches?.push(next);
      set(next);
    },
    configure(options) {
      if (options.presets) presets = options.presets;
      presetCache = allKnownPresets();
      if (options.defaults) {
        const previousDefaults = defaults;
        defaults = mergeSettings(defaultSettings, options.defaults);
        // Only adopt new defaults while the user has not changed anything yet.
        if (settings === previousDefaults || settings === defaultSettings) settings = defaults;
      }
      // Called during render by <DevicePreview>: never notify synchronously
      // (that would update other components mid-render). Subscribers pick the
      // new snapshot up on their next read.
      simulation = null;
    },
    attachStorage(storage) {
      if (!storage) return () => {};
      let disposed = false;
      let loaded = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const write = () => {
        timer = undefined;
        try {
          void Promise.resolve(storage.setItem(STORAGE_KEY, JSON.stringify(settings))).catch(() => {});
        } catch {
          // Storage is best-effort.
        }
      };
      const save = () => {
        clearTimeout(timer);
        timer = setTimeout(write, 250);
      };
      const unsubscribe = store.subscribe(() => {
        if (loaded) save();
      });
      const local: SettingsPatch[] = [];
      pendingPatches = local;
      const finish = (raw: string | null | undefined) => {
        if (pendingPatches === local) pendingPatches = null;
        if (disposed) return;
        loaded = true;
        let parsed: SettingsPatch | null = null;
        try {
          parsed = raw ? (JSON.parse(raw) as SettingsPatch) : null;
        } catch {
          parsed = null;
        }
        if (parsed) {
          // Saved settings first, then whatever changed while they loaded.
          set(local.reduce(mergeSettings, mergeSettings(defaults, parsed)));
        }
        if (local.length) save();
      };
      try {
        const result = storage.getItem(STORAGE_KEY);
        if (result && typeof (result as Promise<string | null>).then === 'function') {
          (result as Promise<string | null>).then(finish, () => finish(null));
        } else {
          finish(result as string | null);
        }
      } catch {
        finish(null);
      }
      return () => {
        disposed = true;
        if (pendingPatches === local) pendingPatches = null;
        unsubscribe();
        // Flush instead of dropping the last changes.
        if (timer !== undefined) {
          clearTimeout(timer);
          write();
        }
      };
    },
  };
  return store;
}

/** The global controller. */
export const devicePreview: DevicePreviewStore = createDevicePreviewStore();
