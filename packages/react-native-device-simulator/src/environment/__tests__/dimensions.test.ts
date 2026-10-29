import type * as DimensionsModule from '../dimensions';

type RN = typeof import('react-native');

let RN: RN;
let dims: typeof DimensionsModule;

const PHONE = { width: 402, height: 874, scale: 3, fontScale: 1.5 };
const TABLET = { width: 820, height: 1180, scale: 2, fontScale: 1 };

beforeEach(() => {
  jest.resetModules();
  RN = require('react-native');
  dims = require('../dimensions');
  dims.installDimensionsPatch();
});

function set(metrics: typeof PHONE | null, notify = true) {
  dims.setDimensionsOverride(metrics ? { window: metrics, screen: metrics } : null, notify);
}

describe('Dimensions patch', () => {
  it('is idempotent', () => {
    dims.installDimensionsPatch();
    const get = RN.Dimensions.get;
    const add = RN.Dimensions.addEventListener;
    dims.installDimensionsPatch();
    expect(RN.Dimensions.get).toBe(get);
    expect(RN.Dimensions.addEventListener).toBe(add);
  });

  it('reports the override through Dimensions.get and PixelRatio', () => {
    const real = RN.Dimensions.get('window');
    set(PHONE);
    expect(RN.Dimensions.get('window')).toEqual(PHONE);
    expect(RN.Dimensions.get('screen')).toEqual(PHONE);
    expect(RN.PixelRatio.get()).toBe(3);
    expect(RN.PixelRatio.getFontScale()).toBe(1.5);
    expect(dims.getRealDimensions('window')).toEqual(real);
    set(null);
    expect(RN.Dimensions.get('window')).toEqual(real);
    expect(dims.getDimensionsOverride()).toBeNull();
  });

  it('notifies listeners on change and when cleared, not on identical updates', () => {
    const real = RN.Dimensions.get('window');
    const handler = jest.fn();
    RN.Dimensions.addEventListener('change', handler);
    set(PHONE);
    set({ ...PHONE });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenLastCalledWith({ window: PHONE, screen: PHONE });
    set(TABLET);
    expect(handler).toHaveBeenLastCalledWith({ window: TABLET, screen: TABLET });
    set(null);
    expect(handler).toHaveBeenCalledTimes(3);
    expect(handler.mock.calls[2][0].window).toEqual(real);
  });

  it('does not notify when clearing an override that was never notified', () => {
    const handler = jest.fn();
    RN.Dimensions.addEventListener('change', handler);
    set(null);
    expect(handler).not.toHaveBeenCalled();
  });

  it('defers notifications in silent mode', () => {
    const handler = jest.fn();
    RN.Dimensions.addEventListener('change', handler);
    set(PHONE, false);
    expect(RN.Dimensions.get('window')).toEqual(PHONE);
    expect(handler).not.toHaveBeenCalled();
    set(PHONE);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenLastCalledWith({ window: PHONE, screen: PHONE });
  });

  it('skips a deferred notification that ends where listeners already are', () => {
    const handler = jest.fn();
    RN.Dimensions.addEventListener('change', handler);
    set(PHONE);
    set(TABLET, false);
    set(PHONE, false);
    set(PHONE);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('removes subscriptions, also for the same handler added twice', () => {
    const handler = jest.fn();
    const a = RN.Dimensions.addEventListener('change', handler);
    const b = RN.Dimensions.addEventListener('change', handler);
    a.remove();
    a.remove();
    set(PHONE);
    expect(handler).toHaveBeenCalledTimes(1);
    b.remove();
    set(TABLET);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('reports the override for real (host) change events while simulating', () => {
    dims.installDimensionsPatch();
    const handler = jest.fn();
    RN.Dimensions.addEventListener('change', handler);
    set(PHONE);
    handler.mockClear();
    const host = { width: 1000, height: 800, scale: 2, fontScale: 1 };
    // Dimensions.set() is what the native module's change event calls.
    (RN.Dimensions as unknown as { set(d: unknown): void }).set({ window: host, screen: host });
    expect(handler).toHaveBeenCalledWith({ window: PHONE, screen: PHONE });
    expect(dims.getRealDimensions('window')).toEqual(host);
  });
});
