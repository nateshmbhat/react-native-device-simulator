import type * as AppearanceModule from '../appearance';

type RN = typeof import('react-native');

let RN: RN;
let appearance: typeof AppearanceModule;
let realScheme: 'light' | 'dark';
let emitReal: (scheme: 'light' | 'dark') => void;

beforeEach(() => {
  jest.resetModules();
  RN = require('react-native');
  // Simulate the native Appearance module: a host scheme and its change event.
  realScheme = 'light';
  const realListeners = new Set<(p: { colorScheme: string }) => void>();
  const A = RN.Appearance as unknown as Record<string, unknown>;
  A.getColorScheme = () => realScheme;
  A.addChangeListener = (l: (p: { colorScheme: string }) => void) => {
    realListeners.add(l);
    return { remove: () => realListeners.delete(l) };
  };
  emitReal = (scheme) => {
    realScheme = scheme;
    realListeners.forEach((l) => l({ colorScheme: scheme }));
  };
  appearance = require('../appearance');
  // DevicePreview installs the patches before the app subscribes.
  appearance.installAppearancePatch();
});

describe('Appearance patch', () => {
  it('is idempotent', () => {
    appearance.installAppearancePatch();
    const get = RN.Appearance.getColorScheme;
    appearance.installAppearancePatch();
    expect(RN.Appearance.getColorScheme).toBe(get);
  });

  it('reports the override and keeps the real scheme available', () => {
    appearance.setColorSchemeOverride('dark');
    expect(RN.Appearance.getColorScheme()).toBe('dark');
    expect(appearance.getRealColorScheme()).toBe('light');
    appearance.setColorSchemeOverride(null);
    expect(RN.Appearance.getColorScheme()).toBe('light');
  });

  it('notifies on change and on clearing, not when the visible scheme is unchanged', () => {
    const listener = jest.fn();
    RN.Appearance.addChangeListener(listener);
    appearance.setColorSchemeOverride('light'); // same as real
    expect(listener).not.toHaveBeenCalled();
    appearance.setColorSchemeOverride('dark');
    expect(listener).toHaveBeenLastCalledWith({ colorScheme: 'dark' });
    appearance.setColorSchemeOverride(null);
    expect(listener).toHaveBeenLastCalledWith({ colorScheme: 'light' });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('defers notifications in silent mode', () => {
    const listener = jest.fn();
    RN.Appearance.addChangeListener(listener);
    appearance.setColorSchemeOverride('dark', false);
    expect(RN.Appearance.getColorScheme()).toBe('dark');
    expect(listener).not.toHaveBeenCalled();
    appearance.setColorSchemeOverride('dark');
    expect(listener).toHaveBeenCalledWith({ colorScheme: 'dark' });
  });

  it('hides real changes behind the override and passes them through otherwise', () => {
    const listener = jest.fn();
    RN.Appearance.addChangeListener(listener);
    appearance.setColorSchemeOverride('light');
    emitReal('dark');
    expect(listener).toHaveBeenLastCalledWith({ colorScheme: 'light' });
    appearance.setColorSchemeOverride(null);
    expect(listener).toHaveBeenLastCalledWith({ colorScheme: 'dark' });
    emitReal('light');
    expect(listener).toHaveBeenLastCalledWith({ colorScheme: 'light' });
  });

  it('notifies after a real change even if the override equals the initial scheme', () => {
    const listener = jest.fn();
    RN.Appearance.addChangeListener(listener);
    appearance.installAppearancePatch();
    appearance.setColorSchemeOverride(null); // listeners saw 'light'
    emitReal('dark'); // listeners now saw 'dark'
    listener.mockClear();
    appearance.setColorSchemeOverride('light');
    expect(listener).toHaveBeenCalledWith({ colorScheme: 'light' });
  });

  it('removes subscriptions', () => {
    const listener = jest.fn();
    const sub = RN.Appearance.addChangeListener(listener);
    sub.remove();
    appearance.setColorSchemeOverride('dark');
    emitReal('dark');
    expect(listener).not.toHaveBeenCalled();
  });
});
