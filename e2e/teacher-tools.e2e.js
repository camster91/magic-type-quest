import { expect, test } from '@playwright/test';

test('a teacher sets up a class with an assignment and words, and sees the student report', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
  });

  // 1. Teacher: set a PIN, create the class, set an assignment and a spelling list.
  await page.goto('teacher.html');
  await page.locator('#pin-input').fill('2468');
  await page.locator('#pin-confirm').fill('2468');
  await page.locator('#btn-unlock').click();
  await expect(page.locator('#teacher-dashboard')).toBeVisible();
  await page.locator('#new-class-name').fill('Room 12');
  await page.locator('#new-class-form button[type="submit"]').click();
  const code = (await page.locator('#settings-class-code').textContent()).trim();
  expect(code).toMatch(/^[A-Z0-9]{6}$/);
  await page.locator('#assign-level').selectOption('1');
  await page.locator('#assign-due').fill('2099-12-31');
  await page.locator('#assignment-form button[type="submit"]').click();
  await expect(page.locator('#assignment-status')).toContainText('Level 1');
  await page.locator('#class-words').fill('Plant, seed, bloom, 123, bloom');
  await page.locator('#words-form button[type="submit"]').click();
  await expect(page.locator('#words-status')).toContainText('3 words saved');

  // 2. Student on the same device: join the class and see the banner.
  await page.goto('');
  await page.locator('#btn-profile').click();
  await page.locator('#player-name').fill('Ava');
  await page.locator('#class-code').fill(code.toLowerCase());
  await page.locator('#btn-save-profile').click();
  await page.goto('');
  await expect(page.locator('#class-banner')).toBeVisible();
  await expect(page.locator('#class-banner-text')).toContainText('finish Level 1');
  await expect(page.locator('#btn-class-words')).toBeVisible();

  // 3. Practise the class words.
  await page.locator('#btn-class-words').click();
  for (const id of ['#btn-close-finger-guide', '#btn-chapter-continue']) {
    if (await page.locator(id).isVisible().catch(() => false)) await page.locator(id).click();
  }
  await expect.poll(() => page.evaluate(() => window.gameState.targetWord?.text || '')).toMatch(/^(plant|seed|bloom)$/);

  // 4. Teacher sees the student row with the assignment status.
  await page.goto('teacher.html');
  await page.locator(`.class-chip[data-code="${code}"]`).click();
  const row = page.locator('#student-body tr', { hasText: 'Ava' });
  await expect(row).toBeVisible();
  await expect(row).toContainText('Not yet');
  // The student's save code is on the roster, ready to print for a rescue.
  await expect(row.locator('td.save-code')).toHaveText(/^[0-9A-Z]{4}(-[0-9A-Z]{4}){3}$/);

  const download = page.waitForEvent('download');
  await page.locator('#btn-export-csv').click();
  const file = await download;
  const csv = await (await file.createReadStream()).toArray().then((chunks) => Buffer.concat(chunks).toString('utf8'));
  expect(csv.split('\r\n')[0]).toContain('Best WPM,Accuracy %,Weak keys');
  expect(csv).toContain('Ava');
});
