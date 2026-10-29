/**
 * Public value types for react-native-device-simulator.
 *
 * The device model mirrors Flutter's `device_preview` 3.x `DevicePreset`, so the
 * JSON device specs from that project can be loaded unchanged.
 */

export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type Orientation = 'portrait' | 'landscape';

export type DeviceKind = 'phone' | 'tablet' | 'foldable' | 'desktop';

/** The operating system a device runs. Matches `Platform.OS` values. */
export type DevicePlatform = 'ios' | 'android' | 'macos' | 'windows' | 'web' | 'linux';

export type ColorSchemeName = 'light' | 'dark';

/** Fold or hinge of a foldable device, in portrait screen coordinates. */
export interface DisplayFeature {
  bounds: { left: number; top: number; right: number; bottom: number };
  type: 'fold' | 'hinge' | 'cutout' | 'unknown';
  state: 'flat' | 'halfOpened' | 'unknown';
}

/**
 * A device's appearance. Everything is described in portrait, in screen
 * coordinates: the screen's top-left corner is the origin, so the body starts at
 * `-screenOffset`.
 */
export interface DeviceFrameSpec {
  /** Body size, portrait. */
  size: Size;
  /** Screen top-left inside the body. */
  screenOffset: Point;
  /**
   * SVG path data (`d`) of the screen outline, in screen coordinates. Rounds the
   * display corners and punches cutouts (notch, Dynamic Island, camera hole).
   * Omit for a plain rectangle.
   */
  screenPath?: string;
  /** SVG document drawn behind the screen. Its viewBox covers `size`. */
  body?: string;
}

/** On-screen OS furniture drawn over the app. Artwork uses `currentColor`. */
export interface SystemUiSpec {
  statusBar?: {
    /** Horizontal edge inset of the leading/trailing artwork. */
    inset?: number;
    /** SVG (usually the clock). */
    leading?: string;
    /** SVG (usually signal, wifi, battery). */
    trailing?: string;
    /** SVG centred in the bar. */
    center?: string;
  };
  navigationBar?: {
    /** SVG (home indicator / gesture pill / 3-button bar). */
    center?: string;
    leading?: string;
    trailing?: string;
    /** Distance of the artwork from the screen's bottom edge. Centred when absent. */
    bottomInset?: number;
  };
}

/** Description of a device. Matches the `device_specs` JSON format. */
export interface DevicePreset {
  /** Stable identifier, e.g. `apple-iphone-17-pro`. */
  id: string;
  /** Display name, e.g. `iPhone 17 Pro`. */
  name: string;
  brand?: string;
  year?: number;
  platform: DevicePlatform;
  kind: DeviceKind;
  /** Logical resolution, portrait. */
  portraitSize: Size;
  devicePixelRatio: number;
  /** Safe area insets, portrait. */
  portraitPadding: EdgeInsets;
  /** Safe area insets, landscape. Derived by the rotation rule when absent. */
  landscapePadding?: EdgeInsets;
  /** Height the software keyboard covers in portrait. No keyboard when absent. */
  portraitKeyboardHeight?: number;
  landscapeKeyboardHeight?: number;
  displayFeatures?: DisplayFeature[];
  frame?: DeviceFrameSpec;
  systemUi?: SystemUiSpec;
}

/** Tri-state accessibility overrides. `null` means "use the real device value". */
export interface AccessibilityOverrides {
  boldText: boolean | null;
  reduceMotion: boolean | null;
  reduceTransparency: boolean | null;
  invertColors: boolean | null;
  grayscale: boolean | null;
  highContrast: boolean | null;
  darkerSystemColors: boolean | null;
  screenReader: boolean | null;
}

/** A user-defined device, edited from the "Custom device" panel. */
export interface CustomDeviceSpec {
  name: string;
  platform: DevicePlatform;
  kind: DeviceKind;
  portraitSize: Size;
  devicePixelRatio: number;
  portraitPadding: EdgeInsets;
  landscapePadding?: EdgeInsets;
  portraitKeyboardHeight?: number;
  landscapeKeyboardHeight?: number;
}

export type ToolbarPosition = 'auto' | 'left' | 'right' | 'bottom';

export type StatusBarStyleOverride = 'auto' | 'light-content' | 'dark-content';

/**
 * Everything the user can change. Serializable: this is what gets persisted.
 * `null` values mean "use the real (host) value".
 */
export interface DevicePreviewSettings {
  /** When false the app renders full-screen as if the preview was not installed. */
  isFrameVisible: boolean;
  /** Whether the simulation is active. False shows the app unmodified (state is kept). */
  isEnabled: boolean;
  /** Selected preset id, or `custom` for the custom device. */
  deviceId: string;
  orientation: Orientation;
  customDevice: CustomDeviceSpec;
  showSystemUi: boolean;
  keyboardVisible: boolean;
  colorScheme: ColorSchemeName | null;
  /** Text scale. `null` = real device value. */
  fontScale: number | null;
  /** BCP-47 tag, e.g. `ar-EG`. `null` = real device locale. */
  locale: string | null;
  use24HourClock: boolean | null;
  accessibility: AccessibilityOverrides;
  statusBarStyle: StatusBarStyleOverride;
  toolbar: {
    visible: boolean;
    position: ToolbarPosition;
    /** Selected tab id. */
    tab: string;
  };
  /** Background behind the device. */
  background: 'dots' | 'plain' | 'gradient';
  /** Colour theme of the preview chrome (toolbar, background). */
  theme: ColorSchemeName;
}

/**
 * The fully resolved simulation, derived from settings + presets. This is what
 * the app sees.
 */
export interface ResolvedSimulation {
  preset: DevicePreset;
  orientation: Orientation;
  /** Logical screen size in the current orientation. */
  screenSize: Size;
  pixelRatio: number;
  /** Safe area insets in the current orientation. */
  insets: EdgeInsets;
  /** Keyboard height in the current orientation, 0 when hidden. */
  keyboardHeight: number;
  platform: DevicePlatform;
  colorScheme: ColorSchemeName | null;
  fontScale: number | null;
  locale: string | null;
  isRTL: boolean;
  use24HourClock: boolean | null;
  accessibility: AccessibilityOverrides;
}

/** Key/value storage used to persist settings, e.g. AsyncStorage. */
export interface DevicePreviewStorage {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
}
