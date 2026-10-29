import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';
import { getRealColorScheme } from '../environment';
import type { ColorSchemeName } from '../types';

const subscribe = (onChange: () => void) => {
  const sub = Appearance.addChangeListener(() => onChange());
  return () => sub.remove();
};
const getSnapshot = (): ColorSchemeName => getRealColorScheme() ?? 'light';
// Server rendering has no system colour scheme; hydration must match it.
const getServerSnapshot = (): ColorSchemeName => 'light';

/** The host's real colour scheme (never the simulated one), hydration-safe. */
export function useRealColorScheme(): ColorSchemeName {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
