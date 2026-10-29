/**
 * Locales offered by the locale picker. Native names are hard-coded because
 * `Intl.DisplayNames` is missing on some JS engines (older Hermes).
 */
export interface LocaleOption {
  /** BCP-47 tag. */
  tag: string;
  /** Name in the language itself. */
  native: string;
  /** English name, for searching. */
  english: string;
  rtl?: boolean;
}

export const LOCALES: readonly LocaleOption[] = [
  { tag: 'en-US', native: 'English (US)', english: 'English United States' },
  { tag: 'en-GB', native: 'English (UK)', english: 'English United Kingdom' },
  { tag: 'es-ES', native: 'Español (España)', english: 'Spanish Spain' },
  { tag: 'es-MX', native: 'Español (México)', english: 'Spanish Mexico Latin America' },
  { tag: 'fr-FR', native: 'Français', english: 'French France' },
  { tag: 'de-DE', native: 'Deutsch', english: 'German Germany' },
  { tag: 'it-IT', native: 'Italiano', english: 'Italian Italy' },
  { tag: 'pt-BR', native: 'Português (Brasil)', english: 'Portuguese Brazil' },
  { tag: 'pt-PT', native: 'Português (Portugal)', english: 'Portuguese Portugal' },
  { tag: 'nl-NL', native: 'Nederlands', english: 'Dutch Netherlands' },
  { tag: 'sv-SE', native: 'Svenska', english: 'Swedish Sweden' },
  { tag: 'nb-NO', native: 'Norsk bokmål', english: 'Norwegian Norway' },
  { tag: 'da-DK', native: 'Dansk', english: 'Danish Denmark' },
  { tag: 'fi-FI', native: 'Suomi', english: 'Finnish Finland' },
  { tag: 'pl-PL', native: 'Polski', english: 'Polish Poland' },
  { tag: 'cs-CZ', native: 'Čeština', english: 'Czech Czechia' },
  { tag: 'el-GR', native: 'Ελληνικά', english: 'Greek Greece' },
  { tag: 'tr-TR', native: 'Türkçe', english: 'Turkish Turkey' },
  { tag: 'ru-RU', native: 'Русский', english: 'Russian Russia' },
  { tag: 'uk-UA', native: 'Українська', english: 'Ukrainian Ukraine' },
  { tag: 'ar', native: 'العربية', english: 'Arabic', rtl: true },
  { tag: 'he', native: 'עברית', english: 'Hebrew Israel', rtl: true },
  { tag: 'fa', native: 'فارسی', english: 'Persian Farsi Iran', rtl: true },
  { tag: 'ur', native: 'اردو', english: 'Urdu Pakistan', rtl: true },
  { tag: 'hi-IN', native: 'हिन्दी', english: 'Hindi India' },
  { tag: 'bn-BD', native: 'বাংলা', english: 'Bengali Bangla Bangladesh' },
  { tag: 'th-TH', native: 'ไทย', english: 'Thai Thailand' },
  { tag: 'vi-VN', native: 'Tiếng Việt', english: 'Vietnamese Vietnam' },
  { tag: 'id-ID', native: 'Bahasa Indonesia', english: 'Indonesian Indonesia' },
  { tag: 'ms-MY', native: 'Bahasa Melayu', english: 'Malay Malaysia' },
  { tag: 'ja-JP', native: '日本語', english: 'Japanese Japan' },
  { tag: 'ko-KR', native: '한국어', english: 'Korean Korea' },
  { tag: 'zh-CN', native: '简体中文', english: 'Chinese Simplified China' },
  { tag: 'zh-TW', native: '繁體中文', english: 'Chinese Traditional Taiwan' },
];

function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Locales whose tag, native or English name contains every word of the query. */
export function filterLocales(locales: readonly LocaleOption[], query: string): LocaleOption[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...locales];
  return locales.filter((l) => {
    const haystack = fold(`${l.tag} ${l.tag.replace('-', '_')} ${l.native} ${l.english}${l.rtl ? ' rtl' : ''}`);
    return words.every((w) => haystack.includes(w));
  });
}

/** `العربية (ar)`; unknown tags are shown as is. */
export function localeLabel(tag: string, locales: readonly LocaleOption[] = LOCALES): string {
  const match = locales.find((l) => l.tag.toLowerCase() === tag.toLowerCase());
  return match ? `${match.native} (${match.tag})` : tag;
}
