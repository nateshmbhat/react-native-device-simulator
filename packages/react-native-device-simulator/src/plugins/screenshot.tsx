import * as React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { deviceViewRef, screenViewRef } from '../core/refs';
import type { Orientation } from '../types';
import { getCaptureBackend, type Capture, type CaptureBackend } from './capture';
import type { DeviceSimulatorPlugin, DeviceSimulatorPluginContext } from './types';
import { Notice, PanelButton, PanelSection, panelStyles } from './ui';

/** What gets captured: the whole device with its frame, or the app only. */
export type ScreenshotTarget = 'device' | 'screen';

export interface Screenshot extends Capture {
  target: ScreenshotTarget;
  /** Image size in pixels, when known. */
  width?: number;
  height?: number;
}

export interface ScreenshotPluginOptions {
  /**
   * Output pixels per logical pixel. Defaults to the simulated device's pixel
   * ratio, so a screen capture has the real device's resolution.
   */
  pixelRatio?: number;
  /** Custom file names. Defaults to `<device-id>-<orientation>-<timestamp>.png`. */
  fileName?: (info: { deviceId: string; orientation: Orientation; target: ScreenshotTarget; date: Date }) => string;
  /** Called after every capture, e.g. to upload it. */
  onCapture?: (screenshot: Screenshot) => void;
  /** Tab label. Defaults to "Screenshot". */
  title?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** `apple-iphone-17-pro-portrait-20261029-153012.png` (local time). */
export function screenshotFileName(deviceId: string, orientation: Orientation, date: Date = new Date()): string {
  const stamp =
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  const safeId = deviceId.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
  return `${safeId}-${orientation}-${stamp}.png`;
}

/**
 * A toolbar tab that captures the device (with its frame) or the screen only,
 * previews the result and saves it (download on web, share sheet on native).
 *
 * Needs `react-native-view-shot` on native and `html-to-image` on web, both
 * optional: without them the tab explains what to install.
 *
 * ```tsx
 * <DeviceSimulator plugins={[screenshotPlugin()]}>
 * ```
 */
export function screenshotPlugin(options: ScreenshotPluginOptions = {}): DeviceSimulatorPlugin {
  return {
    id: 'screenshot',
    title: options.title ?? 'Screenshot',
    icon: '📸',
    render: (context) => <ScreenshotPanel context={context} options={options} />,
  };
}

type Status = { kind: 'idle' } | { kind: 'busy'; target: ScreenshotTarget } | { kind: 'error'; message: string };

export function ScreenshotPanel({
  context,
  options = {},
  backend: backendProp,
}: {
  context: DeviceSimulatorPluginContext;
  options?: ScreenshotPluginOptions;
  /** Injectable for tests. */
  backend?: CaptureBackend;
}) {
  const { theme, simulation } = context;
  const [backend] = React.useState(() => backendProp ?? getCaptureBackend());
  const [status, setStatus] = React.useState<Status>({ kind: 'idle' });
  const [shot, setShot] = React.useState<Screenshot | null>(null);
  const [saved, setSaved] = React.useState<string | null>(null);
  const available = backend.available;

  const capture = async (target: ScreenshotTarget) => {
    const view = (target === 'device' ? deviceViewRef : screenViewRef).current;
    if (!view) {
      setStatus({ kind: 'error', message: 'Nothing to capture: the device is not mounted.' });
      return;
    }
    const date = new Date();
    const { id } = simulation.preset;
    const fileName =
      options.fileName?.({ deviceId: id, orientation: simulation.orientation, target, date }) ??
      screenshotFileName(target === 'device' ? id : `${id}-screen`, simulation.orientation, date);
    setStatus({ kind: 'busy', target });
    setSaved(null);
    try {
      const result = await backend.capture(view, {
        pixelRatio: options.pixelRatio ?? simulation.pixelRatio,
        fileName,
      });
      const size = await imageSize(result.uri);
      const next: Screenshot = { ...result, target, ...size };
      setShot(next);
      setStatus({ kind: 'idle' });
      options.onCapture?.(next);
    } catch (error) {
      setStatus({ kind: 'error', message: `Capture failed: ${errorMessage(error)}` });
    }
  };

  const save = async () => {
    if (!shot) return;
    try {
      const result = await backend.save(shot);
      if (result !== 'dismissed') setSaved(result === 'downloaded' ? 'Downloaded' : 'Shared');
    } catch (error) {
      setStatus({ kind: 'error', message: `Save failed: ${errorMessage(error)}` });
    }
  };

  const busy = status.kind === 'busy';
  const aspectRatio = shot?.width && shot.height ? shot.width / shot.height : undefined;

  return (
    <View>
      <PanelSection title="Capture" theme={theme}>
        {available ? null : (
          <Notice theme={theme}>
            <Text style={panelStyles.code}>{backend.installHint}</Text>
          </Notice>
        )}
        <PanelButton
          testID="screenshot-capture-device"
          label={busy && status.target === 'device' ? 'Capturing…' : 'Capture device'}
          variant="primary"
          disabled={!available || busy}
          onPress={() => void capture('device')}
          theme={theme}
        />
        <PanelButton
          testID="screenshot-capture-screen"
          label={busy && status.target === 'screen' ? 'Capturing…' : 'Capture screen only'}
          disabled={!available || busy}
          onPress={() => void capture('screen')}
          theme={theme}
        />
        {status.kind === 'error' ? (
          <Notice theme={theme} tone="error">
            {status.message}
          </Notice>
        ) : null}
      </PanelSection>

      {shot ? (
        <PanelSection title="Preview" theme={theme}>
          <View style={[styles.thumbFrame, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <Image
              testID="screenshot-preview"
              accessibilityLabel={`Screenshot ${shot.fileName}`}
              source={{ uri: shot.uri }}
              resizeMode="contain"
              style={[styles.thumb, aspectRatio ? { aspectRatio } : styles.thumbFallback]}
            />
          </View>
          <Text style={[styles.meta, { color: theme.textMuted }]} numberOfLines={3} selectable>
            {shot.fileName}
            {shot.width && shot.height ? `\n${shot.width} × ${shot.height} px` : ''}
          </Text>
          <View style={panelStyles.buttonRow}>
            <PanelButton
              testID="screenshot-save"
              label={saved ?? backend.saveLabel}
              variant="primary"
              onPress={() => void save()}
              theme={theme}
              style={panelStyles.grow}
            />
            <PanelButton
              testID="screenshot-discard"
              label="Discard"
              onPress={() => {
                setShot(null);
                setSaved(null);
              }}
              theme={theme}
            />
          </View>
        </PanelSection>
      ) : null}
    </View>
  );
}

function imageSize(uri: string): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    // The size is informative only: never block the preview on it.
    const timer = setTimeout(() => resolve({}), 3000);
    const done = (size: { width?: number; height?: number }) => {
      clearTimeout(timer);
      resolve(size);
    };
    try {
      Image.getSize(
        uri,
        (width, height) => done({ width, height }),
        () => done({}),
      );
    } catch {
      done({});
    }
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const styles = StyleSheet.create({
  thumbFrame: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  thumb: { width: '100%', maxHeight: 260 },
  thumbFallback: { height: 200 },
  meta: { fontSize: 11, lineHeight: 16 },
});
