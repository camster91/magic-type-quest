import { expect, test } from '@playwright/test';

test('the meadow scene shows during play and words follow each other quickly', async ({ page }) => {
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

  // The painted sky is light blue, unlike the old dark purple backdrop.
  await expect.poll(() => page.evaluate(() => {
    const canvas = document.getElementById('game-canvas');
    const [r, g, b] = canvas.getContext('2d').getImageData(canvas.width / 2, canvas.height * 0.12, 1, 1).data;
    return b > 180 && g > 150 && r > 100;
  }), { timeout: 10_000 }).toBe(true);

  const gaps = [];
  for (let i = 0; i < 4; i++) {
    const started = Date.now();
    await expect.poll(() => page.evaluate(() => window.gameState.targetWord?.text || '')).not.toBe('');
    gaps.push(Date.now() - started);
    const word = await page.evaluate(() => window.gameState.targetWord.text);
    await page.keyboard.type(word);
  }
  // After a finished word the next one arrives in well under the old 4 s wait.
  expect(Math.max(...gaps.slice(1))).toBeLessThan(2000);
  await expect.poll(() => page.evaluate(() => window.gameState.wordsCompleted)).toBe(4);
});
