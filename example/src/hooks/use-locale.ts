import { isRTLLocale, useDeviceSimulator, useDeviceSimulatorLocale } from 'react-native-device-simulator';

import { languageFor, strings, type Language, type Strings } from '@/i18n/strings';

/** The real device locale. A production app would use `expo-localization`. */
function deviceLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
  } catch {
    return 'en-US';
  }
}

export interface AppLocale {
  /** BCP-47 tag used for `Intl` formatting. */
  locale: string;
  language: Language;
  t: Strings;
  isRTL: boolean;
  /** `undefined` follows the locale's convention. */
  hour12: boolean | undefined;
  /** True when the locale comes from the device simulator. */
  isSimulated: boolean;
}

/**
 * The locale the app should render in: the simulated one while previewing a
 * device, the real device locale otherwise.
 */
export function useLocale(): AppLocale {
  const previewLocale = useDeviceSimulatorLocale();
  const { settings, isActive } = useDeviceSimulator();
  const raw = previewLocale ?? deviceLocale();
  const language = languageFor(raw);
  const t = strings[language];
  // A bare language tag ("fr") formats better with the dictionary's region.
  const locale = raw.includes('-') ? raw : t.locale;
  const use24h = isActive ? settings.use24HourClock : null;
  return {
    locale,
    language,
    t,
    isRTL: isRTLLocale(locale),
    hour12: use24h == null ? undefined : !use24h,
    isSimulated: previewLocale != null,
  };
}
