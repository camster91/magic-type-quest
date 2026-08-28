import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale } from '../src/i18n.js';
import { PET_PERSONALITY, PET_PERSONALITY_TRANSLATIONS, say } from '../src/story.js';

beforeEach(() => {
  globalThis.document = { documentElement: { lang: 'en' } };
  setLocale('en');
});

describe('localized story copy', () => {
  it('keeps every personality category and line count in French and Spanish', () => {
    const categories = Object.keys(PET_PERSONALITY).sort();
    for (const locale of ['fr', 'es']) {
      expect(Object.keys(PET_PERSONALITY_TRANSLATIONS[locale]).sort()).toEqual(categories);
      for (const category of categories) {
        expect(PET_PERSONALITY_TRANSLATIONS[locale][category]).toHaveLength(PET_PERSONALITY[category].length);
      }
    }
  });

  it('selects pet dialogue from the active locale', () => {
    setLocale('fr');
    expect(PET_PERSONALITY_TRANSLATIONS.fr.correct).toContain(say('correct'));
    setLocale('es');
    expect(PET_PERSONALITY_TRANSLATIONS.es.idle).toContain(say('idle'));
  });
});
