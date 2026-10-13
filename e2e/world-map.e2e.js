import { expect, test } from '@playwright/test';

// The world map on the Lessons screen: five habitats that restore as their
// levels are finished. Finishing level 1 moves the Meadow from stage 0 to 1.
test('finishing level 1 starts restoring the Meadow on the world map', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    localStorage.setItem('bloomtype-profile', JSON.stringify({ tutorialSeen: true, seenFingerGuide: true }));
  });
  await page.goto('');

  await page.locator('#btn-lesson-select').click();
  const habitats = page.locator('#world-map-list .habitat');
  await expect(habitats).toHaveCount(5);
  const meadow = page.locator('.habitat[data-habitat="meadow"]');
  await expect(meadow).toHaveAttribute('data-stage', '0');
  await expect(page.locator('.habitat[data-habitat="pond"]')).toHaveClass(/is-locked/);
  await expect(page.locator('.habitat[data-habitat="pond"]')).toContainText('Finish level 2 to open');

  // Tapping a habitat takes you to its levels.
  await page.locator('.habitat[data-habitat="forest"]').click();
  await expect(page.locator('#habitat-levels-forest')).toBeFocused();
  await expect(page.locator('#habitat-levels-forest')).toBeInViewport();

  // Play level 1 to the end.
  await page.locator('#btn-lesson-back').click();
  await page.locator('#btn-start').click();
  for (const id of ['#btn-close-finger-guide', '#btn-chapter-continue']) {
    if (await page.locator(id).isVisible().catch(() => false)) await page.locator(id).click();
  }
  await expect.poll(() => page.evaluate(() => window.gameState.screen)).toBe('game');
  for (let i = 0; i < 40; i++) {
    await page.evaluate(() => { window.gameState.lastSpawn = -Infinity; window.gameState.nextSpawnAt = 0; });
    const next = () => page.evaluate(() => (window.gameState.levelComplete ? 'DONE' : window.gameState.targetWord?.text || ''));
    await expect.poll(next).not.toBe('');
    const word = await next();
    if (word === 'DONE') break;
    await page.keyboard.type(word);
  }
  await expect(page.locator('#level-overlay')).toBeVisible();

  await page.locator('#btn-level-menu').click();
  await expect(page.locator('#lesson-select-screen')).toHaveClass(/active/);
  await expect(meadow).toHaveAttribute('data-stage', '1');
  await expect(meadow).toContainText('1 of 2 levels done');
  await expect(meadow.locator('.habitat-pip.on')).toHaveCount(1);
});

test('the world map is reachable with the keyboard and fits a 360px phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    localStorage.setItem('bloomtype-profile', JSON.stringify({ tutorialSeen: true, seenFingerGuide: true, completedLevels: [1, 2, 3] }));
  });
  await page.goto('');
  await page.locator('#btn-lesson-select').click();
  await expect(page.locator('#lesson-select-screen')).toHaveClass(/active/);

  await expect(page.locator('.habitat[data-habitat="meadow"]')).toHaveClass(/is-restored/);
  await expect(page.locator('.habitat[data-habitat="pond"]')).toHaveAttribute('data-stage', '1');
  await expect(page.locator('.habitat[data-habitat="forest"]')).toHaveClass(/is-locked/);

  const overflow = await page.evaluate(() => {
    const screen = document.getElementById('lesson-select-screen');
    return Math.max(document.documentElement.scrollWidth, screen.scrollWidth) - window.innerWidth;
  });
  expect(overflow).toBeLessThanOrEqual(0);

  // From the Back button, Tab reaches the habitats in order; Enter opens one.
  await page.locator('#btn-lesson-back').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('.habitat[data-habitat="meadow"]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('.habitat[data-habitat="pond"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#habitat-levels-pond')).toBeFocused();
});
