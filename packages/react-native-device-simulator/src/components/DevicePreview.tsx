import * as React from 'react';
import { Platform, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useDevicePreviewSettings, useDevicePreviewSimulation } from '../context';
import { fitScale } from '../core/geometry';
import { devicePreview, type SettingsPatch } from '../core/store';
import { deviceViewRef } from '../core/refs';
import { applyEnvironment } from '../environment';
import { useRealColorScheme } from './useRealColorScheme';
import { useRealFontScale } from './useRealFontScale';
import { defaultStorage } from '../storage';
import type { DevicePreset, DevicePreviewStorage, Size } from '../types';
import { DeviceFrame, getDeviceOuterSize } from './frame/DeviceFrame';
import { SimulatedScreen } from './SimulatedScreen';
import { Toolbar } from './toolbar/Toolbar';
import { useRealWindowSize } from './toolbar/host';
import { resolveToolbarPlacement, rootDirection } from './toolbar/logic';
import { palettes } from './toolbar/theme';
import { PreviewBackground } from './PreviewBackground';
import type { DevicePreviewPlugin } from '../plugins/types';

export interface DevicePreviewProps {
  /** The app. */
  children: React.ReactNode;
  /**
   * When false, renders `children` untouched and installs nothing. Defaults to
   * `__DEV__`, so release builds are never affected.
   */
  enabled?: boolean;
  /** Devices offered by the picker. Defaults to every built-in preset. */
  devices?: readonly DevicePreset[];
  /** Initial settings, used until the user changes something. */
  defaultSettings?: SettingsPatch;
  /**
   * Where settings are persisted. Defaults to `localStorage` on web and to
   * memory elsewhere; pass AsyncStorage to persist on native. `null` disables.
   */
  storage?: DevicePreviewStorage | null;
  /** Extra tool panels shown in the toolbar. */
  plugins?: readonly DevicePreviewPlugin[];
  /** Space kept around the device, in logical pixels. */
  padding?: number;
  /** Allows drawing the device larger than its real logical size. */
  maxScale?: number;
}

/**
 * Wrap your app to preview it on other devices.
 *
 * ```tsx
 * export default function RootLayout() {
 *   return (
 *     <DevicePreview>
 *       <Stack />
 *     </DevicePreview>
 *   );
 * }
 * ```
 */
export function DevicePreview({ enabled = __DEV__, children, ...props }: DevicePreviewProps) {
  useWarnWhenEnabledChanges(enabled);
  if (!enabled) return <>{children}</>;
  return <DevicePreviewHost {...props}>{children}</DevicePreviewHost>;
}

function DevicePreviewHost({
  children,
  devices,
  defaultSettings,
  storage = defaultStorage(),
  plugins = [],
  padding = 24,
  maxScale = 1,
}: Omit<DevicePreviewProps, 'enabled'>) {
  // Configure synchronously so the first render already uses the right devices.
  React.useState(() => devicePreview.configure({ presets: devices, defaults: defaultSettings }));
  // Storage is read once, on mount (an inline object must not reload settings on every render).
  const [initialStorage] = React.useState(() => storage);
  React.useEffect(() => devicePreview.attachStorage(initialStorage), [initialStorage]);
  React.useLayoutEffect(() => devicePreview.registerHost(), []);

  const settings = useDevicePreviewSettings();
  const simulation = useDevicePreviewSimulation();
  const active = settings.isEnabled;

  // Apply during render (silently) so the app's first render already sees the
  // simulated device, then notify subscribers before paint.
  applyEnvironment(active ? simulation : null, { silent: true });
  // Re-rendered when the host's own text size changes, so the simulated
  // fontScale ("System" setting) and the Text multiplier stay correct.
  const realFontScale = useRealFontScale();
  React.useLayoutEffect(() => {
    applyEnvironment(active ? simulation : null);
  });
  // Restore the real environment when the last preview goes away. Runs after
  // the registerHost cleanup above (cleanups run in declaration order).
  React.useLayoutEffect(
    () => () => {
      if (!devicePreview.hasHost()) applyEnvironment(null);
    },
    [],
  );

  const [stage, setStage] = React.useState<Size | null>(null);
  const onStageLayout = React.useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setStage((s) => (s && s.width === width && s.height === height ? s : { width, height }));
  }, []);

  const { preset, orientation, screenSize, insets } = simulation;
  const showFrame = active && settings.isFrameVisible;
  const effectiveScreen = active ? screenSize : stage ?? screenSize;
  const outer = getDeviceOuterSize(preset, orientation, effectiveScreen, showFrame);
  const scale = active && stage ? fitScale(outer, stage, padding, maxScale) : 1;

  const realScheme = useRealColorScheme();
  const effectiveScheme = simulation.colorScheme ?? realScheme;
  const systemUiColor = resolveSystemUiColor(settings.statusBarStyle, effectiveScheme);

  const deviceStyle = active
    ? {
        position: 'absolute' as const,
        width: outer.width,
        height: outer.height,
        left: ((stage?.width ?? outer.width) - outer.width) / 2,
        top: ((stage?.height ?? outer.height) - outer.height) / 2,
        transform: [{ scale }],
        opacity: stage ? 1 : 0,
      }
    : styles.fill;

  // Toolbar placement follows the REAL space the preview occupies (never the
  // simulated window). Only the root's flex direction changes, so the stage
  // keeps its position in the tree and the app is never remounted.
  const realWindow = useRealWindowSize();
  const [rootLayout, setRootLayout] = React.useState<Size | null>(null);
  const onRootLayout = React.useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setRootLayout((s) => (s && s.width === width && s.height === height ? s : { width, height }));
  }, []);
  const host = rootLayout ?? realWindow;
  const placement = resolveToolbarPlacement(settings.toolbar.position, host.width);
  const docked = active && settings.toolbar.visible;

  return (
    <View
      style={[
        styles.root,
        { flexDirection: docked ? rootDirection(placement) : 'row' },
        active && { backgroundColor: (palettes[settings.theme] ?? palettes.dark).stage },
      ]}
      onLayout={onRootLayout}
    >
      {active ? <PreviewBackground key="background" variant={settings.background} theme={settings.theme} /> : null}
      <View key="stage" style={styles.stage} onLayout={onStageLayout}>
        <View ref={deviceViewRef} collapsable={false} style={deviceStyle}>
          <DeviceFrame
            preset={preset}
            orientation={orientation}
            screenSize={effectiveScreen}
            insets={active ? insets : { top: 0, right: 0, bottom: 0, left: 0 }}
            showFrame={showFrame}
            showSystemUi={active && settings.showSystemUi}
            keyboardHeight={active ? simulation.keyboardHeight : 0}
            systemUiColor={systemUiColor}
            colorScheme={effectiveScheme}
          >
            <SimulatedScreen active={active} simulation={simulation} realFontScale={realFontScale}>
              {children}
            </SimulatedScreen>
          </DeviceFrame>
        </View>
      </View>
      <Toolbar key="toolbar" active={active} placement={placement} plugins={plugins} hostSize={host} />
    </View>
  );
}

function resolveSystemUiColor(style: string, colorScheme: 'light' | 'dark' | null): string {
  if (style === 'light-content') return '#ffffff';
  if (style === 'dark-content') return '#000000';
  return colorScheme === 'dark' ? '#ffffff' : '#000000';
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? ({ height: '100%' } as object) : null),
  },
  stage: { flex: 1, overflow: 'hidden' },
  fill: { flex: 1 },
});

/** `enabled` is read on mount: switching it later would remount the app. */
function useWarnWhenEnabledChanges(enabled: boolean) {
  const initial = React.useRef(enabled);
  const warned = React.useRef(false);
  React.useEffect(() => {
    if (__DEV__ && enabled !== initial.current && !warned.current) {
      warned.current = true;
      console.warn(
        '[device-simulator] The `enabled` prop of <DevicePreview> changed after mount, which remounts your app. ' +
          'Use devicePreview.setEnabled() (or the toolbar) to turn the simulation on and off at runtime.',
      );
    }
  }, [enabled]);
}
