/**
 * Frame geometry: which frame artwork a preset uses (its own, or a generic one
 * when it has none) and where the screen sits in the current orientation.
 * Pure functions, shared by `DeviceFrame` and `getDeviceOuterSize`.
 */
import { flipSize, rotatedScreenOffset } from '../../core/geometry';
import { iPadAir11M4, iPhone17, pixel10 } from '../../presets/generated';
import type { DeviceFrameSpec, DevicePreset, DisplayFeature, Orientation, Size, SystemUiSpec } from '../../types';
import { estimateBodyCornerRadius, rotateRadii, roundedRectPath, screenClipRadii, type CornerRadii } from './svg';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FrameLayout {
  /** Natural size of everything DeviceFrame draws, current orientation. */
  outer: Size;
  /** The screen inside `outer`, current orientation. */
  screen: Rect;
  /** Frame artwork (in its own portrait coordinates), or null when the frame is hidden. */
  frame: DeviceFrameSpec | null;
  /**
   * How the artwork is turned: the device orientation, except for desktop
   * windows, which are never rotated.
   */
  frameOrientation: Orientation;
  /** Screen size in the artwork's own coordinates. */
  frameScreen: Size;
  /** Screen size in portrait (display features are given in portrait). */
  portraitScreen: Size;
  /** Outer corner radius of the body, for the drop shadow. */
  bodyRadius: number;
  /**
   * Rounded corners clipping the app view, current orientation: inside the
   * body, outside the visible screen shape (the mask covers the difference).
   */
  screenRadii: CornerRadii;
  /** `screenRadii` in the artwork's own coordinates. */
  frameScreenRadii: CornerRadii;
}

const NO_RADII: CornerRadii = Object.freeze({ topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 });

const round = (value: number) => Math.round(value * 1000) / 1000;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function portraitSizeOf(screenSize: Size, orientation: Orientation): Size {
  return orientation === 'portrait' ? screenSize : flipSize(screenSize);
}

/**
 * The frame artwork for a preset showing a screen of `portraitScreen`. A
 * preset's own artwork is only used when it matches the screen size; anything
 * else (custom device, resized windows, frameless presets) gets a generic frame.
 */
export function resolveFrame(preset: DevicePreset, portraitScreen: Size): DeviceFrameSpec {
  const own = preset.frame;
  if (
    own &&
    Math.abs(preset.portraitSize.width - portraitScreen.width) < 0.5 &&
    Math.abs(preset.portraitSize.height - portraitScreen.height) < 0.5
  ) {
    return own;
  }
  return genericFrame(preset, portraitScreen);
}

const genericCache = new Map<string, DeviceFrameSpec>();

/** A tasteful, brand-free frame drawn from the device kind and platform. */
export function genericFrame(preset: Pick<DevicePreset, 'kind' | 'platform'>, screen: Size): DeviceFrameSpec {
  const key = `${preset.kind}|${preset.platform}|${screen.width}x${screen.height}`;
  const cached = genericCache.get(key);
  if (cached) return cached;
  const frame =
    preset.kind === 'desktop'
      ? desktopWindowFrame(preset.platform, screen)
      : preset.kind === 'tablet' || (preset.kind === 'foldable' && Math.min(screen.width, screen.height) >= 600)
        ? handheldFrame(preset.platform, screen, 'tablet')
        : handheldFrame(preset.platform, screen, 'phone');
  if (genericCache.size > 64) genericCache.clear();
  genericCache.set(key, frame);
  return frame;
}

function handheldFrame(platform: DevicePreset['platform'], screen: Size, kind: 'phone' | 'tablet'): DeviceFrameSpec {
  const short = Math.min(screen.width, screen.height);
  const isApple = platform === 'ios';
  const bezel = kind === 'phone' ? clamp(Math.round(short * 0.03), 8, 14) : clamp(Math.round(short * 0.028), 16, 28);
  const button = 2.5; // side buttons stick out of the shell
  const screenRadius = round(
    kind === 'phone' ? clamp(short * (isApple ? 0.115 : 0.085), 0, 60) : clamp(short * 0.022, 0, 22),
  );
  const shellRadius = round(screenRadius + bezel);
  const sideX = kind === 'phone' ? button : 0;
  const topY = kind === 'tablet' ? button : 0;
  const shell = { x: sideX, y: topY, width: screen.width + bezel * 2, height: screen.height + bezel * 2 };
  const size = { width: round(shell.width + sideX * 2), height: round(shell.height + topY) };
  const ring = (inset: number, fill: string, opacity = 1) =>
    `<path d="${roundedRectPath(shell.x + inset, shell.y + inset, shell.width - inset * 2, shell.height - inset * 2, shellRadius - inset)}" fill="${fill}"${opacity < 1 ? ` fill-opacity="${opacity}"` : ''}/>`;

  const buttons =
    kind === 'phone'
      ? [
          // left: action/volume, right: power
          `<rect x="0" y="${round(shell.height * 0.2)}" width="${button + 2}" height="${round(shell.height * 0.04)}" rx="1.5"/>`,
          `<rect x="0" y="${round(shell.height * 0.27)}" width="${button + 2}" height="${round(shell.height * 0.07)}" rx="1.5"/>`,
          `<rect x="0" y="${round(shell.height * 0.355)}" width="${button + 2}" height="${round(shell.height * 0.07)}" rx="1.5"/>`,
          `<rect x="${round(size.width - button - 2)}" y="${round(shell.height * 0.3)}" width="${button + 2}" height="${round(shell.height * 0.1)}" rx="1.5"/>`,
        ]
      : [`<rect x="${round(shell.width * 0.8)}" y="0" width="${round(shell.width * 0.07)}" height="${button + 2}" rx="1.5"/>`];

  const body =
    `<svg viewBox="0 0 ${size.width} ${size.height}">` +
    `<g fill="#3a3c42">${buttons.join('')}</g>` +
    ring(0, '#4a4c52') +
    ring(1, '#2a2b30') +
    ring(2.5, '#121316') +
    ring(Math.min(4, bezel / 2), '#000000') +
    `</svg>`;

  return {
    size,
    screenOffset: { x: round(shell.x + bezel), y: round(shell.y + bezel) },
    screenPath: roundedRectPath(0, 0, screen.width, screen.height, screenRadius),
    body,
  };
}

function desktopWindowFrame(platform: DevicePreset['platform'], screen: Size): DeviceFrameSpec {
  const mac = platform === 'macos' || platform === 'ios';
  const titleBar = mac ? 28 : 32;
  const radius = mac ? 10 : 8;
  const size = { width: round(screen.width + 2), height: round(screen.height + titleBar + 1) };
  const titlePill = Math.min(140, screen.width * 0.3);
  const controls = mac
    ? `<circle cx="16" cy="${titleBar / 2}" r="6" fill="#ff5f57"/><circle cx="36" cy="${titleBar / 2}" r="6" fill="#febc2e"/><circle cx="56" cy="${titleBar / 2}" r="6" fill="#28c840"/>`
    : [46, 32, 18]
        .map((fromRight) => `<rect x="${round(size.width - fromRight)}" y="${titleBar / 2 - 1}" width="10" height="2" fill="#c9ccd1"/>`)
        .join('');
  const body =
    `<svg viewBox="0 0 ${size.width} ${size.height}">` +
    `<path d="${roundedRectPath(0, 0, size.width, size.height, radius)}" fill="#26282c"/>` +
    controls +
    `<rect x="${round((size.width - titlePill) / 2)}" y="${titleBar / 2 - 5}" width="${round(titlePill)}" height="10" rx="5" fill="#c9ccd1" fill-opacity="0.35"/>` +
    `</svg>`;
  return {
    size,
    screenOffset: { x: 1, y: titleBar },
    screenPath: roundedRectPath(0, 0, screen.width, screen.height, { topLeft: 0, topRight: 0, bottomRight: radius - 1, bottomLeft: radius - 1 }),
    body,
  };
}

/** Everything DeviceFrame needs to position its layers. */
export function computeFrameLayout(
  preset: DevicePreset,
  orientation: Orientation,
  screenSize: Size,
  showFrame: boolean,
): FrameLayout {
  const portraitScreen = portraitSizeOf(screenSize, orientation);
  if (!showFrame) {
    return {
      outer: { width: screenSize.width, height: screenSize.height },
      screen: { x: 0, y: 0, width: screenSize.width, height: screenSize.height },
      frame: null,
      frameOrientation: 'portrait',
      frameScreen: screenSize,
      portraitScreen,
      bodyRadius: 0,
      screenRadii: NO_RADII,
      frameScreenRadii: NO_RADII,
    };
  }
  // A desktop window is not turned on its side: it is redrawn around the
  // rotated screen instead (title bar on top).
  const frameOrientation: Orientation = preset.kind === 'desktop' ? 'portrait' : orientation;
  const frameScreen = frameOrientation === orientation ? portraitScreen : screenSize;
  const frame = resolveFrame(preset, frameScreen);
  const frameScreenRadii = screenClipRadii(frame.screenPath, frameScreen);
  const offset =
    frameOrientation === 'portrait' ? frame.screenOffset : rotatedScreenOffset(frame.size, frame.screenOffset, frameScreen);
  return {
    outer: frameOrientation === 'portrait' ? { ...frame.size } : flipSize(frame.size),
    screen: { x: offset.x, y: offset.y, width: screenSize.width, height: screenSize.height },
    frame,
    frameOrientation,
    frameScreen,
    portraitScreen,
    bodyRadius: estimateBodyCornerRadius(frame.body, frame.size),
    screenRadii: rotateRadii(frameScreenRadii, frameOrientation),
    frameScreenRadii,
  };
}

/** A display feature's bounds in the current orientation's screen coordinates. */
export function orientFeatureBounds(feature: DisplayFeature, portraitScreen: Size, orientation: Orientation): Rect {
  const { left, top, right, bottom } = feature.bounds;
  if (orientation === 'portrait') return { x: left, y: top, width: right - left, height: bottom - top };
  // (x, y) -> (y, W - x): quarter turn counter-clockwise.
  return { x: top, y: portraitScreen.width - right, width: bottom - top, height: right - left };
}

/**
 * The status/navigation bar artwork of a preset, or a platform default for
 * presets without any (the custom device), so they still look like a phone.
 */
export function systemUiFor(preset: DevicePreset): SystemUiSpec | undefined {
  if (preset.systemUi || preset.kind === 'desktop') return preset.systemUi;
  if (preset.platform === 'ios') return preset.kind === 'tablet' ? iPadAir11M4.systemUi : iPhone17.systemUi;
  if (preset.platform === 'android') return pixel10.systemUi;
  return undefined;
}
