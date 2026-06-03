import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const enginePath = resolve(__dirname, '../src/gameEngine.js');
const engineSrc = readFileSync(enginePath, 'utf-8');

describe('Focus mechanic - source contracts', () => {
  it('Word constructor initializes focus to 100', () => {
    expect(engineSrc).toMatch(/this\.focus\s*=\s*100/);
  });

  it('Word.update decays focus based on y / groundY', () => {
    expect(engineSrc).toMatch(/this\.focus\s*=\s*Math\.max\(0,\s*Math\.min\(100,\s*100\s*\*\s*\(1\s*-\s*this\.y\s*\/\s*groundY\)\)\)/);
  });

  it('getScoreMultiplier returns 0.5x to 1.0x', () => {
    expect(engineSrc).toMatch(/return\s+0\.5\s*\+\s*\(this\.focus\s*\/\s*100\)\s*\*\s*0\.5/);
  });

  it('completeWord applies focus multiplier to score', () => {
    expect(engineSrc).toMatch(/focusBonus\s*=\s*Math\.round\(baseScore\s*\*\s*\(focusMultiplier\s*-\s*0\.5\)\)/);
  });

  it('HUD has focus-score element in index.html', () => {
    const indexHtml = readFileSync(resolve(__dirname, '../index.html'), 'utf-8');
    expect(indexHtml).toMatch(/id="focus-score"/);
  });

  it('Word pill color is focus-driven (HSL hue from 0 to 120)', () => {
    expect(engineSrc).toMatch(/hue\s*=\s*Math\.round\(\(this\.focus\s*\/\s*100\)\s*\*\s*120\)/);
  });

  it('Background parallax loads from /assets/backgrounds/ not -new suffix', () => {
    expect(engineSrc).toMatch(/loadImg\(['"]\/assets\/backgrounds\/magical_garden-sky\.png['"]\)/);
    expect(engineSrc).not.toMatch(/backgrounds-new\/magical_garden/);
  });
});

describe('Focus multiplier formula', () => {
  const scoreMultiplier = (focus) => 0.5 + (focus / 100) * 0.5;

  it('returns 1.0x at full focus', () => {
    expect(scoreMultiplier(100)).toBe(1.0);
  });

  it('returns 0.75x at focus 50', () => {
    expect(scoreMultiplier(50)).toBe(0.75);
  });

  it('returns 0.5x at zero focus', () => {
    expect(scoreMultiplier(0)).toBe(0.5);
  });

  it('5-letter word at focus 100 scores 75 (50 base + 25 bonus)', () => {
    const base = 50;
    const bonus = Math.round(base * (scoreMultiplier(100) - 0.5));
    expect(base + bonus).toBe(75);
  });

  it('5-letter word at focus 50 scores 63 (50 base + 13 bonus)', () => {
    const base = 50;
    const bonus = Math.round(base * (scoreMultiplier(50) - 0.5));
    expect(base + bonus).toBe(63);
  });

  it('5-letter word at focus 0 scores 50 (base, no bonus)', () => {
    const base = 50;
    const bonus = Math.round(base * (scoreMultiplier(0) - 0.5));
    expect(base + bonus).toBe(50);
  });
});
