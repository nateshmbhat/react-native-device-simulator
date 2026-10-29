import type * as AccessibilityModule from '../accessibility';
import type { AccessibilityOverrides } from '../../types';

type RN = typeof import('react-native');

let RN: RN;
let a11y: typeof AccessibilityModule;
let emitReal: (event: string, value: boolean) => void;

const NONE: AccessibilityOverrides = {
  boldText: null,
  reduceMotion: null,
  reduceTransparency: null,
  invertColors: null,
  grayscale: null,
  highContrast: null,
  darkerSystemColors: null,
  screenReader: null,
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  jest.resetModules();
  RN = require('react-native');
  // The Jest preset mocks AccessibilityInfo; give it a working event source.
  const real = new Map<string, Set<(v: boolean) => void>>();
  const info = RN.AccessibilityInfo as unknown as Record<string, unknown>;
  info.addEventListener = (event: string, handler: (v: boolean) => void) => {
    if (!real.has(event)) real.set(event, new Set());
    real.get(event)!.add(handler);
    return { remove: () => real.get(event)!.delete(handler) };
  };
  info.isBoldTextEnabled = () => Promise.resolve(false);
  emitReal = (event, value) => real.get(event)?.forEach((h) => h(value));
  a11y = require('../accessibility');
  a11y.installAccessibilityPatch();
});

describe('AccessibilityInfo patch', () => {
  it('is idempotent', () => {
    a11y.installAccessibilityPatch();
    const fn = RN.AccessibilityInfo.isBoldTextEnabled;
    a11y.installAccessibilityPatch();
    expect(RN.AccessibilityInfo.isBoldTextEnabled).toBe(fn);
  });

  it('reports overrides and falls back to the real value', async () => {
    a11y.setAccessibilityOverrides({ ...NONE, boldText: true, reduceMotion: false });
    await expect(RN.AccessibilityInfo.isBoldTextEnabled()).resolves.toBe(true);
    await expect(RN.AccessibilityInfo.isReduceMotionEnabled()).resolves.toBe(false);
    a11y.setAccessibilityOverrides(NONE);
    await expect(RN.AccessibilityInfo.isBoldTextEnabled()).resolves.toBe(false);
  });

  it('notifies listeners on change and with the real value when cleared', async () => {
    const handler = jest.fn();
    RN.AccessibilityInfo.addEventListener('boldTextChanged', handler);
    a11y.setAccessibilityOverrides({ ...NONE, boldText: true });
    expect(handler).toHaveBeenLastCalledWith(true);
    a11y.setAccessibilityOverrides({ ...NONE, boldText: true });
    expect(handler).toHaveBeenCalledTimes(1);
    a11y.setAccessibilityOverrides(NONE);
    await flush();
    expect(handler).toHaveBeenLastCalledWith(false);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('drops a stale real value when an override is set before it arrives', async () => {
    const handler = jest.fn();
    RN.AccessibilityInfo.addEventListener('boldTextChanged', handler);
    a11y.setAccessibilityOverrides({ ...NONE, boldText: true });
    a11y.setAccessibilityOverrides(NONE);
    a11y.setAccessibilityOverrides({ ...NONE, boldText: true });
    await flush();
    expect(handler.mock.calls.map((c) => c[0])).toEqual([true, true]);
  });

  it('notifies both screen reader events', () => {
    const changed = jest.fn();
    RN.AccessibilityInfo.addEventListener('screenReaderChanged', changed);
    a11y.setAccessibilityOverrides({ ...NONE, screenReader: true });
    expect(changed).toHaveBeenCalledWith(true);
  });

  it('maps real events through the override', () => {
    const handler = jest.fn();
    RN.AccessibilityInfo.addEventListener('reduceMotionChanged', handler);
    emitReal('reduceMotionChanged', true);
    expect(handler).toHaveBeenLastCalledWith(true);
    a11y.setAccessibilityOverrides({ ...NONE, reduceMotion: false });
    emitReal('reduceMotionChanged', true);
    expect(handler).toHaveBeenLastCalledWith(false);
  });

  it('removes subscriptions, also for the same handler added twice', () => {
    const handler = jest.fn();
    const a = RN.AccessibilityInfo.addEventListener('boldTextChanged', handler);
    const b = RN.AccessibilityInfo.addEventListener('boldTextChanged', handler);
    a.remove();
    a11y.setAccessibilityOverrides({ ...NONE, boldText: true });
    expect(handler).toHaveBeenCalledTimes(1);
    b.remove();
    a11y.setAccessibilityOverrides({ ...NONE, boldText: false });
    emitReal('boldTextChanged', true);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('passes other events to the original implementation', () => {
    const handler = jest.fn();
    RN.AccessibilityInfo.addEventListener('announcementFinished' as 'change', handler);
    emitReal('announcementFinished', true);
    expect(handler).toHaveBeenCalledWith(true);
  });
});
