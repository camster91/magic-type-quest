import { expect, test } from '@playwright/test';

test('siblings share a device and the parent page shows each child', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    localStorage.setItem('bloomtype-profile', JSON.stringify({
      uuid: 'ava-1', name: 'Ava', avatar: '🦊', tutorialSeen: true, totalWords: 40, completedLevels: [1],
      levelStats: { 1: { wpm: 15, accuracy: 93 } }, practiceLog: { [key]: 12 }, minutesPractised: 12,
      keySR: { f: { correct: 10, wrong: 0 }, q: { correct: 1, wrong: 3 } }, lastPlayed: today.toISOString(),
    }));
  });

  // Ava adds a second player for her brother.
  await page.goto('');
  await page.locator('#btn-profile').click();
  await page.locator('#btn-add-player').click();
  await page.waitForLoadState('load');
  await page.locator('#btn-profile').click();
  await page.locator('#player-name').fill('Ben');
  await page.locator('#btn-save-profile').click();

  // Ben can switch back to Ava.
  await page.goto('');
  await page.locator('#btn-profile').click();
  await expect(page.locator('.player-chip')).toHaveText(/Ava/);
  await page.locator('.player-chip', { hasText: 'Ava' }).click();
  await page.waitForLoadState('load');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('bloomtype-profile')).name)).toBe('Ava');

  // The parent page shows both children with real numbers.
  await page.goto('parents.html');
  await expect(page.locator('#family-progress')).toBeVisible();
  await expect(page.locator('#family-sample')).toBeHidden();
  const ava = page.locator('.child-card', { hasText: 'Ava' });
  await expect(ava).toContainText('12 min this week');
  await expect(ava).toContainText('15 WPM best');
  await expect(ava).toContainText('Keys learned: F');
  await expect(ava).toContainText('Practise next: Q');
  await expect(page.locator('.child-card', { hasText: 'Ben' })).toBeVisible();
});
