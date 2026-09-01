import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  getPreferredLocale,
  pageDictionaries,
  pageT,
  setPageLocale,
} from '../src/pageTranslations.js';

beforeEach(() => {
  globalThis.document = { documentElement: { lang: 'en' } };
  setPageLocale('en');
});

describe('parent and teacher page localization', () => {
  it('keeps every French and Spanish page key in parity with English', () => {
    const englishKeys = Object.keys(pageDictionaries.en).sort();
    expect(Object.keys(pageDictionaries.fr).sort()).toEqual(englishKeys);
    expect(Object.keys(pageDictionaries.es).sort()).toEqual(englishKeys);
  });

  it('defines every translation key referenced by the parent and teacher markup', () => {
    const root = resolve(import.meta.dirname, '..');
    const markup = ['parents.html', 'teacher.html']
      .map((file) => readFileSync(resolve(root, file), 'utf8'))
      .join('\n');
    const referenced = [...markup.matchAll(/data-page-(?:title|i18n|i18n-html|i18n-placeholder|i18n-aria-label)="([^"]+)"/g)]
      .map((match) => match[1]);
    expect(referenced.length).toBeGreaterThan(0);
    expect(referenced.filter((key) => !(key in pageDictionaries.en))).toEqual([]);
  });

  it('uses a valid saved learner locale before the browser preference', () => {
    const storage = { getItem: () => JSON.stringify({ locale: 'fr' }) };
    expect(getPreferredLocale(storage, 'es-MX')).toBe('fr');
  });

  it('falls back safely for corrupt profiles and unsupported browser locales', () => {
    expect(getPreferredLocale({ getItem: () => '{broken' }, 'es-MX')).toBe('es');
    expect(getPreferredLocale({ getItem: () => null }, 'de-DE')).toBe('en');
  });

  it('translates parameterized dynamic teacher messages', () => {
    setPageLocale('fr');
    expect(pageT('teacher.noClass', { code: 'ABC123' })).toContain('ABC123');
    expect(pageT('teacher.inactiveMany', { count: 3 })).toBe('3 élèves n’ont pas joué depuis au moins 7 jours.');
  });
});
