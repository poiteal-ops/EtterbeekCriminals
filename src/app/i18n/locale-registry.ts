export const LOCALE_CODES = [
  'en',
  'bg',
  'hr',
  'cs',
  'da',
  'nl',
  'et',
  'fi',
  'fr',
  'de',
  'el',
  'hu',
  'ga',
  'it',
  'lv',
  'lt',
  'mt',
  'pl',
  'pt',
  'ro',
  'sk',
  'sl',
  'es',
  'sv',
  'ja',
  'nb',
] as const;

export type LocaleCode = (typeof LOCALE_CODES)[number];

export const DEFAULT_LOCALE: LocaleCode = 'en';

/**
 * Locales that currently ship real content. To add a language later:
 * create public/i18n/{code}.json (matching SiteContent) and add the code here.
 */
export const CONTENT_LOCALES: readonly LocaleCode[] = [
  'en',
  'fr',
  'de',
  'nl',
  'es',
  'it',
  'ja',
  'pt',
  'ro',
  'bg',
  'pl',
  'el',
  'sv',
  'nb',
  'hr',
  'cs',
  'da',
  'et',
  'fi',
  'hu',
];

const KNOWN_LOCALES = new Set<string>(LOCALE_CODES);

export function isKnownLocale(code: string): code is LocaleCode {
  return KNOWN_LOCALES.has(code);
}

export function hasContent(code: LocaleCode): boolean {
  return (CONTENT_LOCALES as readonly string[]).includes(code);
}

export function localeDisplayName(code: LocaleCode): string {
  try {
    const name = new Intl.DisplayNames([code], { type: 'language' }).of(code);
    return name ? name[0].toUpperCase() + name.slice(1) : code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}
