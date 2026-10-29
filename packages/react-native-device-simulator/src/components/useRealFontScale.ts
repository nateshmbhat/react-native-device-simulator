import { useSyncExternalStore } from 'react';
import { Dimensions } from 'react-native';
import { getRealDimensions } from '../environment';

const subscribe = (onChange: () => void) => {
  // The listener may receive simulated metrics; it is only used as a signal.
  const sub = Dimensions.addEventListener('change', onChange);
  return () => sub?.remove();
};
const getSnapshot = () => getRealDimensions('window').fontScale || 1;
const getServerSnapshot = () => 1;

/** The host's real text scale (never the simulated one). */
export function useRealFontScale(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
