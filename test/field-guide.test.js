import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { FIELD_GUIDE, discoverForLevel, discoveredCards } from '../src/fieldGuide.js';
import { dictionaries as translations } from '../src/i18n.js';

describe('Field Guide', () => {
  it('discovers the card for a level the first time it is finished', () => {
    const profile = { completedLevels: [] };
    expect(discoverForLevel(profile, 1)?.id).toBe('monarch');
    expect(discoverForLevel(profile, 1)).toBeNull();
    expect(profile.fieldGuide).toEqual(['monarch']);
  });

  it('lets older profiles catch up on levels they already finished', () => {
    const profile = { completedLevels: [1, 2, 3] };
    expect(discoverForLevel(profile, 4)?.id).toBe('milkweed');
    expect(discoveredCards(profile).map((c) => c.id)).toEqual(['monarch', 'bumblebee', 'bluebird', 'milkweed']);
  });

  it('ignores levels without a card', () => {
    const profile = {};
    expect(discoverForLevel(profile, 9)).toBeNull();
    expect(discoverForLevel(null, 1)).toBeNull();
  });

  it('has a name and a fact for every card in every language', () => {
    for (const locale of ['en', 'fr', 'es']) {
      for (const card of FIELD_GUIDE) {
        expect(translations[locale][`fieldguide.${card.id}.name`], `${locale} ${card.id}`).toBeTruthy();
        expect(translations[locale][`fieldguide.${card.id}.fact`], `${locale} ${card.id}`).toBeTruthy();
      }
    }
  });

  it('keeps every fact listed with a source', () => {
    const doc = readFileSync('docs/v2/FIELD-GUIDE-FACTS.md', 'utf8');
    for (const card of FIELD_GUIDE) expect(doc).toContain(translations.en[`fieldguide.${card.id}.fact`]);
  });
});
