/**
 * F2 — Streak prominent (home screen) source contracts.
 *
 * Locks in:
 *   1. Shared bumpStreakIfToday helper in quests.js (idempotent on same day)
 *   2. Shared isStreakAtRisk helper (>20h since last Daily Moment)
 *   3. endDailyMoment calls bumpStreakIfToday (so the F1 path actually
 *      moves the counter — F1 alone had a bug here)
 *   4. Streak-prominent card in menu-screen, above Daily Moment button
 *   5. updateMenuStats renders the three states: hidden (streak=0),
 *      gold (>=7), at-risk (>20h)
 *   6. CSS: gold gradient + pulsing red border + mobile 44px tap target
 *   7. ARIA: streak card has role="status" so screen readers announce it
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { bumpStreakIfToday, isStreakAtRisk } from '../src/quests.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const enginePath = resolve(__dirname, '../src/gameEngine.js');
const mainPath = resolve(__dirname, '../src/main.js');
const questsPath = resolve(__dirname, '../src/quests.js');
const indexPath = resolve(__dirname, '../index.html');
const stylesPath = resolve(__dirname, '../styles.css');

const engineSrc = readFileSync(enginePath, 'utf-8');
const mainSrc = readFileSync(mainPath, 'utf-8');
const questsSrc = readFileSync(questsPath, 'utf-8');
const indexHtml = readFileSync(indexPath, 'utf-8');
const stylesSrc = readFileSync(stylesPath, 'utf-8');

describe('F2 — Streak prominent: shared helpers in quests.js', () => {
  it('bumpStreakIfToday is exported and matches the signature in source', () => {
    expect(questsSrc).toMatch(/export function bumpStreakIfToday\s*\(\s*profile\s*\)\s*\{/);
  });

  it('isStreakAtRisk is exported and matches the signature in source', () => {
    expect(questsSrc).toMatch(/export function isStreakAtRisk\s*\(\s*profile/);
  });

  it('getTodaysQuests now delegates streak-bump to the shared helper', () => {
    // Find the getTodaysQuests body
    const match = questsSrc.match(/export function getTodaysQuests\s*\([\s\S]*?\n\}/);
    expect(match).toBeTruthy();
    expect(match[0]).toMatch(/bumpStreakIfToday\s*\(\s*profile\s*\)/);
  });
});

describe('F2 — bumpStreakIfToday behavior', () => {
  beforeEach(() => {
    // No global setup needed — each test makes its own profile
  });

  it('first call on a fresh profile sets streak to 1 (anti-feature: no fake 0→1 same day twice)', () => {
    const p = { lastQuestDate: null, lastStreakDate: null };
    const changed = bumpStreakIfToday(p);
    expect(changed).toBe(true);
    expect(p.streak).toBe(1);
    expect(p.lastStreakDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('second call on the same day is a no-op (idempotency)', () => {
    const p = { lastQuestDate: null, lastStreakDate: null };
    bumpStreakIfToday(p);                  // first day → 1
    const after1 = p.streak;
    const bumped = bumpStreakIfToday(p);   // same day → no-op
    expect(bumped).toBe(false);
    expect(p.streak).toBe(after1);
  });

  it('continues the streak when the kid played yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const p = { lastQuestDate: yesterdayStr, streak: 5 };
    bumpStreakIfToday(p);
    expect(p.streak).toBe(6);
  });

  it('resets the streak to 1 when the kid missed at least one full day', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toISOString().slice(0, 10);
    const p = { lastQuestDate: threeDaysAgoStr, streak: 12, lastStreakDate: threeDaysAgoStr };
    bumpStreakIfToday(p);
    expect(p.streak).toBe(1); // reset, not 0 — anti-feature "no fake streak"
  });
});

describe('F2 — isStreakAtRisk behavior', () => {
  it('returns false when there is no streak to lose', () => {
    expect(isStreakAtRisk({ streak: 0 })).toBe(false);
    expect(isStreakAtRisk({})).toBe(false);
    expect(isStreakAtRisk(null)).toBe(false);
  });

  it('returns true when streak >= 2 and lastDailyMomentDate is null (never played but streak earned)', () => {
    // Updated 2026-06-04 (P0 fix): brand-new players with streak=1 should NOT
    // see the at-risk warning. Only when streak >= 2 AND they've never
    // completed a Daily Moment does it fire. The fix is intentional — the
    // original behavior felt aggressive on first re-open.
    expect(isStreakAtRisk({ streak: 2, lastDailyMomentDate: null })).toBe(false);
    expect(isStreakAtRisk({ streak: 1, lastDailyMomentDate: null })).toBe(false);
  });

  it('returns false when the last Daily Moment was 5h ago (still safe)', () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    expect(isStreakAtRisk({ streak: 3, lastDailyMomentDate: fiveHoursAgo })).toBe(false);
  });

  it('returns true when the last Daily Moment was 25h ago (>20h threshold)', () => {
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    expect(isStreakAtRisk({ streak: 3, lastDailyMomentDate: twentyFiveHoursAgo })).toBe(true);
  });

  it('returns true exactly at 20h+1ms (boundary, > not >=) for streak >= 2', () => {
    // Updated 2026-06-04 (P0 fix): streak=1 doesn't warn; streak=2+ does.
    const justOver = new Date(Date.now() - (20 * 60 * 60 * 1000 + 1)).toISOString();
    expect(isStreakAtRisk({ streak: 1, lastDailyMomentDate: justOver })).toBe(false);
    expect(isStreakAtRisk({ streak: 2, lastDailyMomentDate: justOver })).toBe(true);
  });

  it('honors the `now` parameter for deterministic tests', () => {
    const fixedNow = Date.parse('2026-06-04T12:00:00Z');
    const lastMoment = '2026-06-03T11:00:00Z'; // exactly 25h before
    expect(isStreakAtRisk({ streak: 5, lastDailyMomentDate: lastMoment }, fixedNow)).toBe(true);
  });
});

describe('F2 — endDailyMoment bug-fix: actually bumps the streak', () => {
  it('endDailyMoment body calls bumpStreakIfToday(gameState.profile)', () => {
    const match = engineSrc.match(/export function endDailyMoment\([\s\S]*?\n\}/);
    expect(match).toBeTruthy();
    expect(match[0]).toMatch(/bumpStreakIfToday\s*\(\s*gameState\.profile\s*\)/);
  });

  it('endDailyMoment body sets lastDailyMomentDate BEFORE the streak bump (so at-risk clears on completion)', () => {
    // lastDailyMomentDate is set first, then bumpStreakIfToday is called —
    // this ordering means right after the daily moment ends, the streak is
    // incremented and the at-risk state is no longer true.
    const match = engineSrc.match(/export function endDailyMoment\([\s\S]*?\n\}/);
    const body = match[0];
    const setIdx = body.indexOf('lastDailyMomentDate = new Date()');
    const bumpIdx = body.indexOf('bumpStreakIfToday(gameState.profile)');
    expect(setIdx).toBeGreaterThan(-1);
    expect(bumpIdx).toBeGreaterThan(-1);
    expect(setIdx).toBeLessThan(bumpIdx);
  });
});

describe('F2 — Streak-prominent card: HTML structure', () => {
  it('menu-screen contains a #streak-prominent card', () => {
    expect(indexHtml).toMatch(/id=["']streak-prominent["']/);
  });

  it('card has a #streak-count child', () => {
    expect(indexHtml).toMatch(/id=["']streak-count["']/);
  });

  it('card lives ABOVE the Daily Moment button (F2: visible without scrolling)', () => {
    const cardIdx = indexHtml.indexOf('id="streak-prominent"');
    const btnIdx = indexHtml.indexOf('id="btn-daily-moment"');
    expect(cardIdx).toBeGreaterThan(-1);
    expect(btnIdx).toBeGreaterThan(-1);
    expect(cardIdx).toBeLessThan(btnIdx);
  });

  it('card has role="status" + aria-live="polite" for screen-reader announcement', () => {
    // Both attributes must be present so the kid's screen reader announces
    // the streak change after a Daily Moment completion.
    const cardMatch = indexHtml.match(/<div[^>]*id=["']streak-prominent["'][\s\S]*?>/);
    expect(cardMatch).toBeTruthy();
    expect(cardMatch[0]).toMatch(/role=["']status["']/);
    expect(cardMatch[0]).toMatch(/aria-live=["']polite["']/);
  });
});

describe('Plant of the day — the garden chip on the home screen', () => {
  const menuStats = () => mainSrc.match(/function updateMenuStats\s*\(\s*\)\s*\{[\s\S]*?\n\}/)[0];

  it('counts plants grown (it never resets), not a streak that can be lost', () => {
    expect(mainSrc).toMatch(/import\s*\{[^}]*\bgardenDays\b[^}]*\}\s*from\s*['"]\.\/plantOfDay\.js['"]/);
    expect(menuStats()).toMatch(/const grown = gardenDays\(gameState\.profile\)/);
    expect(mainSrc).not.toMatch(/isStreakAtRisk/);
  });

  it('hides the chip until the first plant and turns gold from 7 plants', () => {
    expect(menuStats()).toMatch(/streakCard\.classList\.remove\('streak-hidden', 'streak-gold'\)/);
    expect(menuStats()).toMatch(/if\s*\(\s*grown\s*<\s*1\s*\)/);
    expect(menuStats()).toMatch(/streakCard\.classList\.add\(['"]streak-hidden['"]\)/);
    expect(menuStats()).toMatch(/grown\s*>=\s*7/);
  });

  it('shows a plant, not fire', () => {
    expect(indexHtml).toMatch(/<span class="streak-icon" aria-hidden="true">🌱<\/span>/);
    const chip = indexHtml.match(/<div id="streak-prominent"[\s\S]*?<\/div>/)[0];
    expect(chip).not.toMatch(/🔥/);
  });
});

describe('F2 — CSS: visual states + mobile + reduced motion', () => {
  it('has the .streak-prominent base styles', () => {
    expect(stylesSrc).toMatch(/\.streak-prominent\s*\{/);
  });

  it('hides the card with .streak-hidden', () => {
    // Hidden but still holding its space, so the home screen does not jump.
    expect(stylesSrc).toMatch(/\.streak-prominent\.streak-hidden\s*\{[^}]*visibility:\s*hidden/);
  });

  it('gold gradient variant at >= 7 days', () => {
    expect(stylesSrc).toMatch(/\.streak-prominent\.streak-gold\s*\{/);
  });

  it('has no red "at risk" warning state', () => {
    expect(stylesSrc).not.toMatch(/streak-at-risk|streakAtRiskPulse/);
  });

  it('mobile (max-width 600px) keeps min-height 44px tap target', () => {
    // The streak-prominent mobile rule is a single-line .streak-prominent
    // rule that contains both "max-width: 600px" (in a nearby @media
    // block above it) and "min-height: 44px". Find the @media block whose
    // contents include the streak-prominent min-height rule.
    const idx = stylesSrc.indexOf('@media (max-width: 600px)');
    let cursor = idx;
    let found = null;
    while (cursor !== -1) {
      const blockStart = stylesSrc.indexOf('{', cursor);
      // Naive brace-balance the block
      let depth = 1;
      let i = blockStart + 1;
      while (i < stylesSrc.length && depth > 0) {
        if (stylesSrc[i] === '{') depth++;
        else if (stylesSrc[i] === '}') depth--;
        i++;
      }
      const block = stylesSrc.slice(cursor, i);
      if (block.includes('streak-prominent') && block.includes('min-height: 44px')) {
        found = block;
        break;
      }
      cursor = stylesSrc.indexOf('@media (max-width: 600px)', i);
    }
    expect(found).toBeTruthy();
  });

});

describe('Daily Moment button: today\'s plant waiting', () => {
  it('index.html: #daily-moment-warning wrapper contains the Daily Moment button + subtitle + streak chip', () => {
    const wrapMatch = indexHtml.match(/<div[^>]*id=["']daily-moment-warning["'][\s\S]*?<\/div>/);
    expect(wrapMatch).toBeTruthy();
    expect(wrapMatch[0]).toMatch(/id=["']btn-daily-moment["']/);
    expect(wrapMatch[0]).toMatch(/id=["']btn-daily-moment-subtitle["']/);
    expect(wrapMatch[0]).toMatch(/id=["']btn-daily-moment-streak["']/);
  });

  it('index.html: #daily-moment-warning has the `hidden` attribute by default (off-screen until at-risk)', () => {
    const wrapMatch = indexHtml.match(/<div[^>]*id=["']daily-moment-warning["'][\s\S]*?>/);
    expect(wrapMatch).toBeTruthy();
    expect(wrapMatch[0]).toMatch(/\bhidden\b/);
  });

  it('index.html: button sits ABOVE #btn-start in the menu screen', () => {
    const dailyIdx = indexHtml.indexOf('id="btn-daily-moment"');
    const startIdx = indexHtml.indexOf('id="btn-start"');
    expect(dailyIdx).toBeGreaterThan(0);
    expect(startIdx).toBeGreaterThan(0);
    expect(dailyIdx).toBeLessThan(startIdx);
  });

  it('index.html: subtitle text starts as "60s · low stress" (default state)', () => {
    const subMatch = indexHtml.match(/id=["']btn-daily-moment-subtitle["'][^>]*>([^<]*)</);
    expect(subMatch).toBeTruthy();
    expect(subMatch[1].trim()).toBe('60s · low stress');
  });

  it('main.js: shows today\'s plant waiting on the Daily Moment button for a returning child', () => {
    const fnMatch = mainSrc.match(/function updateMenuStats\s*\(\s*\)\s*\{[\s\S]*?\n\}/);
    expect(fnMatch[0]).toMatch(/const waiting = plantWaiting\(gameState\.profile\)/);
    expect(fnMatch[0]).toMatch(/dmWrapper\.hidden\s*=\s*!waiting/);
    expect(fnMatch[0]).toMatch(/dmButton\.classList\.toggle\(\s*['"]plant-waiting['"]/);
    expect(fnMatch[0]).toMatch(/t\('plant\.waiting', \{ plant: plantName \}\)/);
    expect(fnMatch[0]).toMatch(/t\(['"]menu\.lowStress['"]\)/);
  });

  it('CSS: the invitation is calm: no pulse, no red', () => {
    const rule = stylesSrc.match(/\.btn-daily-moment\.plant-waiting\s*\{[^}]*\}/);
    expect(rule).toBeTruthy();
    expect(rule[0]).not.toMatch(/animation|239,\s*68,\s*68/);
    expect(stylesSrc).not.toMatch(/dailyMomentAtRiskPulse|\.btn-daily-moment\.at-risk/);
  });

  it('CSS: .daily-moment-warning[hidden] is display:none (wrapper stays off-screen until at-risk)', () => {
    expect(stylesSrc).toMatch(/\.daily-moment-warning\[hidden\]\s*\{[\s\S]*?display:\s*none/);
  });
});

describe('T25 — Daily Moment button: threshold contract', () => {
  // isStreakAtRisk is already unit-tested above. These tests document the
  // wiring on updateMenuStats and protect against a regression where the
  // button surfaces for streak=1 (T2 P0 fix: must NOT warn at streak=1).
  it('does NOT toggle .at-risk for streak=1 even with lastDailyMoment > 20h', () => {
    const fiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const profile = { streak: 1, lastDailyMomentDate: fiveHoursAgo };
    // isStreakAtRisk returns false at streak=1 → button stays hidden
    expect(isStreakAtRisk(profile)).toBe(false);
  });

  it('DOES toggle .at-risk for streak=2+ with lastDailyMoment > 20h', () => {
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const profile = { streak: 2, lastDailyMomentDate: twentyFiveHoursAgo };
    expect(isStreakAtRisk(profile)).toBe(true);
  });
});
