import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { dictionaries } from '../src/i18n.js';
import { pageDictionaries } from '../src/pageTranslations.js';
import { translatedContent } from '../src/contentTranslations.js';

const root = resolve(import.meta.dirname, '..');
const placeholders = (text) => (String(text).match(/\{\w+\}/g) || []).sort();
const htmlTags = (text) => (String(text).match(/<\/?[a-z0-9]+/gi) || []).map((tag) => tag.toLowerCase());

// Strings that are legitimately identical to English in the target language
// (cognates, proper names, units). Anything else that matches English is
// treated as an untranslated string.
const SAME_AS_ENGLISH = {
  game: {
    fr: ['plant.aster', 'a11y.fontDefault', 'a11y.fontDyslexic', 'nav.parents', 'metric.score'],
    es: ['a11y.fontDyslexic', 'common.colon'],
  },
  page: {
    fr: ['family.recordDate', 'family.recordMinutes', 'teacher.local', 'teacher.score', 'teacher.source'],
    es: ['teacher.local', 'teacher.pin'],
  },
};

const sets = [
  ['game', dictionaries],
  ['page', pageDictionaries],
];

describe.each(sets)('%s dictionary translation quality', (name, dicts) => {
  it.each(['fr', 'es'])('has no key missing in %s compared with English', (locale) => {
    const missing = Object.keys(dicts.en).filter((key) => !(key in dicts[locale]));
    const extra = Object.keys(dicts[locale]).filter((key) => !(key in dicts.en));
    expect({ missing, extra }).toEqual({ missing: [], extra: [] });
  });

  it.each(['fr', 'es'])('keeps every {placeholder} from English in %s', (locale) => {
    const mismatched = Object.keys(dicts.en)
      .filter((key) => key in dicts[locale])
      .filter((key) => placeholders(dicts.en[key]).join() !== placeholders(dicts[locale][key]).join());
    expect(mismatched).toEqual([]);
  });

  it.each(['fr', 'es'])('has no empty or still-English strings in %s', (locale) => {
    const allowed = new Set(SAME_AS_ENGLISH[name][locale]);
    const suspicious = Object.keys(dicts.en)
      .filter((key) => !String(dicts[locale][key] ?? '').trim() || (dicts[locale][key] === dicts.en[key] && !allowed.has(key)));
    expect(suspicious).toEqual([]);
  });

  it.each(['fr', 'es'])('keeps the HTML structure of rich strings in %s', (locale) => {
    const broken = Object.keys(dicts.en)
      .filter((key) => htmlTags(dicts.en[key]).join() !== htmlTags(dicts[locale][key]).join());
    expect(broken).toEqual([]);
  });
});

describe('static markup and dictionaries stay in sync', () => {
  it('defines every data-i18n key used by the game markup', () => {
    const markup = readFileSync(resolve(root, 'index.html'), 'utf8');
    const referenced = [...markup.matchAll(/data-i18n(?:-placeholder|-aria-label|-title|-alt)?="([^"]+)"/g)].map((m) => m[1]);
    expect(referenced.length).toBeGreaterThan(50);
    expect([...new Set(referenced.filter((key) => !(key in dictionaries.en)))]).toEqual([]);
  });

  it('defines an avatar name for every avatar button', () => {
    const markup = readFileSync(resolve(root, 'index.html'), 'utf8');
    const names = [...markup.matchAll(/data-avatar-name="([^"]+)"/g)].map((m) => m[1]);
    expect(names).toHaveLength(10);
    expect(names.filter((avatar) => !(`avatar.${avatar}` in dictionaries.en))).toEqual([]);
  });

  it('does not leave English-only aria-labels on visible game controls', () => {
    const markup = readFileSync(resolve(root, 'index.html'), 'utf8');
    const untranslated = [...markup.matchAll(/<[^>]*\saria-label="[^"]*"[^>]*>/g)]
      .map((m) => m[0])
      .filter((tag) => !/data-i18n-aria-label=|data-avatar-name=/.test(tag))
      // The sound toggle's label depends on state; main.js sets it with t('sound.on' | 'sound.off').
      .filter((tag) => !tag.includes('id="btn-sound"'));
    expect(untranslated).toEqual([]);
  });

  it('keeps the English parent privacy copy as complete as the static page', () => {
    const markup = readFileSync(resolve(root, 'parents.html'), 'utf8');
    const block = markup.match(/data-page-i18n-html="parent\.privacy">([\s\S]*?)<\/div>/)[1];
    const headings = [...block.matchAll(/<h3>([^<]+)<\/h3>/g)].map((m) => m[1]);
    for (const heading of headings) expect(pageDictionaries.en['parent.privacy']).toContain(`<h3>${heading}</h3>`);
  });
});

describe('For Schools page (landing.html) translations', () => {
  const markup = readFileSync(resolve(root, 'landing.html'), 'utf8');
  const doc = new JSDOM(markup).window.document;
  const collapse = (text) => String(text).replace(/\s+/g, ' ').trim();
  const tagged = (attribute) => [...doc.querySelectorAll(`[${attribute}]`)].map((element) => [element.getAttribute(attribute), element]);
  // Strings the page keeps outside data-page-i18n*: src/landing.js sets them.
  const attributeStrings = () => [
    ['landing.metaDescription', doc.querySelector('meta[name="description"]').getAttribute('content')],
    ['landing.mostPopular', doc.querySelector('.price-card.featured').dataset.badge],
    ['landing.demoStreak', doc.getElementById('demo-canvas').dataset.streakLabel],
    ['landing.demoRank', doc.getElementById('demo-canvas').dataset.rankLabel],
  ];

  it.each(['en', 'fr', 'es'])('defines every data-page-i18n* key used by landing.html in %s', (locale) => {
    const referenced = [...markup.matchAll(/data-page-(?:title|i18n|i18n-html|i18n-placeholder|i18n-aria-label)="([^"]+)"/g)]
      .map((match) => match[1]);
    expect(referenced.length).toBeGreaterThan(80);
    expect(referenced.filter((key) => !key.startsWith('landing.'))).toEqual([]);
    expect([...new Set(referenced.filter((key) => !(key in pageDictionaries[locale])))]).toEqual([]);
    expect(attributeStrings().map(([key]) => key).filter((key) => !(key in pageDictionaries[locale]))).toEqual([]);
  });

  it('keeps the English dictionary identical to the static page, its source of truth', () => {
    const differences = [
      ...tagged('data-page-i18n').map(([key, element]) => [key, collapse(element.textContent)]),
      ...tagged('data-page-i18n-html').map(([key, element]) => [key, collapse(element.innerHTML)]),
      ...tagged('data-page-i18n-aria-label').map(([key, element]) => [key, element.getAttribute('aria-label')]),
      [doc.documentElement.dataset.pageTitle, doc.title],
      ...attributeStrings(),
    ].filter(([key, text]) => pageDictionaries.en[key] !== text);
    expect(differences).toEqual([]);
  });

  it('leaves no visible English text outside a translated element', () => {
    for (const element of doc.querySelectorAll('script, style')) element.remove();
    const walker = doc.createTreeWalker(doc.body, 4 /* NodeFilter.SHOW_TEXT */);
    const untranslated = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = collapse(node.textContent);
      // Emoji, prices and ✓ marks carry no words; BloomType is the product name.
      if (!/\p{L}/u.test(text) || text === 'BloomType') continue;
      if (!node.parentElement.closest('[data-page-i18n], [data-page-i18n-html]')) untranslated.push(text);
    }
    expect(untranslated).toEqual([]);
  });
});

describe('lesson, quest and achievement content translations', () => {
  const shape = (value) => (value && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shape(inner)]))
    : placeholders(value).join());

  it('gives French and Spanish the same content entries and placeholders', () => {
    expect(shape(translatedContent.es)).toEqual(shape(translatedContent.fr));
  });
});
