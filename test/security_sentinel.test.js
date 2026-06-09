import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { renderRoster } from '../src/teacher.js';

describe('Teacher Dashboard XSS Mitigation', () => {
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body>' +
      '<div id="student-body"></div>' +
      '<div id="stats-grid"></div>' +
      '<div id="empty-state"></div>' +
      '<div id="alert-panel"></div>' +
      '</body></html>');
    document = dom.window.document;
    global.document = document;
    global.window = dom.window;
    global.HTMLElement = dom.window.HTMLElement;
    global.Node = dom.window.Node;
  });

  it('mitigation: coerces malicious numeric fields in roster to 0 or NaN (safe)', () => {
    const maliciousStudent = {
      name: 'Legit Name',
      avatar: '🌸',
      total_words: '<img src=x onerror=alert("XSS_WORDS")>',
      high_score: '<img src=x onerror=alert("XSS_SCORE")>',
      total_stars: '<img src=x onerror=alert("XSS_STARS")>',
      completed_levels: ['<img src=x onerror=alert("XSS_LEVEL")>']
    };

    renderRoster([maliciousStudent], false);

    const html = document.getElementById('student-body').innerHTML;

    // The XSS payload should NOT be present in the HTML anymore
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('<img');

    // It should render as NaN or 0 depending on Number() behavior
    // Number('<img...') is NaN
    expect(html).toContain('NaN');
  });

  it('mitigation: prevents XSS in stats grid summary', () => {
    const maliciousStudent = {
      name: 'Legit Name',
      avatar: '🌸',
      total_words: '<img src=x onerror=alert("XSS_WORDS")>',
      high_score: 100,
      total_stars: '<img src=x onerror=alert("XSS_STARS")>',
      completed_levels: ['<img src=x onerror=alert("XSS_LEVEL")>']
    };

    renderRoster([maliciousStudent], false);

    const statsHtml = document.getElementById('stats-grid').innerHTML;

    expect(statsHtml).not.toContain('onerror');
    expect(statsHtml).not.toContain('<img');
    expect(statsHtml).toContain('NaN');
  });
});
