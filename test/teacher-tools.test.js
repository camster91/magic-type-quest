// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  assignmentStatus, buildClassWordsLesson, cleanWordList, createClass, deleteClass,
  generateClassCode, getClassMeta, listClasses, updateClass,
} from '../src/classes.js';
import { practiceDays, practiceSummary, recordPractice } from '../src/practiceLog.js';
import { createClassReportCSV, summarizeStudent, weakKeysFrom, mergeLinkedRosterRows } from '../src/reporting.js';

beforeEach(() => localStorage.clear());

describe('teacher classes', () => {
  it('makes 6-character codes without look-alike letters', () => {
    const code = generateClassCode();
    expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTVWXYZ2-9]{6}$/);
  });

  it('never reuses a taken code', () => {
    let n = 0;
    const seq = () => [0, 0, 0, 0, 0, 0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5][n++ % 12];
    expect(generateClassCode(['AAAAAA'], seq)).not.toBe('AAAAAA');
  });

  it('creates, updates, lists and deletes classes', () => {
    const code = createClass('  Room 12  ');
    expect(getClassMeta(code)).toMatchObject({ name: 'Room 12', assignment: null, words: [] });
    updateClass(code, { assignment: { level: 3, due: '2026-10-20' } });
    expect(listClasses()).toHaveLength(1);
    expect(listClasses()[0]).toMatchObject({ code, assignment: { level: 3 } });
    deleteClass(code);
    expect(getClassMeta(code)).toBeNull();
  });

  it('cleans pasted spelling lists', () => {
    expect(cleanWordList('Plant, seed;  bloom\nbloom x 3 hello-world toolongwordthatkeepsgoing')).toEqual(['plant', 'seed', 'bloom']);
    expect(cleanWordList(Array.from({ length: 150 }, (_, i) => `w${'a'.repeat((i % 10) + 1)}`).join(' ')).length).toBeLessThanOrEqual(100);
  });

  it('tracks assignment status', () => {
    const now = new Date('2026-10-15T12:00:00');
    expect(assignmentStatus([1, 2, 3], { level: 3, due: '2026-10-20' }, now)).toBe('done');
    expect(assignmentStatus([1], { level: 3, due: '2026-10-20' }, now)).toBe('not-yet');
    expect(assignmentStatus([1], { level: 3, due: '2026-10-10' }, now)).toBe('late');
    expect(assignmentStatus([1], null, now)).toBe('none');
  });

  it('builds a class-words drill only when there are words', () => {
    expect(buildClassWordsLesson({ name: 'Room 12', words: [] })).toBeNull();
    const lesson = buildClassWordsLesson({ name: 'Room 12', words: ['plant', 'seed'] });
    expect(lesson).toMatchObject({ isDrill: true, words: ['plant', 'seed'], wordsPerLevel: 2 });
  });
});

describe('practice log', () => {
  it('adds minutes per day and caps one sitting at 30 minutes', () => {
    const profile = {};
    const day = new Date('2026-10-13T10:00:00');
    expect(recordPractice(profile, 5 * 60000, day)).toBe(5);
    expect(recordPractice(profile, 90 * 60000, day)).toBe(30);
    expect(profile.practiceLog['2026-10-13']).toBe(35);
    expect(profile.minutesPractised).toBe(35);
    expect(recordPractice(profile, -100, day)).toBe(0);
  });

  it('summarizes the last 7 days', () => {
    const profile = { practiceLog: { '2026-10-13': 5, '2026-10-10': 4, '2026-09-01': 30 } };
    expect(practiceSummary(profile, 7, new Date('2026-10-13T20:00:00'))).toEqual({ minutes: 9, activeDays: 2 });
    expect(practiceDays(profile).map((d) => d.date)).toEqual(['2026-09-01', '2026-10-10', '2026-10-13']);
  });
});

describe('student reports', () => {
  it('finds weak keys from enough tries', () => {
    expect(weakKeysFrom({ q: { correct: 1, wrong: 4 }, a: { correct: 20, wrong: 1 }, z: { correct: 0, wrong: 1 }, x: { correct: 3, wrong: 3 } })).toEqual(['q', 'x']);
  });

  it('summarizes speed, accuracy, weak keys and minutes', () => {
    const summary = summarizeStudent({
      levelStats: { 1: { wpm: 12, accuracy: 90 }, 2: { wpm: 18, accuracy: 96 } },
      keySR: { q: { correct: 1, wrong: 4 } },
      practiceLog: { '2026-10-13': 6 },
      minutesPractised: 40,
    }, new Date('2026-10-13T12:00:00'));
    expect(summary).toEqual({ bestWpm: 18, avgAccuracy: 93, weakKeys: ['q'], minutes7d: 6, activeDays7d: 1, minutesTotal: 40 });
  });

  it('reports the best run, not the latest one', () => {
    expect(summarizeStudent({ levelStats: { 1: { wpm: 10, bestWpm: 25 } } }).bestWpm).toBe(25);
  });

  it('shows a child on several linked devices as one student', () => {
    const rows = mergeLinkedRosterRows([
      { profile_id: 'd1', student_id: 's1', name: 'Ada', total_words: 100, total_stars: 5, completed_levels: [1, 2], updated_at: '2026-10-01T00:00:00Z' },
      { profile_id: 'd2', student_id: 's1', name: 'Ada B', total_words: 40, total_stars: 9, completed_levels: [3], updated_at: '2026-10-05T00:00:00Z' },
      { profile_id: 'd3', student_id: 's2', name: 'Ben', total_words: 7, completed_levels: [], updated_at: '2026-10-02T00:00:00Z' },
      { profile_id: 'd4', name: 'Old row', completed_levels: [] },
    ]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ name: 'Ada B', total_words: 100, total_stars: 9, completed_levels: [1, 2, 3], updated_at: '2026-10-05T00:00:00Z' });
  });

  it('exports a full class report as safe CSV', () => {
    const csv = createClassReportCSV([{ name: '=Ada', level: 3, bestWpm: 18, avgAccuracy: 93, weakKeys: ['q', 'z'], minutes7d: 6, minutesTotal: 40, words: 120, stars: 30, lastPlayed: '10/13/2026', assignment: 'Done' }]);
    const [header, row] = csv.split('\r\n');
    expect(header).toBe('Name,Levels done,Best WPM,Accuracy %,Weak keys,Minutes (7 days),Minutes (total),Words,Stars,Last played,Assignment,Save code');
    expect(row.startsWith("'=Ada,3,18,93,q z,6,40,120,30,10/13/2026,Done")).toBe(true);
  });
});
