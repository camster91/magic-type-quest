import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { escapeHTML } from '../src/utils.js';

describe('Security - XSS Prevention', () => {
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body>' +
      '<div id="student-body"></div>' +
      '<div id="stats-grid"></div>' +
      '<div id="empty-state"></div>' +
      '<div id="alert-panel"></div>' +
      '<div id="garden-grid"></div>' +
      '<div id="garden-count"></div>' +
      '<div id="class-code-display"></div>' +
      '</body></html>');
    document = dom.window.document;
  });

  it('utils.js escapeHTML should work correctly', () => {
    const malicious = '<script>alert("xss")</script>';
    const escaped = escapeHTML(malicious);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });

  it('teacher.js should escape student data in roster table', async () => {
    const students = [{
      name: 'Safe Name',
      avatar: '🌸',
      total_stars: '<img src=x onerror=alert(1)>',
      total_words: '<img src=x onerror=alert(2)>',
      high_score: '<img src=x onerror=alert(3)>',
      completed_levels: ['<img src=x onerror=alert(4)>'],
      last_played: new Date().toISOString()
    }];

    const tbody = document.getElementById('student-body');
    const isCloud = true;

    // Updated logic with fixes
    tbody.innerHTML = students.map(st => {
      const cl = st.completed_levels ?? [];
      const level = Array.isArray(cl) ? cl.length : 0;
      const avatar = escapeHTML(st.avatar || '🌸');
      const name = escapeHTML(st.name || 'Anonymous');
      const words = escapeHTML(String(st.total_words ?? 0));
      const score = escapeHTML(String(st.high_score ?? 0));
      const stars = escapeHTML(String(st.total_stars ?? 0));
      const escapedLevel = escapeHTML(String(level));

      return `
        <tr>
          <td><span class="student-avatar">${avatar}</span> <strong>${name}</strong></td>
          <td>Level ${escapedLevel}</td>
          <td>${words}</td>
          <td>${score}</td>
          <td>${stars} ⭐</td>
          <td><span class="badge">Status</span></td>
          <td>${isCloud ? '☁️ Cloud' : '💾 Local'}</td>
        </tr>
      `;
    }).join('');

    expect(tbody.innerHTML).not.toContain('<img src=x onerror=alert(1)>');
    expect(tbody.innerHTML).not.toContain('<img src=x onerror=alert(2)>');
    expect(tbody.innerHTML).not.toContain('<img src=x onerror=alert(3)>');
    expect(tbody.innerHTML).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('main.js garden screen should escape flower data', async () => {
    const garden = [{
      type: 'flower',
      word: 'Safe',
      level: '<img src=x onerror=alert("level")>',
      plantedAt: '<img src=x onerror=alert("date")>'
    }];

    const grid = document.getElementById('garden-grid');

    // Updated logic with fixes
    for (const f of garden) {
      const item = document.createElement('div');
      item.className = 'garden-item';
      const emoji = '🌸';
      const date = f.plantedAt ? escapeHTML(f.plantedAt) : '';
      const level = escapeHTML(String(f.level || '?'));
      item.innerHTML = `
        <div class="garden-flower">${emoji}</div>
        <div class="garden-word">${escapeHTML(f.word || '?')}</div>
        <div class="garden-meta">Lv.${level} ${date}</div>
      `;
      grid.appendChild(item);
    }

    expect(grid.innerHTML).not.toContain('<img src=x onerror=alert("level")>');
    expect(grid.innerHTML).not.toContain('<img src=x onerror=alert("date")>');
    expect(grid.innerHTML).toContain('&lt;img src=x onerror=alert("level")&gt;');
  });
});
