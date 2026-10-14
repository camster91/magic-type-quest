import { beforeEach, describe, expect, it, vi } from 'vitest';

// Spanish cannot be fetched here, as for an installed app that is offline
// before its service worker cached the language (public/sw.js).
let spanishOnline = false;
vi.mock('../src/lang/es.js', async (importOriginal) => {
  if (!spanishOnline) throw new Error('offline');
  return importOriginal();
});

const { changeLocale, dictionaries, getLocale, isLocaleLoaded, loadLocale, setLocale, t } = await import('../src/i18n.js');

beforeEach(() => {
  globalThis.document = { documentElement: { lang: 'en' } };
  setLocale('en');
  spanishOnline = false;
});

describe('a language that cannot load', () => {
  it('reports the failure instead of pretending it loaded', async () => {
    expect(await loadLocale('es')).toBe(false);
    expect(isLocaleLoaded('es')).toBe(false);
    expect(dictionaries.es).toBeUndefined();
  });

  it('keeps the current language, so the page never claims one its text is not in', async () => {
    const applied = await new Promise((done) => changeLocale('es', (...args) => done(args)));
    expect(applied).toEqual(['en', false]);
    expect(getLocale()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(t('nav.lessons')).toBe(dictionaries.en['nav.lessons']);
  });

  it('keeps French when Spanish fails while French is showing', async () => {
    expect(await loadLocale('fr')).toBe(true);
    changeLocale('fr', () => {});
    expect(getLocale()).toBe('fr');
    const [locale] = await new Promise((done) => changeLocale('es', (...args) => done(args)));
    expect(locale).toBe('fr');
    expect(document.documentElement.lang).toBe('fr');
  });

  it('tries again later and switches once the language arrives', async () => {
    expect(await loadLocale('es')).toBe(false);
    spanishOnline = true;
    vi.resetModules(); // forget the failed import
    const [locale, switched] = await new Promise((done) => changeLocale('es', (...args) => done(args)));
    expect([locale, switched]).toEqual(['es', true]);
    expect(document.documentElement.lang).toBe('es');
  });

  it('lets a newer pick win over a language still loading', async () => {
    const apply = vi.fn();
    changeLocale('es', apply, () => false);
    await loadLocale('es');
    await Promise.resolve();
    expect(apply).not.toHaveBeenCalled();
    expect(getLocale()).toBe('en');
  });
});
