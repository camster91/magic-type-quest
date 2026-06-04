import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const enginePath = resolve(__dirname, '../src/gameEngine.js');
const mainPath = resolve(__dirname, '../src/main.js');
const statePath = resolve(__dirname, '../src/state.js');
const indexPath = resolve(__dirname, '../index.html');
const stylesPath = resolve(__dirname, '../styles.css');
const swPath = resolve(__dirname, '../public/sw.js');

const engineSrc = readFileSync(enginePath, 'utf-8');
const mainSrc = readFileSync(mainPath, 'utf-8');
const stateSrc = readFileSync(statePath, 'utf-8');
const indexHtml = readFileSync(indexPath, 'utf-8');
const stylesSrc = readFileSync(stylesPath, 'utf-8');
const swSrc = readFileSync(swPath, 'utf-8');

describe('Daily Moment (F1) — source contracts', () => {
  it('state.js: defaultState.dailyMoment exists with active/startTime/durationMs/wordsTarget', () => {
    expect(stateSrc).toMatch(/dailyMoment:\s*\{[\s\S]*?active:\s*false/);
    expect(stateSrc).toMatch(/startTime:\s*0/);
    expect(stateSrc).toMatch(/durationMs:\s*60_000/);
    expect(stateSrc).toMatch(/wordsTarget:\s*12/);
  });

  it('state.js: profile.lastDailyMomentDate is initialized to null', () => {
    expect(stateSrc).toMatch(/lastDailyMomentDate:\s*null/);
  });

  it('gameEngine.js: startDailyMoment is exported', () => {
    expect(engineSrc).toMatch(/export function startDailyMoment\s*\(\s*\)/);
  });

  it('gameEngine.js: endDailyMoment is exported and bails on re-entry', () => {
    expect(engineSrc).toMatch(/export function endDailyMoment\s*\(\s*\{\s*reason\s*\}\s*=\s*\{\s*\}\s*\)/);
    expect(engineSrc).toMatch(/if\s*\(\s*!gameState\.dailyMoment\?\.active\s*\)\s*return/);
  });

  it('gameEngine.js: loseHealth is a no-op while daily moment is active', () => {
    expect(engineSrc).toMatch(/loseHealth[\s\S]*?F1 Daily Moment: no game-over[\s\S]*?return/);
  });

  it('gameEngine.js: completeWord triggers endDailyMoment when wordsTarget hit', () => {
    expect(engineSrc).toMatch(/gameState\.dailyMoment\?\.active\s*&&[\s\S]*?gameState\.wordsCompleted\s*>=\s*\(?gameState\.dailyMoment\.wordsTarget/);
  });

  it('gameEngine.js: endDailyMoment persists lastDailyMomentDate to ISO string', () => {
    expect(engineSrc).toMatch(/gameState\.profile\.lastDailyMomentDate\s*=\s*new Date\(\)\.toISOString\(\)/);
  });

  it('gameEngine.js: endDailyMoment runs a 60s setTimeout', () => {
    expect(engineSrc).toMatch(/setTimeout\(\(\)\s*=>\s*endDailyMoment\(\{\s*reason:\s*['"]timeUp['"]\s*\}\),\s*60_000\)/);
  });

  it('gameEngine.js: endDailyMoment body calls evaluateQuests then saveProfile (for streak/quest progress)', () => {
    // Locate the endDailyMoment function body (between the export and the closing brace)
    const match = engineSrc.match(/export function endDailyMoment\([\s\S]*?\n\}/);
    expect(match, 'endDailyMoment function body not found').toBeTruthy();
    const body = match[0];
    const evalIdx = body.indexOf('evaluateQuests(');
    const saveIdx = body.indexOf('saveProfile()');
    expect(evalIdx, 'evaluateQuests not called inside endDailyMoment').toBeGreaterThan(-1);
    expect(saveIdx, 'saveProfile not called inside endDailyMoment').toBeGreaterThan(-1);
    expect(evalIdx, 'evaluateQuests must run before saveProfile').toBeLessThan(saveIdx);
  });

  it('index.html: btn-daily-moment sits above btn-start in #menu-screen', () => {
    const dailyIdx = indexHtml.indexOf('btn-daily-moment');
    const startIdx = indexHtml.indexOf('btn-start');
    expect(dailyIdx).toBeGreaterThan(0);
    expect(startIdx).toBeGreaterThan(0);
    expect(dailyIdx).toBeLessThan(startIdx);
  });

  it('styles.css: .btn-daily-moment uses gradient + pulse animation', () => {
    expect(stylesSrc).toMatch(/\.btn-daily-moment\s*\{[\s\S]*?linear-gradient/);
    expect(stylesSrc).toMatch(/animation:\s*dailyMomentPulse/);
    expect(stylesSrc).toMatch(/@keyframes dailyMomentPulse/);
  });

  it('main.js: imports startDailyMoment and binds the button click', () => {
    expect(mainSrc).toMatch(/startDailyMoment[\s\S]*?from\s*['"]\.\/gameEngine\.js['"]/);
    expect(mainSrc).toMatch(/btn-daily-moment[\s\S]{0,200}?addEventListener\(['"]click['"][\s\S]{0,100}?startDailyMoment\(\)/);
  });

  it('main.js: exposes __refreshMenuStats for endDailyMoment to call', () => {
    expect(mainSrc).toMatch(/window\.__refreshMenuStats\s*=\s*updateMenuStats/);
  });

  it('sw.js: CACHE_NAME is bumped past the F1 baseline (v4) so users see F2/F3', () => {
    // The original F1 contract was v4. F2 bumped to v5. F3 bumped to v6.
    // The test only enforces that the bump is real, not the specific version.
    const match = swSrc.match(/const CACHE_NAME\s*=\s*["']bloomtype-v(\d+)["']/);
    expect(match).toBeTruthy();
    const version = parseInt(match[1], 10);
    expect(version).toBeGreaterThanOrEqual(6);
  });
});
