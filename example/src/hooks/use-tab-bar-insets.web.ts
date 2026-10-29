import { useWindowDimensions } from 'react-native';

import { Breakpoints } from '@/constants/theme';

/** Height of the web tab bars drawn by `app-tabs.web.tsx`. */
export const WebTabBarHeight = { bottom: 64, top: 72 } as const;

/** Whether the web tabs render as a bottom bar (phones) or a top bar. */
export function useCompactTabs(): boolean {
  return useWindowDimensions().width < Breakpoints.medium;
}

/** Extra space screens keep free for the tab bar (on top of safe area insets). */
export function useTabBarInsets(): { top: number; bottom: number } {
  const compact = useCompactTabs();
  return compact ? { top: 0, bottom: WebTabBarHeight.bottom } : { top: WebTabBarHeight.top, bottom: 0 };
}
