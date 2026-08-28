/**
 * BloomType — Teacher Dashboard (ES Module)
 * Supports both localStorage (offline) and Supabase (cloud) class data.
 * Loaded by teacher.html as a Vite-bundled module.
 */

import { fetchClassRoster } from './sync.js';
import { normalizeClassCode } from './classroom.js';
import { createRosterCSV, createRosterExport } from './reporting.js';
import { escapeHTML } from './utils.js';
import { formatNumber } from './i18n.js';
import { initializePageTranslations, pageT } from './pageTranslations.js';

const $ = (id) => document.getElementById(id);

let currentMode = 'local';
let currentClassCode = '';

function init() {
  initializePageTranslations();
  renderToolbar();
  bindEvents();
  loadLocalData();
}

function bindEvents() {
  $('btn-load-class')?.addEventListener('click', () => {
    const code = $('class-code-input')?.value?.trim();
    if (code) loadClass(code);
  });
  $('btn-all-students')?.addEventListener('click', loadLocalData);
  $('btn-export-csv')?.addEventListener('click', exportCSV);
  $('btn-export-json')?.addEventListener('click', exportJSON);
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
  
  if (currentMode === 'cloud') {
    const roster = await fetchClassRoster(currentClassCode);
    if (roster?.length) renderRoster(roster, true);
    else showEmpty(pageT('teacher.noCloud'));
  } else {
    const data = getLocalClassData(currentClassCode);
    const students = data ? Object.values(data) : [];
    if (students.length) renderRoster(students, false);
    else showEmpty(pageT('teacher.noClass', { code: currentClassCode }));
  }
}

function loadLocalData() {
  currentClassCode = '';
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
    const lp = st.last_played ?? st.lastPlayed;
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
    const lp = st.last_played ?? st.lastPlayed;
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
  tbody.innerHTML = students.map(st => {
    const cl = st.completed_levels ?? st.completedLevels ?? [];
    const level = Array.isArray(cl) ? cl.length : 0;
    const statusKey = level >= 10 ? 'teacher.completed' : level >= 5 ? 'teacher.onTrack' : level > 0 ? 'teacher.gettingStarted' : 'teacher.notStarted';
    const status = pageT(statusKey);
    const badgeClass = level >= 10 ? 'badge-green' : level >= 5 ? 'badge-yellow' : 'badge-red';
    const avatar = escapeHTML(st.avatar || '🌸');
    const name = escapeHTML(st.name || pageT('teacher.anonymous'));
    const words = escapeHTML(formatNumber(st.total_words ?? st.totalWords ?? 0));
    const score = escapeHTML(formatNumber(st.high_score ?? st.highScore ?? 0));
    const stars = escapeHTML(formatNumber(st.total_stars ?? st.totalStars ?? 0));
    
    return `
      <tr>
        <td><span class="student-avatar">${avatar}</span> <strong>${name}</strong></td>
        <td>${pageT('teacher.level')} ${escapeHTML(formatNumber(level))}</td>
        <td>${words}</td>
        <td>${score}</td>
        <td>${stars} ⭐</td>
        <td><span class="badge ${badgeClass}">${escapeHTML(status)}</span></td>
        <td>${isCloud ? pageT('teacher.cloud') : pageT('teacher.local')}</td>
      </tr>
    `;
  }).join('');
}

function showEmpty(msg) {
  const tbody = $('student-body');
  const stats = $('stats-grid');
  const empty = $('empty-state');
  const alerts = $('alert-panel');
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
  const students = getRenderedStudents();
  if (students.length === 0) { alert(pageT('teacher.noExport')); return; }

  const csv = createRosterCSV(students);
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, 'csv');
}

function exportJSON() {
  const students = getRenderedStudents();
  if (students.length === 0) { alert(pageT('teacher.noExport')); return; }

  const payload = createRosterExport(currentClassCode, students);

  const blob = new Blob([payload], { type: 'application/json' });
  downloadBlob(blob, 'json');
}

function getRenderedStudents() {
  return Array.from(document.querySelectorAll('#student-body tr')).map(row => {
    const tds = row.querySelectorAll('td');
    return {
      name: tds[0]?.textContent?.trim() || '',
      level: tds[1]?.textContent?.trim() || '',
      words: tds[2]?.textContent?.trim() || '',
      score: tds[3]?.textContent?.trim() || '',
      stars: tds[4]?.textContent?.trim() || '',
      status: tds[5]?.textContent?.trim() || '',
      source: tds[6]?.textContent?.trim() || '',
    };
  });
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
  if (!confirm(pageT('teacher.clearConfirm'))) return;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('bloomtype_') || key?.startsWith('bloomtype-class-')) keys.push(key);
  }
  keys.forEach(k => localStorage.removeItem(k));
  loadLocalData();
}

// Init
document.addEventListener('DOMContentLoaded', init);
