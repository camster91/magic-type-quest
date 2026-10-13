import { describe, it, expect } from 'vitest';
import {
  encodeRestoreCode,
  decodeRestoreCode,
  normalizeRestoreCode,
  mergeRestoredProgress,
} from '../src/restoreCode.js';

const sample = {
  name: 'Ava',
  uuid: 'abc-123',
  avatar: '🦊',
  locale: 'fr',
  totalStars: 412,
  totalWords: 1530,
  petEvolution: 2,
  completedLevels: [1, 2, 3, 5],
  keySR: {
    q: { correct: 2, wrong: 6 },
    z: { correct: 5, wrong: 5 },
    p: { correct: 9, wrong: 1 },
    a: { correct: 20, wrong: 0 },
    x: { correct: 1, wrong: 3 },
  },
};

describe('restore codes', () => {
  it('formats as four groups of four characters', () => {
    expect(encodeRestoreCode(sample)).toMatch(/^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/);
  });

  it('round-trips progress without the name or id', () => {
    const code = encodeRestoreCode(sample);
    const data = decodeRestoreCode(code);
    expect(data).toEqual({
      completedLevels: [1, 2, 3, 5],
      totalStars: 412,
      totalWords: 1530,
      petEvolution: 2,
      avatar: '🦊',
      locale: 'fr',
      weakKeys: ['q', 'x', 'z'],
    });
    expect(JSON.stringify(data)).not.toContain('Ava');
    expect(JSON.stringify(data)).not.toContain('abc-123');
  });

  it('encodes a brand-new profile', () => {
    const data = decodeRestoreCode(encodeRestoreCode({}));
    expect(data).toMatchObject({ completedLevels: [], totalStars: 0, totalWords: 0, petEvolution: 1, avatar: '🌸', locale: 'en', weakKeys: [] });
  });

  it('caps very large numbers instead of overflowing', () => {
    const data = decodeRestoreCode(encodeRestoreCode({ totalStars: 10_000_000, totalWords: 10_000_000 }));
    expect(data.totalStars).toBe(65535);
    expect(data.totalWords).toBe(131071);
  });

  it('accepts lowercase, spaces and look-alike letters', () => {
    const code = encodeRestoreCode(sample);
    const messy = ` ${code.toLowerCase().replace(/-/g, ' ')} `.replace(/0/g, 'o').replace(/1/g, 'l');
    expect(normalizeRestoreCode(messy)).toBe(code.replace(/-/g, ''));
    expect(decodeRestoreCode(messy)).toEqual(decodeRestoreCode(code));
  });

  it('rejects typos with the checksum', () => {
    const code = encodeRestoreCode(sample).replace(/-/g, '');
    let rejected = 0;
    let tried = 0;
    for (let i = 0; i < code.length; i++) {
      for (const ch of '0123456789ABCDEFGHJKMNPQRSTVWXYZ') {
        if (ch === code[i]) continue;
        tried++;
        if (decodeRestoreCode(code.slice(0, i) + ch + code.slice(i + 1)) === null) rejected++;
      }
    }
    expect(rejected / tried).toBeGreaterThan(0.99);
  });

  it('rejects junk input', () => {
    expect(decodeRestoreCode('')).toBeNull();
    expect(decodeRestoreCode('hello')).toBeNull();
    expect(decodeRestoreCode('UUUU-UUUU-UUUU-UUUU')).toBeNull();
    expect(decodeRestoreCode(null)).toBeNull();
  });

  it('merge keeps the higher values and never removes progress', () => {
    const profile = {
      avatar: '🐶', locale: 'es', totalStars: 900, totalWords: 100, petEvolution: 3,
      completedLevels: [4], keySR: { q: { correct: 3, wrong: 1, streak: 1, lastPracticed: 'x', interval: 2 } },
    };
    mergeRestoredProgress(profile, decodeRestoreCode(encodeRestoreCode(sample)));
    expect(profile.totalStars).toBe(900);
    expect(profile.totalWords).toBe(1530);
    expect(profile.petEvolution).toBe(3);
    expect(profile.completedLevels).toEqual([1, 2, 3, 4, 5]);
    expect(profile.avatar).toBe('🐶');
    expect(profile.locale).toBe('es');
    expect(profile.keySR.q.correct).toBe(3);
    expect(profile.keySR.x).toMatchObject({ wrong: 1, interval: 1 });
  });

  it('merge adopts avatar and language on a fresh device', () => {
    const profile = { avatar: '🌸', locale: 'en', totalStars: 0, totalWords: 0, completedLevels: [] };
    mergeRestoredProgress(profile, decodeRestoreCode(encodeRestoreCode(sample)));
    expect(profile.avatar).toBe('🦊');
    expect(profile.locale).toBe('fr');
  });
});
