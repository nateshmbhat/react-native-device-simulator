import type * as KeyboardModule from '../keyboard';
import type * as StoreModule from '../../core/store';

type RN = typeof import('react-native');

let RN: RN;
let kb: typeof KeyboardModule;
let store: typeof StoreModule;

const KB = { height: 336, screenWidth: 402, screenHeight: 874 };

beforeEach(() => {
  jest.resetModules();
  jest.useFakeTimers();
  RN = require('react-native');
  kb = require('../keyboard');
  store = require('../../core/store');
});

afterEach(() => {
  jest.useRealTimers();
});

function record(...events: string[]) {
  kb.installKeyboardPatch();
  const log: Array<[string, unknown]> = [];
  const subs = events.map((name) =>
    RN.Keyboard.addListener(name as 'keyboardDidShow', (e: unknown) => {
      log.push([name, e]);
    }),
  );
  return { log, names: () => log.map(([n]) => n), subs };
}

const ALL = [
  'keyboardWillShow',
  'keyboardDidShow',
  'keyboardWillHide',
  'keyboardDidHide',
  'keyboardWillChangeFrame',
  'keyboardDidChangeFrame',
];

describe('simulated keyboard', () => {
  it('emits the iOS show sequence with simulated screen coordinates', () => {
    kb.installKeyboardPatch();
    const { log, names } = record(...ALL);
    kb.setKeyboardOverride(KB);
    expect(names()).toEqual(['keyboardWillChangeFrame', 'keyboardWillShow']);
    jest.advanceTimersByTime(kb.KEYBOARD_ANIMATION_DURATION);
    expect(names()).toEqual(['keyboardWillChangeFrame', 'keyboardWillShow', 'keyboardDidChangeFrame', 'keyboardDidShow']);
    expect(log[1]![1]).toEqual({
      duration: 250,
      easing: 'keyboard',
      startCoordinates: { screenX: 0, screenY: 874, width: 402, height: 336 },
      endCoordinates: { screenX: 0, screenY: 874 - 336, width: 402, height: 336 },
      isEventFromThisApp: true,
    });
  });

  it('reports isVisible() and metrics() while shown', () => {
    expect(RN.Keyboard.isVisible()).toBe(false);
    kb.setKeyboardOverride(KB);
    expect(RN.Keyboard.isVisible()).toBe(true);
    expect(RN.Keyboard.metrics()).toEqual({ screenX: 0, screenY: 538, width: 402, height: 336 });
    kb.setKeyboardOverride(null);
    expect(RN.Keyboard.isVisible()).toBe(false);
    expect(RN.Keyboard.metrics()).toBeUndefined();
  });

  it('emits the hide sequence', () => {
    kb.setKeyboardOverride(KB);
    jest.runAllTimers();
    const { log, names } = record(...ALL);
    jest.runAllTimers(); // replayed show events for the new listeners
    log.length = 0;
    kb.setKeyboardOverride(null);
    jest.runAllTimers();
    expect(names()).toEqual(['keyboardWillChangeFrame', 'keyboardWillHide', 'keyboardDidChangeFrame', 'keyboardDidHide']);
    expect(log[1]![1]).toMatchObject({
      startCoordinates: { screenY: 538, height: 336 },
      endCoordinates: { screenX: 0, screenY: 874, width: 402, height: 336 },
    });
  });

  it('re-emits show events when the keyboard frame changes (rotation)', () => {
    kb.setKeyboardOverride(KB);
    jest.runAllTimers();
    const { log, names } = record('keyboardWillShow', 'keyboardWillHide');
    jest.runAllTimers();
    log.length = 0;
    kb.setKeyboardOverride({ height: 200, screenWidth: 874, screenHeight: 402 });
    expect(names()).toEqual(['keyboardWillShow']);
    expect(log[0]![1]).toMatchObject({
      startCoordinates: { screenY: 538, height: 336 },
      endCoordinates: { screenX: 0, screenY: 202, width: 874, height: 200 },
    });
  });

  it('ignores identical updates and treats height 0 as hidden', () => {
    const { names } = record('keyboardWillShow', 'keyboardWillHide');
    kb.setKeyboardOverride(KB);
    kb.setKeyboardOverride({ ...KB });
    kb.setKeyboardOverride({ ...KB, height: 0 });
    kb.setKeyboardOverride(null);
    expect(names()).toEqual(['keyboardWillShow', 'keyboardWillHide']);
  });

  it('delivers pending "did" events before the next transition starts', () => {
    const { names } = record(...ALL);
    kb.setKeyboardOverride(KB);
    kb.setKeyboardOverride(null);
    expect(names()).toEqual([
      'keyboardWillChangeFrame',
      'keyboardWillShow',
      'keyboardDidChangeFrame',
      'keyboardDidShow',
      'keyboardWillChangeFrame',
      'keyboardWillHide',
    ]);
  });

  it('removes subscriptions', () => {
    const { names, subs } = record('keyboardWillShow');
    subs.forEach((s) => s.remove());
    kb.setKeyboardOverride(KB);
    jest.runAllTimers();
    expect(names()).toEqual([]);
  });

  it('removeAllListeners drops simulated listeners too', () => {
    const { names } = record('keyboardWillShow', 'keyboardWillHide');
    RN.Keyboard.removeAllListeners('keyboardWillShow');
    kb.setKeyboardOverride(KB);
    kb.setKeyboardOverride(null);
    expect(names()).toEqual(['keyboardWillHide']);
  });

  it('replays the shown keyboard to listeners added while it is up', () => {
    kb.setKeyboardOverride(KB);
    jest.runAllTimers();
    const { log, names } = record('keyboardWillShow', 'keyboardDidShow', 'keyboardWillHide');
    expect(names()).toEqual([]);
    jest.runAllTimers();
    expect(names()).toEqual(['keyboardWillShow', 'keyboardDidShow']);
    expect(log[0]![1]).toMatchObject({ endCoordinates: { screenY: 538 } });
  });

  it('does not replay "did" events that are still pending', () => {
    kb.setKeyboardOverride(KB);
    const { names } = record('keyboardDidShow');
    jest.runAllTimers();
    expect(names()).toEqual(['keyboardDidShow']);
  });

  it('does not replay to a listener removed before the replay', () => {
    kb.setKeyboardOverride(KB);
    jest.runAllTimers();
    const { names, subs } = record('keyboardWillShow');
    subs[0]!.remove();
    jest.runAllTimers();
    expect(names()).toEqual([]);
  });

  it('dismiss() hides the simulated keyboard and updates the settings', () => {
    store.deviceSimulator.setKeyboardVisible(true);
    kb.setKeyboardOverride(KB);
    const { names } = record('keyboardWillHide');
    RN.Keyboard.dismiss();
    expect(names()).toEqual(['keyboardWillHide']);
    expect(RN.Keyboard.isVisible()).toBe(false);
    expect(store.deviceSimulator.getSettings().keyboardVisible).toBe(false);
  });

  it('dismiss() leaves the settings alone when no simulated keyboard is shown', () => {
    const listener = jest.fn();
    store.deviceSimulator.subscribe(listener);
    RN.Keyboard.dismiss();
    expect(listener).not.toHaveBeenCalled();
  });

  it('is idempotent', () => {
    kb.installKeyboardPatch();
    const addListener = RN.Keyboard.addListener;
    kb.installKeyboardPatch();
    expect(RN.Keyboard.addListener).toBe(addListener);
    const { names } = record('keyboardWillShow');
    kb.setKeyboardOverride(KB);
    expect(names()).toEqual(['keyboardWillShow']);
  });

  it('a throwing listener does not stop the others', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    kb.installKeyboardPatch();
    RN.Keyboard.addListener('keyboardWillShow', () => {
      throw new Error('boom');
    });
    const { names } = record('keyboardWillShow');
    kb.setKeyboardOverride(KB);
    expect(names()).toEqual(['keyboardWillShow']);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  describe('real keyboard events', () => {
    // The native keyboard observer is not available in Jest; drive the
    // emitter the original `addListener` subscribes to.
    function emitReal(name: string, event: unknown) {
      const emitter = (RN.Keyboard as unknown as { _emitter: { emit(n: string, e: unknown): void } })._emitter;
      emitter.emit(name, event);
    }

    it('pass through while no simulated keyboard is shown, and are hidden while one is', () => {
      kb.installKeyboardPatch();
      const { log } = record('keyboardDidShow');
      const real = { endCoordinates: { screenX: 0, screenY: 500, width: 390, height: 300 } };
      emitReal('keyboardDidShow', real);
      expect(log).toEqual([['keyboardDidShow', real]]);
      kb.setKeyboardOverride(KB);
      jest.runAllTimers();
      log.length = 0;
      emitReal('keyboardDidShow', real);
      expect(log).toEqual([]);
      kb.setKeyboardOverride(null);
      jest.runAllTimers();
      emitReal('keyboardDidShow', real);
      expect(log).toEqual([['keyboardDidShow', real]]);
    });
  });
});
