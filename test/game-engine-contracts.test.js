import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const engineSrc = readFileSync(resolve(__dirname, '../src/gameEngine.js'), 'utf-8');
const mainSrc = readFileSync(resolve(__dirname, '../src/main.js'), 'utf-8');

function fn(src, signature) {
  const start = src.indexOf(signature);
  expect(start, `${signature} not found`).toBeGreaterThanOrEqual(0);
  return src.slice(start, src.indexOf('\n}', start) + 2);
}

describe('game engine fixes — source contracts', () => {
  it('only ever runs one animation loop', () => {
    // Every start goes through startLoop, which cancels the previous loop.
    // (The fifth keeps the restored meadow animating behind the level-complete card.)
    expect(engineSrc.match(/animationId = requestAnimationFrame\(gameLoop\)/g)).toHaveLength(5);
    expect(fn(engineSrc, 'function startLoop()')).toMatch(/cancelAnimationFrame\(animationId\)/);
    for (const start of ['export function startGame(', 'export function startDrillMode(', 'export function startDailyMoment(']) {
      expect(fn(engineSrc, start), start).toMatch(/startLoop\(\);/);
    }
    // The loop stops itself instead of spinning on the menu or after game over.
    const loop = fn(engineSrc, 'function gameLoop(');
    expect(loop).toMatch(/gameState\.screen !== 'game' \|\| gameState\.gameOver\) \{\s*animationId = null;\s*return;/);
  });

  it('a skipped word is replaced instead of counting toward the level', () => {
    expect(fn(engineSrc, 'function skipWord()')).toMatch(/gameState\.wordsSpawned = Math\.max\(0, gameState\.wordsSpawned - 1\)/);
  });

  it('caps the saved garden but keeps the full flower count', () => {
    expect(engineSrc).toMatch(/const MAX_SAVED_GARDEN = 500;/);
    const complete = fn(engineSrc, 'function completeWord(');
    expect(complete).toMatch(/gardenTotal = \(gameState\.profile\.gardenTotal \?\? gameState\.profile\.garden\.length\) \+ 1/);
    expect(complete).toMatch(/garden\.splice\(0, gameState\.profile\.garden\.length - MAX_SAVED_GARDEN\)/);
    expect(mainSrc).toMatch(/p\.gardenTotal \?\? garden\.length/);
  });

  it('practice mode stops its timer when the learner leaves', () => {
    expect(fn(mainSrc, 'function updatePracticeStats()')).toMatch(/gameState\.screen !== 'practice'\) \{\s*stopPracticeTimer\(\);/);
    expect(mainSrc).toMatch(/btn-practice-back'\)\?\.addEventListener\('click', \(\) => \{\s*stopPracticeTimer\(\);/);
    expect(fn(mainSrc, 'function handlePracticeKey(')).toMatch(/if \(e\.key\.length !== 1\) return;/);
  });
});

describe('level stars', () => {
  it('rewards accuracy, never speed', async () => {
    const src = engineSrc;
    expect(src).toMatch(/export function levelStars\(accuracy\)/);
    expect(src).toMatch(/if \(accuracy >= 95\) return 3;/);
    expect(src).toMatch(/if \(accuracy >= 80\) return 2;/);
  });
});
