import { beforeEach, describe, expect, it } from 'vitest';
import { formatDate, formatNumber, getLocale, setLocale, supportedLocales, t } from '../src/i18n.js';

beforeEach(() => {
  globalThis.document = { documentElement: { lang: 'en' } };
  setLocale('en');
});

describe('localization', () => {
  it('supports English, French, and Spanish with English fallback', () => {
    expect(supportedLocales).toEqual(['en', 'fr', 'es']);
    setLocale('fr');
    expect(t('nav.lessons')).toBe('Leçons');
    expect(t('profile.classHint')).toBe('Ask your teacher for a class code to share your progress.');
  });

  it('falls back to English for unsupported locales', () => {
    expect(setLocale('de')).toBe('en');
    expect(getLocale()).toBe('en');
  });

  it('interpolates values without evaluating them', () => {
    expect(t('game.level', { level: 3 })).toBe('Level 3');
    expect(t('game.level', { level: '<script>' })).toBe('Level <script>');
  });

  it('formats numbers and dates with the active locale', () => {
    setLocale('fr');
    expect(formatNumber(1234)).toMatch(/1[\s\u202f]234/);
    expect(formatDate('2026-08-28T12:00:00Z', { year: 'numeric' })).toBe('2026');
  });
});
