import { test, expect } from '@playwright/test';

test('v2 mounts and unmounts a dedicated world while v1 stays available', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('v2/');
  await page.evaluate(() => localStorage.setItem('bloomtype-profile', JSON.stringify({ name: 'Migration QA', uuid: 'qa-profile' })));
  const before = await page.evaluate(() => localStorage.getItem('bloomtype-profile'));
  await expect(page.getByRole('heading', { name: 'Nature Quest' })).toBeVisible();
  await expect(page.locator('.v2-stage canvas')).toHaveCount(1);
  await expect(page.getByRole('status')).toHaveText('World preview ready');
  await expect(page.locator('.v2-stage canvas')).toHaveAttribute('aria-hidden', 'true');
  if (process.env.CAPTURE_V2_BOOT === '1') {
    await page.screenshot({ path: 'docs/v2/evidence/boot-preview.png', fullPage: true });
  }
  await page.getByRole('button', { name: 'Close preview' }).click();
  await expect(page.locator('.v2-stage canvas')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('bloomtype-profile'))).toBe(before);
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'BloomType' })).toBeVisible();
  if (process.env.CAPTURE_V2_BOOT === '1') {
    await page.screenshot({ path: 'docs/v2/evidence/v1-default.png', fullPage: true });
  }
  expect(errors).toEqual([]);
});
