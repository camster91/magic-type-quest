import { expect, test } from '@playwright/test';

test('finishing level 1 discovers the monarch card and the sound choice is saved', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    localStorage.setItem('bloomtype-profile', JSON.stringify({ tutorialSeen: true, seenFingerGuide: true }));
  });
  await page.goto('');
  await page.locator('#btn-start').click();
  for (const id of ['#btn-close-finger-guide', '#btn-chapter-continue']) {
    if (await page.locator(id).isVisible().catch(() => false)) await page.locator(id).click();
  }

  await page.locator('#btn-sound').click();
  await expect(page.locator('#btn-sound')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#game-screen').focus();

  for (let i = 0; i < 20; i++) {
    if (await page.locator('#level-overlay').isVisible()) break;
    await expect.poll(() => page.evaluate(() => window.gameState.targetWord?.text || window.gameState.levelComplete)).toBeTruthy();
    const word = await page.evaluate(() => window.gameState.targetWord?.text || '');
    if (word) await page.keyboard.type(word);
  }

  await expect(page.locator('#level-complete-title')).toContainText('Meadow restored!');
  await expect(page.locator('#level-new-card')).toBeVisible();
  await expect(page.locator('#level-new-card-name')).toHaveText('Monarch butterfly');

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('bloomtype-profile')));
  expect(saved.fieldGuide).toEqual(['monarch']);
  expect(saved.soundEnabled).toBe(false);

  await page.locator('#btn-level-menu').click();
  await page.goto('');
  await page.locator('[data-screen="garden"], #btn-garden, .menu-dock-item:has-text("Garden")').first().click();
  await expect(page.locator('#field-guide-grid .fg-card:not(.locked)')).toHaveCount(1);
  await expect(page.locator('#field-guide-grid')).toContainText('Monarch caterpillars eat only milkweed leaves.');
  await expect(page.locator('#field-guide-count')).toHaveText('1 of 4 found');
});
