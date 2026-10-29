import * as React from 'react';
import { Platform, type TextStyle } from 'react-native';
import type { ColorSchemeName } from '../../types';

/** Colours of the preview chrome (toolbar, floating buttons, background). */
export interface ToolbarPalette {
  scheme: ColorSchemeName;
  /** Panel background. */
  background: string;
  /** Cards, inputs, segmented tracks. */
  surface: string;
  /** Hover state of surfaces. */
  surfaceHover: string;
  /** Pressed state of surfaces. */
  surfacePressed: string;
  /** Selected segment / raised element. */
  raised: string;
  border: string;
  divider: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  danger: string;
  dangerSoft: string;
  switchOff: string;
  shadow: string;
  /** Stage background behind the device. */
  stage: string;
  /** Dots / gradient colours of the stage background. */
  stageDot: string;
  stageGradient: [string, string];
}

const dark: ToolbarPalette = {
  scheme: 'dark',
  background: '#1b1b22',
  surface: '#25252e',
  surfaceHover: '#2d2d37',
  surfacePressed: '#34343f',
  raised: '#3a3a46',
  border: '#33333d',
  divider: '#2a2a33',
  text: '#ececf1',
  textMuted: '#a0a0ad',
  textFaint: '#6c6c79',
  accent: '#7c7cf8',
  accentText: '#ffffff',
  accentSoft: 'rgba(124,124,248,0.16)',
  danger: '#f2706b',
  dangerSoft: 'rgba(242,112,107,0.12)',
  switchOff: '#45454f',
  shadow: '#000000',
  stage: '#121217',
  stageDot: 'rgba(255,255,255,0.09)',
  stageGradient: ['#20202b', '#0d0d12'],
};

const light: ToolbarPalette = {
  scheme: 'light',
  background: '#ffffff',
  surface: '#f2f3f6',
  surfaceHover: '#e9eaef',
  surfacePressed: '#e0e1e8',
  raised: '#ffffff',
  border: '#e2e3e9',
  divider: '#eceef2',
  text: '#1c1c22',
  textMuted: '#62626e',
  textFaint: '#9a9aa6',
  accent: '#5b5bd6',
  accentText: '#ffffff',
  accentSoft: 'rgba(91,91,214,0.11)',
  danger: '#d6403a',
  dangerSoft: 'rgba(214,64,58,0.08)',
  switchOff: '#d3d4dc',
  shadow: '#1c1c3a',
  stage: '#e9ebf0',
  stageDot: 'rgba(30,30,60,0.13)',
  stageGradient: ['#f5f6fa', '#dcdfe8'],
};

export const palettes: Record<ColorSchemeName, ToolbarPalette> = { dark, light };

export const space = { xs: 4, sm: 6, md: 10, lg: 14, xl: 18 } as const;
export const radius = { sm: 6, md: 8, lg: 12, pill: 999 } as const;

const fontFamily = Platform.select<string | undefined>({
  web: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  default: undefined,
});

export const type = {
  title: { fontFamily, fontSize: 13, fontWeight: '600', letterSpacing: -0.1 },
  body: { fontFamily, fontSize: 13, fontWeight: '400' },
  label: { fontFamily, fontSize: 12, fontWeight: '500' },
  small: { fontFamily, fontSize: 11, fontWeight: '400' },
  caption: { fontFamily, fontSize: 10, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, SFMono-Regular, Menlo, monospace' }),
    fontSize: 11,
  },
} satisfies Record<string, TextStyle>;

export const ToolbarThemeContext = React.createContext<ToolbarPalette>(dark);

export function useToolbarTheme(): ToolbarPalette {
  return React.useContext(ToolbarThemeContext);
}

/** The colours handed to plugins (see `DeviceSimulatorPluginContext.theme`). */
export function pluginTheme(p: ToolbarPalette) {
  return {
    background: p.background,
    surface: p.surface,
    text: p.text,
    textMuted: p.textMuted,
    accent: p.accent,
    border: p.border,
  };
}
