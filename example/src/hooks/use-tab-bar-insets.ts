import { BottomTabInset } from '@/constants/theme';

/** Extra space screens keep free for the tab bar (on top of safe area insets). */
export function useTabBarInsets(): { top: number; bottom: number } {
  return { top: 0, bottom: BottomTabInset };
}
