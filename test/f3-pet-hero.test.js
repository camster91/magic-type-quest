/**
 * F3 — Pet-as-front-of-house (home screen pet hero) source contracts.
 *
 * Locks in:
 *   1. #pet-hero block in #menu-screen (above the menu-dock, below streak)
 *   2. #pet-hero-img + #pet-hero-bubble + #pet-evolution in the DOM
 *   3. menu-dock replaces the old .menu-buttons stack
 *   4. updateHomePet() in main.js exports logic for 3 states:
 *        idle       — no streak, no at-risk, no celebrate signal
 *        warning    — streak >= 1 AND isStreakAtRisk() true
 *        celebrate  — window.__petHeroState === 'celebrate' (single-shot)
 *   5. window.__petHeroState = 'celebrate' is set by gameEngine.endDailyMoment
 *      before calling __refreshMenuStats, so the pet pops when the kid
 *      lands back on the menu after a Daily Moment.
 *   6. CSS has .pet-hero / .pet-hero-img / .pet-hero-bubble / .pet-evolution
 *      and 3 keyframe animations (petHeroIdle, petHeroCelebrate, petHeroWarning)
 *      with @media (prefers-reduced-motion: reduce) honoring.
 *   7. Evolution dots render 3 stages (1/2/3) driven by profile.petEvolution
 *   8. ARIA: pet-hero has aria-label, pet-hero-bubble is aria-live
 *   9. SW CACHE_NAME bumped v5 -> v6 so the new bundle reaches users
 *  10. No new pet animations beyond the 5 existing states (anti-feature)
 *  11. The pet is identity, not mechanic — no feeding/UI hooks added
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mainPath = resolve(__dirname, '../src/main.js');
const enginePath = resolve(__dirname, '../src/gameEngine.js');
const indexPath = resolve(__dirname, '../index.html');
const stylesPath = resolve(__dirname, '../styles.css');
const assetsPath = resolve(__dirname, '../src/assets.js');
const swPath = resolve(__dirname, '../public/sw.js');

const mainSrc = readFileSync(mainPath, 'utf-8');
const engineSrc = readFileSync(enginePath, 'utf-8');
const indexHtml = readFileSync(indexPath, 'utf-8');
const stylesSrc = readFileSync(stylesPath, 'utf-8');
const assetsSrc = readFileSync(assetsPath, 'utf-8');
const swSrc = readFileSync(swPath, 'utf-8');

describe('F3 — Pet hero: DOM scaffolding in index.html', () => {
  it('menu-screen contains a #pet-hero block with the expected children', () => {
    expect(indexHtml).toMatch(/<div id="pet-hero" class="pet-hero"[^>]*>/);
    expect(indexHtml).toMatch(/<div class="pet-hero-stage">/);
    expect(indexHtml).toMatch(/<img id="pet-hero-img" class="pet-hero-img" src="\/assets\/pets\/flower-idle\.png"/);
    expect(indexHtml).toMatch(/<div id="pet-hero-bubble" class="pet-hero-bubble" aria-live="polite">/);
    expect(indexHtml).toMatch(/<div class="pet-evolution" id="pet-evolution" aria-label="Pet evolution stage">/);
  });

  it('evolution dots render all 3 stages (sprout / bud / bloom)', () => {
    expect(indexHtml).toMatch(/data-stage="1"[^>]*title="Sprout"/);
    expect(indexHtml).toMatch(/data-stage="2"[^>]*title="Bud"/);
    expect(indexHtml).toMatch(/data-stage="3"[^>]*title="Bloom"/);
    expect(indexHtml).toMatch(/<span class="evo-dot active" data-stage="1"/);
  });

  it('pet-hero lives above the menu-dock and below the streak card', () => {
    const streakIdx = indexHtml.indexOf('id="streak-prominent"');
    const petIdx = indexHtml.indexOf('id="pet-hero"');
    const dockIdx = indexHtml.indexOf('class="menu-dock"');
    expect(streakIdx).toBeGreaterThan(-1);
    expect(petIdx).toBeGreaterThan(streakIdx);
    expect(dockIdx).toBeGreaterThan(petIdx);
  });

  it('the old .menu-buttons stack is replaced by .menu-dock', () => {
    // The old class="menu-buttons" wrapper is gone; each button now uses menu-dock-item
    expect(indexHtml).not.toMatch(/<div class="menu-buttons">/);
    expect(indexHtml).toMatch(/<div class="menu-dock">/);
    // The dock should contain the 8 menu items: Daily Moment (wide) + 7 others
    // (Play Now, Lessons, Practice, Profile, Garden, Parents, Progress)
    // Daily Moment has BOTH menu-dock-item and menu-dock-item-wide, so we
    // expect at least 8 instances of "menu-dock-item" (the shared base class).
    const dockItemMatches = indexHtml.match(/menu-dock-item/g) || [];
    expect(dockItemMatches.length).toBeGreaterThanOrEqual(8);
    // And the CSS sets the legacy .menu-buttons wrapper to display:none so
    // any leftover nodes don't fight the new dock.
    expect(stylesSrc).toMatch(/\.menu-buttons\s*\{\s*display: none/);
  });
});

describe('F3 — Pet hero: state machine in main.js', () => {
  it('updateHomePet is defined and reads gameState.profile', () => {
    expect(mainSrc).toMatch(/function updateHomePet\s*\(\s*\)\s*\{/);
    expect(mainSrc).toMatch(/const profile = gameState\.profile \|\| \{\}/);
  });

  it('updateHomePet picks the celebrate state when window.__petHeroState is set', () => {
    // The function checks window.__petHeroState === 'celebrate' and sets the .celebrate class
    const fnMatch = mainSrc.match(/function updateHomePet\s*\(\s*\)\s*\{[\s\S]*?\n\}/);
    expect(fnMatch).toBeTruthy();
    const body = fnMatch[0];
    expect(body).toMatch(/window\.__petHeroState === 'celebrate'/);
    expect(body).toMatch(/petHero\.classList\.add\('celebrate'\)/);
    // The flag is single-shot — cleared right after consumption
    expect(body).toMatch(/window\.__petHeroState = null/);
  });

  it('updateHomePet applies the warning class when isStreakAtRisk is true', () => {
    const fnMatch = mainSrc.match(/function updateHomePet\s*\(\s*\)\s*\{[\s\S]*?\n\}/);
    const body = fnMatch[0];
    expect(body).toMatch(/isStreakAtRisk\(profile\)/);
    expect(body).toMatch(/petHero\.classList\.add\('warning'\)/);
  });

  it('updateHomePet uses getPetPath(avatar, state) to set the image src', () => {
    const fnMatch = mainSrc.match(/function updateHomePet\s*\(\s*\)\s*\{[\s\S]*?\n\}/);
    const body = fnMatch[0];
    expect(body).toMatch(/getPetPath\(avatar, state\)/);
    expect(body).toMatch(/petImg\.src = /);
  });

  it('updateHomePet wires the evolution dots to profile.petEvolution (1..3)', () => {
    const fnMatch = mainSrc.match(/function updateHomePet\s*\(\s*\)\s*\{[\s\S]*?\n\}/);
    const body = fnMatch[0];
    expect(body).toMatch(/profile\.petEvolution \|\| 1/);
    expect(body).toMatch(/Math\.min\(3/);
    expect(body).toMatch(/dot\.classList\.toggle\('active'/);
  });

  it('updateMenuStats calls updateHomePet so the hero renders on every menu render', () => {
    // updateMenuStats body is ~50 lines, the call must be inside the function.
    const fnMatch = mainSrc.match(/function updateMenuStats\s*\(\s*\)\s*\{[\s\S]*?^\}/m);
    expect(fnMatch).toBeTruthy();
    expect(fnMatch[0]).toMatch(/updateHomePet\(\)/);
  });
});

describe('F3 — Pet hero: trigger surface', () => {
  it('gameEngine.endDailyMoment sets window.__petHeroState = "celebrate" before refresh', () => {
    const fnMatch = engineSrc.match(/export function endDailyMoment[\s\S]*?\n\}/);
    expect(fnMatch).toBeTruthy();
    const body = fnMatch[0];
    const setIdx = body.indexOf('window.__petHeroState = ');
    const refreshIdx = body.indexOf('__refreshMenuStats');
    expect(setIdx).toBeGreaterThan(-1);
    expect(refreshIdx).toBeGreaterThan(setIdx);
    expect(body).toMatch(/window\.__petHeroState = 'celebrate'/);
  });

  it('main.js exposes window.__triggerPetHeroCelebrate for the engine to call', () => {
    expect(mainSrc).toMatch(/window\.__triggerPetHeroCelebrate = triggerPetHeroCelebrate/);
    expect(mainSrc).toMatch(/function triggerPetHeroCelebrate\s*\(\s*\)\s*\{/);
  });
});

describe('F3 — Pet hero: CSS contracts', () => {
  it('defines the pet-hero block, image, bubble, and evolution containers', () => {
    expect(stylesSrc).toMatch(/\.pet-hero\s*\{/);
    expect(stylesSrc).toMatch(/\.pet-hero-stage\s*\{/);
    expect(stylesSrc).toMatch(/\.pet-hero-img\s*\{/);
    expect(stylesSrc).toMatch(/\.pet-hero-bubble\s*\{/);
    expect(stylesSrc).toMatch(/\.pet-hero-bubble\.visible\s*\{/);
    expect(stylesSrc).toMatch(/\.pet-evolution\s*\{/);
    expect(stylesSrc).toMatch(/\.evo-dot\.active\s*\{/);
  });

  it('declares all 3 keyframe animations (idle / celebrate / warning)', () => {
    expect(stylesSrc).toMatch(/@keyframes petHeroIdle\s*\{/);
    expect(stylesSrc).toMatch(/@keyframes petHeroCelebrate\s*\{/);
    expect(stylesSrc).toMatch(/@keyframes petHeroWarning\s*\{/);
  });

  it('respects prefers-reduced-motion on the pet hero', () => {
    expect(stylesSrc).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.pet-hero-img \{ animation: none/);
  });

  it('defines the .menu-dock layout (flex wrap, kid-finger tap targets)', () => {
    expect(stylesSrc).toMatch(/\.menu-dock\s*\{/);
    expect(stylesSrc).toMatch(/display: flex;\s*flex-wrap: wrap/);
    expect(stylesSrc).toMatch(/\.menu-dock-item\s*\{/);
    expect(stylesSrc).toMatch(/min-height: 48px/);
    expect(stylesSrc).toMatch(/\.menu-dock-item-wide\s*\{\s*flex-basis: 100%/);
  });

  it('disables the old .menu-buttons stack so the dock takes over', () => {
    expect(stylesSrc).toMatch(/\.menu-buttons\s*\{\s*display: none/);
  });

  it('mobile breakpoint shrinks the pet to 160px and stacks the dock 2-wide', () => {
    expect(stylesSrc).toMatch(/@media \(max-width: 600px\)[\s\S]*?\.pet-hero-stage \{ width: 160px/);
    expect(stylesSrc).toMatch(/@media \(max-width: 600px\)[\s\S]*?\.menu-dock-item \{ flex-basis: calc\(50% - 4px\)/);
  });
});

describe('F3 — Pet hero: anti-features explicitly NOT built', () => {
  it('does not introduce any new pet state beyond the existing 5 (idle/happy/hurt/celebrate/fire)', () => {
    // The CSS only adds motion to .pet-hero-img via the 3 keyframes.
    // The .pet-hero-img.src comes from getPetPath(avatar, state) which
    // uses one of {idle,happy,hurt,celebrate,fire} per assets.js.
    const petStates = ['idle', 'happy', 'hurt', 'celebrate', 'fire'];
    // The function should not pass any other state to getPetPath
    const fnMatch = mainSrc.match(/function updateHomePet\s*\(\s*\)\s*\{[\s\S]*?\n\}/);
    const body = fnMatch[0];
    const stateVarMatches = body.match(/state = '(\w+)'/g) || [];
    const usedStates = new Set(stateVarMatches.map(s => s.match(/'(\w+)'/)[1]));
    for (const s of usedStates) {
      expect(petStates).toContain(s);
    }
  });

  it('does not add a pet-customization UI (color picker / accessory shop)', () => {
    // The avatar comes from profile.avatar, set in profile-screen only.
    // No new picker in main.js or the menu screen.
    const fnMatch = mainSrc.match(/function updateHomePet\s*\(\s*\)\s*\{[\s\S]*?\n\}/);
    const body = fnMatch[0];
    expect(body).not.toMatch(/color[- ]picker|accessory|pet-swap/);
  });

  it('does not give the pet any gameplay hook (flowers/watering/levels)', () => {
    // Per the T7 anti-feature contract: pet is identity, not mechanic.
    const fnMatch = mainSrc.match(/function updateHomePet\s*\(\s*\)\s*\{[\s\S]*?\n\}/);
    const body = fnMatch[0];
    expect(body).not.toMatch(/water|feed|treat|gameState\.garden\.push/);
  });
});

describe('F3 — Pet hero: SW cache bust (so users see the new layout)', () => {
  it('public/sw.js CACHE_NAME is bumped to v6 (was v5 in F2)', () => {
    expect(swSrc).toMatch(/const CACHE_NAME = "bloomtype-v6"/);
    expect(swSrc).not.toMatch(/const CACHE_NAME = "bloomtype-v5"/);
  });
});

describe('F3 — Pet hero: assets registry still has getPetPath(emoji, state)', () => {
  it('the 5-state pet path resolver is unchanged (5 PNGs per pet)', () => {
    expect(assetsSrc).toMatch(/export const PET_STATES = \['idle', 'happy', 'hurt', 'celebrate', 'fire'\]/);
    expect(assetsSrc).toMatch(/export function getPetPath\(emoji, state = 'idle'\)/);
  });
});
