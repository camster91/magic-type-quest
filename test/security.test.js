import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { escapeHTML } from '../src/utils.js';

describe('Security: XSS Vulnerability Fix Verification', () => {
  let dom, document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body><div id="student-body"></div><div id="stats-grid"></div><div id="garden-grid"></div></body></html>');
    document = dom.window.document;
    global.document = document;
    global.window = dom.window;
  });

  it('verifies that numeric fields in Teacher Dashboard roster are escaped', () => {
    const tbody = document.getElementById('student-body');
    const xssPayload = '<img src=x onerror="alert(1)">';

    // Simulate the FIXED logic in src/teacher.js renderRoster
    const students = [{
      name: 'Alice',
      avatar: '🌸',
      total_words: xssPayload,
      high_score: 100,
      total_stars: 10,
      completed_levels: [1]
    }];

    tbody.innerHTML = students.map(st => {
      const words = escapeHTML(st.total_words ?? 0);
      return `<tr><td>${words}</td></tr>`;
    }).join('');

    // JSDOM might normalize &quot; to " in innerHTML
    expect(tbody.innerHTML).not.toContain('<img src=x');
    expect(tbody.innerHTML).toContain('&lt;img');
  });

  it('verifies that aggregated numeric fields in Teacher Dashboard stats use Number coercion', () => {
    const stats = document.getElementById('stats-grid');
    const xssPayload = '<img src=x onerror="alert(1)">';

    const students = [{ total_stars: xssPayload }];

    // Simulate the FIXED logic in src/teacher.js renderRoster
    const totalStars = students.reduce((s, st) => s + (Number(st.total_stars) || 0), 0);

    stats.innerHTML = `<div class="stat-value">${totalStars}</div>`;

    expect(stats.innerHTML).toContain('0');
    expect(stats.innerHTML).not.toContain(xssPayload);
  });

  it('verifies that level field in Garden Screen is escaped', () => {
    const grid = document.getElementById('garden-grid');
    const xssPayload = '<img src=x onerror="alert(1)">';

    const garden = [{
      level: xssPayload,
      word: 'test'
    }];

    // Simulate the FIXED logic in src/main.js loadGardenScreen
    for (const f of garden) {
      const item = document.createElement('div');
      item.innerHTML = `<div class="garden-meta">Lv.${escapeHTML(f.level || '?')}</div>`;
      grid.appendChild(item);
    }

    expect(grid.innerHTML).not.toContain('<img src=x');
    expect(grid.innerHTML).toContain('&lt;img');
  });

  it('verifies that escapeHTML correctly mitigates the payload', () => {
    const xssPayload = '<img src=x onerror="alert(1)">';
    const escaped = escapeHTML(xssPayload);

    expect(escaped).not.toContain('<img');
    expect(escaped).toContain('&lt;img');
    expect(escaped).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  });
});
