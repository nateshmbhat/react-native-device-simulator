import type * as React from 'react';
import type { DevicePreviewController } from '../core/store';
import type { DevicePreviewSettings, ResolvedSimulation } from '../types';

export interface DevicePreviewPluginContext {
  controller: DevicePreviewController;
  settings: DevicePreviewSettings;
  simulation: ResolvedSimulation;
  /** Colours of the toolbar, so plugins blend in. */
  theme: { background: string; surface: string; text: string; textMuted: string; accent: string; border: string };
}

/** An extra tab in the toolbar. */
export interface DevicePreviewPlugin {
  /** Unique id, also the tab id. */
  id: string;
  /** Tab label. */
  title: string;
  /** Short glyph or emoji shown in the tab bar. */
  icon?: string;
  /** Renders the panel content. */
  render(context: DevicePreviewPluginContext): React.ReactNode;
}
