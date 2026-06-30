import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const indexPath = resolve(__dirname, '../index.html');
const mainPath = resolve(__dirname, '../src/main.js');
const stylesPath = resolve(__dirname, '../styles.css');

const indexHtml = readFileSync(indexPath, 'utf-8');
const mainSrc = readFileSync(mainPath, 'utf-8');
const stylesSrc = readFileSync(stylesPath, 'utf-8');

describe('T29 — Daily Moment pill on home: 1-tap access to the 60s session', () => {
  it('index.html: #btn-dm-pill sits inside the .progress-card so it ships with the home screen', () => {
    // Find the opening <div> that contains class="progress-card"
    const cardOpenMatch = indexHtml.match(/<div class="progress-card"[^>]*>/);
    expect(cardOpenMatch, 'progress-card opening <div> not found').toBeTruthy();
    const cardOpen = cardOpenMatch.index + cardOpenMatch[0].length; // start AFTER the opening tag
    const pillIdx = indexHtml.indexOf('id="btn-dm-pill"');
    // Walk forward from cardOpen, counting opens vs closes
    let depth = 0;
    let i = cardOpen;
    let cardClose = -1;
    while (i < indexHtml.length) {
      const nextOpen = indexHtml.indexOf('<div', i);
      const nextClose = indexHtml.indexOf('</div>', i);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth += 1;
        i = nextOpen + 4;
      } else {
        if (depth === 0) { cardClose = nextClose; break; }
        depth -= 1;
        i = nextClose + 6;
      }
    }
    expect(pillIdx, 'btn-dm-pill not found').toBeGreaterThan(-1);
    expect(cardClose, 'progress-card closing </div> not found').toBeGreaterThan(-1);
    expect(pillIdx, 'btn-dm-pill must be inside the progress card').toBeLessThan(cardClose);
    expect(pillIdx, 'btn-dm-pill must be after progress-card opening').toBeGreaterThan(cardOpen);
  });

  it('index.html: both "Type to plant" CTA and Daily Moment pill are in #menu-screen', () => {
    const menuOpenMatch = indexHtml.match(/<div id="menu-screen"[^>]*>/);
    expect(menuOpenMatch, 'menu-screen opening <div> not found').toBeTruthy();
    const menuOpen = menuOpenMatch.index + menuOpenMatch[0].length;
    let depth = 0;
    let i = menuOpen;
    let menuClose = -1;
    while (i < indexHtml.length) {
      const nextOpen = indexHtml.indexOf('<div', i);
      const nextClose = indexHtml.indexOf('</div>', i);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth += 1;
        i = nextOpen + 4;
      } else {
        if (depth === 0) { menuClose = nextClose; break; }
        depth -= 1;
        i = nextClose + 6;
      }
    }
    const menu = indexHtml.slice(menuOpen, menuClose);
    expect(menu, 'Type to plant CTA missing from #menu-screen').toMatch(/Type to plant/);
    expect(menu, 'btn-start missing from #menu-screen').toMatch(/id="btn-start"/);
    expect(menu, 'btn-dm-pill missing from #menu-screen').toMatch(/id="btn-dm-pill"/);
    expect(menu, '60s label missing from #menu-screen').toMatch(/>60s</);
  });

  it('index.html: the pill is rendered as a real <button> (not a div), so it is keyboard + a11y reachable', () => {
    const match = indexHtml.match(/<button[^>]*id="btn-dm-pill"[^>]*>/);
    expect(match, 'btn-dm-pill must be a <button> element').toBeTruthy();
    expect(match[0]).toMatch(/type="button"/);
    expect(match[0]).toMatch(/aria-label=/);
  });

  it('main.js: btn-dm-pill is wired to startDailyMoment (same code path as the original Daily Moment button)', () => {
    // Find the click handler block
    const match = mainSrc.match(/btn-dm-pill[\s\S]{0,200}?addEventListener\(['"]click['"][\s\S]{0,100}?startDailyMoment\(\)/);
    expect(match, 'btn-dm-pill click handler calling startDailyMoment not found').toBeTruthy();
  });

  it('styles.css: .dm-pill has its own pill styling (rounded, small, distinct from main CTA)', () => {
    expect(stylesSrc).toMatch(/\.dm-pill\s*\{/);
    expect(stylesSrc).toMatch(/\.dm-pill[\s\S]*?border-radius:\s*999px/);
    // amber/warning color hint — not the same as the violet main CTA
    expect(stylesSrc).toMatch(/\.dm-pill[\s\S]*?var\(--warning\)/);
  });

  it('styles.css: .progress-bar-row lays out the bar + the pill side-by-side', () => {
    expect(stylesSrc).toMatch(/\.progress-bar-row\s*\{[\s\S]*?display:\s*flex/);
    expect(stylesSrc).toMatch(/\.progress-bar-row[\s\S]*?align-items:\s*center/);
  });

  it('F1 contract: btn-daily-moment is still present and still appears before btn-start in #menu-screen', () => {
    // The pill is a SECOND entry point — it must not remove the F1 contract button.
    const dailyIdx = indexHtml.indexOf('btn-daily-moment');
    const startIdx = indexHtml.indexOf('btn-start');
    expect(dailyIdx).toBeGreaterThan(0);
    expect(startIdx).toBeGreaterThan(0);
    expect(dailyIdx, 'btn-daily-moment must still appear before btn-start (F1 contract)').toBeLessThan(startIdx);
  });
});
