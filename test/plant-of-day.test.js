import { describe, expect, it } from 'vitest';
import {
  MINUTES_TO_PLANT, PLANTS, backfillPlants, gardenDays, grownPlants, plantForDay, plantToday, plantWaiting, plantedToday,
} from '../src/plantOfDay.js';
import { recordPractice } from '../src/practiceLog.js';
import { loadLocale, dictionaries } from '../src/i18n.js';

// French and Spanish load on demand (src/lang/); the checks below need them.
await Promise.all(['fr', 'es'].map((locale) => loadLocale(locale)));

const day = (iso) => new Date(`${iso}T12:00:00`);

describe('plant of the day', () => {
  it('gives every day a plant, and the next day a different one', () => {
    const seen = new Set();
    for (let d = 1; d <= 10; d++) {
      const key = `2026-10-${String(d).padStart(2, '0')}`;
      const next = `2026-10-${String(d + 1).padStart(2, '0')}`;
      expect(plantForDay(key)).not.toBe(plantForDay(next));
      seen.add(plantForDay(key).id);
    }
    expect(seen.size).toBe(PLANTS.length);
    expect(plantForDay('2026-10-13')).toBe(plantForDay('2026-10-13'));
  });

  it('plants today\'s plant once the day has enough practice', () => {
    const profile = {};
    expect(plantToday(profile, day('2026-10-13'))).toBeNull(); // no practice yet
    recordPractice(profile, 20_000, day('2026-10-13')); // 20 seconds: not yet
    expect(plantedToday(profile, day('2026-10-13'))).toBe(false);
    recordPractice(profile, 20_000, day('2026-10-13')); // now over half a minute
    expect(plantedToday(profile, day('2026-10-13'))).toBe(true);
    expect(gardenDays(profile)).toBe(1);
    recordPractice(profile, 600_000, day('2026-10-13')); // more practice the same day
    expect(gardenDays(profile)).toBe(1);
    expect(MINUTES_TO_PLANT).toBe(0.5);
  });

  it('never takes anything away when a child misses days', () => {
    const profile = {};
    recordPractice(profile, 60_000, day('2026-10-01'));
    recordPractice(profile, 60_000, day('2026-10-02'));
    expect(plantWaiting(profile, day('2026-10-09'))).toBe(true);
    expect(gardenDays(profile)).toBe(2);
    recordPractice(profile, 60_000, day('2026-10-09'));
    expect(gardenDays(profile)).toBe(3);
    expect(plantWaiting(profile, day('2026-10-09'))).toBe(false);
    expect(grownPlants(profile).reduce((sum, p) => sum + p.count, 0)).toBe(3);
  });

  it('never plants the same calendar day twice, even if the clock goes back', () => {
    const profile = {};
    recordPractice(profile, 60_000, day('2026-10-13'));
    recordPractice(profile, 60_000, day('2026-10-14'));
    recordPractice(profile, 60_000, day('2026-10-13')); // clock corrected backwards
    expect(gardenDays(profile)).toBe(2);
    expect(profile.plantedDays).toEqual(['2026-10-13', '2026-10-14']);
  });

  it('gives children who played before plants existed the plants they earned', () => {
    const profile = { totalWords: 90, practiceLog: { '2026-09-01': 4, '2026-09-03': 0.2, '2026-09-05': 2 } };
    expect(plantWaiting(profile, day('2026-10-13'))).toBe(true); // returning child, even before backfill
    expect(backfillPlants(profile)).toBe(2); // the 0.2-minute day is too short
    expect(gardenDays(profile)).toBe(2);
    expect(profile.lastPlantDate).toBe('2026-09-05');
    expect(backfillPlants(profile)).toBe(0); // only once
  });

  it('does not nag a brand-new player', () => {
    expect(plantWaiting({}, day('2026-10-13'))).toBe(false);
  });

  it('names every plant in every language', () => {
    for (const [lang, dict] of Object.entries(dictionaries)) {
      for (const plant of PLANTS) expect(dict[`plant.${plant.id}`], `${lang} ${plant.id}`).toBeTruthy();
      for (const key of ['plant.title', 'plant.count', 'plant.today', 'plant.plantedToday', 'plant.waiting', 'plant.none', 'pet.plantWaiting']) {
        expect(dict[key], `${lang} ${key}`).toBeTruthy();
      }
    }
  });
});
