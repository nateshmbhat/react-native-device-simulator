// Dependency-free on purpose: imported by the Metro shims (Text, TextInput,
// safe-area-context), which must not pull the store or the device catalog
// into apps that only use the Metro helper.
import { createContext, useContext } from 'react';
import type { ResolvedSimulation } from './types';

/** Provided inside the simulated screen (consumed by hooks and Metro shims). */
export interface PreviewScreenContextValue {
  /** True while a device is being simulated. */
  active: boolean;
  simulation: ResolvedSimulation;
  /** Multiplier to apply on top of the host's own text scaling. */
  fontScaleMultiplier: number;
  boldText: boolean;
}

export const PreviewScreenContext = createContext<PreviewScreenContextValue | null>(null);

/** Inside the simulated screen: the simulation, or null when not simulating. */
export function usePreviewScreen(): PreviewScreenContextValue | null {
  const value = useContext(PreviewScreenContext);
  return value?.active ? value : null;
}
