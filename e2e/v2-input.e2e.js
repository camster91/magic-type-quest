import { expect, test } from '@playwright/test';

test('physical keyboard follows F/J target with gentle retry and no browser-shortcut capture', async ({ page }) => {
  await page.goto('v2/');
  await page.getByRole('button', { name: 'Start Meadow' }).click();
  await expect(page.locator('.v2-typing-surface')).toBeFocused();
  const shortcut = await page.locator('.v2-typing-surface').evaluate((surface) => {
    const event = new window.KeyboardEvent('keydown', { key: 'l', ctrlKey: true, bubbles: true, cancelable: true });
    surface.dispatchEvent(event); return event.defaultPrevented;
  });
  expect(shortcut).toBe(false);
  await page.keyboard.press('g');
  await expect(page.locator('.v2-feedback')).toContainText('Try f again');
  await expect(page.locator('.v2-practice-progress')).toHaveText('0 of 2 keys');
  await page.keyboard.press('f');
  await expect(page.locator('.v2-practice-progress')).toHaveText('1 of 2 keys');
  await expect(page.locator('.v2-target')).toHaveText('Next key: J');
  await expect(page.locator('.v2-finger')).toContainText('right index');
  await page.keyboard.press('j');
  await expect(page.locator('.v2-target')).toHaveText('F and J complete');
  await expect(page.locator('.v2-live')).toContainText('Sequence complete');
  await page.getByRole('button', { name: 'Try the keys again' }).click();
  await expect(page.locator('.v2-practice-progress')).toHaveText('0 of 2 keys');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Use touch keyboard' })).toBeFocused();
});

test('settings and pause stop scoring until typing focus is explicitly restored', async ({ page }) => {
  await page.goto('v2/');
  await page.getByRole('button', { name: 'Start Meadow' }).click();
  await expect(page.locator('.v2-typing-surface')).toBeFocused();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
  await page.keyboard.press('f');
  await expect(page.locator('.v2-practice-progress')).toHaveText('0 of 2 keys');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Settings' })).toBeFocused();
  await page.keyboard.press('f');
  await expect(page.locator('.v2-practice-progress')).toHaveText('0 of 2 keys');
  await page.getByRole('button', { name: 'Resume typing' }).click();
  await expect(page.locator('.v2-typing-surface')).toBeFocused();
  await page.keyboard.press('f');
  await expect(page.locator('.v2-practice-progress')).toHaveText('1 of 2 keys');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Paused' })).toBeVisible();
  await page.keyboard.press('j');
  await expect(page.locator('.v2-practice-progress')).toHaveText('1 of 2 keys');
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(page.locator('.v2-typing-surface')).toBeFocused();
  await page.keyboard.press('j');
  await expect(page.locator('.v2-target')).toHaveText('F and J complete');
});

test('touch keyboard remains a clearly unscored practice fallback', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('v2/');
  await page.getByRole('button', { name: 'Start Meadow' }).click();
  await page.getByRole('button', { name: 'Use touch keyboard' }).click();
  await expect(page.locator('.v2-touch-input')).toBeFocused();
  await page.locator('.v2-touch-input').fill('f');
  await expect(page.locator('.v2-practice-progress')).toHaveText('1 of 2 keys');
  await expect(page.locator('.v2-world-note')).toContainText('Physical-key mastery is not recorded');
});
