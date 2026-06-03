/**
 * BloomType — Teacher Dashboard (ES Module)
 * Supports both localStorage (offline) and Supabase (cloud) class data.
 * Loaded by teacher.html as a Vite-bundled module.
 */

import { fetchClassRoster } from './sync.js';
import { escapeHTML } from './utils.js';

const $ = (id) => document.getElementById(id);

let currentMode = 'local';
let currentClassCode = '';

function init() {
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
  currentClassCode = code;
  $('class-code-display').textContent = code.toUpperCase();
  
  if (currentMode === 'cloud') {
    const roster = await fetchClassRoster(code);
    if (roster) renderRoster(roster, true);
    else showEmpty('No cloud data for this class. Students may not have synced yet.');
  } else {
    const data = getLocalClassData(code);
    if (data) renderRoster(Object.values(data), false);
    else showEmpty(`No students have joined class ${code} on this device yet.`);
  }
}

function loadLocalData() {
  currentClassCode = '';
  $('class-code-display').textContent = 'All Students (Local)';
  const students = getAllLocalStudents();
  if (students.length > 0) renderRoster(students, false);
  else showEmpty('No student data on this device yet.');
}

function getLocalClassData(code) {
  const key = 'bloomtype-class-' + code.toUpperCase().trim().replace(/\s+/g, '');
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
    <div class="stat-card"><div class="stat-value">${students.length}</div><div class="stat-label">Students</div></div>
    <div class="stat-card"><div class="stat-value">${escapeHTML(totalStars)}</div><div class="stat-label">Total Stars</div></div>
    <div class="stat-card"><div class="stat-value">${escapeHTML(totalWords)}</div><div class="stat-label">Words Typed</div></div>
    <div class="stat-card"><div class="stat-value">${avgLevel.toFixed(1)}</div><div class="stat-label">Avg Level</div></div>
    <div class="stat-card"><div class="stat-value">${activeToday}</div><div class="stat-label">Active Today</div></div>
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
        <span>${redFlags.length} student${redFlags.length > 1 ? 's' : ''} haven't played in 7+ days.</span>
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
    const status = level >= 10 ? 'Completed!' : level >= 5 ? 'On Track' : level > 0 ? 'Getting Started' : 'Not Started';
    const badgeClass = level >= 10 ? 'badge-green' : level >= 5 ? 'badge-yellow' : 'badge-red';
    const avatar = escapeHTML(st.avatar || '🌸');
    const name = escapeHTML(st.name || 'Anonymous');
    // Numeric fields from localStorage/Cloud are untrusted and must be escaped
    const words = escapeHTML(st.total_words ?? st.totalWords ?? 0);
    const score = escapeHTML(st.high_score ?? st.highScore ?? 0);
    const stars = escapeHTML(st.total_stars ?? st.totalStars ?? 0);
    
    return `
      <tr>
        <td><span class="student-avatar">${avatar}</span> <strong>${name}</strong></td>
        <td>Level ${level}</td>
        <td>${words}</td>
        <td>${score}</td>
        <td>${stars} ⭐</td>
        <td><span class="badge ${badgeClass}">${status}</span></td>
        <td>${isCloud ? '☁️ Cloud' : '💾 Local'}</td>
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
    empty.innerHTML = `<h2>No data yet</h2><p>${escapeHTML(msg)}</p><p>Students will appear here after they play BloomType. 🌸</p>`;
    empty.classList.remove('hidden');
  }
}

function renderToolbar() {
  const isCloud = currentMode === 'cloud';
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === currentMode);
  });
}

function exportCSV() {
  const rows = Array.from(document.querySelectorAll('#student-body tr'));
  if (rows.length === 0) { alert('No data to export'); return; }
  
  const headers = ['Name', 'Level', 'Words', 'Score', 'Stars', 'Status', 'Source'];
  const data = rows.map(row => {
    const tds = row.querySelectorAll('td');
    return Array.from(tds).map(td => td.textContent.trim()).join(',');
  });
  
  const csv = [headers.join(','), ...data].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bloomtype-class-${currentClassCode || 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportJSON() {
  const rows = Array.from(document.querySelectorAll('#student-body tr'));
  if (rows.length === 0) { alert('No data to export'); return; }
  
  const students = rows.map(row => {
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
  
  const payload = {
    classCode: currentClassCode || 'all',
    exportedAt: new Date().toISOString(),
    students,
  };
  
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bloomtype-class-${currentClassCode || 'all'}-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function clearAllData() {
  if (!confirm('⚠️ Delete ALL local student data? Cannot be undone!')) return;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('bloomtype_')) keys.push(key);
  }
  keys.forEach(k => localStorage.removeItem(k));
  loadLocalData();
}

// Init
document.addEventListener('DOMContentLoaded', init);
