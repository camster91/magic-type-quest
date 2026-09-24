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
  await expect(page.locator('.v2-feedback')).toContainText('You found both home-position keys');
  await expect(page.locator('.v2-world-summary')).toContainText('practice saved');
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

test('physical practice evidence survives a page reload without duplicate summaries', async ({ page }) => {
  await page.goto('v2/');
  await page.getByRole('button', { name: 'Start Meadow' }).click();
  await expect(page.locator('.v2-typing-surface')).toBeFocused();
  await page.keyboard.press('f'); await page.keyboard.press('j');
  await expect(page.locator('.v2-world-summary')).toContainText('practice saved');
  await page.reload();
  await expect(page.locator('.v2-world-summary')).toContainText('1 home-position practice visit saved');
  const evidence = await page.evaluate(async () => {
    const id = localStorage.getItem('naturequest:v2:active-profile');
    const request = window.indexedDB.open('naturequest:v2:progress', 2);
    const db = await new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = reject; });
    const tx = db.transaction(['mastery', 'sessions'], 'readonly');
    const read = (store) => new Promise((resolve, reject) => {
      const query = tx.objectStore(store).getAll(); query.onsuccess = () => resolve(query.result); query.onerror = reject;
    });
    const [keys, sessions] = await Promise.all([read('mastery'), read('sessions')]); db.close();
    return { f: keys.find((row) => row.id === `${id}:f`)?.evidence.correct,
      j: keys.find((row) => row.id === `${id}:j`)?.evidence.correct,
      sessions: sessions.filter((row) => row.learnerId === id).length };
  });
  expect(evidence).toEqual({ f: 1, j: 1, sessions: 1 });
});

test('loaded Meadow practice saves locally while the network is offline', async ({ page, context }) => {
  await page.goto('v2/');
  await page.getByRole('button', { name: 'Start Meadow' }).click();
  await expect(page.locator('.v2-typing-surface')).toBeFocused();
  await context.setOffline(true);
  await page.keyboard.press('f'); await page.keyboard.press('j');
  await expect(page.locator('.v2-world-summary')).toContainText('practice saved');
  await context.setOffline(false);
});
