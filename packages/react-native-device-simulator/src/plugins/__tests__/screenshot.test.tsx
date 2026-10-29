import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Image } from 'react-native';
import { deviceViewRef, screenViewRef, type ViewHandle } from '../../core/refs';
import { createDeviceSimulatorStore } from '../../core/store';
import type { CaptureBackend } from '../capture-types';
import { ScreenshotPanel, screenshotFileName, screenshotPlugin } from '../screenshot';
import type { DeviceSimulatorPluginContext } from '../types';

const theme = {
  background: '#000',
  surface: '#111',
  text: '#fff',
  textMuted: '#aaa',
  accent: '#5b5bd6',
  border: '#333',
};

function makeContext(): DeviceSimulatorPluginContext {
  const controller = createDeviceSimulatorStore();
  return { controller, settings: controller.getSettings(), simulation: controller.getSimulation(), theme };
}

function fakeBackend(overrides: Partial<CaptureBackend> = {}): CaptureBackend & {
  capture: jest.Mock;
  save: jest.Mock;
} {
  return {
    available: true,
    installHint: 'install something',
    saveLabel: 'Save it',
    capture: jest.fn(async (_view, options) => ({ uri: 'file:///tmp/shot.png', fileName: options.fileName })),
    save: jest.fn(async () => 'shared' as const),
    ...overrides,
  } as never;
}

const fakeView = {} as ViewHandle;

beforeEach(() => {
  (deviceViewRef as { current: ViewHandle | null }).current = fakeView;
  (screenViewRef as { current: ViewHandle | null }).current = { screen: true } as unknown as ViewHandle;
  jest.spyOn(Image, 'getSize').mockImplementation((_uri, success) => success(1206, 2622));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('screenshotFileName', () => {
  it('combines device id, orientation and a local timestamp', async () => {
    const date = new Date(2026, 9, 29, 9, 5, 7);
    expect(screenshotFileName('apple-iphone-17-pro', 'portrait', date)).toBe(
      'apple-iphone-17-pro-portrait-20261029-090507.png',
    );
  });

  it('sanitizes ids', async () => {
    expect(screenshotFileName('My Device/2', 'landscape', new Date(2026, 0, 1, 0, 0, 0))).toBe(
      'my-device-2-landscape-20260101-000000.png',
    );
  });
});

describe('screenshotPlugin', () => {
  it('describes a toolbar tab', async () => {
    const plugin = screenshotPlugin({ title: 'Shots' });
    expect(plugin.id).toBe('screenshot');
    expect(plugin.title).toBe('Shots');
    expect(typeof plugin.render).toBe('function');
  });

  it('renders a panel through render(context)', async () => {
    await render(<>{screenshotPlugin().render(makeContext())}</>);
    expect(screen.getByText('Capture device')).toBeTruthy();
    expect(screen.getByText('Capture screen only')).toBeTruthy();
  });
});

describe('ScreenshotPanel', () => {
  it('captures the device view at the simulated pixel ratio and previews it', async () => {
    const backend = fakeBackend();
    const onCapture = jest.fn();
    const context = makeContext();
    await render(<ScreenshotPanel context={context} backend={backend} options={{ onCapture }} />);

    await fireEvent.press(screen.getByTestId('screenshot-capture-device'));

    expect(backend.capture).toHaveBeenCalledWith(fakeView, {
      pixelRatio: context.simulation.pixelRatio,
      fileName: expect.stringMatching(/^apple-iphone-17-pro-portrait-\d{8}-\d{6}\.png$/),
    });
    await waitFor(() => expect(screen.getByTestId('screenshot-preview')).toBeTruthy());
    expect(screen.getByText(/1206 × 2622 px/)).toBeTruthy();
    expect(onCapture).toHaveBeenCalledWith(
      expect.objectContaining({ target: 'device', uri: 'file:///tmp/shot.png', width: 1206, height: 2622 }),
    );
  });

  it('captures the screen only from screenViewRef, with a custom pixel ratio', async () => {
    const backend = fakeBackend();
    await render(<ScreenshotPanel context={makeContext()} backend={backend} options={{ pixelRatio: 1 }} />);
    await fireEvent.press(screen.getByTestId('screenshot-capture-screen'));
    expect(backend.capture).toHaveBeenCalledWith(screenViewRef.current, {
      pixelRatio: 1,
      fileName: expect.stringMatching(/^apple-iphone-17-pro-screen-portrait-/),
    });
  });

  it('saves the capture with the backend', async () => {
    const backend = fakeBackend();
    await render(<ScreenshotPanel context={makeContext()} backend={backend} />);
    await fireEvent.press(screen.getByTestId('screenshot-capture-device'));
    await fireEvent.press(screen.getByTestId('screenshot-save'));
    expect(backend.save).toHaveBeenCalledWith(expect.objectContaining({ uri: 'file:///tmp/shot.png' }));
    expect(screen.getByText('Shared')).toBeTruthy();
  });

  it('shows the install hint and disables capture when the dependency is missing', async () => {
    const backend = fakeBackend({ available: false });
    await render(<ScreenshotPanel context={makeContext()} backend={backend} />);
    expect(screen.getByText('install something')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('screenshot-capture-device'));
    expect(backend.capture).not.toHaveBeenCalled();
  });

  it('reports capture errors', async () => {
    const backend = fakeBackend({ capture: jest.fn(async () => Promise.reject(new Error('boom'))) });
    await render(<ScreenshotPanel context={makeContext()} backend={backend} />);
    await fireEvent.press(screen.getByTestId('screenshot-capture-device'));
    expect(screen.getByText('Capture failed: boom')).toBeTruthy();
  });

  it('reports an unmounted device', async () => {
    (deviceViewRef as { current: ViewHandle | null }).current = null;
    const backend = fakeBackend();
    await render(<ScreenshotPanel context={makeContext()} backend={backend} />);
    await fireEvent.press(screen.getByTestId('screenshot-capture-device'));
    expect(backend.capture).not.toHaveBeenCalled();
    expect(screen.getByText(/not mounted/)).toBeTruthy();
  });
});
