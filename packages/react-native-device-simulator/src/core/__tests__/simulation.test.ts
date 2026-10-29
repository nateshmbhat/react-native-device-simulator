import { fitScale, paddingFor, rotatePadding, rotatedScreenOffset } from '../geometry';
import { defaultSettings, isRTLLocale, resolveSimulation } from '../simulation';
import { createDevicePreviewStore } from '../store';
import { allPresets, iPhone17Pro, iPhoneSE3rdGen } from '../../presets';

describe('geometry', () => {
  it('rotates portrait padding to landscape by the rotation rule', () => {
    expect(rotatePadding({ top: 47, right: 0, bottom: 34, left: 0 })).toEqual({ top: 0, left: 47, right: 47, bottom: 34 });
  });

  it('prefers an explicit landscape padding', () => {
    expect(paddingFor(iPhone17Pro, 'landscape')).toEqual(iPhone17Pro.landscapePadding);
  });

  it('fits content inside the available area, never above maxScale', () => {
    expect(fitScale({ width: 400, height: 800 }, { width: 2000, height: 2000 })).toBe(1);
    expect(fitScale({ width: 400, height: 800 }, { width: 448, height: 448 }, 24)).toBe(0.5);
    expect(fitScale({ width: 400, height: 800 }, { width: 0, height: 448 })).toBe(0);
  });

  it('places the screen inside a body rotated counter-clockwise', () => {
    // Body 100x200, screen 80x180 at (10,10): after rotation the screen is 180x80 at (10,10).
    expect(rotatedScreenOffset({ width: 100, height: 200 }, { x: 10, y: 10 }, { width: 80, height: 180 })).toEqual({ x: 10, y: 10 });
    expect(rotatedScreenOffset({ width: 100, height: 200 }, { x: 5, y: 20 }, { width: 80, height: 150 })).toEqual({ x: 20, y: 15 });
  });
});

describe('resolveSimulation', () => {
  it('resolves the default device in portrait', () => {
    const sim = resolveSimulation(defaultSettings, allPresets);
    expect(sim.preset.id).toBe(iPhone17Pro.id);
    expect(sim.screenSize).toEqual({ width: 402, height: 874 });
    expect(sim.pixelRatio).toBe(3);
    expect(sim.keyboardHeight).toBe(0);
  });

  it('swaps the screen and uses landscape insets and keyboard', () => {
    const sim = resolveSimulation({ ...defaultSettings, orientation: 'landscape', keyboardVisible: true }, allPresets);
    expect(sim.screenSize).toEqual({ width: 874, height: 402 });
    expect(sim.insets).toEqual(iPhone17Pro.landscapePadding);
    expect(sim.keyboardHeight).toBe(iPhone17Pro.landscapeKeyboardHeight);
  });

  it('falls back to the first preset for unknown ids', () => {
    expect(resolveSimulation({ ...defaultSettings, deviceId: 'nope' }, allPresets).preset.id).toBe(allPresets[0]!.id);
  });

  it('resolves the custom device', () => {
    const sim = resolveSimulation({ ...defaultSettings, deviceId: 'custom' }, allPresets);
    expect(sim.preset.id).toBe('custom');
    expect(sim.screenSize).toEqual(defaultSettings.customDevice.portraitSize);
  });

  it('detects right-to-left locales', () => {
    expect(isRTLLocale('ar-EG')).toBe(true);
    expect(isRTLLocale('he')).toBe(true);
    expect(isRTLLocale('en-US')).toBe(false);
    expect(isRTLLocale(null)).toBe(false);
  });
});

describe('store', () => {
  it('notifies subscribers and recomputes the simulation', () => {
    const store = createDevicePreviewStore();
    const listener = jest.fn();
    store.subscribe(listener);
    store.setDevice(iPhoneSE3rdGen.id);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSimulation().screenSize).toEqual({ width: 375, height: 667 });
    store.toggleOrientation();
    expect(store.getSimulation().screenSize).toEqual({ width: 667, height: 375 });
  });

  it('registers and selects a custom preset object', () => {
    const store = createDevicePreviewStore();
    store.setDevice({ ...iPhoneSE3rdGen, id: 'my-device', name: 'Mine' });
    expect(store.getSimulation().preset.name).toBe('Mine');
    expect(store.getPresets().some((p) => p.id === 'my-device')).toBe(true);
  });

  it('merges nested settings', () => {
    const store = createDevicePreviewStore();
    store.update({ accessibility: { ...store.getSettings().accessibility, boldText: true } });
    store.update((s) => ({ accessibility: { ...s.accessibility, grayscale: true } }));
    expect(store.getSettings().accessibility.boldText).toBe(true);
    expect(store.getSettings().accessibility.grayscale).toBe(true);
  });

  it('persists and restores settings', async () => {
    const data = new Map<string, string>();
    const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
    const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
    const a = createDevicePreviewStore();
    a.attachStorage(storage);
    await tick();
    a.setDevice(iPhoneSE3rdGen.id);
    await tick(300);
    const b = createDevicePreviewStore();
    b.attachStorage(storage);
    await new Promise((r) => setTimeout(r, 0));
    expect(b.getSettings().deviceId).toBe(iPhoneSE3rdGen.id);
  });
});

describe('store lifecycle (review regressions)', () => {
  const memoryStorage = (initial?: object, async = true) => {
    const data = new Map<string, string>();
    if (initial) data.set('react-native-device-simulator/settings/v1', JSON.stringify(initial));
    return {
      data,
      getItem: (k: string) => (async ? Promise.resolve(data.get(k) ?? null) : data.get(k) ?? null),
      setItem: (k: string, v: string) => void data.set(k, v),
    };
  };
  const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

  it('keeps changes made while saved settings are loading', async () => {
    const storage = memoryStorage({ deviceId: iPhoneSE3rdGen.id, colorScheme: 'dark' });
    const store = createDevicePreviewStore();
    store.attachStorage(storage);
    store.setOrientation('landscape'); // before the async read resolves
    await tick();
    expect(store.getSettings().deviceId).toBe(iPhoneSE3rdGen.id); // saved value applied
    expect(store.getSettings().colorScheme).toBe('dark');
    expect(store.getSettings().orientation).toBe('landscape'); // early change kept
  });

  it('applies synchronous storage immediately', () => {
    const store = createDevicePreviewStore();
    store.attachStorage(memoryStorage({ deviceId: iPhoneSE3rdGen.id }, false));
    expect(store.getSettings().deviceId).toBe(iPhoneSE3rdGen.id);
  });

  it('flushes a pending save when detached', async () => {
    const storage = memoryStorage();
    const store = createDevicePreviewStore();
    const detach = store.attachStorage(storage);
    await tick();
    store.setColorScheme('dark');
    detach(); // before the 250 ms debounce
    expect(JSON.parse(storage.data.get('react-native-device-simulator/settings/v1')!).colorScheme).toBe('dark');
  });

  it('is only active while a host is registered', () => {
    const store = createDevicePreviewStore();
    expect(store.isActive()).toBe(false);
    const unregister = store.registerHost();
    expect(store.isActive()).toBe(true);
    store.setEnabled(false);
    expect(store.isActive()).toBe(false);
    store.setEnabled(true);
    unregister();
    unregister(); // idempotent
    expect(store.isActive()).toBe(false);
    expect(store.hasHost()).toBe(false);
  });

  it('keeps the same simulation object for preview-chrome-only changes', () => {
    const store = createDevicePreviewStore();
    const before = store.getSimulation();
    store.update({ theme: 'light', background: 'plain', toolbar: { ...store.getSettings().toolbar, tab: 'display' } });
    expect(store.getSimulation()).toBe(before);
    store.setColorScheme('dark');
    expect(store.getSimulation()).not.toBe(before);
  });
});
