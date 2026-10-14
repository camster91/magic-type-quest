import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createPilotSummary, createSurveyExport } from '../src/pilot.js';
import {
  MIN_GROUP,
  buildReport,
  quantile,
  quartiles,
  readExports,
  redactQuote,
  renderMarkdown,
  run,
  sanitizeSummary,
  sanitizeSurvey,
} from '../scripts/pilot-report.mjs';

const FIXTURES = resolve(import.meta.dirname, 'fixtures/pilot');
const NOW = new Date('2026-10-16T12:00:00Z');
// Every fake identifier planted in the fixtures. None may reach the report.
const PLANTED = ['Zebedee', 'Fakechild', 'Fakename', 'Testington', 'Owls', 'Fakey', 'McFakeface', 'example.test', 'ms-fakename-tiny', 'class-01', 'teacher-1', 'parent-1'];

function summary(group, generatedOn, n, wpm, acc, { m7 = 0, m28 = 0, active = n } = {}) {
  return {
    group,
    ...sanitizeSummary({
      type: 'bloomtype-pilot-summary',
      version: 1,
      generatedOn,
      studentCount: n,
      wpm: { median: wpm, average: wpm, studentsCounted: n },
      accuracyPercent: { median: acc, average: acc, studentsCounted: n },
      minutes: { last7Days: m7, last28Days: m28, studentsCounted7Days: n, studentsCounted28Days: n, activeStudentsLast7Days: active },
      levelsReached: {},
    }),
  };
}

describe('pilot report stats', () => {
  it('computes quartiles with linear interpolation', () => {
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(quantile([1, 2, 3, 4], 0.25)).toBe(1.8);
    expect(quantile([1, 2, 3, 4], 0.75)).toBe(3.3);
    expect(quantile([], 0.5)).toBeNull();
    expect(quartiles([10, null, 20, 30])).toEqual({ q1: 15, median: 20, q3: 25, n: 3 });
  });

  it('compares each class from its earliest to its latest export', () => {
    const report = buildReport(readExports(FIXTURES), { now: NOW });
    expect(report.groups).toBe(4);
    expect(report.studentsTotal).toBe(38); // the class of 3 is left out of the total;
    expect(report.files).toEqual({ summaries: 7, surveys: 10, skipped: 1 });
    const c = report.comparison;
    expect(c.sixWeek).toBe(true);
    expect(c.groups).toBe(2); // the class of 3 is left out; the single-export class can't be compared
    expect(c.students).toBe(30);
    expect(c.wpmStart.median).toBe(7);
    expect(c.wpmEnd.median).toBe(11);
    expect(c.wpmChange.median).toBe(4);
    expect(c.accStart.median).toBe(82.5);
    expect(c.accEnd.median).toBe(89);
    expect(c.accChange).toMatchObject({ q1: 5.8, median: 6.5, q3: 7.3 });
  });

  it('works out minutes per student per week from the latest export', () => {
    const { minutes, rows } = buildReport(readExports(FIXTURES), { now: NOW });
    // 1200 min / 20 students / 4 weeks, 800 / 10 / 4, 320 / 8 / 4
    expect(rows.filter((r) => !r.suppressed).map((r) => r.minutes.perStudentWeek)).toEqual([15, 20, 10]);
    expect(minutes.perStudentWeek.median).toBe(15);
    expect(minutes.totalLast28Days).toBe(2320);
    expect(minutes.totalLast7Days).toBe(580);
    expect(minutes.activeShare7Days).toBe(84.2); // 32 of 38
  });

  it('builds rating distributions and minute bands from valid answers only', () => {
    const { surveys } = buildReport(readExports(FIXTURES), { now: NOW });
    expect(surveys.teacher).toBe(3);
    expect(surveys.parent).toBe(7);
    const parents = surveys.roles.parent;
    expect(parents.suppressed).toBe(false);
    // parent-6 gave childEnjoyment 9, which the app's normaliser turns into "no answer"
    expect(parents.scales.childEnjoyment.dist).toEqual({ 1: 0, 2: 0, 3: 1, 4: 3, 5: 2, none: 1 });
    expect(parents.scales.setupEase.median).toBe(4);
    expect(parents.minutesBands).toEqual({ under30: 1, '30to60': 3, '60to120': 1, over120: 1, none: 1 });
  });

  it('reads files in the exact format the app exports today', () => {
    const now = new Date(2026, 9, 13, 15, 30);
    const real = createPilotSummary([
      { bestWpm: 10, avgAccuracy: 90, completedLevels: [1], minutes7d: 30, updatedAt: now.toISOString() },
    ], now);
    expect(sanitizeSummary(JSON.parse(JSON.stringify(real)))).toMatchObject({ generatedOn: '2026-10-13', studentCount: 1, wpm: { median: 10 } });
    const survey = createSurveyExport({ setupEase: 4, comments: 'Nice' }, { role: 'teacher', savedOn: now });
    expect(sanitizeSurvey(JSON.parse(JSON.stringify(survey)))).toMatchObject({ role: 'teacher', language: 'en', answers: { setupEase: 4, comments: 'Nice' } });
    expect(sanitizeSummary({ ...real, version: 2 })).toBeNull();
    expect(sanitizeSurvey({ ...survey, role: 'student' })).toBeNull();
  });

  it('says so when the exports cannot support a before/after comparison', () => {
    const report = buildReport({ summaries: [summary('a', '2026-10-01', 12, 9, 88), summary('b', '2026-10-02', 15, 11, 90)] }, { now: NOW });
    expect(report.comparison).toBeNull();
    expect(report.snapshot.wpm.median).toBe(10);
    const md = renderMarkdown(report);
    expect(md).toContain('cannot support a before/after comparison');
    expect(md).toContain('Class median WPM: 10');
  });

  it('labels a comparison shorter than six weeks', () => {
    const report = buildReport({ summaries: [summary('a', '2026-10-01', 12, 9, 88), summary('a', '2026-10-15', 12, 10, 89)] }, { now: NOW });
    expect(report.comparison.sixWeek).toBe(false);
    expect(renderMarkdown(report)).toContain('No class has a full 6-week gap yet');
  });
});

describe('pilot report small-sample guard', () => {
  it('suppresses classes and survey groups with fewer than 5', () => {
    const report = buildReport(readExports(FIXTURES), { now: NOW });
    const tiny = report.rows.find((r) => r.students < MIN_GROUP);
    expect(tiny.suppressed).toBe(true);
    expect(report.surveys.roles.teacher.suppressed).toBe(true);
    // "all" would let teacher answers be worked out by subtraction
    expect(report.surveys.roles.all.suppressed).toBe(true);
    const md = renderMarkdown(report);
    // The tiny class's 40-41 WPM and 99% accuracy never appear
    expect(md).not.toMatch(/40 →|→ 41/);
    expect(report.snapshot.wpm.q3).toBeLessThan(40);
    expect(md).not.toContain('99%');
    expect(md).toContain('| <5 |');
    expect(md).not.toContain('| 4 | 5 | 4 |'); // no teacher-only rating rows
  });

  it('keeps a suppressed class out of every total, so it cannot be found by subtraction', () => {
    // Fixture classes: 20, 10 and 8 students shown, plus a hidden class of 3.
    // A total of 41 would give away 41 - 20 - 10 - 8 = 3.
    const report = buildReport(readExports(FIXTURES), { now: NOW });
    const shown = report.rows.filter((r) => !r.suppressed);
    expect(shown.map((r) => r.students)).toEqual([20, 10, 8]);
    expect(report.studentsTotal).toBe(20 + 10 + 8);
    // Minute totals are the visible classes only (the hidden class had 360 and 90).
    expect(report.minutes.totalLast28Days).toBe(1200 + 800 + 320);
    expect(report.minutes.totalLast7Days).toBe(300 + 200 + 80);
    expect(report.minutes.studentsCounted7Days).toBe(38);
    const md = renderMarkdown(report);
    expect(md).not.toMatch(/\b41\b/);
    expect(md).not.toMatch(/\b(2680|670)\b/);
    expect(md).toContain('| Students in classes with 5 or more (latest export) | 38 |');
  });

  it('suppresses each metric with fewer than 5 contributors, even in a bigger class', () => {
    const raw = (generatedOn, { wpm, acc, counted, active, m7, m28 }) => ({
      group: 'one-active',
      ...sanitizeSummary({
        type: 'bloomtype-pilot-summary',
        version: 1,
        generatedOn,
        studentCount: 10,
        wpm: { median: wpm, average: wpm, studentsCounted: counted },
        accuracyPercent: { median: acc, average: acc, studentsCounted: counted },
        minutes: { last7Days: m7, last28Days: m28, studentsCounted7Days: 10, studentsCounted28Days: 10, activeStudentsLast7Days: active },
      }),
    });
    // A class of 10 where only one child has played: every figure is that child's.
    const oneChild = raw('2026-10-13', { wpm: 23, acc: 97, counted: 1, active: 1, m7: 42, m28: 133 });
    const other = [summary('b', '2026-09-01', 12, 8, 85), summary('b', '2026-10-13', 12, 12, 90, { m7: 120, m28: 480 })];
    const report = buildReport({ summaries: [oneChild, ...other] }, { now: NOW });
    const row = report.rows.find((r) => r.students === 10);
    expect(row.suppressed).toBe(false);
    expect(row.wpm.end).toBeNull();
    expect(row.accuracy.end).toBeNull();
    expect(row.minutes.perStudentWeek).toBeNull();
    expect(row.minutes.last7).toBeNull();
    expect(row.minutes.last28).toBeNull();
    expect(report.snapshot.wpm.n).toBe(1);
    expect(report.minutes.totalLast7Days).toBe(120);
    expect(report.minutes.totalLast28Days).toBe(480);
    const md = renderMarkdown(report);
    for (const leaked of ['23', '97', '42', '133', '162', '613', '4.2', '3.3']) expect(md).not.toMatch(new RegExp(`(^|[^\\d.])${leaked.replace('.', '\\.')}(?![\\d])`));
    expect(md).toContain('| 10 | 1 | n/a | suppressed (one export) | suppressed (one export) | suppressed |');

    // A comparable class whose start had one scored child: start is hidden and
    // the class drops out of the WPM comparison instead of showing that child.
    const early = raw('2026-09-01', { wpm: 23, acc: 97, counted: 1, active: 6, m7: 60, m28: 60 });
    const late = raw('2026-10-13', { wpm: 11, acc: 88, counted: 10, active: 8, m7: 100, m28: 400 });
    const paired = buildReport({ summaries: [early, late, ...other] }, { now: NOW });
    expect(paired.rows.find((r) => r.students === 10).wpm).toEqual({ start: null, end: 11 });
    expect(paired.comparison.wpmStart.n).toBe(1);
    expect(renderMarkdown(paired)).toContain('suppressed → 11');
  });

  it('suppresses every student number when the whole pilot has fewer than 5 students', () => {
    const report = buildReport({ summaries: [summary('a', '2026-09-01', 4, 8, 85, { m28: 100 }), summary('a', '2026-10-13', 4, 12, 92, { m28: 300 })] }, { now: NOW });
    expect(report.enoughStudents).toBe(false);
    expect(report.comparison).toBeNull();
    expect(report.snapshot).toBeNull();
    expect(report.minutes).toBeNull();
    const md = renderMarkdown(report);
    expect(md).toContain('all student numbers are suppressed');
    expect(md).not.toMatch(/\b(12|92|300)\b/);
  });

  it('flags results below 30 students as not statistically significant', () => {
    const small = buildReport({ summaries: [summary('a', '2026-09-01', 12, 8, 85), summary('a', '2026-10-13', 12, 12, 90)] }, { now: NOW });
    expect(small.significant).toBe(false);
    expect(renderMarkdown(small)).toContain('Not statistically significant');
    const big = buildReport({ summaries: [summary('a', '2026-09-01', 30, 8, 85), summary('a', '2026-10-13', 30, 12, 90)] }, { now: NOW });
    expect(big.significant).toBe(true);
    expect(renderMarkdown(big)).not.toContain('Not statistically significant');
  });
});

describe('pilot report privacy', () => {
  it('hides likely names, emails, links and phone numbers in quotes', () => {
    expect(redactQuote('My son Zebedee loves it').text).toBe('My son [name?] loves it');
    expect(redactQuote('Write to a.b@example.test or see https://example.test/x').text).toBe('Write to [email removed] or see [link removed]');
    expect(redactQuote('Call 555-123-4567 any time').text).toBe('Call [number removed] any time');
    expect(redactQuote('Great. I think BloomType is fun on Monday.')).toEqual({ text: 'Great. I think BloomType is fun on Monday.', hidden: 0 });
    expect(redactQuote('<script>x</script>').text).not.toContain('<script>');
  });

  it('lists every comment for owner review and marks it as needing permission', () => {
    const md = renderMarkdown(buildReport(readExports(FIXTURES), { now: NOW }));
    const quoteLines = md.split('\n').filter((l) => l.startsWith('- "'));
    expect(quoteLines).toHaveLength(5);
    for (const line of quoteLines) expect(line).toContain('needs permission before publishing');
  });

  it('never writes a name, email, folder or file name to the report', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pilot-report-'));
    try {
      const { out } = run([FIXTURES, '--out', join(dir, 'draft.md')], { now: NOW });
      const md = readFileSync(out, 'utf8');
      for (const word of PLANTED) expect(md).not.toContain(word);
      expect(md).not.toMatch(/[\w.+-]+@[\w-]+\.\w+/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses to run without a folder', () => {
    expect(() => run([])).toThrow('Usage');
    expect(() => run([join(FIXTURES, 'nope')])).toThrow('Not a folder');
  });
});
