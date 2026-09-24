// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { LESSONS, LESSON_ORDER, auditCurriculum, getAllowedKeys, getLesson, getNextLesson, getPracticeItems, validatePracticeItem } from '../src/v2/curriculum/domain.ts';
import { BIOME_ORDER, LESSON_BIOMES, auditBiomeMapping, getBiomeForLesson } from '../src/v2/curriculum/biomeMapping.ts';
import { ALL_WORDS, ALL_SENTENCES } from '../src/words.js';
import { LESSON_LEVELS, getLessonByLevel, getLessonWordsForPractice } from '../src/lessonLevels.js';
import { assertLegacyContentAllowed, getLegacyAllowedCharacters, getLegacyContentAudit, isLegacyItemAllowed } from '../src/v2/curriculum/legacyAdapter.ts';
import { buildDrillLesson, generateDrillWords } from '../src/drills.js';
import { buildReviewWords } from '../src/spacedRep.js';
import { localizeLesson } from '../src/contentTranslations.js';
import { setLocale } from '../src/i18n.js';

const locales = ['en', 'fr', 'es'];
const modes = ['lesson', 'practice', 'daily', 'drill', 'review'];

describe('v2 curriculum contract', () => {
  it('validates every lesson, locale, mode, prerequisite and assessed character', () => {
    expect(auditCurriculum()).toEqual([]);
    expect(new Set(LESSON_ORDER).size).toBe(LESSONS.length);
    for (const lesson of LESSONS) {
      expect(lesson.contentVersion).toBeGreaterThan(0);
      expect(lesson.displayNameKey).toMatch(/^lesson\./);
      expect(lesson.completion.minimumState).toBe('familiar');
      expect(getAllowedKeys(lesson.id)).toEqual(lesson.allowedAssessedKeys);
      for (const locale of locales) {
        const items = getPracticeItems(lesson.id, locale);
        expect(items.length).toBeGreaterThan(0);
        for (const mode of modes) for (const item of items) {
          expect(validatePracticeItem(item, lesson.id, locale, mode), `${lesson.id}/${locale}/${mode}/${item.id}`).toEqual([]);
        }
      }
    }
  });

  it('follows a deterministic prerequisite order and maps exactly to six biomes', () => {
    expect(auditBiomeMapping()).toEqual([]);
    expect(Object.keys(LESSON_BIOMES).sort()).toEqual([...LESSON_ORDER].sort());
    expect(new Set(Object.values(LESSON_BIOMES))).toEqual(new Set(BIOME_ORDER));
    const completedLessonIds = [];
    for (const id of LESSON_ORDER) {
      expect(getNextLesson({ completedLessonIds })?.id).toBe(id);
      expect(BIOME_ORDER).toContain(getBiomeForLesson(id));
      completedLessonIds.push(id);
    }
    expect(getNextLesson({ completedLessonIds })).toBeNull();
  });

  it('rejects future letters, capitals, punctuation, numbers and unreviewed accents in every mode', () => {
    const cases = [
      ['meadow-fj', 'fg', 'en'],
      ['meadow-growth', 'half', 'en'],
      ['forest-upper', 'Fox', 'en'],
      ['wetlands-lower', '2', 'en'],
      ['river-shift', 'fox?', 'en'],
      ['mountain-numbers', '1,2', 'en'],
      ['reserve-fluency', 'é', 'fr'],
    ];
    for (const [id, value, locale] of cases) for (const mode of modes) {
      expect(validatePracticeItem({ id: 'invalid', text: value, kind: 'pattern', locales }, id, locale, mode).length, `${id}/${mode}/${value}`).toBeGreaterThan(0);
    }
    expect(getPracticeItems('meadow-growth', 'fr').every((item) => item.kind === 'pattern')).toBe(true);
    expect(getPracticeItems('meadow-growth', 'es').map((item) => item.id)).toEqual(getPracticeItems('meadow-growth', 'fr').map((item) => item.id));
    expect(getLesson('mountain-punctuation').punctuation.requiresShift).toEqual(['?', '!']);
  });
});

describe('v1 compatibility gate (#139)', () => {
  it('filters every assessed word, sentence and practice pattern without editing historical banks', () => {
    // Historical rejection ceiling: a newly introduced unsafe item fails CI.
    const rejectionCeiling = [
      [111, 19, 0], [87, 19, 0], [78, 19, 1], [0, 0, 0], [0, 0, 0],
      [164, 1, 0], [0, 0, 0], [1, 0, 0], [0, 0, 0], [60, 0, 0],
    ];
    for (let level = 1; level <= 10; level++) {
      const lesson = getLessonByLevel(level);
      for (const item of [...lesson.words, ...lesson.sentences, ...lesson.practicePatterns, ...getLessonWordsForPractice(lesson, 20)]) {
        expect(isLegacyItemAllowed(item, level), `v1 L${level}: ${item}`).toBe(true);
      }
      const source = { words: ALL_WORDS[level], sentences: ALL_SENTENCES[level] || [], practicePatterns: LESSON_LEVELS[level].practicePatterns || [] };
      const audit = getLegacyContentAudit(level, source);
      expect([audit.words.rejected, audit.sentences.rejected, audit.practicePatterns.rejected].every((count, index) => count <= rejectionCeiling[level - 1][index]), `v1 L${level}: new invalid material`).toBe(true);
      expect(audit.words.total).toBeGreaterThan(0);
      expect(lesson.words.length).toBe(audit.words.total - audit.words.rejected);
    }
    expect(isLegacyItemAllowed('grass', 1)).toBe(false);
    expect(isLegacyItemAllowed('glass', 4)).toBe(true);
    expect(getLegacyAllowedCharacters(4).has('g')).toBe(true);
    expect(getLegacyAllowedCharacters(4).has('h')).toBe(true);
    expect(LESSON_LEVELS[4].teaches).toMatch(/g and h/);
  });

  it('fails loudly for new malformed content and gates drills and review to unlocked keys', () => {
    expect(() => assertLegacyContentAllowed(1, { words: ['grass'], sentences: [], practicePatterns: [] })).toThrow(/unintroduced key/);
    expect(() => assertLegacyContentAllowed(1, { words: ['sad'], sentences: [], practicePatterns: [] })).not.toThrow();
    expect(generateDrillWords(['a'], ['grass', 'sad', 'dad'], 10, 1).every((word) => isLegacyItemAllowed(word, 1))).toBe(true);
    expect(buildDrillLesson(['g'], 1)).toBeNull();
    const drill = buildDrillLesson(['a', 'g'], 1);
    expect(drill?.words.length).toBeGreaterThan(0);
    expect(drill?.words.every((word) => isLegacyItemAllowed(word, 1))).toBe(true);
    expect(drill?.practicePatterns.every((item) => isLegacyItemAllowed(item, 1))).toBe(true);
    const profile = { completedLevels: [], keySR: { g: { interval: 1, correct: 1, wrong: 2 }, a: { interval: 1, correct: 1, wrong: 2 } } };
    const review = buildReviewWords(profile, ['grass', 'sad', 'dad']);
    expect(review.length).toBeGreaterThan(0);
    expect(review.every((word) => isLegacyItemAllowed(word, 1))).toBe(true);
  });

  it('localisation only overrides display metadata, retaining the validated assessed material', () => {
    for (const locale of locales) {
      setLocale(locale);
      for (let level = 1; level <= 10; level++) {
        const lesson = localizeLesson(getLessonByLevel(level));
        expect(lesson.words.every((word) => isLegacyItemAllowed(word, level))).toBe(true);
        expect(lesson.practicePatterns.every((item) => isLegacyItemAllowed(item, level))).toBe(true);
      }
    }
    setLocale('en');
  });
});
