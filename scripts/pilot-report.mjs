#!/usr/bin/env node
/**
 * BloomType pilot report builder.
 *
 *   npm run pilot:report -- <folder> [--out <file>]
 *
 * Reads the files the app exports today from <folder> (searched recursively):
 * - the teacher's anonymised pilot summary (`bloomtype-pilot-summary`,
 *   downloaded from teacher.html), and
 * - the grown-ups' survey (`bloomtype-pilot-feedback`, downloaded or pasted
 *   from teacher.html or parents.html),
 * and writes a Markdown draft (default docs/pilot/PILOT-REPORT-DRAFT.md).
 *
 * Grouping: put each class's (or family's) summaries in their own subfolder,
 * named with a neutral code such as `class-01`. Summaries in the same
 * subfolder are treated as the same group over time, so the earliest one is
 * "start" and the latest one is "end". A summary file at the top of the
 * folder is a group on its own. Folder and file names never reach the report.
 *
 * Privacy: only whitelisted, known fields are read; anything else in a file
 * (for example a name someone typed into it) is ignored. Breakdowns with
 * fewer than MIN_GROUP students or responses are suppressed. Free-text
 * comments go through a best-effort redaction and are marked for owner review.
 * Nothing here makes a network request.
 */
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { MINUTE_BANDS, SURVEY_QUESTIONS, SURVEY_ROLES, normalizeSurveyAnswers } from '../src/pilot.js';

/** Suppress any breakdown smaller than this (students or survey responses). */
export const MIN_GROUP = 5;
/** Below this many students, results are flagged as not statistically significant. */
export const MIN_SIGNIFICANT = 30;
/** A start/end pair this many days apart or more counts as a 6-week comparison (one week of slack). */
export const SIX_WEEK_DAYS = 35;
/** Pairs closer together than this are not compared at all. */
export const MIN_COMPARE_DAYS = 7;

const SUMMARY_TYPE = 'bloomtype-pilot-summary';
const SURVEY_TYPE = 'bloomtype-pilot-feedback';
const SUPPORTED_VERSION = 1;
const SCALE_QUESTIONS = SURVEY_QUESTIONS.filter((q) => q.type === 'scale').map((q) => q.id);
const QUOTE_FLAG = '**needs permission before publishing**';
const SUPPRESSED = 'suppressed (fewer than 5)';
const suppressedNote = (what) => `Suppressed: fewer than ${MIN_GROUP} ${what}.`;

const QUESTION_LABELS = {
  setupEase: 'How easy was BloomType to set up?',
  childEnjoyment: 'How much did the children enjoy it?',
  typingImprovement: 'How much did their typing improve?',
  minutesPerWeek: 'About how many minutes a week did each child play?',
  wouldRecommend: 'How likely are you to recommend BloomType to others?',
};
const BAND_LABELS = { under30: 'under 30 min', '30to60': '30 to 60 min', '60to120': '60 to 120 min', over120: 'over 120 min' };

// ===== Small numeric helpers =====

const round1 = (n) => (n == null ? null : Math.round(n * 10) / 10);
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const count = (v) => (Number.isInteger(v) && v >= 0 ? v : 0);
const isDay = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

/** Quantile with linear interpolation between closest ranks. */
export function quantile(values, q) {
  const xs = values.filter((v) => v != null).sort((a, b) => a - b);
  if (!xs.length) return null;
  const pos = (xs.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return round1(xs[lo] + (xs[hi] - xs[lo]) * (pos - lo));
}

export const quartiles = (values) => ({ q1: quantile(values, 0.25), median: quantile(values, 0.5), q3: quantile(values, 0.75), n: values.filter((v) => v != null).length });

// ===== Reading and sanitising exports =====

/** Keep only the known, non-identifying fields of a pilot summary. */
export function sanitizeSummary(raw) {
  if (!raw || raw.type !== SUMMARY_TYPE || raw.version !== SUPPORTED_VERSION || !isDay(raw.generatedOn)) return null;
  const minutes = raw.minutes || {};
  const levelsReached = {};
  for (let i = 0; i <= 10; i++) levelsReached[i] = count(raw.levelsReached?.[i]);
  return {
    generatedOn: raw.generatedOn,
    studentCount: count(raw.studentCount),
    wpm: { median: num(raw.wpm?.median), studentsCounted: count(raw.wpm?.studentsCounted) },
    accuracy: { median: num(raw.accuracyPercent?.median), studentsCounted: count(raw.accuracyPercent?.studentsCounted) },
    minutes: {
      last7Days: num(minutes.last7Days) ?? 0,
      last28Days: num(minutes.last28Days) ?? 0,
      studentsCounted7Days: count(minutes.studentsCounted7Days),
      studentsCounted28Days: count(minutes.studentsCounted28Days),
      activeStudentsLast7Days: count(minutes.activeStudentsLast7Days),
    },
    levelsReached,
  };
}

/** Keep only role, language and the normalised answers of a survey export. */
export function sanitizeSurvey(raw) {
  if (!raw || raw.type !== SURVEY_TYPE || raw.version !== SUPPORTED_VERSION || !SURVEY_ROLES.includes(raw.role)) return null;
  const language = typeof raw.language === 'string' && /^[a-z]{2}(-[A-Za-z]{2})?$/.test(raw.language) ? raw.language : 'other';
  return { role: raw.role, language, answers: normalizeSurveyAnswers(raw.answers || {}) };
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(json|txt)$/i.test(name)) out.push(full);
  }
  return out;
}

/**
 * Read every export under `folder`. Returns sanitised records plus counts of
 * what was skipped. Group keys are internal only and never printed.
 */
export function readExports(folder) {
  const root = resolve(folder);
  const summaries = [];
  const surveys = [];
  let skipped = 0;
  for (const file of walk(root)) {
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      skipped++;
      continue;
    }
    const rel = relative(root, file);
    const parts = rel.split(sep);
    const group = parts.length > 1 ? `dir:${parts[0]}` : `file:${rel}`;
    for (const item of Array.isArray(parsed) ? parsed : [parsed]) {
      const summary = sanitizeSummary(item);
      const survey = summary ? null : sanitizeSurvey(item);
      if (summary) summaries.push({ group, ...summary });
      else if (survey) surveys.push(survey);
      else skipped++;
    }
  }
  return { summaries, surveys, skipped };
}

// ===== Quote redaction =====

const ALLOWED_CAPITALISED = new Set([
  'I', "I'm", "I've", "I'd", "I'll", 'BloomType', 'Bloom', 'OK', 'Ok',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
  'English', 'French', 'Spanish', 'Google', 'Classroom', 'Chromebook', 'Chromebooks', 'Windows', 'Mac',
]);

/**
 * Best-effort clean-up of a free-text comment. Removes emails, links and long
 * numbers, and hides capitalised words that are not at the start of a sentence
 * (likely names). It is a safety net, not a guarantee: the owner reads every quote.
 */
export function redactQuote(text) {
  let hidden = 0;
  let out = String(text)
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, () => { hidden++; return '[email removed]'; })
    .replace(/\b(https?:\/\/|www\.)\S+/gi, () => { hidden++; return '[link removed]'; })
    .replace(/\+?\d[\d\s().-]{6,}\d/g, () => { hidden++; return '[number removed]'; });
  out = out.replace(/(^|[^\p{L}'’-])(\p{Lu}[\p{L}'’-]*)/gu, (match, before, word, offset, whole) => {
    const prefix = whole.slice(0, offset + before.length).trimEnd();
    const sentenceStart = prefix === '' || /[.!?¡¿:;"“«(]$/.test(prefix);
    const acronym = word.length > 1 && word === word.toUpperCase();
    if (sentenceStart || acronym || ALLOWED_CAPITALISED.has(word)) return match;
    hidden++;
    return `${before}[name?]`;
  });
  // Keep it inert in Markdown/HTML.
  out = out.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return { text: out, hidden };
}

// ===== Building the report data =====

/** A class median is shown only when at least MIN_GROUP students contributed to it. */
const guarded = (metric) => (metric && metric.studentsCounted >= MIN_GROUP ? metric.median : null);

/**
 * Minutes for one export, each figure shown only when at least MIN_GROUP
 * students actually contributed practice to it. A class of 10 where one child
 * played would otherwise reveal that child's minutes.
 * - 7-day: at least 5 students counted and at least 5 active in those 7 days.
 * - 28-day: as above, and every counted student has a full practice log
 *   (studentsCounted28Days === studentsCounted7Days), so the 5 active
 *   students are inside the 28-day total too.
 */
function guardedMinutes(s) {
  const m = s.minutes;
  const active = m.activeStudentsLast7Days;
  const ok7 = m.studentsCounted7Days >= MIN_GROUP && active >= MIN_GROUP;
  const ok28 = ok7 && m.studentsCounted28Days >= MIN_GROUP && m.studentsCounted28Days === m.studentsCounted7Days;
  return {
    last7: ok7 ? { minutes: m.last7Days, students: m.studentsCounted7Days } : null,
    last28: ok28 ? { minutes: m.last28Days, students: m.studentsCounted28Days } : null,
    perStudentWeek: ok28 ? round1(m.last28Days / m.studentsCounted28Days / 4) : ok7 ? round1(m.last7Days / m.studentsCounted7Days) : null,
    active: m.studentsCounted7Days >= MIN_GROUP ? { active, counted: m.studentsCounted7Days } : null,
  };
}

const NO_MINUTES = { last7: null, last28: null, perStudentWeek: null, active: null };
const letter = (i) => (i < 26 ? String.fromCharCode(65 + i) : `${String.fromCharCode(65 + Math.floor(i / 26) - 1)}${String.fromCharCode(65 + (i % 26))}`);
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const change = (a, b) => (a != null && b != null ? round1(b - a) : null);

export function buildReport({ summaries = [], surveys = [], skipped = 0 } = {}, { now = new Date() } = {}) {
  const byGroup = new Map();
  for (const s of summaries) {
    if (!byGroup.has(s.group)) byGroup.set(s.group, []);
    byGroup.get(s.group).push(s);
  }
  const groups = [...byGroup.values()].map((list) => list.sort((a, b) => a.generatedOn.localeCompare(b.generatedOn)));
  // Stable, meaningless labels: order by first export date then size, never by folder name.
  groups.sort((a, b) => a[0].generatedOn.localeCompare(b[0].generatedOn) || b.at(-1).studentCount - a.at(-1).studentCount);

  const rows = groups.map((list, i) => {
    const start = list[0];
    const end = list.at(-1);
    const span = daysBetween(start.generatedOn, end.generatedOn);
    const comparable = list.length > 1 && span >= MIN_COMPARE_DAYS;
    const students = end.studentCount;
    // A class under MIN_GROUP shows nothing and is left out of every total,
    // so no figure about it can be worked out by subtracting visible classes.
    const suppressed = students < MIN_GROUP;
    return {
      label: `Group ${letter(i)}`,
      students,
      exports: list.length,
      span,
      weeks: round1(span / 7),
      comparable,
      sixWeek: comparable && span >= SIX_WEEK_DAYS,
      suppressed,
      wpm: suppressed ? { start: null, end: null } : { start: comparable ? guarded(start.wpm) : null, end: guarded(end.wpm) },
      accuracy: suppressed ? { start: null, end: null } : { start: comparable ? guarded(start.accuracy) : null, end: guarded(end.accuracy) },
      minutes: suppressed ? NO_MINUTES : guardedMinutes(end),
    };
  });

  const visible = rows.filter((r) => !r.suppressed);
  const studentsTotal = sum(visible.map((r) => r.students));
  const enoughStudents = studentsTotal >= MIN_GROUP;

  // Before/after, per metric: only classes where both ends of that metric are shown.
  const pairs = visible.filter((r) => r.comparable);
  const sixWeekPairs = pairs.filter((r) => r.sixWeek);
  const headlinePairs = sixWeekPairs.length ? sixWeekPairs : pairs;
  const wpmPairs = headlinePairs.filter((r) => r.wpm.start != null && r.wpm.end != null);
  const accPairs = headlinePairs.filter((r) => r.accuracy.start != null && r.accuracy.end != null);
  const compared = headlinePairs.filter((r) => wpmPairs.includes(r) || accPairs.includes(r));
  const comparison = compared.length
    ? {
      sixWeek: sixWeekPairs.length > 0,
      groups: compared.length,
      students: sum(compared.map((r) => r.students)),
      wpmStart: quartiles(wpmPairs.map((r) => r.wpm.start)),
      wpmEnd: quartiles(wpmPairs.map((r) => r.wpm.end)),
      wpmChange: quartiles(wpmPairs.map((r) => change(r.wpm.start, r.wpm.end))),
      accStart: quartiles(accPairs.map((r) => r.accuracy.start)),
      accEnd: quartiles(accPairs.map((r) => r.accuracy.end)),
      accChange: quartiles(accPairs.map((r) => change(r.accuracy.start, r.accuracy.end))),
    }
    : null;

  const snapshot = enoughStudents
    ? { groups: visible.length, wpm: quartiles(visible.map((r) => r.wpm.end)), accuracy: quartiles(visible.map((r) => r.accuracy.end)) }
    : null;

  const with7 = visible.filter((r) => r.minutes.last7);
  const with28 = visible.filter((r) => r.minutes.last28);
  const withActive = visible.filter((r) => r.minutes.active);
  const activeCounted = sum(withActive.map((r) => r.minutes.active.counted));
  const minutes = enoughStudents
    ? {
      totalLast28Days: with28.length ? round1(sum(with28.map((r) => r.minutes.last28.minutes))) : null,
      studentsCounted28Days: sum(with28.map((r) => r.minutes.last28.students)),
      classes28: with28.length,
      totalLast7Days: with7.length ? round1(sum(with7.map((r) => r.minutes.last7.minutes))) : null,
      studentsCounted7Days: sum(with7.map((r) => r.minutes.last7.students)),
      classes7: with7.length,
      activeShare7Days: activeCounted >= MIN_GROUP ? round1((sum(withActive.map((r) => r.minutes.active.active)) / activeCounted) * 100) : null,
      perStudentWeek: quartiles(visible.map((r) => r.minutes.perStudentWeek)),
    }
    : null;

  const roles = {};
  // A small role inside "all" could be worked out by subtraction, so "all"
  // is suppressed too whenever any role has 1 to 4 responses.
  const smallRole = SURVEY_ROLES.some((role) => {
    const n = surveys.filter((s) => s.role === role).length;
    return n > 0 && n < MIN_GROUP;
  });
  for (const role of [...SURVEY_ROLES, 'all']) {
    const list = role === 'all' ? surveys : surveys.filter((s) => s.role === role);
    const block = { responses: list.length, suppressed: list.length < MIN_GROUP || (role === 'all' && smallRole) };
    if (!block.suppressed) {
      block.scales = Object.fromEntries(SCALE_QUESTIONS.map((id) => {
        const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, none: 0 };
        const values = [];
        for (const s of list) {
          const v = s.answers[id];
          if (v == null) dist.none++;
          else { dist[v]++; values.push(v); }
        }
        return [id, { dist, median: quantile(values, 0.5), answered: values.length }];
      }));
      const bands = Object.fromEntries([...MINUTE_BANDS, 'none'].map((b) => [b, 0]));
      for (const s of list) bands[s.answers.minutesPerWeek ?? 'none']++;
      block.minutesBands = bands;
    }
    roles[role] = block;
  }

  const quotes = surveys
    .filter((s) => s.answers.comments)
    .map((s) => ({ role: s.role, language: s.language, ...redactQuote(s.answers.comments) }))
    .sort((a, b) => a.role.localeCompare(b.role) || a.text.localeCompare(b.text));

  return {
    generatedOn: now.toISOString().slice(0, 10),
    files: { summaries: summaries.length, surveys: surveys.length, skipped },
    groups: rows.length,
    smallGroups: rows.length - visible.length,
    studentsTotal,
    enoughStudents,
    significant: studentsTotal >= MIN_SIGNIFICANT && (!comparison || comparison.students >= MIN_SIGNIFICANT),
    rows,
    pairsAll: rows.filter((r) => r.comparable).length,
    comparison,
    snapshot,
    minutes,
    surveys: { teacher: roles.teacher.responses, parent: roles.parent.responses, roles },
    quotes,
  };
}

// ===== Markdown =====

const fmt = (v, unit = '') => (v == null ? 'n/a' : `${v}${unit}`);
const fmtQ = (q, unit = '') => (q && q.n ? `${fmt(q.median, unit)} (IQR ${fmt(q.q1, unit)} to ${fmt(q.q3, unit)})` : 'n/a');
const signed = (v, unit = '') => (v == null ? 'n/a' : `${v > 0 ? '+' : ''}${v}${unit}`);
const fmtQSigned = (q, unit = '') => (q && q.n ? `${signed(q.median, unit)} (IQR ${signed(q.q1, unit)} to ${signed(q.q3, unit)})` : 'n/a');

export function renderMarkdown(r) {
  const L = [];
  const push = (...lines) => L.push(...lines);

  push(
    '# BloomType 6-week pilot report (DRAFT)',
    '',
    `> Generated on ${r.generatedOn} by \`npm run pilot:report\`. **Draft for owner review.** Do not publish on the landing page until the owner has approved every number and has written permission for every quote.`,
    '',
  );

  const warnings = [];
  if (!r.enoughStudents) warnings.push(`No class or family with ${MIN_GROUP} or more students: all student numbers are suppressed for privacy.`);
  if (r.smallGroups) warnings.push(`${r.smallGroups} class(es) or families with fewer than ${MIN_GROUP} students are left out of every student number and total, so their figures can't be worked out by subtraction.`);
  warnings.push(`Each figure needs at least ${MIN_GROUP} contributing students (for minutes: at least ${MIN_GROUP} who practised in the last 7 days). Figures with fewer are shown as "suppressed" and left out of the totals and medians below.`);
  if (!r.significant) {
    const n = r.comparison && r.comparison.students < r.studentsTotal ? r.comparison.students : r.studentsTotal;
    warnings.push(`**Not statistically significant.** ${n} students is below the ${MIN_SIGNIFICANT}-student threshold. Treat every number as anecdotal and say so if quoted.`);
  }
  if (r.comparison && r.comparison.groups < 4) warnings.push(`Only ${r.comparison.groups} class(es) in the before/after comparison: the interquartile ranges across classes say very little.`);
  warnings.push('The exports are class-level summaries (one median per class), not per-student scores, so no significance test is possible and quartiles below are across classes, not across students.');
  push('## Read this first', '', ...warnings.map((w) => `- ${w}`), '');

  push(
    '## Who took part',
    '',
    '| | Count |',
    '| --- | ---: |',
    `| Classes or families that sent a pilot summary | ${r.groups} |`,
    `| ...of which with fewer than ${MIN_GROUP} students (left out of all student numbers) | ${r.smallGroups} |`,
    `| Students in classes with ${MIN_GROUP} or more (latest export) | ${r.enoughStudents ? r.studentsTotal : SUPPRESSED} |`,
    `| Teacher surveys | ${r.surveys.teacher} |`,
    `| Parent surveys (families) | ${r.surveys.parent} |`,
    `| Files skipped (not a v1 BloomType export) | ${r.files.skipped} |`,
    '',
  );

  push('## Speed and accuracy: start vs. week 6', '');
  push(
    `"Start" is each class's earliest pilot summary and "end" its latest. A pair at least ${SIX_WEEK_DAYS} days apart counts as a 6-week comparison. WPM is each student's best speed so far and accuracy their average across levels, so both are "to date" figures, summarised by the class median.`,
    '',
  );
  if (r.pairsAll === 0) {
    push(
      '**The exports cannot support a before/after comparison yet:** no class sent two pilot summaries at least a week apart. Ask each teacher to download a summary in week 1 and again in week 6, and file both in the same subfolder. The latest snapshot below is all that can be said.',
      '',
    );
  } else if (!r.comparison) {
    push(suppressedNote('students across the classes with a start and end export'), '');
  } else {
    const c = r.comparison;
    if (!c.sixWeek) push(`**No class has a full 6-week gap yet.** The figures below use the ${c.groups} class(es) with at least ${MIN_COMPARE_DAYS} days between exports; label them as such.`, '');
    push(
      `Classes compared: ${c.groups} (${c.students} students). Median across classes, with interquartile range (IQR).`,
      '',
      '| | Start | End | Change per class |',
      '| --- | --- | --- | --- |',
      `| Class median WPM (${c.wpmStart.n} classes) | ${fmtQ(c.wpmStart)} | ${fmtQ(c.wpmEnd)} | ${fmtQSigned(c.wpmChange)} |`,
      `| Class median accuracy (${c.accStart.n} classes) | ${fmtQ(c.accStart, '%')} | ${fmtQ(c.accEnd, '%')} | ${fmtQSigned(c.accChange, ' pts')} |`,
      '',
    );
  }

  push('### Latest snapshot', '');
  if (r.snapshot) {
    push(
      `Across ${r.snapshot.groups} class(es), from each one's latest export:`,
      '',
      `- Class median WPM: ${fmtQ(r.snapshot.wpm)}${r.snapshot.wpm.n < r.snapshot.groups ? ` (${r.snapshot.wpm.n} classes; others suppressed)` : ''}`,
      `- Class median accuracy: ${fmtQ(r.snapshot.accuracy, '%')}${r.snapshot.accuracy.n < r.snapshot.groups ? ` (${r.snapshot.accuracy.n} classes; others suppressed)` : ''}`,
      '',
    );
  } else push(suppressedNote('students'), '');

  push('## Minutes used', '');
  if (r.minutes) {
    const m = r.minutes;
    push(
      'From each class\'s latest export. Class snapshots only carry a 7-day total, so 28-day minutes cover only students with a full practice log on that device.',
      '',
      `- Total minutes, last 28 days: ${m.totalLast28Days == null ? SUPPRESSED : `${m.totalLast28Days} (${m.studentsCounted28Days} students in ${m.classes28} classes)`}`,
      `- Total minutes, last 7 days: ${m.totalLast7Days == null ? SUPPRESSED : `${m.totalLast7Days} (${m.studentsCounted7Days} students in ${m.classes7} classes)`}`,
      `- Minutes per student per week, median across classes: ${fmtQ(m.perStudentWeek)}`,
      `- Students active in the last 7 days: ${m.activeShare7Days == null ? SUPPRESSED : `${m.activeShare7Days}%`}`,
      '',
      'The exports cannot give a true 6-week total: each one only looks back 28 days.',
      '',
    );
  } else push(suppressedNote('students'), '');

  push('### By class', '');
  if (r.rows.length) {
    push(
      '| Class | Students | Exports | Weeks covered | WPM start → end | Accuracy start → end | Min/student/week |',
      '| --- | ---: | ---: | ---: | --- | --- | ---: |',
    );
    for (const row of r.rows) {
      if (row.suppressed) {
        push(`| ${row.label} | <5 | ${row.exports} | ${row.comparable ? row.weeks : 'n/a'} | ${SUPPRESSED} | ${SUPPRESSED} | ${SUPPRESSED} |`);
        continue;
      }
      const cell = (v, unit = '') => (v == null ? 'suppressed' : `${v}${unit}`);
      const pair = (m, unit = '') => (row.comparable ? `${cell(m.start, unit)} → ${cell(m.end, unit)}` : `${cell(m.end, unit)} (one export)`);
      push(`| ${row.label} | ${row.students} | ${row.exports} | ${row.comparable ? row.weeks : 'n/a'} | ${pair(row.wpm)} | ${pair(row.accuracy, '%')} | ${cell(row.minutes.perStudentWeek)} |`);
    }
    push('', `Class labels are assigned by this script and do not match folder or school names. "suppressed" means fewer than ${MIN_GROUP} students contributed to that figure.`, '');
  } else push('No pilot summaries found.', '');

  push('## Survey ratings', '', 'Scale is 1 (low) to 5 (high). Groups with fewer than 5 responses are suppressed.', '');
  for (const [role, title] of [['teacher', 'Teachers'], ['parent', 'Parents'], ['all', 'All grown-ups']]) {
    const b = r.surveys.roles[role];
    push(`### ${title} (${b.responses} response${b.responses === 1 ? '' : 's'})`, '');
    if (b.suppressed) {
      push(role === 'all' && b.responses >= MIN_GROUP
        ? 'Combined ratings suppressed: one group has fewer than 5 responses and could be worked out by subtraction.'
        : suppressedNote('responses'), '');
      continue;
    }
    push('| Question | 1 | 2 | 3 | 4 | 5 | No answer | Median |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
    for (const id of SCALE_QUESTIONS) {
      const s = b.scales[id];
      push(`| ${QUESTION_LABELS[id]} | ${s.dist[1]} | ${s.dist[2]} | ${s.dist[3]} | ${s.dist[4]} | ${s.dist[5]} | ${s.dist.none} | ${fmt(s.median)} |`);
    }
    push('', `${QUESTION_LABELS.minutesPerWeek}`, '');
    push(...MINUTE_BANDS.map((band) => `- ${BAND_LABELS[band]}: ${b.minutesBands[band]}`), `- no answer: ${b.minutesBands.none}`, '');
  }

  push(
    '## Quotes for owner review',
    '',
    `Every quote below is marked ${QUOTE_FLAG}. Names, emails, links and long numbers were hidden automatically as a safety net only: read each one, check it names no child, and get the writer's written OK before it goes anywhere public.`,
    '',
  );
  if (r.quotes.length) {
    for (const q of r.quotes) {
      push(`- "${q.text}" (${q.role}, ${q.language}${q.hidden ? `, ${q.hidden} item(s) hidden` : ''}) ${QUOTE_FLAG}`);
    }
    push('');
  } else push('No comments in the surveys.', '');

  push(
    '## Before publishing',
    '',
    '- [ ] Owner has checked every number against the exports.',
    '- [ ] Every quote has written permission and names no child.',
    '- [ ] The "not statistically significant" note stays with the numbers if it applies.',
    '- [ ] Owner approves publishing on the landing page.',
    '',
  );
  return L.join('\n');
}

// ===== CLI =====

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_OUT = join(repoRoot, 'docs', 'pilot', 'PILOT-REPORT-DRAFT.md');

export function run(argv, { now = new Date() } = {}) {
  const args = [...argv];
  const outIdx = args.indexOf('--out');
  let out = DEFAULT_OUT;
  if (outIdx !== -1) {
    out = resolve(args[outIdx + 1] || '');
    args.splice(outIdx, 2);
  }
  const folder = args[0];
  if (!folder) throw new Error('Usage: npm run pilot:report -- <folder with pilot exports> [--out <file>]');
  if (!statSync(folder, { throwIfNoEntry: false })?.isDirectory()) throw new Error(`Not a folder: ${folder}`);
  const report = buildReport(readExports(folder), { now });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${renderMarkdown(report)}\n`);
  return { out, report };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { out, report } = run(process.argv.slice(2));
    const shown = relative(process.cwd(), out);
    console.log(`Pilot report draft written to ${shown.startsWith('..') ? out : shown}`);
    console.log(`${report.files.summaries} pilot summaries, ${report.files.surveys} surveys, ${report.files.skipped} skipped.`);
    if (!report.significant) console.log(`Note: fewer than ${MIN_SIGNIFICANT} students, results are not statistically significant.`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
