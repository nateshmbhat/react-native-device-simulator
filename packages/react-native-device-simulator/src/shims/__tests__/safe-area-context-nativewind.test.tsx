/**
 * Issue #5: with NativeWind v4, every JSX call and every `React.createElement`
 * call (this library's source included) goes through react-native-css-interop,
 * which swaps any component named "SafeAreaProvider" for a shim of the first
 * one it saw. See ./nativewind-jsx.ts for the replica used here.
 */
import * as React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import * as Real from 'react-native-safe-area-context';
import { PreviewScreenContext, type PreviewScreenContextValue } from '../../previewScreenContext';
import { defaultSettings, resolveSimulation } from '../../core/simulation';
import { allPresets } from '../../presets';
import { SafeAreaProvider, useSafeAreaInsets } from '../safe-area-context';
import { VariableContext, hijack, resetNativeWindReplica } from './nativewind-jsx';

jest.mock('react', () => require('./nativewind-jsx').wrapReact(jest.requireActual('react')));
jest.mock('react/jsx-runtime', () => require('./nativewind-jsx').wrapJsxRuntime(jest.requireActual('react/jsx-runtime')));
jest.mock('react/jsx-dev-runtime', () =>
  require('./nativewind-jsx').wrapJsxRuntime(jest.requireActual('react/jsx-dev-runtime')),
);

const HOST = { insets: { top: 20, right: 1, bottom: 2, left: 3 }, frame: { x: 0, y: 0, width: 1000, height: 800 } };
const SIM_INSETS = { top: 62, right: 0, bottom: 34, left: 0 };
const SIM_FRAME = { x: 0, y: 0, width: 402, height: 874 };

const simulation = resolveSimulation(defaultSettings, allPresets);

/** What SimulatedScreen provides around the app inside an active preview. */
function ActivePreview({ children }: { children: React.ReactNode }) {
  const value: PreviewScreenContextValue = { active: true, simulation, fontScaleMultiplier: 1, boldText: false };
  return (
    <PreviewScreenContext.Provider value={value}>
      <Real.SafeAreaFrameContext.Provider value={SIM_FRAME}>
        <Real.SafeAreaInsetsContext.Provider value={SIM_INSETS}>{children}</Real.SafeAreaInsetsContext.Provider>
      </Real.SafeAreaFrameContext.Provider>
    </PreviewScreenContext.Provider>
  );
}

let childRenders = 0;
/** Reports the app's insets and NativeWind's safe-area CSS variables. */
function Probe() {
  childRenders++;
  const insets = useSafeAreaInsets();
  const vars = React.useContext(VariableContext);
  const cssInsets = vars && {
    top: vars['--___css-interop___safe-area-inset-top'],
    right: vars['--___css-interop___safe-area-inset-right'],
    bottom: vars['--___css-interop___safe-area-inset-bottom'],
    left: vars['--___css-interop___safe-area-inset-left'],
  };
  return <Text testID="probe">{JSON.stringify({ insets, cssInsets })}</Text>;
}
const probe = () => JSON.parse(String(screen.getByTestId('probe').props.children));

beforeEach(() => {
  resetNativeWindReplica();
  childRenders = 0;
});

describe('the NativeWind replica', () => {
  it('hijacks React.createElement as well as JSX', async () => {
    await render(React.createElement(Real.SafeAreaProvider, { initialMetrics: HOST }, <Probe />));
    expect(hijack.renders).toBe(1);
    expect(childRenders).toBe(1);
  });
});

describe('safe-area-context shim under NativeWind (issue #5)', () => {
  it('renders the app once instead of looping', async () => {
    await render(
      <SafeAreaProvider initialMetrics={HOST}>
        <Probe />
      </SafeAreaProvider>,
    );
    expect(childRenders).toBe(1);
    // NativeWind hijacked the app's provider once, and nothing else.
    expect(hijack.renders).toBe(1);
  });

  it('handles a nested provider (React Navigation, Expo Router)', async () => {
    await render(
      <SafeAreaProvider initialMetrics={HOST}>
        <SafeAreaProvider>
          <Probe />
        </SafeAreaProvider>
      </SafeAreaProvider>,
    );
    expect(childRenders).toBe(1);
    expect(hijack.renders).toBe(2);
  });

  it("gives NativeWind's safe-area variables the real insets outside a preview", async () => {
    await render(
      <SafeAreaProvider initialMetrics={HOST}>
        <Probe />
      </SafeAreaProvider>,
    );
    expect(probe()).toEqual({ insets: HOST.insets, cssInsets: HOST.insets });
  });

  it("gives NativeWind's safe-area variables the simulated insets inside a preview", async () => {
    await render(
      <ActivePreview>
        <SafeAreaProvider initialMetrics={HOST}>
          <SafeAreaProvider>
            <Probe />
          </SafeAreaProvider>
        </SafeAreaProvider>
      </ActivePreview>,
    );
    expect(probe()).toEqual({ insets: SIM_INSETS, cssInsets: SIM_INSETS });
    expect(childRenders).toBe(1);
  });
});
