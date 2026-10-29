import * as React from 'react';
import { StyleSheet, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { PreviewScreenContext, type PreviewScreenContextValue } from '../../previewScreenContext';
import { defaultSettings, resolveSimulation } from '../../core/simulation';
import { allPresets } from '../../presets';
import * as Real from 'react-native-safe-area-context';
import {
  SafeAreaListener,
  SafeAreaProvider,
  SafeAreaView,
  safeAreaViewStyle,
  useSafeAreaFrame,
  useSafeAreaInsets,
  initialWindowMetrics,
} from '../safe-area-context';

const SIM_INSETS = { top: 62, right: 0, bottom: 34, left: 0 };
const SIM_FRAME = { x: 0, y: 0, width: 402, height: 874 };
const HOST = { insets: { top: 20, right: 1, bottom: 2, left: 3 }, frame: { x: 0, y: 0, width: 1000, height: 800 } };

const simulation = resolveSimulation(defaultSettings, allPresets);

/** What SimulatedScreen provides around the app. */
function Screen({ active, children }: { active: boolean; children: React.ReactNode }) {
  const value: PreviewScreenContextValue = { active, simulation, fontScaleMultiplier: 1, boldText: false };
  const content = (
    <PreviewScreenContext.Provider value={value}>
      {active ? (
        <Real.SafeAreaFrameContext.Provider value={SIM_FRAME}>
          <Real.SafeAreaInsetsContext.Provider value={SIM_INSETS}>{children}</Real.SafeAreaInsetsContext.Provider>
        </Real.SafeAreaFrameContext.Provider>
      ) : (
        children
      )}
    </PreviewScreenContext.Provider>
  );
  return content;
}

function Probe() {
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();
  return <Text testID="probe">{JSON.stringify({ insets, frame })}</Text>;
}
const probe = () => JSON.parse(String(screen.getByTestId('probe').props.children));
const flat = (id: string) => StyleSheet.flatten(screen.getByTestId(id).props.style);

describe('safe-area-context shim', () => {
  it('re-exports the rest of the library', () => {
    expect(initialWindowMetrics).toBe(Real.initialWindowMetrics);
    expect(useSafeAreaInsets).toBe(Real.useSafeAreaInsets);
    expect(SafeAreaProvider).not.toBe(Real.SafeAreaProvider);
  });

  describe('SafeAreaProvider', () => {
    it('keeps the simulated insets for a nested provider inside an active preview', async () => {
      await render(
        <Screen active>
          <SafeAreaProvider initialMetrics={HOST}>
            <Probe />
          </SafeAreaProvider>
        </Screen>,
      );
      expect(probe()).toEqual({ insets: SIM_INSETS, frame: SIM_FRAME });
    });

    it('behaves like the real provider outside a preview', async () => {
      await render(
        <Screen active={false}>
          <SafeAreaProvider initialMetrics={HOST}>
            <Probe />
          </SafeAreaProvider>
        </Screen>,
      );
      expect(probe()).toEqual(HOST);
    });
  });

  describe('SafeAreaView', () => {
    it('applies the simulated insets as padding, with native edges off', async () => {
      await render(
        <Screen active>
          <SafeAreaView testID="v" style={{ padding: 10, backgroundColor: 'red' }} />
        </Screen>,
      );
      const view = screen.getByTestId('v');
      expect(view.props.edges).toEqual({ top: 'off', right: 'off', bottom: 'off', left: 'off' });
      expect(flat('v')).toMatchObject({ backgroundColor: 'red', paddingTop: 72, paddingRight: 10, paddingBottom: 44, paddingLeft: 10 });
    });

    it('honours edges and mode', () => {
      const style = (s: object, mode: 'padding' | 'margin' | undefined, edges: Real.Edges | undefined) =>
        StyleSheet.flatten(safeAreaViewStyle(s, SIM_INSETS, mode, edges));
      expect(style({}, undefined, ['top'])).toEqual({ paddingTop: 62, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 });
      expect(style({ marginBottom: 40 }, 'margin', { bottom: 'maximum', top: 'additive' })).toEqual({
        marginTop: 62,
        marginRight: 0,
        marginBottom: 40,
        marginLeft: 0,
      });
      expect(style({ paddingVertical: 5 }, 'padding', { bottom: 'maximum' })).toMatchObject({ paddingTop: 5, paddingBottom: 34 });
    });

    it('renders the real view unchanged outside a preview', async () => {
      const style = { padding: 10 };
      await render(
        <Screen active={false}>
          <SafeAreaView testID="v" edges={['top']} style={style} />
        </Screen>,
      );
      const view = screen.getByTestId('v');
      expect(view.props.style).toBe(style);
      expect(view.props.edges).toEqual({ top: 'additive', right: 'off', bottom: 'off', left: 'off' });
    });

    it('does not remount its children when the preview is toggled', async () => {
      let mounts = 0;
      function Child() {
        React.useEffect(() => {
          mounts++;
        }, []);
        return null;
      }
      const tree = (active: boolean) => (
        <PreviewScreenContext.Provider value={{ active, simulation, fontScaleMultiplier: 1, boldText: false }}>
          <Real.SafeAreaFrameContext.Provider value={SIM_FRAME}>
            <Real.SafeAreaInsetsContext.Provider value={SIM_INSETS}>
              <SafeAreaProvider>
                <SafeAreaView>
                  <Child />
                </SafeAreaView>
              </SafeAreaProvider>
            </Real.SafeAreaInsetsContext.Provider>
          </Real.SafeAreaFrameContext.Provider>
        </PreviewScreenContext.Provider>
      );
      await render(tree(true));
      await screen.rerender(tree(false));
      await screen.rerender(tree(true));
      expect(mounts).toBe(1);
    });
  });

  describe('SafeAreaListener', () => {
    it('reports the simulated safe area inside an active preview', async () => {
      const onChange = jest.fn();
      await render(
        <Screen active>
          <SafeAreaListener onChange={onChange} />
        </Screen>,
      );
      expect(onChange).toHaveBeenCalledWith({ insets: SIM_INSETS, frame: SIM_FRAME });
    });

    it('reports nothing simulated outside a preview', async () => {
      const onChange = jest.fn();
      await render(
        <Screen active={false}>
          <SafeAreaListener onChange={onChange} />
        </Screen>,
      );
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
