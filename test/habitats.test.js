import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { HABITATS, MAX_STAGE, habitatForLevel, habitatStage, isHabitatUnlocked, worldMap } from '../src/habitats.js';
import { LESSON_LEVELS } from '../src/lessonLevels.js';
import { loadLocale, dictionaries } from '../src/i18n.js';

// French and Spanish load on demand (src/lang/); the checks below need them.
await Promise.all(['fr', 'es'].map((locale) => loadLocale(locale)));

describe('world map habitats', () => {
  it('has 5 habitats in order, two levels each, covering every level once', () => {
    expect(HABITATS.map((h) => h.id)).toEqual(['meadow', 'pond', 'forest', 'shore', 'mountain']);
    expect(HABITATS.flatMap((h) => h.levels)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(HABITATS.flatMap((h) => h.levels)).toEqual(Object.values(LESSON_LEVELS).map((l) => l.id));
  });

  it('finds the habitat for each level', () => {
    expect(habitatForLevel(1).id).toBe('meadow');
    expect(habitatForLevel(2).id).toBe('meadow');
    expect(habitatForLevel(3).id).toBe('pond');
    expect(habitatForLevel(6).id).toBe('forest');
    expect(habitatForLevel(7).id).toBe('shore');
    expect(habitatForLevel('10').id).toBe('mountain');
    for (const bad of [0, 11, -1, null, undefined, '', 'x', 1.5]) expect(habitatForLevel(bad)).toBeNull();
  });

  it('restores a habitat in stages as its levels are finished', () => {
    expect(habitatStage('meadow', [])).toBe(0);
    expect(habitatStage('meadow', [1])).toBe(1);
    expect(habitatStage('meadow', [2])).toBe(1);
    expect(habitatStage('meadow', [1, 2, 3])).toBe(MAX_STAGE);
    expect(habitatStage('pond', [1, 2, 3])).toBe(1);
    expect(habitatStage(HABITATS[4], [9, 10])).toBe(2);
  });

  it('copes with damaged or missing progress', () => {
    for (const bad of [undefined, null, 42, 'meadow', {}]) {
      expect(habitatStage('meadow', bad)).toBe(0);
      expect(isHabitatUnlocked('pond', bad)).toBe(false);
    }
    expect(habitatStage('meadow', [1, 1, '1'])).toBe(1);
    expect(habitatStage('meadow', ['1', '2'])).toBe(2);
    expect(habitatStage('nowhere', [1])).toBe(0);
    expect(isHabitatUnlocked('nowhere', [1])).toBe(false);
  });

  it('opens a habitat when its first level opens', () => {
    expect(isHabitatUnlocked('meadow', [])).toBe(true);
    expect(isHabitatUnlocked('pond', [1])).toBe(false);
    expect(isHabitatUnlocked('pond', [1, 2])).toBe(true);
    expect(isHabitatUnlocked('mountain', [8])).toBe(true);
    // Sparse restored or linked progress: Forest has level 5 done without level 4.
    expect(isHabitatUnlocked('forest', [1, 5])).toBe(true);
    expect(isHabitatUnlocked('shore', [1, 5])).toBe(false);
  });

  it('describes the whole map for a profile', () => {
    const map = worldMap([1, 2, 3]);
    expect(map.map((h) => [h.id, h.stage, h.unlocked])).toEqual([
      ['meadow', 2, true], ['pond', 1, true], ['forest', 0, false], ['shore', 0, false], ['mountain', 0, false],
    ]);
    expect(map[0].restored).toBe(true);
    expect(map[1].restored).toBe(false);
    expect(map[2].unlockLevel).toBe(4);
  });

  it('has child-facing names in every language', () => {
    for (const locale of ['en', 'fr', 'es']) {
      for (const h of HABITATS) expect(dictionaries[locale][`map.${h.id}`], `${locale} ${h.id}`).toBeTruthy();
    }
  });

  it('gives each habitat its own art hook in the stylesheet', () => {
    const css = readFileSync('styles.css', 'utf8');
    for (const h of HABITATS) expect(css).toContain(`.habitat--${h.id}`);
  });
});
