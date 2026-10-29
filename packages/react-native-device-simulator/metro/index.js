'use strict';

/**
 * Metro helper for react-native-device-simulator.
 *
 * ```js
 * // metro.config.js
 * const { getDefaultConfig } = require('expo/metro-config');
 * const { withDevicePreview } = require('react-native-device-simulator/metro');
 * module.exports = withDevicePreview(getDefaultConfig(__dirname));
 * ```
 *
 * It swaps a few modules for preview-aware versions (see src/shims). Each
 * shim renders the original module unchanged outside an active preview, so
 * the helper is safe to keep in production builds.
 *
 * - `react-native-safe-area-context` -> SafeAreaProvider / SafeAreaView /
 *   SafeAreaListener that report the simulated insets (`safeArea`).
 * - React Native's and react-native-web's `Text` and `TextInput` -> versions
 *   that apply the simulated font scale and bold text (`textScaling`).
 * - react-native-web's `KeyboardAvoidingView` (a plain View) -> a port of
 *   React Native's implementation that avoids the simulated keyboard
 *   (`keyboardAvoidingView`).
 *
 * Redirects are decided on the RESOLVED file path, so every import of a
 * module is covered (`react-native`'s index, `Animated.Text`, deep imports,
 * react-native-web's internals) and the platform/package aliases Expo
 * applies keep working. Imports made by the shims themselves are never
 * redirected, so they reach the original modules.
 */

const fs = require('fs');
const path = require('path');

const SHIMS_DIR = path.resolve(__dirname, '..', 'src', 'shims');

function realpath(p) {
  try {
    return fs.realpathSync(p);
  } catch (e) {
    return p;
  }
}

function toPosix(p) {
  return p.split(path.sep).join('/').replace(/\\/g, '/');
}

const SHIMS_DIRS = Array.from(new Set([SHIMS_DIR, realpath(SHIMS_DIR)])).map((dir) => toPosix(dir) + '/');

const SAFE_AREA_PACKAGE = 'react-native-safe-area-context';
const SAFE_AREA_SHIM = path.join(SHIMS_DIR, 'safe-area-context.tsx');

/** Resolved file (posix path suffix) -> shim, per option. */
const TEXT_REDIRECTS = [
  ['/react-native/Libraries/Text/Text.js', 'native/Text.ts'],
  ['/react-native/Libraries/Components/TextInput/TextInput.js', 'native/TextInput.ts'],
  ['/react-native-web/dist/exports/Text/index.js', 'web/Text.ts'],
  ['/react-native-web/dist/exports/TextInput/index.js', 'web/TextInput.ts'],
  ['/react-native-web/dist/cjs/exports/Text/index.js', 'web-cjs/Text.ts'],
  ['/react-native-web/dist/cjs/exports/TextInput/index.js', 'web-cjs/TextInput.ts'],
];

const KEYBOARD_AVOIDING_VIEW_REDIRECTS = [
  ['/react-native-web/dist/exports/KeyboardAvoidingView/index.js', 'web/KeyboardAvoidingView.ts'],
  ['/react-native-web/dist/cjs/exports/KeyboardAvoidingView/index.js', 'web-cjs/KeyboardAvoidingView.ts'],
];

/** True for modules inside src/shims: their imports must reach the originals. */
function isShim(originModulePath) {
  if (!originModulePath) return false;
  const origin = toPosix(originModulePath);
  return SHIMS_DIRS.some((dir) => origin.startsWith(dir));
}

/**
 * Wraps `config.resolver.resolveRequest` (or Metro's default resolver) with
 * the preview redirects.
 *
 * @param {import('metro-config').InputConfigT | Record<string, any>} config
 * @param {{ safeArea?: boolean, textScaling?: boolean, keyboardAvoidingView?: boolean }} [options]
 */
function withDevicePreview(config, options) {
  const opts = options || {};
  const safeArea = opts.safeArea !== false;
  const textScaling = opts.textScaling !== false;
  const keyboardAvoidingView = opts.keyboardAvoidingView !== false;

  const redirects = [];
  if (textScaling) redirects.push(...TEXT_REDIRECTS);
  if (keyboardAvoidingView) redirects.push(...KEYBOARD_AVOIDING_VIEW_REDIRECTS);
  const redirectFor = (filePath) => {
    const file = toPosix(filePath);
    for (const [suffix, shim] of redirects) {
      if (file.endsWith(suffix)) return path.join(SHIMS_DIR, shim);
    }
    return null;
  };

  const resolver = (config && config.resolver) || {};
  const upstream = resolver.resolveRequest;
  if (upstream && upstream.__devicePreview) return config; // Already applied.

  function resolveRequest(context, moduleName, platform) {
    const resolution = upstream
      ? upstream(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform);
    if (!resolution || resolution.type !== 'sourceFile' || isShim(context.originModulePath)) return resolution;
    if (safeArea && moduleName === SAFE_AREA_PACKAGE) return { type: 'sourceFile', filePath: SAFE_AREA_SHIM };
    const shim = redirectFor(resolution.filePath);
    return shim ? { type: 'sourceFile', filePath: shim } : resolution;
  }
  Object.defineProperty(resolveRequest, '__devicePreview', { value: true });

  return {
    ...config,
    resolver: {
      ...resolver,
      resolveRequest,
    },
  };
}

module.exports = {
  withDevicePreview,
  // Exposed for tests and tooling.
  SHIMS_DIR,
};
