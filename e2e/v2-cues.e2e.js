import { expect, test } from '@playwright/test';

test('reduced-motion sequence still marks the habitat and announces completion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('v2/');
  await page.getByRole('button', { name: 'Start Meadow' }).click();
  await expect(page.locator('.v2-typing-surface')).toBeFocused();
  await page.keyboard.press('f'); await page.keyboard.press('j');
  await expect(page.locator('.v2-world-summary')).toContainText('A planting spot is marked');
  await expect(page.locator('.v2-feedback')).toContainText('You found both home-position keys');
  if (process.env.CAPTURE_V2_CUES === '1') {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: 'docs/v2/evidence/reduced-motion-cue.png', fullPage: true, animations: 'disabled' });
  }
});

test('audio settings persist and no sound is needed for typing', async ({ page }) => {
  await page.goto('v2/');
  await page.getByRole('button', { name: 'Settings' }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await dialog.getByLabel('Mute all sound').check();
  await dialog.getByLabel('Effects volume').fill('25');
  await dialog.getByLabel('Ambience volume').fill('10');
  await dialog.getByRole('button', { name: 'Done' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(dialog.getByLabel('Mute all sound')).toBeChecked();
  await expect(dialog.getByLabel('Effects volume')).toHaveValue('25');
  await expect(dialog.getByLabel('Ambience volume')).toHaveValue('10');
  await dialog.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('button', { name: 'Start Meadow' }).click();
  await expect(page.locator('.v2-typing-surface')).toBeFocused();
  await page.keyboard.press('f'); await page.keyboard.press('j');
  await expect(page.locator('.v2-world-summary')).toContainText('practice saved');
});
