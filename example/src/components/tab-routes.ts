import type { SymbolViewProps } from 'expo-symbols';

import type { Strings } from '@/i18n/strings';

export interface TabRoute {
  /** Route name (file in src/app). */
  name: 'index' | 'gallery' | 'form' | 'world' | 'inspector';
  href: '/' | '/gallery' | '/form' | '/world' | '/inspector';
  label: keyof Strings['tabs'];
  icon: SymbolViewProps['name'];
}

/** The tabs, shared by the native and web tab bars. */
export const tabRoutes: TabRoute[] = [
  { name: 'index', href: '/', label: 'home', icon: { ios: 'house.fill', android: 'home', web: 'home' } },
  {
    name: 'gallery',
    href: '/gallery',
    label: 'gallery',
    icon: { ios: 'square.grid.2x2.fill', android: 'grid_view', web: 'grid_view' },
  },
  { name: 'form', href: '/form', label: 'form', icon: { ios: 'calendar', android: 'event', web: 'event' } },
  { name: 'world', href: '/world', label: 'world', icon: { ios: 'globe', android: 'language', web: 'language' } },
  {
    name: 'inspector',
    href: '/inspector',
    label: 'inspector',
    icon: { ios: 'ruler', android: 'straighten', web: 'straighten' },
  },
];
