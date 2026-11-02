/**
 * A replica of the part of NativeWind v4's JSX runtime that hijacks
 * `SafeAreaProvider`, for tests (issue #5). Mirrors react-native-css-interop
 * 0.2.2 (used by nativewind 4.2.x):
 * - src/runtime/wrap-jsx.ts: `wrapJSX` runs every `jsx` / `jsxs` / `jsxDEV`
 *   call through `maybeHijackSafeAreaProvider(type)`.
 * - src/runtime/third-party-libs/react-native-safe-area-context.native.tsx:
 *   `maybeHijackSafeAreaProvider` swaps any type NAMED "SafeAreaProvider" for
 *   one shim, built once by `shimFactory` from the first such type it sees.
 *   The shim renders that type (with React's unwrapped `createElement`) around
 *   `SafeAreaEnv`, which provides the safe-area CSS variables from
 *   `useSafeAreaInsets()` when the type is the module's `SafeAreaProvider`.
 *
 * NativeWind sets Babel's `jsxImportSource` for every file Metro transforms,
 * including this library's TypeScript source, so the shim's own JSX goes
 * through it too. Tests reproduce that by mocking `react/jsx-runtime` with
 * `wrapJsxRuntime`.
 *
 * Differences from the original, all test-only:
 * - `SafeAreaEnv` requires the safe-area shim directly. In an app it requires
 *   `react-native-safe-area-context`, which the Metro helper redirects to the
 *   shim; jest has no such redirect.
 * - `VariableContext` stands in for css-interop's own context.
 * - The shim counts its renders and throws past `LOOP_LIMIT`, so an infinite
 *   render loop fails fast instead of running out of memory.
 */
import * as React from 'react';

type AnyComponent = React.ComponentType<any>;
type JSXFunction = (type: any, props: any, ...rest: any[]) => unknown;

/** css-interop's VariableContext: CSS variables by name. */
export const VariableContext = React.createContext<Record<string, unknown> | null>(null);

export const LOOP_LIMIT = 25;

/** How many times the hijacking shim rendered since the last reset. */
export const hijack = { renders: 0 };

let safeAreaProviderShim: AnyComponent | undefined;

/** Forget the cached shim (as a fresh app start would) and the render count. */
export function resetNativeWindReplica() {
  safeAreaProviderShim = undefined;
  hijack.renders = 0;
}

function maybeHijackSafeAreaProvider(type: any) {
  // Required lazily: react-native's own modules import react/jsx-runtime.
  const { Platform } = require('react-native') as typeof import('react-native');
  const name = type?.displayName || type?.name;
  if (Platform.OS !== 'web' && name === 'SafeAreaProvider') {
    safeAreaProviderShim ||= shimFactory(type);
    type = safeAreaProviderShim;
  }
  return type;
}

function shimFactory(type: AnyComponent): AnyComponent {
  function SafeAreaEnv({ children }: React.PropsWithChildren) {
    try {
      // Stands in for require('react-native-safe-area-context') under the Metro helper.
      const { useSafeAreaInsets, SafeAreaProvider } = require('../safe-area-context') as typeof import('../safe-area-context');
      if (type !== SafeAreaProvider) return React.createElement(React.Fragment, {}, children);
      const insets = useSafeAreaInsets();
      const parentVars = React.useContext(VariableContext);
      const value = React.useMemo(
        () => ({
          ...parentVars,
          '--___css-interop___safe-area-inset-bottom': insets.bottom,
          '--___css-interop___safe-area-inset-left': insets.left,
          '--___css-interop___safe-area-inset-right': insets.right,
          '--___css-interop___safe-area-inset-top': insets.top,
        }),
        [parentVars, insets],
      );
      return React.createElement(VariableContext.Provider, { value }, children);
    } catch {
      return React.createElement(React.Fragment, {}, children);
    }
  }

  return function SafeAreaProviderShim({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) {
    hijack.renders++;
    if (hijack.renders > LOOP_LIMIT) {
      throw new Error(`NativeWind's SafeAreaProvider shim rendered ${hijack.renders} times: infinite render loop`);
    }
    return React.createElement(type, props, React.createElement(SafeAreaEnv, {}, children));
  };
}

function wrapJSX(jsx: JSXFunction): JSXFunction {
  return function (type, props, ...rest) {
    return jsx.call(jsx, maybeHijackSafeAreaProvider(type), props, ...rest);
  };
}

/** `react/jsx-runtime` (or `react/jsx-dev-runtime`) as NativeWind's jsxImportSource exposes it. */
export function wrapJsxRuntime<T extends Record<string, any>>(runtime: T): T {
  const wrapped: Record<string, unknown> = { ...runtime };
  for (const key of ['jsx', 'jsxs', 'jsxDEV']) {
    if (typeof runtime[key] === 'function') wrapped[key] = wrapJSX(runtime[key]);
  }
  return wrapped as T;
}
