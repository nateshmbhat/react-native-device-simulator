// The React Native Jest preset mocks useColorScheme; test the real hook.
jest.unmock('react-native/Libraries/Utilities/useColorScheme');
import { KeyboardAvoidingView, PixelRatio, useColorScheme, useWindowDimensions, View } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { applyEnvironment, getRealDimensions } from '..';
import { defaultSettings, resolveSimulation } from '../../core/simulation';
import { allPresets } from '../../presets';
import type { DeviceSimulatorSettings } from '../../types';

function simulation(patch: Partial<DeviceSimulatorSettings> = {}) {
  return resolveSimulation({ ...defaultSettings, ...patch }, allPresets);
}

afterEach(async () => {
  await act(async () => applyEnvironment(null));
  jest.useRealTimers();
});

describe('applyEnvironment with React hooks', () => {
  it('drives useWindowDimensions, PixelRatio and useColorScheme, and restores them', async () => {
    const seen: Array<{ width: number; height: number; scheme: string | null | undefined }> = [];
    function Probe() {
      const { width, height } = useWindowDimensions();
      const scheme = useColorScheme();
      seen.push({ width, height, scheme });
      return null;
    }
    const sim = simulation({ colorScheme: 'dark', fontScale: 1.3 });
    // Silent first (as DeviceSimulator does during render), then notifying.
    applyEnvironment(sim, { silent: true });
    await render(<Probe />);
    expect(seen.at(-1)).toEqual({ width: sim.screenSize.width, height: sim.screenSize.height, scheme: 'dark' });
    expect(PixelRatio.get()).toBe(sim.pixelRatio);
    expect(PixelRatio.getFontScale()).toBe(1.3);

    const landscape = simulation({ colorScheme: 'light', orientation: 'landscape' });
    await act(async () => applyEnvironment(landscape));
    expect(seen.at(-1)).toEqual({ width: landscape.screenSize.width, height: landscape.screenSize.height, scheme: 'light' });

    const real = getRealDimensions('window');
    await act(async () => applyEnvironment(null));
    expect(seen.at(-1)).toMatchObject({ width: real.width, height: real.height });
  });
});

describe('KeyboardAvoidingView with the simulated keyboard', () => {
  function Screen({ behavior }: { behavior: 'padding' | 'height' }) {
    return (
      <KeyboardAvoidingView testID="kav" behavior={behavior} style={{ flex: 1 }}>
        <View />
      </KeyboardAvoidingView>
    );
  }

  async function layout(height: number) {
    await act(async () => {
      await fireEvent(screen.getByTestId('kav'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 402, height } },
        persist() {},
      });
    });
  }

  it.each(['padding', 'height'] as const)('avoids the keyboard with behavior="%s"', async (behavior) => {
    jest.useFakeTimers();
    const sim = simulation({ keyboardVisible: true });
    expect(sim.keyboardHeight).toBeGreaterThan(0);
    await render(<Screen behavior={behavior} />);
    await layout(sim.screenSize.height);

    await act(async () => {
      applyEnvironment(sim);
      jest.runAllTimers();
    });
    const style = () => screen.getByTestId('kav').props.style;
    const flat = () => Object.assign({}, ...[style()].flat(Infinity).filter(Boolean));
    if (behavior === 'padding') expect(flat().paddingBottom).toBe(sim.keyboardHeight);
    else expect(flat().height).toBe(sim.screenSize.height - sim.keyboardHeight);

    await act(async () => {
      applyEnvironment(simulation({ keyboardVisible: false }));
      jest.runAllTimers();
    });
    if (behavior === 'padding') expect(flat().paddingBottom).toBe(0);
    else expect(flat().height).toBeUndefined();
  });

  it('adjusts a KeyboardAvoidingView mounted while the keyboard is shown', async () => {
    jest.useFakeTimers();
    const sim = simulation({ keyboardVisible: true });
    await act(async () => applyEnvironment(sim));
    await act(async () => jest.runAllTimers());
    await render(<Screen behavior="padding" />);
    await layout(sim.screenSize.height);
    await act(async () => {
      jest.runAllTimers();
    });
    const flat = Object.assign({}, ...[screen.getByTestId('kav').props.style].flat(Infinity).filter(Boolean));
    expect(flat.paddingBottom).toBe(sim.keyboardHeight);
  });
});
