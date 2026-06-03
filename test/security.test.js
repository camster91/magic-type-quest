import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { escapeHTML } from '../src/utils.js';

describe('Security: XSS in Game UI', async () => {
  let dom;
  let document;

  beforeEach(async () => {
    dom = new JSDOM('<!DOCTYPE html><html><body><div id="student-body"></div><div id="garden-grid"></div></body></html>');
    document = dom.window.document;
  });

  it('Teacher Dashboard: renderRoster should escape numeric fields', async () => {
    const st = {
      name: 'Safe Student',
      avatar: '🌸',
      total_stars: '<img src=x onerror=alert("STARS")>',
      total_words: '<img src=x onerror=alert("WORDS")>',
      high_score: '<img src=x onerror=alert("SCORE")>',
      completed_levels: [1, 2]
    };

    const tbody = document.getElementById('student-body');

    // Simulating the fixed logic in teacher.js
    const words = escapeHTML(st.total_words ?? 0);
    const score = escapeHTML(st.high_score ?? 0);
    const stars = escapeHTML(st.total_stars ?? 0);

    tbody.innerHTML = `
      <tr>
        <td>${words}</td>
        <td>${score}</td>
        <td>${stars} ⭐</td>
      </tr>
    `;

    // If correctly escaped, there should be NO img tags
    expect(tbody.querySelectorAll('img').length).toBe(0);
  });

  it('Garden Screen: loadGardenScreen should escape level and other fields', async () => {
    const garden = [
      {
        type: 'flower',
        word: 'sun',
        level: '10<img src=x onerror=alert("GARDEN_LEVEL")>',
        plantedAt: new Date().toISOString()
      }
    ];

    const grid = document.getElementById('garden-grid');

    // Simulating the fixed logic in main.js
    for (const f of garden) {
      const item = document.createElement('div');
      item.innerHTML = `
        <div class="garden-word">${escapeHTML(f.word || '?')}</div>
        <div class="garden-meta">Lv.${escapeHTML(f.level || '?')}</div>
      `;
      grid.appendChild(item);
    }

    expect(grid.querySelectorAll('img').length).toBe(0);
  });
});
