# react-native-device-simulator

**Preview your React Native app on any device, from one screen.** Pick an
iPhone, iPad, Pixel, Galaxy foldable or desktop window and your app is rendered
inside a pixel-accurate device frame. It also sees that device's screen size,
pixel ratio, safe areas, notch, keyboard, color scheme, text size, locale and
accessibility settings, with no changes to your app code.

A React Native port of Flutter's much-loved
[`device_preview`](https://pub.dev/packages/device_preview). Works with **Expo**
and bare React Native, on **web** (the fastest way to check many layouts),
**iOS** and **Android** (e.g. an iPad simulator previewing phones).

## Features

- **33 real devices** with frame artwork: iPhone 16/17 family, iPhone Air,
  iPhone SE, iPads (mini, Air, Pro), Pixel 9/10, Pixel 10 Pro Fold, Galaxy
  S24/S25, Z Flip8, Z Fold8, Galaxy Tabs, desktop windows. Plus a **custom
  device** with any size, pixel ratio and safe area.
- **Screen cutouts and system UI**: Dynamic Island, notch, punch-hole cameras,
  rounded corners, status bar and home indicator tinted for light/dark content.
- **Orientation**: portrait and landscape with per-device landscape safe areas.
- **Your app sees the simulated device**: `useWindowDimensions`, `Dimensions`,
  `PixelRatio`, `useColorScheme`/`Appearance`, `AccessibilityInfo`, `Keyboard`
  events and `react-native-safe-area-context` insets all report it, so React
  Navigation and Expo Router lay out exactly as on the real device.
- **Virtual keyboard** (iOS and Gboard styles) with real `Keyboard` events, so
  `KeyboardAvoidingView` reacts.
- **Appearance**: light/dark, text scale (0.8x to 3x), bold text.
- **Accessibility**: reduce motion, reduce transparency, invert colors,
  grayscale, high contrast, darker system colors, screen reader. Each one is
  tri-state (device default / on / off).
- **Locales** with automatic right-to-left layout for Arabic, Hebrew, Persian and Urdu.
- **Foldables**: the fold or hinge is drawn and rotates with the device.
- **The app keeps its state**: changing device, orientation, frame or turning
  the preview off never remounts your app.
- **Screenshots** of the device (with frame) or the screen only, at the
  device's real resolution.
- **Plugins**: add your own tabs to the toolbar.
- **Programmatic control** for tests, demos and dev menus.
- Settings are **persisted** (localStorage on web, any AsyncStorage-like store on native).
- **Off in production** by default (`enabled={__DEV__}`): nothing is patched or rendered.

## Install

```bash
npx expo install react-native-device-simulator react-native-svg react-native-safe-area-context
```

`react-native-svg` is required. `react-native-safe-area-context` is optional
but recommended (Expo Router and React Navigation already use it).

## Usage

### Expo Router

Wrap the navigator in your root layout:

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

### Bare React Native / Expo without Router

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

Then run your app (`npx expo start --web` is the quickest way to try many
devices) and use the toolbar on the right (or at the bottom on small screens).

### Recommended: the Metro helper

Some things can't be simulated from JavaScript alone:

- The **native** `SafeAreaView` from `react-native-safe-area-context` measures
  the real screen.
- **Text scaling and bold text** are applied by the OS.
- On web, react-native-web's `KeyboardAvoidingView` does nothing.

`withDevicePreview` redirects those modules to preview-aware versions that
behave exactly like the originals when no preview is active:

```js
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { withDevicePreview } = require('react-native-device-simulator/metro');

module.exports = withDevicePreview(getDefaultConfig(__dirname));
```

Options: `withDevicePreview(config, { safeArea, textScaling, keyboardAvoidingView })`
(all `true` by default).

## Props

| Prop | Default | Description |
| --- | --- | --- |
| `enabled` | `__DEV__` | When `false`, renders `children` only and patches nothing. |
| `devices` | all built-ins | Devices offered by the picker. |
| `defaultSettings` | | Initial settings, e.g. `{ deviceId: 'google-pixel-10', colorScheme: 'dark' }`. |
| `storage` | `localStorage` on web | Where settings persist. Pass AsyncStorage on native, `null` to disable. |
| `plugins` | `[]` | Extra toolbar tabs, e.g. `[screenshotPlugin(), simulationInfoPlugin()]`. |
| `padding` | `24` | Space around the device. |
| `maxScale` | `1` | Allow drawing the device larger than its logical size. |

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

## Locales

Apps pick their language in many different ways, so the simulated locale is
exposed rather than forced. Feed it to your i18n library:

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

Right-to-left locales flip the layout direction of the simulated screen automatically.

## Programmatic control

`devicePreview` is a global controller (the equivalent of Flutter's
`DevicePreview.controller`). It is usable anywhere, including outside React:

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

In components, `useDevicePreview()` returns `{ settings, simulation, isActive, controller }`.

## Custom devices

Any device in the [device spec format](device-specs/) works:

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

Presets without frame artwork get a generic frame for their kind. The toolbar
also has a "Custom device" editor.

## Plugins

```tsx
import type { DevicePreviewPlugin } from 'react-native-device-simulator';

const featureFlags: DevicePreviewPlugin = {
  id: 'flags',
  title: 'Flags',
  icon: '⚑',
  render: ({ theme }) => <FlagsPanel color={theme.text} />,
};
```

Built-in:

- `screenshotPlugin()` captures the device or the screen.
  - **Web**: install the optional `modern-screenshot` (or `html-to-image`).
  - **Native**: install `react-native-view-shot`; `expo-sharing` is optional.
- `simulationInfoPlugin()` shows every simulated value, with "Copy JSON".

## How it works

The app is rendered in a view the size of the simulated screen, then scaled
to fit. The JavaScript modules behind React Native's globals (`Dimensions`,
`Appearance`, `AccessibilityInfo`, `Keyboard`) are wrapped so they report the
simulated device and notify subscribers when it changes. Safe area insets are
provided through `react-native-safe-area-context`'s contexts. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Limitations

- **Native look is not simulated.** An iOS host renders iOS-native components
  (switches, pickers, alerts) even when previewing an Android device, because
  native components can't change platform at runtime. `Platform.OS` is
  deliberately not faked: libraries depend on it to pick native modules.
- **Native modals** (`Modal`, native-stack modals, alerts) are presented by the
  OS over the whole window, outside the device frame.
- **Native animations** that read OS settings directly (e.g. Reanimated's
  `useReducedMotion`) see the host setting.
- **Text scaling and native `SafeAreaView`** need the Metro helper.
- **Mouse input on web**: drag-to-scroll is not emulated; use the wheel or trackpad.

## Development

```bash
npm install
cd example && npx expo start --web            # example app
cd packages/react-native-device-simulator
npx tsc -p . && npx jest                      # typecheck + tests
node scripts/generate-presets.mjs             # after editing device-specs/
```

## Credits

The device catalog (metrics, frame and system UI artwork) comes from
[flutter_device_preview](https://github.com/aloisdeniel/flutter_device_preview)
by Aloïs Deniel (MIT). This project is an independent React Native port.

## License

MIT
