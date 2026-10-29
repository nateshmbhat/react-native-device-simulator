# react-native-device-simulator

[![npm version](https://img.shields.io/npm/v/react-native-device-simulator.svg)](https://www.npmjs.com/package/react-native-device-simulator)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/nateshmbhat/react-native-device-simulator/blob/main/LICENSE)

**Preview your React Native app on 33 real devices, from one screen.**
Wrap your app once, pick an iPhone, iPad, Pixel, Galaxy foldable or desktop
window, and the app runs inside that device's frame. It also gets the
device's screen size, pixel ratio, safe areas, keyboard, color scheme, text
size, locale and accessibility settings, and you don't change any app code.

<p align="center">
  <img src="https://raw.githubusercontent.com/nateshmbhat/react-native-device-simulator/main/docs/images/hero.png" alt="The example app running inside an iPhone 17 Pro frame, with the device toolbar open on the right" width="100%">
</p>

A React Native port of Flutter's
[`device_preview`](https://pub.dev/packages/device_preview). It works with
**Expo** and bare React Native, on **web**, **iOS** and **Android**.

[Quick start](#quick-start) · [Features](#features) · [API](#api) ·
[How it works](#how-it-works) · [Limitations](#limitations) · [Credits](#credits)

## Why this exists

Flutter developers have had [`device_preview`](https://pub.dev/packages/device_preview)
by [Aloïs Deniel](https://github.com/aloisdeniel) for years: you wrap the app,
pick a device, and see it in an accurate frame with that device's dimensions,
notch, safe areas and system settings.

We looked for the same thing in React Native. There are components that draw
a device frame around a view (for example
[`react-native-multidevice-preview`](https://www.npmjs.com/package/react-native-multidevice-preview)),
but we couldn't find one that does what `device_preview` does: run your real
app inside accurate device frames while React Native's own APIs
(`useWindowDimensions`, `useColorScheme`, `Keyboard`, `AccessibilityInfo`,
safe area insets and so on) report the simulated device, so the app needs no
changes. This library fills that gap. It ports `device_preview`'s design to
React Native and uses its device catalog.

## Features

### 33 devices with real frames

iPhone 16 and 17 family, iPhone Air, iPhone SE, iPad (mini, Air, Pro), Pixel 9
and 10, Pixel 10 Pro Fold, Galaxy S24 and S25, Galaxy Z Flip8 and Z Fold8,
Galaxy Tabs, and small and large desktop windows. Frames include the Dynamic
Island, notches, punch-hole cameras, rounded screen corners, a status bar and a
home indicator or navigation bar. Devices are shown at their real logical size
relative to each other:

<p align="center">
  <img src="https://raw.githubusercontent.com/nateshmbhat/react-native-device-simulator/main/docs/images/devices.png" alt="The example app on an iPad Pro 11-inch in landscape, a Pixel 10 Pro Fold, an iPhone 17 Pro, a Pixel 10 and an iPhone SE" width="100%">
</p>

You can switch devices and orientation while the app is running. The app is
never remounted, so navigation state, form input and scroll position all stay
where they were:

<p align="center">
  <img src="https://raw.githubusercontent.com/nateshmbhat/react-native-device-simulator/main/docs/images/switching-devices.gif" alt="Switching between iPhone SE, Pixel 10, Galaxy Z Flip8, Pixel 10 Pro Fold, iPad Pro in landscape and a desktop window using the toolbar" width="100%">
</p>

### Your app sees the simulated device

React Native's own APIs report the simulated device, so React Navigation, Expo
Router and your own responsive code lay out the same way they would on that
device:

| API | Reports |
| --- | --- |
| `useWindowDimensions`, `Dimensions` | Screen size in the current orientation |
| `PixelRatio` | The device's pixel ratio |
| `useColorScheme`, `Appearance` | The simulated light or dark mode |
| `AccessibilityInfo` | Simulated accessibility settings and their change events |
| `Keyboard` | Show, hide and frame-change events for the virtual keyboard, in the same order as iOS |
| `react-native-safe-area-context` | The device's safe area insets (portrait and landscape) |

The example app's Inspector screen prints those values live. In this
screenshot it runs on an iPad mini with bold text, reduce motion and screen
reader turned on:

<p align="center">
  <img src="https://raw.githubusercontent.com/nateshmbhat/react-native-device-simulator/main/docs/images/inspector.png" alt="The Inspector screen on an iPad mini, showing window size, pixel ratio, safe area insets and accessibility values, next to the Accessibility panel" width="100%">
</p>

### A virtual keyboard that behaves like the real one

The keyboard comes in iOS and Gboard styles, and it is sized for each device and
orientation. It sends real `Keyboard` events, so `KeyboardAvoidingView` and
keyboard-aware layouts react to it the same way they do on a device.

<p align="center">
  <img src="https://raw.githubusercontent.com/nateshmbhat/react-native-device-simulator/main/docs/images/keyboard.png" alt="A booking form with the iOS keyboard on an iPhone 17 Pro and the Gboard keyboard on a Pixel 10 in dark mode" width="640">
</p>

### Appearance, text size and locales

- Light and dark mode.
- Text scale from 0.5x to 3.5x, and bold text. These are applied through the
  [Metro helper](#recommended-the-metro-helper).
- Locales. Right-to-left languages such as Arabic, Hebrew, Persian and Urdu
  flip the layout direction of the simulated screen.

<p align="center">
  <img src="https://raw.githubusercontent.com/nateshmbhat/react-native-device-simulator/main/docs/images/appearance.png" alt="The Discover screen on an iPhone 17 in light mode and in dark mode" width="640">
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/nateshmbhat/react-native-device-simulator/main/docs/images/rtl-text-scale.png" alt="The World screen on a Pixel 10 in Arabic (ar-EG), right-to-left, with 1.5x bold text, next to the Display panel" width="100%">
</p>

### Accessibility

You can override reduce motion, reduce transparency, invert colors, grayscale,
high contrast, darker system colors, screen reader and bold text. Each one has
three states: use the device setting, on, or off.

### Foldables and orientation

Portrait and landscape use per-device landscape safe areas. On foldables, the
fold or hinge is drawn and rotates with the device.

<p align="center">
  <img src="https://raw.githubusercontent.com/nateshmbhat/react-native-device-simulator/main/docs/images/foldable-landscape.png" alt="The Discover screen on a Pixel 10 Pro Fold in landscape with the dark toolbar" width="100%">
</p>

### Custom devices

The **Custom device** editor lets you set any size, pixel ratio, platform,
safe area and keyboard height. You can also
[register your own presets](#custom-devices) in code.

<p align="center">
  <img src="https://raw.githubusercontent.com/nateshmbhat/react-native-device-simulator/main/docs/images/custom-device.png" alt="A custom 800 by 1280 Android tablet called ACME Kiosk, with the Inspector reporting its size and pixel ratio, next to the custom device editor" width="100%">
</p>

### Also included

- **Screenshots** of the device with its frame, or the screen only, at the
  device's real resolution (`screenshotPlugin()`).
- **Plugins** that add your own tabs to the toolbar.
- **Programmatic control** for tests, demos and dev menus (`devicePreview.setDevice(...)`).
- **Persisted settings** (`localStorage` on web, any AsyncStorage-like store on native).
- **Off in release builds** by default (`enabled={__DEV__}`): nothing is patched or rendered.
- **A compact toolbar** that moves to the bottom on narrow windows, so you can
  even use the preview from a phone-sized browser window.

<p align="center">
  <img src="https://raw.githubusercontent.com/nateshmbhat/react-native-device-simulator/main/docs/images/compact-toolbar.png" alt="The preview in a phone-sized browser window, with the toolbar collapsed to a bar at the bottom" width="260">
</p>

## Quick start

### 1. Install

```bash
npx expo install react-native-device-simulator react-native-svg react-native-safe-area-context
```

`react-native-svg` is required. `react-native-safe-area-context` is optional but
recommended. Expo Router and React Navigation already use it.

### 2. Wrap your app

**Expo Router.** Wrap the navigator in your root layout:

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';
import { DevicePreview } from 'react-native-device-simulator';

export default function RootLayout() {
  return (
    <DevicePreview>
      <Stack />
    </DevicePreview>
  );
}
```

**Bare React Native, or Expo without Router:**

```tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DevicePreview } from 'react-native-device-simulator';

export default function App() {
  return (
    <SafeAreaProvider>
      <DevicePreview>
        <Navigation />
      </DevicePreview>
    </SafeAreaProvider>
  );
}
```

### 3. Run it

```bash
npx expo start --web
```

Web is the fastest way to check many layouts. The toolbar is on the right, or
at the bottom on small windows. The preview also runs inside your iOS or
Android app, for example on an iPad simulator previewing phones.

### Recommended: the Metro helper

Some things can't be simulated from JavaScript alone:

- The **native** `SafeAreaView` from `react-native-safe-area-context` measures
  the real screen.
- The OS applies **text scaling and bold text**.
- On web, react-native-web's `KeyboardAvoidingView` does nothing.

`withDevicePreview` redirects those modules to preview-aware versions. When no
preview is active, they behave exactly like the originals:

```js
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { withDevicePreview } = require('react-native-device-simulator/metro');

module.exports = withDevicePreview(getDefaultConfig(__dirname));
```

Options: `withDevicePreview(config, { safeArea, textScaling, keyboardAvoidingView })`.
All of them default to `true`.

## API

### `<DevicePreview>` props

| Prop | Default | Description |
| --- | --- | --- |
| `enabled` | `__DEV__` | When `false`, renders `children` only and patches nothing. |
| `devices` | all built-ins | Devices offered by the picker. |
| `defaultSettings` | | Initial settings, e.g. `{ deviceId: 'google-pixel-10', colorScheme: 'dark' }`. |
| `storage` | `localStorage` on web | Where settings persist. Pass AsyncStorage on native, or `null` to disable. |
| `plugins` | `[]` | Extra toolbar tabs, e.g. `[screenshotPlugin(), simulationInfoPlugin()]`. |
| `padding` | `24` | Space around the device. |
| `maxScale` | `1` | Allows drawing the device larger than its logical size. |

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DevicePreview, Devices, screenshotPlugin, simulationInfoPlugin } from 'react-native-device-simulator';

<DevicePreview
  storage={AsyncStorage}
  devices={[Devices.iPhone17Pro, Devices.iPhoneSE3rdGen, Devices.pixel10, Devices.iPadAir11M4]}
  defaultSettings={{ deviceId: Devices.pixel10.id }}
  plugins={[screenshotPlugin(), simulationInfoPlugin()]}
>
  <App />
</DevicePreview>
```

<details>
<summary>Built-in devices (<code>Devices.*</code>)</summary>

| Brand | Devices |
| --- | --- |
| Apple iPhone | `iPhone17Pro`, `iPhone17ProMax`, `iPhone17`, `iPhone17e`, `iPhoneAir`, `iPhone16Pro`, `iPhone16ProMax`, `iPhone16`, `iPhone16Plus`, `iPhoneSE3rdGen` |
| Apple iPad | `iPadPro11M5`, `iPadPro13M5`, `iPadPro11M4`, `iPadPro13M4`, `iPadAir11M4`, `iPadAir13M4`, `iPadAir11M2`, `iPadAir13M2`, `iPadMiniA17Pro`, `iPadA16`, `iPad10thGen` |
| Google | `pixel10`, `pixel10ProFold`, `pixel9` |
| Samsung | `galaxyS25`, `galaxyS24`, `galaxyZFlip8`, `galaxyZFold8`, `galaxyZFold8Ultra`, `galaxyTabS11`, `galaxyTabS10Plus` |
| Desktop | `smallDesktopWindow`, `largeDesktopWindow` |

`allPresets` contains all of them. Each preset's `id` is the file name of its
spec in [`device-specs/`](https://github.com/nateshmbhat/react-native-device-simulator/tree/main/device-specs), e.g. `apple-iphone-17-pro`.

</details>

### Programmatic control

`devicePreview` is a global controller, the equivalent of Flutter's
`DevicePreview.controller`. You can use it anywhere, including outside React:

```ts
import { devicePreview, Devices } from 'react-native-device-simulator';

devicePreview.setDevice(Devices.iPhoneSE3rdGen);
devicePreview.setOrientation('landscape');
devicePreview.setColorScheme('dark');
devicePreview.setFontScale(2);
devicePreview.setLocale('he-IL');
devicePreview.setKeyboardVisible(true);
devicePreview.update({ accessibility: { ...devicePreview.getSettings().accessibility, reduceMotion: true } });
devicePreview.setEnabled(false); // show the app full-screen, state kept
devicePreview.reset();
```

### Hooks

| Hook | Returns |
| --- | --- |
| `useDevicePreview()` | `{ settings, simulation, isActive, controller }` |
| `useDevicePreviewSettings()` | What the user chose (`DevicePreviewSettings`) |
| `useDevicePreviewSimulation()` | What the app sees: screen size, insets, pixel ratio, keyboard height, overrides |
| `useDevicePreviewActive()` | Whether a device is being simulated right now |
| `useDevicePreviewLocale()` | The simulated locale (BCP-47), or `null` |

`getRealDimensions()` and `getRealColorScheme()` return the host's real values
when you need them.

### Locales

Apps choose their language in many different ways, so the library exposes the
simulated locale and leaves it to you to apply. Pass it to your i18n library:

```tsx
import { useDevicePreviewLocale } from 'react-native-device-simulator';

function I18nSync() {
  const previewLocale = useDevicePreviewLocale(); // e.g. 'ar-EG', or null
  useEffect(() => {
    i18n.changeLanguage(previewLocale ?? getLocales()[0].languageTag);
  }, [previewLocale]);
  return null;
}
```

Right-to-left locales flip the layout direction of the simulated screen
automatically.

### Custom devices

Any device in the [device spec format](https://github.com/nateshmbhat/react-native-device-simulator/tree/main/device-specs) works:

```ts
import { devicePreview, type DevicePreset } from 'react-native-device-simulator';

const kioskTablet: DevicePreset = {
  id: 'acme-kiosk',
  name: 'ACME Kiosk',
  brand: 'ACME',
  platform: 'android',
  kind: 'tablet',
  portraitSize: { width: 800, height: 1280 },
  devicePixelRatio: 1.5,
  portraitPadding: { top: 24, right: 0, bottom: 0, left: 0 },
};

devicePreview.registerPreset(kioskTablet); // appears in the picker
```

A preset without frame artwork gets a generic frame for its kind.

### Plugins

A plugin adds a tab to the toolbar:

```tsx
import type { DevicePreviewPlugin } from 'react-native-device-simulator';

const featureFlags: DevicePreviewPlugin = {
  id: 'flags',
  title: 'Flags',
  icon: '⚑',
  render: ({ theme }) => <FlagsPanel color={theme.text} />,
};
```

`render` receives `{ controller, settings, simulation, theme }`.

Built-in plugins:

- `screenshotPlugin()` captures the device or the screen.
  - **Web**: install the optional `modern-screenshot` (or `html-to-image`).
  - **Native**: install `react-native-view-shot`. `expo-sharing` is optional.
- `simulationInfoPlugin()` shows every simulated value, with a "Copy JSON" button.

## How it works

The library renders the app in a view the size of the simulated screen, then
scales that view to fit the window. It wraps the JavaScript modules behind
React Native's globals (`Dimensions`, `Appearance`, `AccessibilityInfo`,
`Keyboard`) so they report the simulated device and notify subscribers when it
changes. Safe area insets come through
`react-native-safe-area-context`'s contexts. The device frames are SVG and
come from `device_preview`'s device specs. For details, see
[docs/ARCHITECTURE.md](https://github.com/nateshmbhat/react-native-device-simulator/blob/main/docs/ARCHITECTURE.md).

## Platforms

The library runs on web (react-native-web), iOS and Android, with Expo or bare
React Native. So far it has been checked on Expo web and on an iPad simulator.
Reports from other setups are welcome.

## Limitations

- **The native look is not simulated.** An iOS host renders iOS-native
  components (switches, pickers, alerts) even when previewing an Android
  device, because native components can't change platform at runtime.
  `Platform.OS` is deliberately not faked, because libraries depend on it to
  pick native modules.
- **Native modals** (`Modal`, native-stack modals, alerts) are presented by the
  OS over the whole window, outside the device frame.
- **Native animations** that read OS settings directly (e.g. Reanimated's
  `useReducedMotion`) see the host setting.
- **Text scaling and the native `SafeAreaView`** need the
  [Metro helper](#recommended-the-metro-helper).
- **Mouse input on web**: drag-to-scroll is not emulated. Use the wheel or
  trackpad.

## Contributing

Issues and pull requests are welcome. The repository is an npm workspace:

```
packages/react-native-device-simulator/   the library
example/                                   Expo Router showcase app
device-specs/                              device JSON specs (from device_preview, MIT)
scripts/generate-presets.mjs               device-specs -> generated presets
docs/ARCHITECTURE.md                       design notes and invariants
```

```bash
npm install
cd example && npx expo start --web            # run the example app
cd packages/react-native-device-simulator
npx tsc -p . && npx jest                      # typecheck and tests
node scripts/generate-presets.mjs             # after editing device-specs/
```

The example app has five screens that exercise the library: Home, Discover (a
responsive grid), Book (a form with the keyboard), World (locales, RTL and the
clock) and Inspector (live values).

## Credits

This project wouldn't exist without
[**device_preview**](https://github.com/aloisdeniel/flutter_device_preview) by
[Aloïs Deniel](https://github.com/aloisdeniel). The idea, the user experience
and the device catalog come from his work. The device metrics, frame artwork
and system UI artwork in [`device-specs/`](https://github.com/nateshmbhat/react-native-device-simulator/tree/main/device-specs) are taken from that
project under the MIT license (see [`device-specs/LICENSE`](https://github.com/nateshmbhat/react-native-device-simulator/blob/main/device-specs/LICENSE)).
If you also build with Flutter, use the original
[`device_preview`](https://pub.dev/packages/device_preview).

This project is an independent React Native port. It is not affiliated with or
endorsed by the original authors.

## License

[MIT](https://github.com/nateshmbhat/react-native-device-simulator/blob/main/LICENSE). The device specs and artwork are © 2019 Aloïs Deniel, also MIT.
