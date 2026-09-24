import { expect, test } from '@playwright/test';

test('first lesson and later all-letter transition assess only introduced keys', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('bloomtype-profile', JSON.stringify({ tutorialSeen: true, seenFingerGuide: true }));
  });
  await page.goto('');
  await page.locator('#btn-start').click();
  await page.locator('#btn-chapter-continue').click();
  await expect.poll(() => page.evaluate(() => window.gameState.activeWords[0]?.text)).toBeTruthy();
  const first = await page.evaluate(() => window.gameState.activeWords[0].text);
  expect(first).toMatch(/^[asdfjkl; ]+$/);

  await page.locator('#game-screen').focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('#pause-overlay')).toHaveAttribute('aria-hidden', 'false');
  await page.locator('#btn-quit').click();
  await page.evaluate(() => { window.gameState.profile.completedLevels = [1, 2, 3]; });
  await page.locator('#btn-lesson-select').click();
  await expect(page.locator('.level-card[data-level="4"]')).toBeEnabled();
  await expect(page.locator('.level-card[data-level="4"]')).toContainText('g and h');
  await page.locator('.level-card[data-level="4"]').click();
  await page.locator('#btn-chapter-continue').click();
  await expect.poll(() => page.evaluate(() => window.gameState.activeWords[0]?.text)).toBeTruthy();
  const later = await page.evaluate(() => window.gameState.activeWords[0].text);
  expect(later).toMatch(/^[a-z; ]+$/);
});
