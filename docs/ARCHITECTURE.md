# Architecture

`react-native-device-simulator` is a React Native port of Flutter's
[`device_preview`](https://pub.dev/packages/device_preview). It renders an app
inside a simulated device (iPhone, iPad, Android phones, tablets, foldables,
desktop windows) and makes React Native's global APIs report that device, so
the app needs **no code changes** to react to it.

## Layout

```
packages/react-native-device-simulator/   the library
  src/
    types.ts                 public value types (DevicePreset, settings, ...)
    core/geometry.ts         pure maths: rotation rule, fit-to-window scale
    core/simulation.ts       default settings, settings -> ResolvedSimulation (pure)
    core/store.ts            global controller `deviceSimulator` (+ persistence)
    environment/             overrides of RN globals (Dimensions, Appearance, ...)
    components/DeviceSimulator.tsx   root component: stage, scaling, toolbar
    components/SimulatedScreen.tsx providers inside the device screen
    components/frame/        device frame rendering (SVG body, mask, system UI)
    components/toolbar/      control panel
    presets/generated/       device catalog, generated from /device-specs
    plugins/                 toolbar plugins (screenshot, ...)
  metro/                     optional Metro helper `withDeviceSimulator`
device-specs/               device JSON specs (from flutter_device_preview, MIT)
scripts/generate-presets.mjs  device-specs -> presets/generated
example/                    Expo Router app used for development
```

## How the simulation works

1. **State.** `deviceSimulator` (core/store.ts) holds `DeviceSimulatorSettings` -
   what the user chose. `resolveSimulation()` turns it into a
   `ResolvedSimulation` - what the app sees (screen size in the current
   orientation, pixel ratio, safe area insets, keyboard height, overrides).
   Components subscribe with `useSyncExternalStore` (`useDeviceSimulatorSettings`,
   `useDeviceSimulatorSimulation`). Never call `deviceSimulator.getX()` during render
   without a subscription: the React Compiler memoizes such calls.

2. **Environment overrides** (`environment/`). The JS modules behind RN's
   globals are patched once, idempotently:
   - `Dimensions.get` / `addEventListener` -> `useWindowDimensions`, `PixelRatio`
   - `Appearance.getColorScheme` / `addChangeListener` -> `useColorScheme`
   - `AccessibilityInfo.is*Enabled` / `addEventListener`
   - `Keyboard` events (simulated software keyboard)
   `applyEnvironment(simulation | null)` sets or clears every override.
   `DeviceSimulator` applies it silently during render (so the app's first render
   already sees the device), then again with notifications in a layout effect.
   The real host values stay available through `getRealDimensions()` and
   `getRealColorScheme()` - the preview's own UI must use those (or `onLayout`),
   never `useWindowDimensions` / `useColorScheme`, which report the simulation.

3. **Safe areas.** `SimulatedScreen` provides `SafeAreaInsetsContext` and
   `SafeAreaFrameContext` from `react-native-safe-area-context` (optional peer),
   so React Navigation, Expo Router and `useSafeAreaInsets` get the simulated
   insets. The native `SafeAreaView` / nested `SafeAreaProvider` measure real
   native insets; the optional Metro helper swaps them for preview-aware
   versions.

4. **Rendering.** The device is rendered at its natural logical size and scaled
   with a single `transform: [{ scale }]` to fit the stage (`fitScale`). The app
   lives in a view exactly the size of the simulated screen.

## Invariants

- **The app is never remounted** by preview changes (device, orientation,
  frame on/off, simulation on/off, toolbar position). The element path from
  `DeviceSimulator` down to `children` must be identical in every mode: hide or
  resize layers with styles, give conditional siblings stable `key`s, never
  wrap `children` conditionally.
- `enabled={false}` (the default in release builds) renders `children` only and
  patches nothing.
- Preview chrome (toolbar, background) never reads simulated values.
- Library code must work on iOS, Android and web (react-native-web) and with
  the React Compiler enabled.

## Frame geometry

Device specs describe the frame in portrait, in screen coordinates (the screen
top-left is the origin; the body starts at `-screenOffset`). Landscape rotates
the whole frame a quarter turn counter-clockwise (the top of the device goes
left); the app itself is laid out unrotated in the landscape screen rect
(`rotatedScreenOffset`).
