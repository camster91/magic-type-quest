import { expect, test } from '@playwright/test';

test('a grown-up PIN keeps progress safe until a grown-up unlocks it', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    localStorage.setItem('bloomtype-profile', JSON.stringify({
      name: 'Ada', tutorialSeen: true, seenFingerGuide: true, completedLevels: [1, 2], totalWords: 50,
    }));
  });
  await page.goto('');
  await page.locator('#btn-profile').click();

  // Set the PIN (with a mismatch first).
  await expect(page.locator('#grown-up-status')).toContainText('Add a PIN');
  await page.locator('#grown-up-pin').fill('1357');
  await page.locator('#grown-up-pin-confirm').fill('1358');
  await page.locator('#btn-grown-up').click();
  await expect(page.locator('#grown-up-message')).toHaveText('The two PINs do not match.');
  await page.locator('#grown-up-pin').fill('1357');
  await page.locator('#grown-up-pin-confirm').fill('1357');
  await page.locator('#btn-grown-up').click();
  await expect(page.locator('#grown-up-status')).toContainText('unlocked');
  await page.locator('#btn-grown-up-lock').click();
  await expect(page.locator('#grown-up-status')).toHaveText('Grown-up settings are locked.');

  // Locked: deleting progress and changing the class do nothing.
  let asked = false;
  page.on('dialog', (dialog) => { asked = true; dialog.accept(); });
  await page.locator('#btn-delete-profile').click();
  expect(asked).toBe(false);
  await expect(page.locator('#grown-up-message')).toHaveText('Ask a grown-up to unlock this with the PIN.');
  await expect(page.locator('#grown-up-pin')).toBeFocused();
  await page.locator('#class-code').fill('ROOM12');
  await page.locator('#btn-save-profile').click();
  await expect(page.locator('#profile-screen')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('bloomtype-profile')).classCode ?? null)).toBeNull();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('bloomtype-profile')).totalWords)).toBe(50);

  // Wrong PIN, then the right one, then deleting works.
  await page.locator('#grown-up-pin').fill('0000');
  await page.locator('#btn-grown-up').click();
  await expect(page.locator('#grown-up-message')).toHaveText('That PIN is not right.');
  await page.locator('#grown-up-pin').fill('1357');
  await page.locator('#btn-grown-up').click();
  await expect(page.locator('#grown-up-unlocked')).toBeVisible();
  await page.locator('#btn-delete-profile').click();
  expect(asked).toBe(true);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('bloomtype-profile'))).toBeNull();
  // The PIN itself survives deleting a child's progress.
  expect(await page.evaluate(() => localStorage.getItem('bloomtype-parent-pin'))).not.toBeNull();
});
