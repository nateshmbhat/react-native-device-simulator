import type * as React from 'react';
import type { DeviceSimulatorController } from '../core/store';
import type { DeviceSimulatorSettings, ResolvedSimulation } from '../types';

export interface DeviceSimulatorPluginContext {
  controller: DeviceSimulatorController;
  settings: DeviceSimulatorSettings;
  simulation: ResolvedSimulation;
  /** Colours of the toolbar, so plugins blend in. */
  theme: { background: string; surface: string; text: string; textMuted: string; accent: string; border: string };
}

/** An extra tab in the toolbar. */
export interface DeviceSimulatorPlugin {
  /** Unique id, also the tab id. */
  id: string;
  /** Tab label. */
  title: string;
  /** Short glyph or emoji shown in the tab bar. */
  icon?: string;
  /** Renders the panel content. */
  render(context: DeviceSimulatorPluginContext): React.ReactNode;
}
