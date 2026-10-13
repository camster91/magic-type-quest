import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const standards = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function noViolations(page, include) {
  const { violations } = await new AxeBuilder({ page }).withTags(standards).include(include).analyze();
  expect(violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target.join(' ')) }))).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
  });
});

test('a parent opts in to the pilot survey, saves it locally and downloads it', async ({ page }) => {
  await page.goto('parents.html');
  // Opt-in: closed, empty and unsaved until the grown-up opens it and saves.
  await expect(page.locator('#pilot-survey')).toBeHidden();
  expect(await page.locator('#pilot-survey').innerHTML()).toBe('');
  await page.locator('#pilot-details summary').click();
  await expect(page.locator('#pilot-survey form')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('bloomtype-pilot-survey'))).toBeNull();
  await noViolations(page, '#pilot-feedback');

  await page.locator('input[name="setupEase"][value="4"]').check();
  await page.locator('input[name="childEnjoyment"][value="5"]').check();
  await page.locator('#pilot-minutesPerWeek').selectOption('30to60');
  await page.locator('#pilot-comments').fill('The meadow kept them going.');
  await page.getByRole('button', { name: 'Save answers' }).click();
  await expect(page.locator('.pilot-status')).toContainText('Saved in this browser only');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download feedback (.json)' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^bloomtype-pilot-feedback-\d{4}-\d{2}-\d{2}\.json$/);
  const record = JSON.parse(await readFile(await file.path(), 'utf8'));
  expect(record).toMatchObject({
    type: 'bloomtype-pilot-feedback', role: 'parent',
    answers: { setupEase: 4, childEnjoyment: 5, minutesPerWeek: '30to60', comments: 'The meadow kept them going.' },
  });

  // Answers come back after a reload, and can be deleted.
  await page.reload();
  await page.locator('#pilot-details summary').click();
  await expect(page.locator('input[name="setupEase"][value="4"]')).toBeChecked();
  await page.getByRole('button', { name: 'Delete my answers' }).click();
  expect(await page.evaluate(() => localStorage.getItem('bloomtype-pilot-survey'))).toBeNull();
});

test('a teacher downloads an anonymised pilot summary and can open the survey', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('bloomtype_profile_ada')) return;
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    localStorage.setItem('bloomtype_profile_ada', JSON.stringify({
      name: 'Ada Lovelace', uuid: 'ada-1', completedLevels: [1, 2],
      levelStats: { 1: { wpm: 14, accuracy: 92 } }, practiceLog: { [key]: 12 }, lastPlayed: today.toISOString(),
    }));
  });
  await page.goto('teacher.html');
  await page.locator('#pin-input').fill('2468');
  await page.locator('#pin-confirm').fill('2468');
  await page.locator('#btn-unlock').click();
  await expect(page.locator('#teacher-dashboard')).toBeVisible();

  const download = page.waitForEvent('download');
  await page.locator('#btn-pilot-summary').click();
  const file = await download;
  const text = await readFile(await file.path(), 'utf8');
  expect(text).not.toContain('Ada');
  expect(text).not.toContain('ada-1');
  expect(JSON.parse(text)).toMatchObject({
    type: 'bloomtype-pilot-summary', studentCount: 1,
    wpm: { median: 14 }, minutes: { last7Days: 12, last28Days: 12 }, levelsReached: { 2: 1 },
  });

  await page.locator('#pilot-details summary').click();
  await expect(page.locator('#pilot-survey form')).toBeVisible();
  await noViolations(page, '#pilot-panel');
});
