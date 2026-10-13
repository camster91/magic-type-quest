import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Automated WCAG A/AA checks on every learner screen and overlay, plus a
// keyboard-only run through a whole level. These do not replace the
// physical screen-reader pass in docs/DEVICE-ACCESSIBILITY-QA.md.
const standards = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function noViolations(page, include) {
  let builder = new AxeBuilder({ page }).withTags(standards);
  if (include) builder = builder.include(include);
  const { violations } = await builder.analyze();
  expect(violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target.join(' ')) }))).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    localStorage.setItem('bloomtype-profile', JSON.stringify({
      name: 'Ada', tutorialSeen: true, seenFingerGuide: true, completedLevels: [1],
      totalWords: 40, totalStars: 9, fieldGuide: ['monarch'], plants: { lupine: 1 },
    }));
  });
  await page.goto('');
});

for (const [name, button, screen] of [
  ['lessons', '#btn-lesson-select', '#lesson-select-screen'],
  ['practice', '#btn-practice', '#practice-screen'],
  ['garden', '#btn-garden', '#garden-screen'],
]) {
  test(`the ${name} screen has no automated WCAG A or AA violations`, async ({ page }) => {
    await page.locator(button).click();
    await expect(page.locator(screen)).toHaveClass(/active/);
    await noViolations(page);
  });
}

async function startLevel(page) {
  await page.locator('#btn-start').click();
  for (const id of ['#btn-close-finger-guide', '#btn-chapter-continue']) {
    if (await page.locator(id).isVisible().catch(() => false)) await page.locator(id).click();
  }
  await expect.poll(() => page.evaluate(() => window.gameState.screen)).toBe('game');
}

async function typeWholeLevel(page) {
  for (let i = 0; i < 40; i++) {
    if (await page.evaluate(() => window.gameState.levelComplete)) return;
    await page.evaluate(() => { window.gameState.lastSpawn = -Infinity; window.gameState.nextSpawnAt = 0; });
    await expect.poll(() => page.evaluate(() => window.gameState.targetWord?.text || '')).not.toBe('');
    await page.keyboard.type(await page.evaluate(() => window.gameState.targetWord.text));
  }
}

test('the game, pause and level-finish overlays have no automated WCAG A or AA violations', async ({ page }) => {
  await startLevel(page);
  await noViolations(page, '#game-screen');
  await page.locator('#btn-pause').click();
  await expect(page.locator('#pause-overlay')).toBeVisible();
  await expect(page.locator('#btn-resume')).toBeFocused();
  await noViolations(page, '#pause-overlay');
  await page.locator('#btn-resume').click();
  await typeWholeLevel(page);
  await expect(page.locator('#level-overlay')).toBeVisible();
  await noViolations(page, '#level-overlay');
});

test('a whole level can be played with the keyboard alone', async ({ page }) => {
  // Tab from the top of the page to the main button and press Enter.
  let reached = false;
  for (let i = 0; i < 25 && !reached; i++) {
    await page.keyboard.press('Tab');
    reached = await page.evaluate(() => document.activeElement?.id === 'btn-start');
  }
  expect(reached).toBe(true);
  await page.keyboard.press('Enter');
  for (const id of ['#btn-close-finger-guide', '#btn-chapter-continue']) {
    if (await page.locator(id).isVisible().catch(() => false)) {
      await page.locator(id).focus();
      await page.keyboard.press('Enter');
    }
  }
  await expect.poll(() => page.evaluate(() => window.gameState.screen)).toBe('game');
  await typeWholeLevel(page);
  await expect(page.locator('#level-overlay')).toBeVisible();
  // The finish card's buttons are reachable by Tab, and Enter opens the lessons.
  let onMenuButton = false;
  for (let i = 0; i < 10 && !onMenuButton; i++) {
    await page.keyboard.press('Tab');
    onMenuButton = await page.evaluate(() => document.activeElement?.id === 'btn-level-menu');
  }
  expect(onMenuButton).toBe(true);
  await page.keyboard.press('Enter');
  await expect(page.locator('#lesson-select-screen')).toHaveClass(/active/);
});
