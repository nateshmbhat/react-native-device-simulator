export interface DeviceSimulatorMetroOptions {
  /**
   * Redirect `react-native-safe-area-context` to a preview-aware version
   * (`SafeAreaProvider`, `SafeAreaView`, `SafeAreaListener` report the
   * simulated insets). Default true.
   */
  safeArea?: boolean;
  /**
   * Redirect React Native's / react-native-web's `Text` and `TextInput` to
   * versions that apply the simulated font scale and bold text. Default true.
   */
  textScaling?: boolean;
  /**
   * On web, replace react-native-web's `KeyboardAvoidingView` (a plain View)
   * with a port of React Native's implementation that avoids the simulated
   * keyboard. Default true.
   */
  keyboardAvoidingView?: boolean;
}

/**
 * Adds the react-native-device-simulator module redirects to a Metro config,
 * chaining any existing `resolver.resolveRequest`.
 */
export function withDeviceSimulator<T extends object>(config: T, options?: DeviceSimulatorMetroOptions): T;

/** Absolute path of the shims directory. */
export const SHIMS_DIR: string;
