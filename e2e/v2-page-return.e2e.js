import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('bloomtype-profile') === null) localStorage.setItem('bloomtype-profile',
      JSON.stringify({ name: 'History QA', completedLevels: [], keyAccuracy: {} }));
  });
});

async function readLocalState(page) {
  return page.evaluate(async () => {
    const { ProgressRepository } = await import('/magic-type-quest/src/v2/persistence/repository.ts');
    const repository = await ProgressRepository.open();
    try {
      const { profiles, problems } = await repository.listProfiles();
      const sessions = [];
      for (const profile of profiles) {
        const state = await repository.read(profile.id);
        sessions.push(...state.sessions.map((row) => row.id));
      }
      return { profiles: profiles.map((row) => row.id).sort(), sessions: sessions.sort(), problems,
        v1: localStorage.getItem('bloomtype-profile') };
    } finally { repository.close(); }
  });
}

async function startPractice(page) {
  await page.getByRole('button', { name: 'Start Meadow', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Use touch keyboard' })).toBeEnabled();
  await page.locator('.v2-typing-surface').focus();
}

test('persisted page-transition events preserve one shell, partial input and learner identity', async ({ page }) => {
  await page.goto('v2/'); await startPractice(page); await page.keyboard.press('f');
  await expect(page.locator('.v2-practice-progress')).toHaveText('1 of 2 keys');
  await expect.poll(async () => (await readLocalState(page)).profiles.length).toBe(1);
  // This tests the event-handling path; synthetic events do not simulate browser
  // freezing, native cache admission, IndexedDB suspension or network behaviour.
  const before = await readLocalState(page);
  await page.evaluate(() => {
    window.__retainedShell = document.querySelector('.v2-shell');
    window.__retainedCanvas = document.querySelector('.v2-stage canvas');
  });
  for (let visit = 0; visit < 5; visit++) {
    await page.evaluate(() => {
      window.dispatchEvent(new window.PageTransitionEvent('pagehide', { persisted: true }));
      window.dispatchEvent(new window.PageTransitionEvent('pageshow', { persisted: true }));
    });
    await expect(page.locator('.v2-shell')).toHaveCount(1);
    await expect(page.locator('.v2-practice-progress')).toHaveText('1 of 2 keys');
    expect(await page.evaluate(() => document.querySelector('.v2-shell') === window.__retainedShell
      && document.querySelector('.v2-stage canvas') === window.__retainedCanvas)).toBe(true);
    expect(await readLocalState(page)).toEqual(before);
  }
  await page.locator('.v2-typing-surface').focus(); await page.keyboard.press('j');
  await expect.poll(async () => (await readLocalState(page)).sessions.length).toBe(1);
  expect((await readLocalState(page)).profiles).toEqual(before.profiles);
});

test('a final non-persisted exit still disposes after several cached departures', async ({ page }) => {
  await page.goto('v2/'); await expect(page.getByRole('button', { name: 'Start Meadow' })).toBeVisible();
  await page.evaluate(() => {
    for (let index = 0; index < 5; index++) {
      window.dispatchEvent(new window.PageTransitionEvent('pagehide', { persisted: true }));
      window.dispatchEvent(new window.PageTransitionEvent('pageshow', { persisted: true }));
    }
    window.dispatchEvent(new window.PageTransitionEvent('pagehide', { persisted: false }));
  });
  await expect(page.locator('#v2-app')).toBeEmpty();
});

test('native Back returns usable v2 progress and records the cache path actually taken', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    window.__pageDocumentToken = crypto.randomUUID();
    window.__pageShowEvents = [];
    window.addEventListener('pageshow', (event) => { window.__pageShowEvents.push(event.persisted); });
  });
  await page.goto('v2/'); await startPractice(page); await page.keyboard.press('f'); await page.keyboard.press('j');
  await expect.poll(async () => (await readLocalState(page)).sessions.length).toBe(1);
  const before = await readLocalState(page);
  const originalToken = await page.evaluate(() => window.__pageDocumentToken);
  await page.getByRole('link', { name: 'Parent view', exact: true }).click();
  await expect(page).toHaveURL(/parents\.html$/u);
  await page.goBack();
  await expect(page.locator('.v2-shell')).toBeVisible();
  const returnPath = await page.evaluate((token) => ({ sameDocument: window.__pageDocumentToken === token,
    persistedReturnObserved: window.__pageShowEvents.includes(true) }), originalToken);
  await testInfo.attach('history-return-path.json', { body: JSON.stringify(returnPath), contentType: 'application/json' });
  if (!returnPath.persistedReturnObserved) testInfo.annotations.push({ type: 'coverage',
    description: 'Native Back used document reload; actual back/forward-cache admission was not exercised.' });
  expect(await readLocalState(page)).toEqual(before);
  if (await page.getByRole('button', { name: 'Start Meadow', exact: true }).isVisible()) await startPractice(page);
  await page.getByRole('button', { name: 'Try the keys again' }).click();
  await page.locator('.v2-typing-surface').focus(); await page.keyboard.press('f');
  await expect(page.locator('.v2-practice-progress')).toHaveText('1 of 2 keys');
});
