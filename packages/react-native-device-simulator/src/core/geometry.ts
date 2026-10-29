import type { DevicePreset, EdgeInsets, Orientation, Size } from '../types';

export const ZERO_INSETS: EdgeInsets = Object.freeze({ top: 0, right: 0, bottom: 0, left: 0 });

export function insetsEqual(a: EdgeInsets, b: EdgeInsets): boolean {
  return a.top === b.top && a.right === b.right && a.bottom === b.bottom && a.left === b.left;
}

export function sizeEqual(a: Size, b: Size): boolean {
  return a.width === b.width && a.height === b.height;
}

/** Swaps width and height. */
export function flipSize(size: Size): Size {
  return { width: size.height, height: size.width };
}

/**
 * The default landscape safe area, used when a preset has no explicit
 * `landscapePadding`: the portrait top cutout moves to both sides (the user may
 * rotate either way), the top becomes free and the bottom is kept.
 */
export function rotatePadding(portrait: EdgeInsets): EdgeInsets {
  return { top: 0, left: portrait.top, right: portrait.top, bottom: portrait.bottom };
}

export function screenSizeFor(preset: Pick<DevicePreset, 'portraitSize'>, orientation: Orientation): Size {
  return orientation === 'portrait' ? { ...preset.portraitSize } : flipSize(preset.portraitSize);
}

export function paddingFor(
  preset: Pick<DevicePreset, 'portraitPadding' | 'landscapePadding'>,
  orientation: Orientation,
): EdgeInsets {
  if (orientation === 'portrait') return { ...preset.portraitPadding };
  return preset.landscapePadding ? { ...preset.landscapePadding } : rotatePadding(preset.portraitPadding);
}

export function keyboardHeightFor(
  preset: Pick<DevicePreset, 'portraitKeyboardHeight' | 'landscapeKeyboardHeight'>,
  orientation: Orientation,
): number | undefined {
  return orientation === 'portrait' ? preset.portraitKeyboardHeight : preset.landscapeKeyboardHeight;
}

/**
 * The scale that fits `content` inside `available` minus `padding` on every
 * side. Never larger than `maxScale` (1 by default: a device is never drawn
 * bigger than its real logical size unless asked).
 */
export function fitScale(content: Size, available: Size, padding = 0, maxScale = 1): number {
  const w = available.width - padding * 2;
  const h = available.height - padding * 2;
  if (content.width <= 0 || content.height <= 0 || w <= 0 || h <= 0) return 0;
  return Math.min(maxScale, w / content.width, h / content.height);
}

/**
 * Portrait frame geometry rotated a quarter turn counter-clockwise (the top of
 * the device goes left), as when a phone is turned to landscape.
 *
 * Returns where the (landscape) screen sits inside the (landscape) body.
 */
export function rotatedScreenOffset(body: Size, screenOffset: { x: number; y: number }, portraitScreen: Size) {
  return {
    x: screenOffset.y,
    y: body.width - screenOffset.x - portraitScreen.width,
  };
}
