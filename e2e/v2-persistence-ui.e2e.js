import { expect, test } from '@playwright/test';

test('local export and confirmed v2 reset preserve the v1 snapshot', async ({ page }) => {
  await page.goto('v2/');
  await page.evaluate(() => localStorage.setItem('bloomtype-profile', JSON.stringify({ name: 'Scout', completedLevels: [1] })));
  await page.reload();
  await page.getByRole('button', { name: 'Start Meadow' }).click();
  await expect(page.locator('.v2-typing-surface')).toBeFocused();
  await page.keyboard.press('f'); await page.keyboard.press('j');
  await expect(page.locator('.v2-world-summary')).toContainText('practice saved');
  await page.getByRole('button', { name: 'Settings' }).click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export local progress' }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/^nature-quest-progress-.*\.json$/);
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Reset this Nature Quest learner' }).click();
  const confirmation = page.getByRole('dialog', { name: 'Reset this learner?' });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.locator('.v2-world-summary')).toContainText('practice saved');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Reset this Nature Quest learner' }).click();
  await page.getByRole('button', { name: 'Reset learner' }).click();
  await expect(page.locator('.v2-world-summary')).toContainText('open patches');
  await page.reload();
  await expect(page.locator('.v2-world-summary')).toContainText('open patches');
  expect(await page.evaluate(() => localStorage.getItem('bloomtype-profile'))).toBe('{"name":"Scout","completedLevels":[1]}');
});

test('storage denial surfaces child-safe recovery and keeps play available', async ({ page }) => {
  await page.addInitScript(() => { window.indexedDB.open = () => { throw new Error('storage denied'); }; });
  await page.goto('v2/');
  await expect(page.getByRole('alert')).toContainText('Saving is unavailable');
  if (process.env.CAPTURE_V2_PERSISTENCE === '1') {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: 'docs/v2/evidence/persistence-storage-unavailable.png', fullPage: true, animations: 'disabled' });
  }
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start Meadow' }).click();
  await expect(page.locator('.v2-typing-surface')).toBeFocused();
});
