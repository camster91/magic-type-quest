import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  dictionaries, formatDate, formatNumber, getLocale, isLocaleLoaded, loadLocale, localizeFingerLabel, onLocalePack,
  setLocale, supportedLocales, t, whenLocaleLoaded,
} from '../src/i18n.js';

// French and Spanish load on demand (src/lang/); the checks below need them.
await Promise.all(['fr', 'es'].map((locale) => loadLocale(locale)));

beforeEach(() => {
  globalThis.document = { documentElement: { lang: 'en' } };
  setLocale('en');
});

describe('localization', () => {
  it('supports English, French, and Spanish without missing core keys', () => {
    expect(supportedLocales).toEqual(['en', 'fr', 'es']);
    const englishKeys = Object.keys(dictionaries.en).sort();
    expect(Object.keys(dictionaries.fr).sort()).toEqual(englishKeys);
    expect(Object.keys(dictionaries.es).sort()).toEqual(englishKeys);
    setLocale('fr');
    expect(t('nav.lessons')).toBe('Leçons');
    expect(t('profile.classHint')).toContain('enseignant');
  });

  it('falls back to English for unsupported locales', () => {
    expect(setLocale('de')).toBe('en');
    expect(getLocale()).toBe('en');
  });

  it('interpolates values without evaluating them', () => {
    expect(t('game.level', { level: 3 })).toBe('Level 3');
    expect(t('game.level', { level: '<script>' })).toBe('Level <script>');
  });

  it('localizes level completion and singular/plural Daily Moment results', () => {
    setLocale('fr');
    expect(t('game.levelCompleteNamed', { level: 4 })).toBe('Niveau 4 terminé !');
    expect(t('daily.summaryOne', { wpm: 12, accuracy: 98 })).toBe('1 mot · 12 MPM · 98 % de précision');
    expect(t('daily.summaryMany', { count: 7, wpm: 18, accuracy: 95 }))
      .toBe('7 mots · 18 MPM · 95 % de précision');

    setLocale('es');
    expect(t('game.levelCompleteNamed', { level: 6 })).toBe('¡Nivel 6 completado!');
    expect(t('daily.summaryMany', { count: 3, wpm: 16, accuracy: 92 }))
      .toBe('3 palabras · 16 PPM · 92 % de precisión');
    expect(t('drill.complete')).toBe('¡Práctica de teclas débiles completada!');
  });

  it('formats numbers and dates with the active locale', () => {
    setLocale('fr');
    expect(formatNumber(1234)).toMatch(/1[\s\u202f]234/);
    expect(formatDate('2026-08-28T12:00:00Z', { year: 'numeric' })).toBe('2026');
  });

  it('localizes finger names and opposite-hand Shift instructions', () => {
    setLocale('fr');
    expect(localizeFingerLabel('Left Pinky')).toBe('auriculaire gauche');
    expect(localizeFingerLabel('Right Index (hold LEFT Shift!)')).toBe('index droit (maintiens la touche Maj gauche !)');
    setLocale('es');
    expect(localizeFingerLabel('Right Ring')).toBe('anular derecho');
  });
});

describe('on-demand languages', () => {
  it('keeps French and Spanish out of the main i18n module', () => {
    // English is built in; the others come from src/lang/ (page weight).
    const source = readFileSync(resolve(import.meta.dirname, '../src/i18n.js'), 'utf8');
    expect(source).not.toMatch(/^\s+(fr|es): \{/m);
    expect(isLocaleLoaded('en')).toBe(true);
    expect(isLocaleLoaded('de')).toBe(true); // falls back to English
  });

  it('hands loaded packs to listeners that register late', () => {
    const seen = [];
    onLocalePack((locale, pack) => seen.push([locale, typeof pack.ui, typeof pack.content, typeof pack.pet]));
    expect(seen.sort()).toEqual([['es', 'object', 'object', 'object'], ['fr', 'object', 'object', 'object']]);
  });

  it('runs a callback straight away once a language is loaded', () => {
    let ran = false;
    whenLocaleLoaded('fr', () => { ran = true; });
    expect(ran).toBe(true);
  });
});
