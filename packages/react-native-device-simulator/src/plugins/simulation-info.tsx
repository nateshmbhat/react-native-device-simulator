import * as React from 'react';
import { View } from 'react-native';
import type { AccessibilityOverrides, EdgeInsets, ResolvedSimulation } from '../types';
import { copyText } from './clipboard';
import type { DeviceSimulatorPlugin, DeviceSimulatorPluginContext } from './types';
import { KeyValueRow, Notice, PanelButton, PanelSection } from './ui';

/** A serializable summary of what the app currently sees (no frame artwork). */
export interface SimulationSummary {
  device: { id: string; name: string; brand?: string; year?: number; platform: string; kind: string };
  orientation: string;
  /** Logical size in the current orientation. */
  screenSize: { width: number; height: number };
  pixelRatio: number;
  /** Size in physical pixels. */
  physicalSize: { width: number; height: number };
  insets: EdgeInsets;
  keyboardHeight: number;
  colorScheme: string | null;
  fontScale: number | null;
  locale: string | null;
  isRTL: boolean;
  use24HourClock: boolean | null;
  /** Only the overridden settings; absent ones follow the real device. */
  accessibility: Partial<AccessibilityOverrides>;
}

export function summarizeSimulation(simulation: ResolvedSimulation): SimulationSummary {
  const { preset, screenSize, pixelRatio } = simulation;
  const accessibility: Partial<AccessibilityOverrides> = {};
  for (const [key, value] of Object.entries(simulation.accessibility) as [keyof AccessibilityOverrides, boolean | null][]) {
    if (value != null) accessibility[key] = value;
  }
  return {
    device: {
      id: preset.id,
      name: preset.name,
      ...(preset.brand ? { brand: preset.brand } : null),
      ...(preset.year ? { year: preset.year } : null),
      platform: preset.platform,
      kind: preset.kind,
    },
    orientation: simulation.orientation,
    screenSize: { width: screenSize.width, height: screenSize.height },
    pixelRatio,
    physicalSize: { width: Math.round(screenSize.width * pixelRatio), height: Math.round(screenSize.height * pixelRatio) },
    insets: { ...simulation.insets },
    keyboardHeight: simulation.keyboardHeight,
    colorScheme: simulation.colorScheme,
    fontScale: simulation.fontScale,
    locale: simulation.locale,
    isRTL: simulation.isRTL,
    use24HourClock: simulation.use24HourClock,
    accessibility,
  };
}

const SYSTEM = 'system';

function insetsText({ top, right, bottom, left }: EdgeInsets): string {
  return `${top} · ${right} · ${bottom} · ${left}`;
}

function onOff(value: boolean | null): string {
  return value == null ? SYSTEM : value ? 'on' : 'off';
}

/** Readable `[label, value]` groups for the panel. */
export function describeSimulation(simulation: ResolvedSimulation): { title: string; rows: [string, string][] }[] {
  const s = summarizeSimulation(simulation);
  const a11y = simulation.accessibility;
  return [
    {
      title: 'Device',
      rows: [
        ['Name', s.device.name],
        ['Id', s.device.id],
        ['Platform', `${s.device.platform} · ${s.device.kind}`],
      ],
    },
    {
      title: 'Display',
      rows: [
        ['Orientation', s.orientation],
        ['Logical size', `${s.screenSize.width} × ${s.screenSize.height} pt`],
        ['Pixel ratio', `@${s.pixelRatio}x`],
        ['Resolution', `${s.physicalSize.width} × ${s.physicalSize.height} px`],
        ['Safe area (t·r·b·l)', insetsText(s.insets)],
        ['Keyboard', s.keyboardHeight > 0 ? `${s.keyboardHeight} pt` : 'hidden'],
      ],
    },
    {
      title: 'Environment',
      rows: [
        ['Color scheme', s.colorScheme ?? SYSTEM],
        ['Text scale', s.fontScale == null ? SYSTEM : `${s.fontScale}×`],
        ['Locale', s.locale ?? SYSTEM],
        ['Direction', s.isRTL ? 'right-to-left' : 'left-to-right'],
        ['Clock', s.use24HourClock == null ? SYSTEM : s.use24HourClock ? '24-hour' : '12-hour'],
      ],
    },
    {
      title: 'Accessibility',
      rows: [
        ['Bold text', onOff(a11y.boldText)],
        ['Reduce motion', onOff(a11y.reduceMotion)],
        ['Reduce transparency', onOff(a11y.reduceTransparency)],
        ['Invert colors', onOff(a11y.invertColors)],
        ['Grayscale', onOff(a11y.grayscale)],
        ['High contrast', onOff(a11y.highContrast)],
        ['Darker colors', onOff(a11y.darkerSystemColors)],
        ['Screen reader', onOff(a11y.screenReader)],
      ],
    },
  ];
}

/**
 * A toolbar tab listing the current simulation (device, display metrics, safe
 * area, environment and accessibility overrides) with a "Copy JSON" button,
 * handy for bug reports.
 */
export function simulationInfoPlugin(options: { title?: string } = {}): DeviceSimulatorPlugin {
  return {
    id: 'simulation-info',
    title: options.title ?? 'Info',
    icon: 'ℹ️',
    render: (context) => <SimulationInfoPanel context={context} />,
  };
}

export function SimulationInfoPanel({ context }: { context: DeviceSimulatorPluginContext }) {
  const { simulation, theme } = context;
  const [feedback, setFeedback] = React.useState<{ text: string; error?: boolean } | null>(null);

  const copy = async () => {
    try {
      const result = await copyText(JSON.stringify(summarizeSimulation(simulation), null, 2));
      setFeedback(result === 'dismissed' ? null : { text: result === 'copied' ? 'Copied to clipboard' : 'Shared' });
    } catch (error) {
      setFeedback({ text: error instanceof Error ? error.message : String(error), error: true });
    }
  };

  return (
    <View>
      {describeSimulation(simulation).map((group) => (
        <PanelSection key={group.title} title={group.title} theme={theme}>
          <View>
            {group.rows.map(([label, value]) => (
              <KeyValueRow key={label} label={label} value={value} theme={theme} />
            ))}
          </View>
        </PanelSection>
      ))}
      <PanelButton testID="simulation-info-copy" label="Copy JSON" variant="primary" onPress={() => void copy()} theme={theme} />
      {feedback ? (
        <View style={{ marginTop: 8 }}>
          <Notice theme={theme} tone={feedback.error ? 'error' : 'info'}>
            {feedback.text}
          </Notice>
        </View>
      ) : null}
    </View>
  );
}
