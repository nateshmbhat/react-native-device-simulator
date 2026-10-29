import { fireEvent, render, screen } from '@testing-library/react-native';
import { Share } from 'react-native';
import { createDevicePreviewStore } from '../../core/store';
import { describeSimulation, simulationInfoPlugin, summarizeSimulation } from '../simulation-info';
import type { DevicePreviewPluginContext } from '../types';

// `expo-clipboard` is an optional dependency; tests toggle its API.
const mockClipboard: { setStringAsync?: (text: string) => Promise<boolean> } = {};
jest.mock('expo-clipboard', () => mockClipboard, { virtual: true });

const theme = {
  background: '#000',
  surface: '#111',
  text: '#fff',
  textMuted: '#aaa',
  accent: '#5b5bd6',
  border: '#333',
};

function makeContext(configure?: (store: ReturnType<typeof createDevicePreviewStore>) => void): DevicePreviewPluginContext {
  const controller = createDevicePreviewStore();
  configure?.(controller);
  return { controller, settings: controller.getSettings(), simulation: controller.getSimulation(), theme };
}

afterEach(() => {
  jest.restoreAllMocks();
  delete mockClipboard.setStringAsync;
});

describe('summarizeSimulation', () => {
  it('reports the resolved device without frame artwork', async () => {
    const { simulation } = makeContext((s) => {
      s.setOrientation('landscape');
      s.setLocale('ar-EG');
      s.update({ accessibility: { ...s.getSettings().accessibility, boldText: true } });
    });
    const summary = summarizeSimulation(simulation);

    expect(summary.device.id).toBe('apple-iphone-17-pro');
    expect(summary.orientation).toBe('landscape');
    expect(summary.screenSize.width).toBeGreaterThan(summary.screenSize.height);
    expect(summary.physicalSize.width).toBe(Math.round(summary.screenSize.width * summary.pixelRatio));
    expect(summary.isRTL).toBe(true);
    expect(summary.accessibility).toEqual({ boldText: true });
    expect(JSON.stringify(summary)).not.toContain('<svg');
  });

  it('describes unset values as "system"', async () => {
    const groups = describeSimulation(makeContext().simulation);
    const env = Object.fromEntries(groups.find((g) => g.title === 'Environment')!.rows);
    expect(env['Color scheme']).toBe('system');
    expect(env['Locale']).toBe('system');
  });
});

describe('simulationInfoPlugin', () => {
  it('renders the current device as key/values', async () => {
    const plugin = simulationInfoPlugin();
    expect(plugin.id).toBe('simulation-info');
    expect(plugin.title).toBe('Info');
    await render(<>{plugin.render(makeContext())}</>);
    expect(screen.getByText('iPhone 17 Pro')).toBeTruthy();
    expect(screen.getByText('portrait')).toBeTruthy();
  });

  it('copies the summary as JSON with expo-clipboard when installed', async () => {
    const setStringAsync = jest.fn(async () => true);
    mockClipboard.setStringAsync = setStringAsync;
    const context = makeContext();
    await render(<>{simulationInfoPlugin().render(context)}</>);

    await fireEvent.press(screen.getByTestId('simulation-info-copy'));

    expect(setStringAsync).toHaveBeenCalledTimes(1);
    const calls = setStringAsync.mock.calls as unknown as [string][];
    expect(JSON.parse(calls[0]![0])).toEqual(summarizeSimulation(context.simulation));
    expect(screen.getByText('Copied to clipboard')).toBeTruthy();
  });

  it('falls back to the share sheet without a clipboard module', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction, activityType: undefined });
    await render(<>{simulationInfoPlugin().render(makeContext())}</>);

    await fireEvent.press(screen.getByTestId('simulation-info-copy'));

    expect(share).toHaveBeenCalledWith({ message: expect.stringContaining('"apple-iphone-17-pro"') });
  });
});
