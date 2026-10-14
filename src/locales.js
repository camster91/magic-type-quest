/**
 * The languages BloomType ships, and which one a page should open in.
 * Kept free of dictionaries so a page can decide its language before
 * downloading any translations (landing.html loads them only for fr/es).
 */
export const supportedLocales = ['en', 'fr', 'es'];

export function getPreferredLocale(storage = globalThis.localStorage, browserLanguage = globalThis.navigator?.language) {
  try {
    const saved = JSON.parse(storage?.getItem('bloomtype-profile') || 'null');
    if (supportedLocales.includes(saved?.locale)) return saved.locale;
  } catch {
    // Ignore corrupt legacy profiles and use the browser preference.
  }
  const browserLocale = browserLanguage?.split('-')[0];
  return supportedLocales.includes(browserLocale) ? browserLocale : 'en';
}
