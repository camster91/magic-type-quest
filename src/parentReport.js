/**
 * BloomType — family progress (parent page)
 * Shows what each child on this device practised this week, and prints a
 * homeschool record. Reads only this browser's storage.
 */
import { listPlayers } from './players.js';
import { practiceDays, practiceSummary } from './practiceLog.js';
import { summarizeStudent } from './reporting.js';
import { escapeHTML } from './utils.js';
import { initializePageTranslations, pageT } from './pageTranslations.js';
import { discoveredCards } from './fieldGuide.js';

/** Keys a child has clearly learned: 5+ tries at 90%+ accuracy. */
export function masteredKeys(keySR = {}) {
  return Object.entries(keySR)
    .filter(([key, sr]) => /^[a-z]$/i.test(key) && (sr.correct || 0) + (sr.wrong || 0) >= 5
      && (sr.correct || 0) / ((sr.correct || 0) + (sr.wrong || 0)) >= 0.9)
    .map(([key]) => key.toLowerCase())
    .sort();
}

/** Everything the parent card and the homeschool record show for one child. */
export function childReport(profile, now = new Date()) {
  const week = practiceSummary(profile, 7, now);
  const summary = summarizeStudent(profile, now);
  return {
    name: profile.name || 'Player',
    avatar: profile.avatar || '🌸',
    weekMinutes: week.minutes,
    weekDays: week.activeDays,
    totalMinutes: summary.minutesTotal,
    bestWpm: summary.bestWpm,
    accuracy: summary.avgAccuracy,
    levels: [...(profile.completedLevels || [])].sort((a, b) => a - b),
    mastered: masteredKeys(profile.keySR),
    weakKeys: summary.weakKeys,
    cards: discoveredCards(profile).length,
    days: practiceDays(profile),
  };
}

function statPill(text) {
  return `<div class="stat-pill">${escapeHTML(text)}</div>`;
}

function renderChild(report, index) {
  return `
    <article class="child-card">
      <h3><span aria-hidden="true">${escapeHTML(report.avatar)}</span> ${escapeHTML(report.name)}</h3>
      <div class="stat-row">
        ${statPill(pageT('family.weekMinutes', { minutes: report.weekMinutes }))}
        ${statPill(pageT('family.weekDays', { days: report.weekDays }))}
        ${statPill(pageT('family.speed', { wpm: report.bestWpm || 0 }))}
        ${report.accuracy == null ? '' : statPill(pageT('family.accuracy', { accuracy: report.accuracy }))}
        ${statPill(pageT('family.levels', { count: report.levels.length }))}
      </div>
      <p class="child-line">${escapeHTML(pageT('family.mastered'))} <strong class="keys">${escapeHTML(report.mastered.join(' ').toUpperCase() || '—')}</strong></p>
      <p class="child-line">${escapeHTML(pageT('family.practiceNext'))} <strong class="keys">${escapeHTML(report.weakKeys.join(' ').toUpperCase() || '—')}</strong></p>
      <button type="button" class="record-btn" data-child="${index}">${escapeHTML(pageT('family.printRecord'))}</button>
    </article>`;
}

/** A printable homeschool record: hours, days practised and progress. */
export function recordHTML(report, now = new Date()) {
  const first = report.days[0]?.date || '—';
  const hours = Math.round((report.totalMinutes / 60) * 10) / 10;
  const rows = report.days.map((d) => `<tr><td>${escapeHTML(d.date)}</td><td>${escapeHTML(String(d.minutes))}</td></tr>`).join('');
  return `
    <h1>${escapeHTML(pageT('family.recordTitle'))}</h1>
    <p><strong>${escapeHTML(pageT('family.recordStudent'))}</strong> ${escapeHTML(report.name)}</p>
    <p><strong>${escapeHTML(pageT('family.recordPeriod'))}</strong> ${escapeHTML(first)} – ${escapeHTML(now.toISOString().slice(0, 10))}</p>
    <p><strong>${escapeHTML(pageT('family.recordHours'))}</strong> ${escapeHTML(String(hours))} (${escapeHTML(String(report.totalMinutes))} min)</p>
    <p><strong>${escapeHTML(pageT('family.recordLevels'))}</strong> ${escapeHTML(report.levels.join(', ') || '—')}</p>
    <p><strong>${escapeHTML(pageT('family.recordSpeed'))}</strong> ${escapeHTML(String(report.bestWpm || 0))} WPM · ${escapeHTML(report.accuracy == null ? '—' : `${report.accuracy}%`)}</p>
    <p><strong>${escapeHTML(pageT('family.recordKeys'))}</strong> ${escapeHTML(report.mastered.join(' ').toUpperCase() || '—')}</p>
    <table><thead><tr><th>${escapeHTML(pageT('family.recordDate'))}</th><th>${escapeHTML(pageT('family.recordMinutes'))}</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="sig">${escapeHTML(pageT('family.recordSignature'))} ______________________</p>`;
}

export function initFamilyProgress(root = document, storage = localStorage) {
  const container = root.getElementById('family-progress');
  const sample = root.getElementById('family-sample');
  if (!container) return [];
  const reports = listPlayers(storage).map((profile) => childReport(profile));
  if (reports.length === 0) {
    container.hidden = true;
    if (sample) sample.hidden = false;
    return reports;
  }
  if (sample) sample.hidden = true;
  container.hidden = false;
  root.getElementById('family-list').innerHTML = reports.map(renderChild).join('');
  root.getElementById('family-list').addEventListener('click', (event) => {
    const button = event.target.closest('.record-btn');
    if (!button) return;
    root.getElementById('print-record').innerHTML = recordHTML(reports[Number(button.dataset.child)]);
    globalThis.print?.();
  });
  return reports;
}

if (typeof document !== 'undefined' && document.getElementById('family-progress')) {
  initializePageTranslations();
  initFamilyProgress();
}
