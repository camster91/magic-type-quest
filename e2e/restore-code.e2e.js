import { expect, test } from '@playwright/test';

test('a save code moves progress to a fresh device without an account', async ({ browser }) => {
  const deviceA = await browser.newContext();
  const pageA = await deviceA.newPage();
  await pageA.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    localStorage.setItem('bloomtype-profile', JSON.stringify({
      name: 'Ava', avatar: '🦊', locale: 'en', totalStars: 321, totalWords: 654,
      completedLevels: [1, 2, 3], petEvolution: 2, keySR: { q: { correct: 1, wrong: 4 } },
    }));
  });
  await pageA.goto('');
  await pageA.locator('#btn-profile').click();
  const code = (await pageA.locator('#restore-code').textContent()).trim();
  expect(code).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
  await deviceA.close();

  const deviceB = await browser.newContext();
  const pageB = await deviceB.newPage();
  await pageB.goto('');
  await pageB.locator('#btn-profile').click();
  await expect(pageB.locator('#profile-stars')).toHaveText('0');

  await pageB.locator('#restore-code-input').fill('not a code');
  await pageB.locator('#btn-restore-code').click();
  await expect(pageB.locator('#restore-code-status')).toContainText('doesn’t look right');
  await expect(pageB.locator('#restore-code-input')).toHaveAttribute('aria-invalid', 'true');

  await pageB.locator('#restore-code-input').fill(code.toLowerCase().replace(/-/g, ' '));
  await pageB.locator('#btn-restore-code').click();
  await expect(pageB.locator('#restore-code-status')).toHaveText('Progress restored! Welcome back.');
  await expect(pageB.locator('#profile-stars')).toHaveText('321');
  await expect(pageB.locator('#profile-words')).toHaveText('654');
  await expect(pageB.locator('#restore-code')).toHaveText(code);

  const saved = await pageB.evaluate(() => JSON.parse(localStorage.getItem('bloomtype-profile')));
  expect(saved).toMatchObject({ avatar: '🦊', totalStars: 321, totalWords: 654, completedLevels: [1, 2, 3], petEvolution: 2 });
  expect(saved.name).not.toBe('Ava');
  await deviceB.close();
});
