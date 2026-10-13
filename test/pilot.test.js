import { describe, expect, it } from 'vitest';
import {
  PILOT_SURVEY_KEY,
  SURVEY_QUESTIONS,
  average,
  createPilotSummary,
  createSurveyExport,
  deleteSurvey,
  loadSurvey,
  median,
  normalizeSurveyAnswers,
  saveSurvey,
} from '../src/pilot.js';
import { dayKey } from '../src/practiceLog.js';

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    keys: () => [...map.keys()],
  };
}

const NOW = new Date(2026, 9, 13, 15, 30);
const daysAgo = (n) => { const d = new Date(NOW); d.setDate(d.getDate() - n); return dayKey(d); };

describe('pilot survey export', () => {
  it('has about six short questions with at least one free-text field', () => {
    expect(SURVEY_QUESTIONS.length).toBe(6);
    expect(SURVEY_QUESTIONS.filter((q) => q.type === 'scale').length).toBeGreaterThanOrEqual(3);
    expect(SURVEY_QUESTIONS.some((q) => q.type === 'text')).toBe(true);
  });

  it('exports only role, language, the day and the answers', () => {
    const record = createSurveyExport(
      { setupEase: '4', childEnjoyment: 5, typingImprovement: 3, minutesPerWeek: '30to60', wouldRecommend: 5, comments: '  Loved it  ' },
      { role: 'teacher', locale: 'fr', savedOn: NOW },
    );
    expect(record).toEqual({
      type: 'bloomtype-pilot-feedback',
      version: 1,
      role: 'teacher',
      language: 'fr',
      savedOn: '2026-10-13',
      answers: {
        setupEase: 4, childEnjoyment: 5, typingImprovement: 3,
        minutesPerWeek: '30to60', wouldRecommend: 5, comments: 'Loved it',
      },
    });
  });

  it('drops unknown fields, identifiers and out-of-range values', () => {
    const record = createSurveyExport({
      name: 'Ada', classCode: 'ABC123', uuid: 'x-1', email: 'a@b.c',
      setupEase: 9, childEnjoyment: 2.5, minutesPerWeek: 'lots', comments: 'x'.repeat(5000),
    }, { role: 'hacker' });
    const json = JSON.stringify(record);
    for (const leak of ['Ada', 'ABC123', 'x-1', 'a@b.c', 'name', 'classCode', 'uuid', 'email']) {
      expect(json).not.toContain(leak);
    }
    expect(record.role).toBe('parent');
    expect(record.answers.setupEase).toBeNull();
    expect(record.answers.childEnjoyment).toBeNull();
    expect(record.answers.minutesPerWeek).toBeNull();
    expect(record.answers.comments).toHaveLength(1000);
    expect(Object.keys(record.answers)).toEqual(SURVEY_QUESTIONS.map((q) => q.id));
  });

  it('stores nothing until saved, keeps roles apart, and deletes cleanly', () => {
    const storage = memoryStorage();
    expect(loadSurvey('parent', storage)).toBeNull();
    expect(storage.keys()).toEqual([]);

    saveSurvey('parent', { setupEase: 5 }, { locale: 'es', now: NOW, storage });
    saveSurvey('teacher', { setupEase: 2 }, { now: NOW, storage });
    expect(storage.keys()).toEqual([PILOT_SURVEY_KEY]);
    expect(loadSurvey('parent', storage).answers.setupEase).toBe(5);
    expect(loadSurvey('parent', storage).language).toBe('es');
    expect(loadSurvey('teacher', storage).answers.setupEase).toBe(2);

    deleteSurvey('parent', storage);
    expect(loadSurvey('parent', storage)).toBeNull();
    deleteSurvey('teacher', storage);
    expect(storage.keys()).toEqual([]);
  });

  it('ignores corrupt saved data', () => {
    const storage = memoryStorage();
    storage.setItem(PILOT_SURVEY_KEY, '{broken');
    expect(loadSurvey('teacher', storage)).toBeNull();
  });

  it('normalizes empty answers to nulls and an empty comment', () => {
    expect(normalizeSurveyAnswers()).toEqual({
      setupEase: null, childEnjoyment: null, typingImprovement: null,
      minutesPerWeek: null, wouldRecommend: null, comments: '',
    });
  });
});

describe('pilot summary aggregates', () => {
  it('computes median and average', () => {
    expect(median([])).toBeNull();
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 10])).toBe(2.5);
    expect(average([10, 20, 31])).toBe(20.3);
    expect(average([])).toBeNull();
  });

  const profiles = [
    {
      name: 'Ada', uuid: 'ada-1', classCode: 'ABC123', avatar: '🦊', completedLevels: [1, 2, 3],
      levelStats: { 1: { wpm: 10, accuracy: 90 }, 2: { bestWpm: 14, accuracy: 94 } },
      practiceLog: { [daysAgo(0)]: 10, [daysAgo(3)]: 5, [daysAgo(20)]: 12, [daysAgo(40)]: 30 },
    },
    {
      name: 'Ben', uuid: 'ben-1', completedLevels: [1],
      levelStats: { 1: { wpm: 6, accuracy: 80 } },
      practiceLog: { [daysAgo(10)]: 8 },
    },
    {
      name: 'Cy', uuid: 'cy-1', completedLevels: [],
      levelStats: {}, practiceLog: {},
    },
  ];

  it('aggregates class-level numbers with no names or identifiers', () => {
    const summary = createPilotSummary(profiles, NOW);
    expect(summary).toMatchObject({
      type: 'bloomtype-pilot-summary',
      version: 1,
      generatedOn: '2026-10-13',
      dateRange: { from: daysAgo(40), to: daysAgo(0) },
      studentCount: 3,
      wpm: { median: 10, average: 10, studentsCounted: 2 },
      accuracyPercent: { median: 86, average: 86, studentsCounted: 2 },
      minutes: {
        last7Days: 15, last28Days: 35, studentsCounted7Days: 3, studentsCounted28Days: 3, activeStudentsLast7Days: 1,
      },
    });
    expect(summary.levelsReached).toEqual({ 0: 1, 1: 1, 2: 0, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 });
    const json = JSON.stringify(summary);
    for (const leak of ['Ada', 'Ben', 'Cy', 'ada-1', 'ABC123', '🦊']) expect(json).not.toContain(leak);
  });

  it('uses the totals on class snapshots and cloud rows', () => {
    const summary = createPilotSummary([
      { name: 'Ada', completedLevels: [1, 2], bestWpm: 12, avgAccuracy: 91, minutes7d: 20, lastPlayed: '2026-10-12T10:00:00Z' },
      { name: 'Ben', completed_levels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], total_words: 50, updated_at: '2026-10-01T10:00:00Z' },
    ], NOW);
    expect(summary.studentCount).toBe(2);
    expect(summary.wpm).toEqual({ median: 12, average: 12, studentsCounted: 1 });
    expect(summary.accuracyPercent.studentsCounted).toBe(1);
    expect(summary.minutes.last7Days).toBe(20);
    expect(summary.minutes.studentsCounted7Days).toBe(1);
    expect(summary.minutes.studentsCounted28Days).toBe(0);
    expect(summary.levelsReached[2]).toBe(1);
    expect(summary.levelsReached[10]).toBe(1);
    expect(summary.dateRange).toEqual({ from: '2026-10-01', to: '2026-10-12' });
  });

  it('handles an empty class', () => {
    const summary = createPilotSummary([], NOW);
    expect(summary.studentCount).toBe(0);
    expect(summary.wpm.median).toBeNull();
    expect(summary.dateRange).toEqual({ from: null, to: null });
  });
});
