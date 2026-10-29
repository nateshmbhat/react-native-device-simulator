import type { ViewHandle } from '../../core/refs';

afterEach(() => {
  jest.resetModules();
});

describe('native capture backend (react-native-view-shot)', () => {
  it('is unavailable when react-native-view-shot cannot be loaded', () => {
    jest.doMock(
      'react-native-view-shot',
      () => {
        throw new Error('Cannot find module');
      },
      { virtual: true },
    );
    const { getCaptureBackend } = require('../capture') as typeof import('../capture');
    const backend = getCaptureBackend();
    expect(backend.available).toBe(false);
    expect(backend.installHint).toMatch(/react-native-view-shot/);
  });

  it('captures a PNG temp file named after the screenshot', async () => {
    const captureRef = jest.fn(async () => '/tmp/ReactNative/abc.png');
    jest.doMock('react-native-view-shot', () => ({ captureRef }), { virtual: true });
    const { getCaptureBackend } = require('../capture') as typeof import('../capture');
    const backend = getCaptureBackend();
    const view = {} as ViewHandle;

    expect(backend.available).toBe(true);
    const capture = await backend.capture(view, { pixelRatio: 3, fileName: 'device-portrait-1.png' });

    expect(captureRef).toHaveBeenCalledWith(view, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
      fileName: 'device-portrait-1',
    });
    expect(capture).toEqual({ uri: 'file:///tmp/ReactNative/abc.png', fileName: 'device-portrait-1.png' });
  });

  it('shares with expo-sharing when available', async () => {
    jest.doMock('react-native-view-shot', () => ({ captureRef: jest.fn() }), { virtual: true });
    const shareAsync = jest.fn(async () => undefined);
    jest.doMock('expo-sharing', () => ({ isAvailableAsync: async () => true, shareAsync }), { virtual: true });
    const { getCaptureBackend } = require('../capture') as typeof import('../capture');

    const result = await getCaptureBackend().save({ uri: 'file:///a.png', fileName: 'a.png' });

    expect(result).toBe('shared');
    expect(shareAsync).toHaveBeenCalledWith('file:///a.png', expect.objectContaining({ mimeType: 'image/png' }));
  });
});

const missing = () => {
  throw new Error('Cannot find module');
};

describe('web capture backend', () => {
  const element = { offsetWidth: 430, offsetHeight: 900 } as unknown as ViewHandle;
  const rootStyle = expect.objectContaining({ transform: 'none', position: 'static' });

  it('prefers modern-screenshot, at the layout size and without the fit-to-window transform', async () => {
    const domToPng = jest.fn(async () => 'data:image/png;base64,AAAA');
    jest.doMock('modern-screenshot', () => ({ domToPng }), { virtual: true });
    jest.doMock('html-to-image', missing, { virtual: true });
    const { getCaptureBackend } = require('../capture.web') as typeof import('../capture.web');
    const backend = getCaptureBackend();

    expect(backend.available).toBe(true);
    expect(backend.saveLabel).toBe('Download PNG');
    const capture = await backend.capture(element, { pixelRatio: 2, fileName: 'x.png' });

    expect(domToPng).toHaveBeenCalledWith(
      element,
      expect.objectContaining({
        width: 430,
        height: 900,
        scale: 2,
        style: rootStyle,
        features: expect.objectContaining({ restoreScrollPosition: true }),
      }),
    );
    expect(capture).toEqual({ uri: 'data:image/png;base64,AAAA', fileName: 'x.png' });
  });

  it('falls back to html-to-image', async () => {
    const toPng = jest.fn(async () => 'data:image/png;base64,BBBB');
    jest.doMock('modern-screenshot', missing, { virtual: true });
    jest.doMock('html-to-image', () => ({ toPng }), { virtual: true });
    const { getCaptureBackend } = require('../capture.web') as typeof import('../capture.web');

    const capture = await getCaptureBackend().capture(element, { pixelRatio: 3, fileName: 'y.png' });

    expect(toPng).toHaveBeenCalledWith(
      element,
      expect.objectContaining({ width: 430, height: 900, pixelRatio: 3, style: rootStyle }),
    );
    expect(capture.uri).toBe('data:image/png;base64,BBBB');
  });

  it('is unavailable without either library', () => {
    jest.doMock('modern-screenshot', missing, { virtual: true });
    jest.doMock('html-to-image', missing, { virtual: true });
    const { getCaptureBackend } = require('../capture.web') as typeof import('../capture.web');
    const backend = getCaptureBackend();
    expect(backend.available).toBe(false);
    expect(backend.installHint).toMatch(/modern-screenshot/);
  });
});
