import * as React from 'react';
import { usePreviewScreen, type PreviewScreenContextValue } from '../previewScreenContext';

/**
 * Font scaling and bold text for `Text` / `TextInput` inside the simulated
 * screen. The Metro helper (`react-native-device-simulator/metro`) points
 * React Native's (and react-native-web's) `Text` and `TextInput` modules at
 * wrappers built here. Outside an active preview the wrappers render the
 * original component with the original props.
 */

/** React Native's default font size, used when a root text sets none. */
export const DEFAULT_FONT_SIZE = 14;

type Style = Record<string, unknown>;
type FlattenStyle = (style: unknown) => Style | null | undefined;

export interface TextScalingProps {
  style?: unknown;
  allowFontScaling?: boolean | null;
  maxFontSizeMultiplier?: number | null;
}

export interface TextScaling {
  /** Simulated font scale (what the app should look like). */
  fontScale: number;
  /** Font scale the platform already applies by itself (1 on web). */
  hostFontScale: number;
  boldText: boolean;
}

/** The scaling to apply inside `preview`, or null when there is nothing to do. */
export function textScalingFor(preview: PreviewScreenContextValue | null): TextScaling | null {
  if (!preview) return null;
  const multiplier = preview.fontScaleMultiplier;
  const scaled = Number.isFinite(multiplier) && multiplier > 0 && multiplier !== 1;
  if (!scaled && !preview.boldText) return null;
  const fontScale = scaled ? (preview.simulation.fontScale ?? multiplier) : 1;
  return {
    fontScale: scaled ? fontScale : 1,
    hostFontScale: scaled ? fontScale / multiplier : 1,
    boldText: preview.boldText,
  };
}

/** `maxFontSizeMultiplier` semantics: values >= 1 cap the scale, others don't. */
function capped(scale: number, max: number | null | undefined): number {
  return typeof max === 'number' && max >= 1 ? Math.min(scale, max) : scale;
}

const WEIGHTS: Record<string, number> = { normal: 400, bold: 700, ultralight: 100, thin: 100, light: 300, medium: 500, regular: 400, semibold: 600, condensedBold: 700, condensed: 400, heavy: 800, black: 900 };

function numericWeight(weight: unknown): number | null {
  if (typeof weight === 'number') return weight;
  if (typeof weight !== 'string') return null;
  const n = Number(weight);
  if (Number.isFinite(n)) return n;
  return WEIGHTS[weight] ?? null;
}

function scaleLength(value: unknown, factor: number): unknown {
  return typeof value === 'number' ? value * factor : value;
}

/**
 * The style overrides that make `props` look like it would on the simulated
 * device, or null when the props can be used unchanged.
 *
 * `nested` is true for a `Text` inside another `Text`: it inherits font size
 * and weight from its parent (already adjusted), so only values it sets
 * itself are scaled.
 */
export function scaledTextStyle(
  props: TextScalingProps,
  scaling: TextScaling | null,
  nested: boolean,
  flatten: FlattenStyle,
): Style | null {
  if (!scaling) return null;
  const scaleText = props.allowFontScaling !== false && scaling.fontScale !== scaling.hostFontScale;
  if (!scaleText && !scaling.boldText) return null;
  const style = flatten(props.style) ?? {};
  const overrides: Style = {};

  if (scaleText) {
    const max = props.maxFontSizeMultiplier;
    // The platform multiplies by the (capped) host scale itself.
    const factor = capped(scaling.fontScale, max) / capped(scaling.hostFontScale, max);
    if (factor !== 1) {
      const fontSize = style.fontSize ?? (nested ? undefined : DEFAULT_FONT_SIZE);
      if (typeof fontSize === 'number') overrides.fontSize = fontSize * factor;
      if (typeof style.lineHeight === 'number') overrides.lineHeight = scaleLength(style.lineHeight, factor);
      if (typeof style.letterSpacing === 'number') overrides.letterSpacing = scaleLength(style.letterSpacing, factor);
    }
  }

  if (scaling.boldText) {
    const weight = style.fontWeight;
    if (weight == null ? !nested : (numericWeight(weight) ?? 400) < 600) overrides.fontWeight = 'bold';
  }

  return Object.keys(overrides).length ? overrides : null;
}

const SKIPPED_STATICS = new Set([
  // Function / class internals.
  'length',
  'name',
  'prototype',
  'caller',
  'arguments',
  // React internals of the wrapped component.
  '$$typeof',
  'render',
  'compare',
  'type',
  'displayName',
  'defaultProps',
  'propTypes',
  'contextType',
  'contextTypes',
  'getDerivedStateFromProps',
  'getDerivedStateFromError',
]);

/** Copies `TextInput.State` & co. so the wrapper is a drop-in replacement. */
export function hoistStatics(target: object, source: object): void {
  for (const key of Object.getOwnPropertyNames(source)) {
    if (SKIPPED_STATICS.has(key) || Object.prototype.hasOwnProperty.call(target, key)) continue;
    const descriptor = Object.getOwnPropertyDescriptor(source, key);
    if (descriptor) {
      try {
        Object.defineProperty(target, key, descriptor);
      } catch {
        // Ignore non-configurable properties.
      }
    }
  }
}

export interface ScaledTextOptions {
  /** True when the component is a root text by definition (TextInput). */
  isInput?: boolean;
  /** The platform's `TextAncestorContext` (true inside a `Text`). */
  textAncestorContext?: React.Context<boolean>;
  flattenStyle: FlattenStyle;
  displayName: string;
}

const NO_ANCESTOR = React.createContext(false);

/**
 * Wraps `Original` so it honours the simulated font scale and bold text. The
 * wrapper passes every prop (including `ref`, a regular prop in React 19)
 * through, so refs, statics and `displayName` behave like the original.
 */
export function createScaledText<C extends React.ComponentType<never>>(Original: C, options: ScaledTextOptions): C {
  const AncestorContext = options.textAncestorContext ?? NO_ANCESTOR;
  const OriginalComponent = Original as unknown as React.ComponentType<Record<string, unknown>>;

  // forwardRef (not ref-as-prop) so refs also work on React 18.
  const ScaledText = React.forwardRef<unknown, Record<string, unknown>>(function ScaledText(props, ref) {
    const preview = usePreviewScreen();
    const hasTextAncestor = React.useContext(AncestorContext);
    const overrides = scaledTextStyle(
      props as TextScalingProps,
      textScalingFor(preview),
      !options.isInput && hasTextAncestor,
      options.flattenStyle,
    );
    if (!overrides) return <OriginalComponent {...props} ref={ref} />;
    return <OriginalComponent {...props} ref={ref} style={[props.style as never, overrides]} />;
  });

  hoistStatics(ScaledText, Original);
  ScaledText.displayName = (Original as { displayName?: string }).displayName ?? options.displayName;
  return ScaledText as unknown as C;
}
