/**
 * BloomType — pilot feedback and pilot summary
 *
 * Two opt-in, local-only tools for the classroom and homeschool pilot:
 * - a short survey for grown-ups (never children), saved only in this
 *   browser after they press Save, and exported by them with Copy or Download;
 * - an anonymised class-level summary (counts, medians, totals) for teachers.
 * Neither has a name, class code, device id or exact timestamp in it, and
 * nothing here makes a network request.
 */
import { practiceSummary } from './practiceLog.js';
import { summarizeStudent } from './reporting.js';
import { escapeHTML } from './utils.js';
import { getPageLocale, pageT } from './pageTranslations.js';

export const PILOT_SURVEY_KEY = 'bloomtype-pilot-survey';
export const SURVEY_VERSION = 1;
export const SUMMARY_VERSION = 1;
export const SURVEY_ROLES = ['teacher', 'parent'];
export const MINUTE_BANDS = ['under30', '30to60', '60to120', 'over120'];
const TEXT_LIMIT = 1000;

/** The survey: five quick answers and one optional comment. */
export const SURVEY_QUESTIONS = [
  { id: 'setupEase', type: 'scale' },
  { id: 'childEnjoyment', type: 'scale' },
  { id: 'typingImprovement', type: 'scale' },
  { id: 'minutesPerWeek', type: 'choice', options: MINUTE_BANDS },
  { id: 'wouldRecommend', type: 'scale' },
  { id: 'comments', type: 'text' },
];

const dateOnly = (date) => {
  // A saved YYYY-MM-DD stays as it is (parsing it would shift it by time zone).
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Keep only known questions and valid values; unknown keys are dropped. */
export function normalizeSurveyAnswers(raw = {}) {
  const answers = {};
  for (const q of SURVEY_QUESTIONS) {
    const value = raw?.[q.id];
    if (q.type === 'scale') {
      const n = Number(value);
      answers[q.id] = Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
    } else if (q.type === 'choice') {
      answers[q.id] = q.options.includes(value) ? value : null;
    } else {
      const text = typeof value === 'string' ? value.trim().slice(0, TEXT_LIMIT) : '';
      answers[q.id] = text;
    }
  }
  return answers;
}

export function hasAnyAnswer(answers = {}) {
  return SURVEY_QUESTIONS.some((q) => answers[q.id] != null && answers[q.id] !== '');
}

/**
 * What a grown-up copies or downloads. Only their role (teacher or parent),
 * the page language, the day it was saved and their answers.
 */
export function createSurveyExport(answers, { role = 'parent', locale = 'en', savedOn = new Date() } = {}) {
  return {
    type: 'bloomtype-pilot-feedback',
    version: SURVEY_VERSION,
    role: SURVEY_ROLES.includes(role) ? role : 'parent',
    language: typeof locale === 'string' ? locale.slice(0, 5) : 'en',
    savedOn: dateOnly(savedOn),
    answers: normalizeSurveyAnswers(answers),
  };
}

/** Saved surveys, keyed by role, so a teacher and parent on one device stay apart. */
export function loadSurvey(role, storage = globalThis.localStorage) {
  const saved = readAll(storage)[role];
  return saved ? createSurveyExport(saved.answers, { role, locale: saved.language, savedOn: saved.savedOn }) : null;
}

function readAll(storage) {
  try {
    const all = JSON.parse(storage?.getItem(PILOT_SURVEY_KEY) || '{}');
    return all && typeof all === 'object' ? all : {};
  } catch {
    return {};
  }
}

export function saveSurvey(role, answers, { locale = 'en', now = new Date(), storage = globalThis.localStorage } = {}) {
  const record = createSurveyExport(answers, { role, locale, savedOn: now });
  const all = readAll(storage);
  all[record.role] = record;
  storage.setItem(PILOT_SURVEY_KEY, JSON.stringify(all));
  return record;
}

export function deleteSurvey(role, storage = globalThis.localStorage) {
  const all = readAll(storage);
  delete all[role];
  if (Object.keys(all).length) storage.setItem(PILOT_SURVEY_KEY, JSON.stringify(all));
  else storage.removeItem(PILOT_SURVEY_KEY);
}

// ===== Pilot summary (class-level aggregates) =====

const round1 = (n) => Math.round(n * 10) / 10;

export function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return round1(sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2);
}

export function average(values) {
  return values.length ? round1(values.reduce((a, b) => a + b, 0) / values.length) : null;
}

const stat = (values) => ({ median: median(values), average: average(values), studentsCounted: values.length });

function isWithinDays(value, days, now) {
  const time = value ? new Date(value).getTime() : NaN;
  if (Number.isNaN(time)) return false;
  return now.getTime() - time < days * 24 * 60 * 60 * 1000;
}

/**
 * One anonymised summary for a group of students. Accepts local profiles,
 * class snapshots or cloud rows; a number a record does not carry is left out
 * of that statistic (studentsCounted says how many were used).
 */
export function createPilotSummary(students = [], now = new Date()) {
  const wpm = [];
  const accuracy = [];
  const levels = {};
  for (let i = 0; i <= 10; i++) levels[i] = 0;
  let minutes7 = 0;
  let minutes28 = 0;
  let counted7 = 0;
  let counted28 = 0;
  let active7 = 0;
  const days = [];

  for (const st of students) {
    const hasDetail = Boolean(st.levelStats || st.practiceLog || st.keySR);
    const summary = hasDetail ? summarizeStudent(st, now) : st;
    const best = Number(summary.bestWpm) || 0;
    if (best > 0) wpm.push(best);
    const acc = Number(summary.avgAccuracy);
    if (summary.avgAccuracy != null && Number.isFinite(acc) && acc > 0) accuracy.push(acc);

    const completed = st.completed_levels ?? st.completedLevels ?? [];
    const reached = Math.min(10, Math.max(0, Array.isArray(completed) ? completed.length : 0));
    levels[reached]++;

    if (st.practiceLog) {
      const week = practiceSummary(st, 7, now);
      minutes7 += week.minutes;
      minutes28 += practiceSummary(st, 28, now).minutes;
      counted7++;
      counted28++;
      if (week.minutes > 0) active7++;
      for (const [day, mins] of Object.entries(st.practiceLog)) if (mins > 0) days.push(day);
    } else if (typeof st.minutes7d === 'number') {
      // A snapshot's minutes7d covers the week before it was saved. Every
      // practice saves a fresh snapshot, so one older than a week means no
      // practice since: count it as 0, not as this week's minutes.
      const fresh = isWithinDays(st.updatedAt ?? st.updated_at ?? st.last_played ?? st.lastPlayed, 7, now);
      const mins = fresh ? st.minutes7d : 0;
      minutes7 += mins;
      counted7++;
      if (mins > 0) active7++;
    }
    // Only records without a practice log fall back to the last-played date:
    // saving settings also updates it, so it can't stretch the practice range.
    if (!st.practiceLog) {
      const last = st.last_played ?? st.lastPlayed ?? st.updated_at ?? null;
      if (last && !Number.isNaN(new Date(last).getTime())) days.push(dateOnly(last));
    }
  }

  days.sort();
  return {
    type: 'bloomtype-pilot-summary',
    version: SUMMARY_VERSION,
    generatedOn: dateOnly(now),
    dateRange: { from: days[0] || null, to: days[days.length - 1] || null },
    studentCount: students.length,
    wpm: stat(wpm),
    accuracyPercent: stat(accuracy),
    minutes: {
      last7Days: round1(minutes7),
      last28Days: round1(minutes28),
      studentsCounted7Days: counted7,
      studentsCounted28Days: counted28,
      activeStudentsLast7Days: active7,
    },
    levelsReached: levels,
  };
}

// ===== Survey form (DOM) =====

function questionHTML(q) {
  const label = escapeHTML(pageT(`pilot.q.${q.id}`));
  const id = `pilot-${q.id}`;
  if (q.type === 'scale') {
    const radios = [1, 2, 3, 4, 5].map((n) => `
      <label class="pilot-choice"><input type="radio" name="${q.id}" value="${n}"> ${n}</label>`).join('');
    return `<fieldset class="pilot-q"><legend>${label}</legend>
      <p class="pilot-hint">${escapeHTML(pageT('pilot.scaleHint'))}</p>
      <div class="pilot-scale">${radios}</div></fieldset>`;
  }
  if (q.type === 'choice') {
    const options = [`<option value="">${escapeHTML(pageT('pilot.choose'))}</option>`,
      ...q.options.map((o) => `<option value="${o}">${escapeHTML(pageT(`pilot.minutes.${o}`))}</option>`)].join('');
    return `<div class="pilot-q"><label for="${id}">${label}</label>
      <select id="${id}" name="${q.id}" class="pilot-field">${options}</select></div>`;
  }
  return `<div class="pilot-q"><label for="${id}">${label}</label>
    <p class="pilot-hint" id="${id}-hint">${escapeHTML(pageT('pilot.noNames'))}</p>
    <textarea id="${id}" name="${q.id}" class="pilot-field" maxlength="${TEXT_LIMIT}" aria-describedby="${id}-hint"></textarea></div>`;
}

function readForm(form) {
  // A radio group's RadioNodeList value is '' when nothing is picked.
  return Object.fromEntries(SURVEY_QUESTIONS.map((q) => [q.id, form.elements[q.id]?.value || null]));
}

function fillForm(form, answers) {
  for (const q of SURVEY_QUESTIONS) {
    const value = answers[q.id];
    if (q.type === 'scale') {
      form.querySelectorAll(`input[name="${q.id}"]`).forEach((input) => { input.checked = Number(input.value) === value; });
    } else {
      form.elements[q.id].value = value ?? '';
    }
  }
}

export function downloadJSON(payload, filename, doc = document) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = doc.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Render the survey into `container`. Nothing is stored until Save. */
export function mountPilotSurvey(container, role, storage = globalThis.localStorage) {
  if (!container) return;
  container.innerHTML = `<form class="pilot-form" novalidate>
      ${SURVEY_QUESTIONS.map(questionHTML).join('')}
      <div class="pilot-actions">
        <button type="submit" class="pilot-btn pilot-btn-primary">${escapeHTML(pageT('pilot.save'))}</button>
        <button type="button" class="pilot-btn" data-action="copy">${escapeHTML(pageT('pilot.copy'))}</button>
        <button type="button" class="pilot-btn" data-action="download">${escapeHTML(pageT('pilot.download'))}</button>
        <button type="button" class="pilot-btn" data-action="delete">${escapeHTML(pageT('pilot.delete'))}</button>
      </div>
      <p class="pilot-status" role="status"></p>
    </form>`;
  const form = container.querySelector('form');
  const status = container.querySelector('.pilot-status');
  const say = (key) => { status.textContent = pageT(key); };
  const saved = loadSurvey(role, storage);
  if (saved) fillForm(form, saved.answers);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const answers = normalizeSurveyAnswers(readForm(form));
    if (!hasAnyAnswer(answers)) return say('pilot.empty');
    saveSurvey(role, answers, { locale: getPageLocale(), storage });
    say('pilot.saved');
  });
  form.addEventListener('click', async (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    if (action === 'delete') {
      deleteSurvey(role, storage);
      form.reset();
      return say('pilot.deleted');
    }
    const record = loadSurvey(role, storage);
    if (!record) return say('pilot.nothingSaved');
    if (action === 'download') {
      downloadJSON(record, `bloomtype-pilot-feedback-${record.savedOn}.json`);
      return say('pilot.downloaded');
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(record, null, 2));
      say('pilot.copied');
    } catch {
      say('pilot.copyFailed');
    }
  });
}
