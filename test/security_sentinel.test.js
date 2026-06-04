import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mocking sync.js since it might try to use Supabase which we don't have here
vi.mock('../src/sync.js', () => ({
  fetchClassRoster: vi.fn(),
}));

describe('Security: XSS Vulnerabilities', () => {
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body><div id="stats-grid"></div><table id="student-table"><tbody id="student-body"></tbody></table><div id="empty-state" class="hidden"></div><div id="alert-panel" class="hidden"></div></body></html>');
    document = dom.window.document;
    global.document = document;
    global.window = dom.window;
    global.Node = dom.window.Node;
    global.Element = dom.window.Element;
    global.HTMLElement = dom.window.HTMLElement;
    global.HTMLTableSectionElement = dom.window.HTMLTableSectionElement;
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    // Fix for URL is not a constructor
    global.URL = dom.window.URL;
    global.Blob = dom.window.Blob;
  });

  it('vulnerability: teacher dashboard stats should be resistant to XSS in numeric fields', async () => {
    // Import teacher.js after setting up DOM
    const { renderRoster } = await import('../src/teacher.js');

    const maliciousStudent = {
      name: 'Attacker',
      total_stars: '<img src=x onerror=alert("xss-stars")>',
      total_words: '<img src=x onerror=alert("xss-words")>',
      completed_levels: [1, 2, 3],
      last_played: new Date().toISOString()
    };

    renderRoster([maliciousStudent], false);

    const statsGrid = document.getElementById('stats-grid');
    expect(statsGrid.innerHTML).not.toContain('<img src=x onerror=alert("xss-stars")>');
    expect(statsGrid.innerHTML).not.toContain('<img src=x onerror=alert("xss-words")>');
  });

  it('vulnerability: teacher dashboard table should be resistant to XSS in numeric fields', async () => {
    const { renderRoster } = await import('../src/teacher.js');

    const maliciousStudent = {
      name: 'Attacker',
      total_stars: '<img src=x onerror=alert("xss-stars-table")>',
      total_words: '<img src=x onerror=alert("xss-words-table")>',
      high_score: '<img src=x onerror=alert("xss-score-table")>',
      completed_levels: [1],
    };

    renderRoster([maliciousStudent], false);

    const tbody = document.getElementById('student-body');
    expect(tbody.innerHTML).not.toContain('<img src=x onerror=alert("xss-stars-table")>');
    expect(tbody.innerHTML).not.toContain('<img src=x onerror=alert("xss-words-table")>');
    expect(tbody.innerHTML).not.toContain('<img src=x onerror=alert("xss-score-table")>');
  });
});
