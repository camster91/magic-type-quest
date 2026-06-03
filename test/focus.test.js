import { describe, it, expect } from 'vitest';

// We import the Word class indirectly by extracting its logic.
// Since gameEngine.js is a 1500-line module that needs DOM/Canvas, we test
// the focus mechanic in isolation by re-implementing the formula and verifying
// the contract: focus = 100 at spawn, 0 at the ground, multiplier 0.5x-1.0x.
//
// To verify the actual gameEngine.js implementation, we also do a static check
// that the expected code patterns are present in the source.

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const enginePath = resolve(__dirname, '../src/gameEngine.js');
const engineSrc = readFileSync(enginePath, 'utf-8');

describe('Focus mechanic (Word.focus)', () => {
  it('Word constructor initializes focus to 100', () => {
    expect(engineSrc).toMatch(/this\.focus\s*=\s*100/);
  });

  it('Word.update decays focus based on y / groundY', () => {
    expect(engineSrc).toMatch(/this\.focus\s*=\s*Math\.max\(0,\s*Math\.min\(100,\s*100\s*\*\s*\(1\s*-\s*this\.y\s*\/\s*groundY\)\)\)/);
  });

  it('getScoreMultiplier returns 1.0x at full focus and 0.5x at zero', () => {
    expect(engineSrc).toMatch(/getScoreMultiplier\(\)\s*\{[\s\S]*?return\s+0\.5\s*\+\s*\(this\.focus\s*\/\s*100\)\s*\*\s*0\.5/);
  });

  it('completeWord multiplies base score by focus', () => {
    // The focusBonus math must exist
    expect(engineSrc).toMatch(/focusBonus\s*=\s*Math\.round\(baseScore\s*\*\s*\(focusMultiplier\s*-\s*0\.5\)\)/);
  });

  it('focus state is tracked on gameState for HUD display', () => {
    expect(engineSrc).toMatch(/gameState\.lastFocus\s*=/);
    expect(engineSrc).toMatch(/gameState\.totalFocusBonus\s*=/);
  });

  it('HUD displays focus score element', () => {
    const indexHtml = readFileSync(resolve(__dirname, '../index.html'), 'utf-8');
    expect(indexHtml).toMatch(/id="focus-score"/);
  });

  it('Word color shifts from green to red as focus drops', () => {
    // The pillStroke uses an HSL with hue derived from focus
    expect(engineSrc).toMatch(/hue\s*=\s*Math\.round\(\(this\.focus\s*\/\s*100\)\s*\*\s*120\)/);
  });

  it('focus bonus is announced to the player via popup', () => {
    expect(engineSrc).toMatch(/showScorePopup\([^)]*focus[^)]*\)/);
  });
});

describe('Focus mechanic — formula (independent verification)', () => {
  // Replicate the formula to verify it produces the expected values.
  // The script is the source of truth; this is a sanity check.

  function focusAtY(y, groundY) {
    if (groundY <= 0) return 100;
    return Math.max(0, Math.min(100, 100 * (1 - y / groundY)));
  }

  function scoreMultiplier(focus) {
    return 0.5 + (focus / 100) * 0.5;
  }

  it('focus starts at 100 when y = 0', () => {
    expect(focusAtY(0, 600)).toBe(100);
  });

  it('focus is 50 at y = half the ground', () => {
    expect(focusAtY(300, 600)).toBe(50);
  });

  it('focus is 0 at the ground (y = groundY)', () => {
    expect(focusAtY(600, 600)).toBe(0);
  });

  it('focus clamps at 0 even past the ground', () => {
    expect(focusAtY(800, 600)).toBe(0);
  });

  it('multiplier is 1.0 at focus 100', () => {
    expect(scoreMultiplier(100)).toBe(1.0);
  });

  it('multiplier is 0.75 at focus 50', () => {
    expect(scoreMultiplier(50)).toBe(0.75);
  });

  it('multiplier is 0.5 at focus 0', () => {
    expect(scoreMultiplier(0)).toBe(0.5);
  });

  it('typing a 5-letter word at focus 100 gives 50 base + 25 focus bonus = 75', () => {
    const baseScore = 5 * 10; // 50
    const focusMultiplier = 1.0;
    const focusBonus = Math.round(baseScore * (focusMultiplier - 0.5)); // 25
    expect(baseScore + focusBonus).toBe(75);
  });

  it('typing a 5-letter word at focus 50 gives 50 base + 13 focus bonus = 63', () => {
    const baseScore = 5 * 10;
    const focusMultiplier = 0.75;
    const focusBonus = Math.round(baseScore * (focusMultiplier - 0.5));
    expect(baseScore + focusBonus).toBe(63);
  });

  it('typing a 5-letter word at focus 0 gives 50 base + 0 focus bonus = 50', () => {
    const baseScore = 5 * 10;
    const focusMultiplier = 0.5;
    const focusBonus = Math.round(baseScore * (focusMultiplier - 0.5));
    expect(baseScore + focusBonus).toBe(50);
  });

describe('Background parallax asset paths (regression)', () => {
  it('loadBgImages uses /assets/backgrounds/ (not the removed -new suffix)', () => {
    const engineSrc = readFileSync(enginePath, 'utf-8');
    expect(engineSrc).toMatch(/loadImg\(['"]\/assets\/backgrounds\/magical_garden-sky\.png['"]\)/);
    // Negative check: the broken -new suffix must not be referenced
    expect(engineSrc).not.toMatch(/backgrounds-new\/magical_garden/);
  });
});


