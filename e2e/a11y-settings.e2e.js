import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('reading and play settings apply, persist and keep the game accessible', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    localStorage.setItem('bloomtype-profile', JSON.stringify({ tutorialSeen: true, seenFingerGuide: true }));
  });
  await page.goto('');
  await page.locator('#btn-profile').click();
  await page.locator('#font-select').selectOption('dyslexic');
  await page.locator('#contrast-toggle').check();
  await page.locator('#relaxed-toggle').check();

  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-font', 'dyslexic');
  await expect(html).toHaveClass(/high-contrast/);
  await expect.poll(() => page.evaluate(() => window.getComputedStyle(document.body).fontFamily)).toContain('OpenDyslexic');

  // Settings survive a reload.
  await page.reload();
  await expect(html).toHaveAttribute('data-font', 'dyslexic');
  await expect(html).toHaveClass(/relaxed/);

  // High contrast still passes automated WCAG A/AA checks on the home screen.
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);

  // Relaxed mode: the word waits instead of falling.
  await page.locator('#btn-start').click();
  for (const id of ['#btn-close-finger-guide', '#btn-chapter-continue']) {
    if (await page.locator(id).isVisible().catch(() => false)) await page.locator(id).click();
  }
  await expect.poll(() => page.evaluate(() => Boolean(window.gameState.targetWord))).toBe(true);
  const before = await page.evaluate(() => window.gameState.targetWord.y);
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => window.gameState.targetWord.y);
  expect(after).toBe(before);
});
