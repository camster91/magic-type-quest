/**
 * BloomType — Teacher Dashboard (ES Module)
 * Supports both localStorage (offline) and Supabase (cloud) class data.
 * Loaded by teacher.html as a Vite-bundled module.
 */

import { fetchClassRoster } from './sync.js';
import { normalizeClassCode } from './classroom.js';
import { createClassReportCSV, createRosterExport, mergeLinkedRosterRows, summarizeStudent } from './reporting.js';
import { assignmentStatus, cleanWordList, createClass, deleteClass, getClassMeta, listClasses, updateClass } from './classes.js';
import { escapeHTML } from './utils.js';
import { formatNumber } from './i18n.js';
import { initializePageTranslations, pageT } from './pageTranslations.js';
import { createTeacherLock, isValidPin } from './teacherLock.js';
import { createPilotSummary, downloadJSON, mountPilotSurvey } from './pilot.js';

const $ = (id) => document.getElementById(id);

let currentMode = 'local';
let currentClassCode = '';
let dashboardBound = false;
const lock = createTeacherLock();
// The rows on screen, as data, so exports never scrape the table text.
let currentRows = [];
// The raw student records behind those rows, for the anonymised pilot summary.
let currentStudents = [];

// True while the dashboard is open through a Google teacher sign-in only:
// cloud classes show, but student data saved on this device stays behind
// the PIN (a shared classroom device may hold other children's progress).
let cloudOnly = false;
const lockListeners = [];

function init() {
  initializePageTranslations();
  bindLock();
  if (lock.isUnlocked()) showDashboard();
  else showLock();
  // Pilot builds only: this static check removes the cloud code (and every
  // Supabase marker) from the public build.
  if (import.meta.env.VITE_CLOUD_CLASS_LOGIN === 'true') {
    import('./teacherCloudUI.js').then(({ mountTeacherCloud }) => mountTeacherCloud(cloudHost()));
  }
}

// What the pilot cloud dashboard may do on this page. It reuses the same
// report table, stats, alerts and CSV/JSON exports as the local dashboard.
function cloudHost() {
  return {
    isPinUnlocked: () => lock.isUnlocked(),
    openCloudOnly() {
      if (lock.isUnlocked()) return;
      showDashboard({ cloudOnly: true });
    },
    showCloudClass(code, rows) {
      currentMode = 'cloud';
      currentClassCode = code;
      renderToolbar();
      renderClassList();
      renderClassSettings();
      $('class-code-display').textContent = code;
      if (rows.length) renderRoster(rows, true);
      else showEmpty(pageT('teacher.cloud.emptyClass'));
    },
    clearReport() {
      currentClassCode = '';
      showEmpty(pageT('teacher.cloud.pickClass'));
    },
    onLock(listener) { lockListeners.push(listener); },
    lockPage() {
      lock.lock();
      showLock();
    },
  };
}

// ===== PIN LOCK =====
// Student data is only read and rendered after the PIN is accepted.
function showLock(message = '') {
  const settingUp = !lock.hasPin();
  $('teacher-dashboard').classList.add('hidden');
  $('student-body').replaceChildren();
  $('stats-grid').replaceChildren();
  $('alert-panel').replaceChildren();
  $('class-list')?.replaceChildren();
  $('print-cards')?.replaceChildren();
  if ($('class-settings')) $('class-settings').hidden = true;
  currentRows = [];
  currentStudents = [];
  cloudOnly = false;
  document.body.classList.remove('cloud-only');
  lockListeners.forEach((listener) => listener());
  $('teacher-lock').classList.remove('hidden');
  $('lock-title').textContent = pageT(settingUp ? 'teacher.lockTitleSet' : 'teacher.lockTitle');
  $('lock-intro').textContent = pageT(settingUp ? 'teacher.lockIntroSet' : 'teacher.lockIntro');
  $('btn-unlock').textContent = pageT(settingUp ? 'teacher.createPin' : 'teacher.unlock');
  $('pin-confirm-row').classList.toggle('hidden', !settingUp);
  $('btn-forgot-pin').classList.toggle('hidden', settingUp);
  $('pin-input').value = '';
  $('pin-confirm').value = '';
  $('lock-message').textContent = message;
  $('pin-input').focus();
}

function showDashboard({ cloudOnly: onlyCloud = false } = {}) {
  cloudOnly = onlyCloud;
  document.body.classList.toggle('cloud-only', cloudOnly);
  $('teacher-lock').classList.add('hidden');
  $('teacher-dashboard').classList.remove('hidden');
  if (!dashboardBound) {
    bindEvents();
    bindClassEvents();
    dashboardBound = true;
  }
  renderToolbar();
  if (cloudOnly) {
    currentMode = 'cloud';
    showEmpty(pageT('teacher.cloud.pickClass'));
    return;
  }
  renderClassList();
  loadLocalData();
}

function lockedMessage() {
  return pageT('teacher.pinLocked', { seconds: Math.ceil(lock.lockedForMs() / 1000) });
}

async function submitPin(event) {
  event.preventDefault();
  const pin = $('pin-input').value.trim();
  const say = (key) => { $('lock-message').textContent = pageT(key); };
  if (!lock.hasPin()) {
    if (!isValidPin(pin)) return say('teacher.pinInvalid');
    if (pin !== $('pin-confirm').value.trim()) return say('teacher.pinMismatch');
    await lock.setPin(pin);
    showDashboard();
    return;
  }
  const result = await lock.unlock(pin);
  if (result === 'ok') {
    showDashboard();
    return;
  }
  $('pin-input').value = '';
  $('lock-message').textContent = result === 'locked' ? lockedMessage() : pageT('teacher.pinWrong');
}

function bindLock() {
  $('lock-form')?.addEventListener('submit', submitPin);
  $('btn-lock')?.addEventListener('click', () => {
    lock.lock();
    showLock();
  });
  $('btn-forgot-pin')?.addEventListener('click', () => {
    if (!confirm(pageT('teacher.resetConfirm'))) return;
    lock.resetAndClearData(clearStudentStorage);
    showLock();
  });
}


// ===== Classes on this device =====
function renderClassList() {
  const list = $('class-list');
  if (!list) return;
  const classes = listClasses();
  list.innerHTML = classes.length
    ? classes.map((c) => `<button type="button" class="class-chip" data-code="${escapeHTML(c.code)}" aria-pressed="${c.code === currentClassCode}">${escapeHTML(c.name)}<code>${escapeHTML(c.code)}</code></button>`).join('')
    : `<p class="hint">${escapeHTML(pageT('teacher.noClassesYet'))}</p>`;
}

function renderClassSettings() {
  const panel = $('class-settings');
  const meta = getClassMeta(currentClassCode);
  if (!panel) return;
  panel.hidden = !meta;
  if (!meta) return;
  $('settings-class-name').textContent = meta.name;
  $('settings-class-code').textContent = currentClassCode;
  const select = $('assign-level');
  select.innerHTML = Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}">${escapeHTML(pageT('teacher.level'))} ${i + 1}</option>`).join('');
  select.value = String(meta.assignment?.level || 1);
  $('assign-due').value = meta.assignment?.due || '';
  $('class-words').value = (meta.words || []).join(', ');
  $('assignment-status').textContent = meta.assignment
    ? pageT('teacher.assignmentSet', { level: meta.assignment.level, due: meta.assignment.due || '—' })
    : '';
  $('words-status').textContent = meta.words?.length ? pageT('teacher.wordsSaved', { count: meta.words.length }) : '';
}

function selectClass(code) {
  currentMode = 'local';
  renderToolbar();
  loadClass(code);
  renderClassList();
  renderClassSettings();
}

function bindClassEvents() {
  $('class-list')?.addEventListener('click', (event) => {
    const chip = event.target.closest('.class-chip');
    if (chip) selectClass(chip.dataset.code);
  });
  $('new-class-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = $('new-class-name').value.trim();
    if (!name) return;
    const code = createClass(name);
    $('new-class-name').value = '';
    selectClass(code);
    $('settings-class-code')?.focus?.();
  });
  $('assignment-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    updateClass(currentClassCode, { assignment: { level: Number($('assign-level').value), due: $('assign-due').value || null } });
    renderClassSettings();
    loadClass(currentClassCode);
  });
  $('btn-clear-assignment')?.addEventListener('click', () => {
    updateClass(currentClassCode, { assignment: null });
    renderClassSettings();
    loadClass(currentClassCode);
  });
  $('words-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    updateClass(currentClassCode, { words: cleanWordList($('class-words').value) });
    renderClassSettings();
  });
  $('btn-print-cards')?.addEventListener('click', printStudentCards);
  $('btn-print-save-codes')?.addEventListener('click', printSaveCodes);
  $('btn-delete-class')?.addEventListener('click', () => {
    if (!confirm(pageT('teacher.deleteClassConfirm'))) return;
    deleteClass(currentClassCode);
    renderClassList();
    loadLocalData();
    renderClassSettings();
  });
}

// One card per student with their save code, for a student who lost their
// progress (new device, cleared browser). Codes hold progress, never names.
function printSaveCodes() {
  const rows = currentRows.filter((row) => row.saveCode);
  if (!rows.length) {
    // Online students sign in to their account on any device, so they never
    // need a save code.
    alert(pageT(currentRows.some((row) => row.cloud) ? 'teacher.cloudNoSaveCodes' : 'teacher.noSaveCodes'));
    return;
  }
  $('print-cards').innerHTML = rows.map((row) => `<div class="print-card">
      <h3>${escapeHTML(row.avatar)} ${escapeHTML(row.name)}</h3>
      <div class="pc-code long">${escapeHTML(row.saveCode)}</div>
      <p>${escapeHTML(pageT('teacher.saveCodeHow'))}</p>
    </div>`).join('');
  window.print();
}

function printStudentCards() {
  const meta = getClassMeta(currentClassCode);
  if (!meta) return;
  const card = `<div class="print-card">
      <h3>🌸 ${escapeHTML(pageT('teacher.cardTitle', { name: meta.name }))}</h3>
      <div class="pc-code">${escapeHTML(currentClassCode)}</div>
      <ol>
        <li>${escapeHTML(pageT('teacher.cardStep1'))}</li>
        <li>${escapeHTML(pageT('teacher.cardStep2'))}</li>
        <li>${escapeHTML(pageT('teacher.cardStep3'))}</li>
      </ol>
    </div>`;
  $('print-cards').innerHTML = card.repeat(8);
  window.print();
}

function bindEvents() {
  $('btn-load-class')?.addEventListener('click', () => {
    const code = $('class-code-input')?.value?.trim();
    if (code) loadClass(code);
  });
  $('btn-all-students')?.addEventListener('click', loadLocalData);
  $('btn-export-csv')?.addEventListener('click', exportCSV);
  $('btn-export-json')?.addEventListener('click', exportJSON);
  $('btn-pilot-summary')?.addEventListener('click', exportPilotSummary);
  // The survey is opt-in: it is only built when the teacher opens it.
  $('pilot-details')?.addEventListener('toggle', (event) => {
    if (event.target.open && !$('pilot-survey').hasChildNodes()) mountPilotSurvey($('pilot-survey'), 'teacher');
  });
  $('btn-clear-data')?.addEventListener('click', clearAllData);
  $('btn-cloud-mode')?.addEventListener('click', () => toggleMode('cloud'));
  $('btn-local-mode')?.addEventListener('click', () => toggleMode('local'));
}

function toggleMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  if (mode === 'local') loadLocalData();
  else if (currentClassCode) loadClass(currentClassCode);
}

async function loadClass(code) {
  currentClassCode = normalizeClassCode(code);
  $('class-code-display').textContent = currentClassCode;
  renderClassList();
  renderClassSettings();
  
  if (currentMode === 'cloud') {
    const rows = await fetchClassRoster(currentClassCode);
    // A child on several linked devices shows as one student.
    const roster = rows ? mergeLinkedRosterRows(rows) : rows;
    if (roster?.length) renderRoster(roster, true);
    else showEmpty(pageT('teacher.noCloud'));
  } else if (cloudOnly) {
    showEmpty(pageT('teacher.cloud.pinForLocal'));
  } else {
    const data = getLocalClassData(currentClassCode);
    const students = data ? Object.values(data) : [];
    if (students.length) renderRoster(students, false);
    else showEmpty(pageT('teacher.noClass', { code: currentClassCode }));
  }
}

function loadLocalData() {
  // Signed in with Google only: this device's student data needs the PIN.
  if (cloudOnly) {
    showEmpty(pageT('teacher.cloud.pinForLocal'));
    return;
  }
  currentClassCode = '';
  renderClassList();
  renderClassSettings();
  $('class-code-display').textContent = pageT('teacher.allLocal');
  const students = getAllLocalStudents();
  if (students.length > 0) renderRoster(students, false);
  else showEmpty(pageT('teacher.noLocal'));
}

function getLocalClassData(code) {
  const key = 'bloomtype-class-' + normalizeClassCode(code);
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function getAllLocalStudents() {
  const students = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('bloomtype_profile_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        data._key = key;
        students.push(data);
      } catch {}
    }
  }
  return students.sort((a, b) => (b.totalStars || 0) - (a.totalStars || 0));
}

function renderRoster(students, isCloud) {
  const tbody = $('student-body');
  const stats = $('stats-grid');
  const empty = $('empty-state');
  const alerts = $('alert-panel');
  
  empty.classList.add('hidden');
  
  // Stats
  const totalStars = students.reduce((s, st) => s + (st.total_stars ?? st.totalStars ?? 0), 0);
  const totalWords = students.reduce((s, st) => s + (st.total_words ?? st.totalWords ?? 0), 0);
  const avgLevel = students.reduce((s, st) => {
    const cl = st.completed_levels ?? st.completedLevels ?? [];
    return s + (Array.isArray(cl) ? cl.length : 0);
  }, 0) / students.length || 0;
  const activeToday = students.filter(st => {
    const lp = lastPlayedOf(st);
    if (!lp) return false;
    return new Date(lp).toDateString() === new Date().toDateString();
  }).length;
  
  stats.innerHTML = `
    <div class="stat-card"><div class="stat-value">${formatNumber(students.length)}</div><div class="stat-label">${pageT('teacher.students')}</div></div>
    <div class="stat-card"><div class="stat-value">${formatNumber(totalStars)}</div><div class="stat-label">${pageT('teacher.totalStars')}</div></div>
    <div class="stat-card"><div class="stat-value">${formatNumber(totalWords)}</div><div class="stat-label">${pageT('teacher.wordsTyped')}</div></div>
    <div class="stat-card"><div class="stat-value">${formatNumber(avgLevel, { maximumFractionDigits: 1 })}</div><div class="stat-label">${pageT('teacher.avgLevel')}</div></div>
    <div class="stat-card"><div class="stat-value">${formatNumber(activeToday)}</div><div class="stat-label">${pageT('teacher.activeToday')}</div></div>
  `;
  
  // Red-flag alerts
  const redFlags = students.filter(st => {
    if (st.notJoined) return false;
    const lp = lastPlayedOf(st);
    if (!lp) return true;
    const daysSince = (Date.now() - new Date(lp).getTime()) / 86400000;
    return daysSince > 7;
  });
  if (redFlags.length > 0 && alerts) {
    alerts.innerHTML = `
      <div class="alert-banner">
        <span class="alert-icon">⚠️</span>
        <span>${pageT(redFlags.length === 1 ? 'teacher.inactiveOne' : 'teacher.inactiveMany', { count: redFlags.length })}</span>
      </div>
    `;
    alerts.classList.remove('hidden');
  } else if (alerts) {
    alerts.classList.add('hidden');
  }
  
  // Table
  const assignment = getClassMeta(currentClassCode)?.assignment || null;
  currentStudents = students;
  currentRows = students.map((st) => studentRow(st, isCloud, assignment));
  tbody.innerHTML = currentRows.map((row) => `
      <tr>
        <td><span class="student-avatar">${escapeHTML(row.avatar)}</span> <strong>${escapeHTML(row.name)}</strong></td>
        <td>${escapeHTML(formatNumber(row.level))}</td>
        <td>${row.bestWpm ? escapeHTML(formatNumber(row.bestWpm)) : '—'}</td>
        <td>${row.avgAccuracy == null ? '—' : `${escapeHTML(formatNumber(row.avgAccuracy))}%`}</td>
        <td class="keys">${row.weakKeys.length ? escapeHTML(row.weakKeys.join(' ').toUpperCase()) : '—'}</td>
        <td>${row.minutes7d == null ? '—' : escapeHTML(formatNumber(row.minutes7d))}</td>
        <td>${escapeHTML(row.lastPlayed || '—')}</td>
        <td>${row.assignmentKey === 'none' ? '—' : `<span class="badge ${ASSIGNMENT_BADGES[row.assignmentKey]}">${escapeHTML(row.assignment)}</span>`}</td>
        <td class="save-code">${row.saveCode ? escapeHTML(row.saveCode) : escapeHTML(row.cloud ? pageT('teacher.saveCodeCloud') : '—')}</td>
        <td><span class="badge ${row.badgeClass}">${escapeHTML(row.status)}</span></td>
      </tr>
    `).join('');
}

const ASSIGNMENT_BADGES = { done: 'badge-green', 'not-yet': 'badge-blue', late: 'badge-yellow' };

// Cloud roster rows store their last save as updated_at.
function lastPlayedOf(st) {
  return st.last_played ?? st.lastPlayed ?? st.updated_at ?? null;
}

// One student's report row, from a local profile, class snapshot or cloud row.
// Cloud roster rows only carry totals, so their detailed numbers show as "—"
// (unknown) rather than 0 until the cloud roster stores them.
function studentRow(st, isCloud, assignment) {
  const completed = st.completed_levels ?? st.completedLevels ?? [];
  const level = Array.isArray(completed) ? completed.length : 0;
  const summary = st.keySR || st.levelStats || st.practiceLog ? summarizeStudent(st) : {
    bestWpm: st.bestWpm || 0,
    avgAccuracy: st.avgAccuracy ?? null,
    weakKeys: st.weakKeys || [],
    minutes7d: st.minutes7d ?? null,
    minutesTotal: st.minutesTotal ?? null,
  };
  const statusKey = st.notJoined ? 'teacher.cloud.notJoined' : level >= 10 ? 'teacher.completed' : level >= 5 ? 'teacher.onTrack' : level > 0 ? 'teacher.gettingStarted' : 'teacher.notStarted';
  const lastPlayedRaw = lastPlayedOf(st);
  const assignmentKey = assignmentStatus(completed, assignment);
  return {
    avatar: st.avatar || '🌸',
    name: st.name || pageT('teacher.anonymous'),
    level,
    ...summary,
    words: st.total_words ?? st.totalWords ?? 0,
    stars: st.total_stars ?? st.totalStars ?? 0,
    lastPlayed: lastPlayedRaw ? new Date(lastPlayedRaw).toLocaleDateString() : '',
    saveCode: isCloud ? '' : st.saveCode || '',
    cloud: Boolean(isCloud),
    assignmentKey,
    assignment: assignmentKey === 'none' ? '' : pageT(`teacher.assign.${assignmentKey}`),
    status: pageT(statusKey),
    badgeClass: st.notJoined ? 'badge-blue' : level >= 10 ? 'badge-green' : level >= 5 ? 'badge-yellow' : 'badge-red',
    source: isCloud ? pageT('teacher.cloud') : pageT('teacher.local'),
  };
}

function showEmpty(msg) {
  const tbody = $('student-body');
  const stats = $('stats-grid');
  const empty = $('empty-state');
  const alerts = $('alert-panel');
  currentRows = [];
  currentStudents = [];
  if (tbody) tbody.innerHTML = '';
  if (stats) stats.innerHTML = '';
  if (alerts) alerts.classList.add('hidden');
  if (empty) {
    // msg is often from class code input, so we escape it
    empty.innerHTML = `<h2>${pageT('teacher.noData')}</h2><p>${escapeHTML(msg)}</p><p>${pageT('teacher.emptyHint')}</p>`;
    empty.classList.remove('hidden');
  }
}

function renderToolbar() {
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === currentMode);
  });
}

function exportCSV() {
  if (currentRows.length === 0) { alert(pageT('teacher.noExport')); return; }

  const csv = createClassReportCSV(currentRows);
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, 'csv');
}

function exportJSON() {
  if (currentRows.length === 0) { alert(pageT('teacher.noExport')); return; }

  const payload = createRosterExport(currentClassCode, currentRows);

  const blob = new Blob([payload], { type: 'application/json' });
  downloadBlob(blob, 'json');
}

// Class-level numbers only (no names, no class code) for sharing pilot results.
function exportPilotSummary() {
  if (currentStudents.length === 0) { alert(pageT('teacher.noExport')); return; }
  const summary = createPilotSummary(currentStudents);
  downloadJSON(summary, `bloomtype-pilot-summary-${summary.generatedOn}.json`);
}

function downloadBlob(blob, extension) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bloomtype-class-${currentClassCode || 'all'}-${new Date().toISOString().split('T')[0]}.${extension}`;
  a.click();
  URL.revokeObjectURL(url);
}

function clearAllData() {
  if (cloudOnly) return;
  if (!confirm(pageT('teacher.clearConfirm'))) return;
  clearStudentStorage();
  currentClassCode = '';
  renderClassList();
  renderClassSettings();
  loadLocalData();
}

// Every student and class record on this device: profile copies, class
// snapshots, the class list and the active player's own progress.
function clearStudentStorage() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('bloomtype_') || key?.startsWith('bloomtype-class-')
      || key === 'bloomtype-classes' || key === 'bloomtype-profile') keys.push(key);
  }
  keys.forEach(k => localStorage.removeItem(k));
}

// Init
document.addEventListener('DOMContentLoaded', init);
