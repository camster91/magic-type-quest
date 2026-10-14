import { expect, test } from '@playwright/test';
import { readFileSync } from 'fs';

const entryPoints = ['', 'parents.html', 'teacher.html', 'landing.html'];

test('home actions reflow and remain reachable on portrait and short landscape screens', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('');

  await expect(page.locator('#btn-start')).toBeVisible();
  await expect(page.locator('#btn-lesson-select')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Parents' })).toBeVisible();
  expect(await page.getByRole('link', { name: 'Parents' }).evaluate((link) => link.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

  await page.setViewportSize({ width: 667, height: 375 });
  const menu = page.locator('#menu-screen');
  await expect(menu).toBeVisible();
  const initial = await page.evaluate(() => ({
    headingTop: document.querySelector('.menu-brand').getBoundingClientRect().top,
    scrollHeight: document.getElementById('menu-screen').scrollHeight,
    clientHeight: document.getElementById('menu-screen').clientHeight,
  }));
  expect(initial.headingTop).toBeGreaterThanOrEqual(0);
  expect(initial.scrollHeight).toBeGreaterThan(initial.clientHeight);

  await menu.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await expect(page.locator('#btn-start')).toBeVisible();
  await expect(page.locator('#btn-lesson-select')).toBeVisible();
  await expect(page.getByRole('link', { name: 'BloomType for schools' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(667);
});

test('a first-time student can start, learn, pause, resume, and quit with the keyboard', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('');

  await page.locator('#btn-start').focus();
  await page.keyboard.press('Enter');

  const tutorial = page.locator('#tutorial-overlay');
  await expect(tutorial).toHaveAttribute('aria-hidden', 'false');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Next →' })).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'How to Play' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next →' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Begin! 🌸' })).toBeFocused();
  await page.keyboard.press('Enter');

  const fingerGuide = page.locator('#finger-guide');
  await expect(fingerGuide).toHaveAttribute('aria-hidden', 'false');
  await expect.poll(() => page.evaluate(() => window.gameState.paused)).toBe(true);
  await expect(page.getByRole('button', { name: 'Got it! ✨' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.gameState.paused)).toBe(false);
  await expect(page.locator('#game-screen')).toBeFocused();

  await page.keyboard.press('Escape');
  const pauseDialog = page.locator('#pause-overlay');
  await expect(pauseDialog).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('#btn-resume')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('#btn-quit')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#btn-resume')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(pauseDialog).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#game-screen')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.locator('#btn-resume')).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.locator('#menu-screen')).toHaveClass(/active/);
  await expect(page.locator('#btn-start')).toBeFocused();
});

async function createTeacherPin(page, pin = '2468') {
  await expect(page.locator('#lock-title')).toHaveText('🔒 Create a teacher PIN');
  await page.locator('#pin-input').fill(pin);
  await page.locator('#pin-confirm').fill(pin);
  await page.locator('#btn-unlock').click();
  await expect(page.locator('#teacher-dashboard')).toBeVisible();
}

test('a student can join and leave a local class that a teacher can review and export', async ({ page }) => {
  await page.goto('');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.locator('#btn-profile').click();
  await page.locator('#player-name').fill('Ada, Jr');
  await page.locator('#class-code').fill(' ab 12 ');
  await page.locator('#btn-save-profile').click();

  await page.goto('teacher.html');
  await createTeacherPin(page);
  await page.locator('#class-code-input').fill('ab 12');
  await page.locator('#btn-load-class').click();
  await expect(page.locator('#class-code-display')).toHaveText('AB12');
  await expect(page.locator('#student-body')).toContainText('Ada, Jr');
  await expect(page.locator('#stats-grid')).toContainText('1');
  await expect(page.locator('#alert-panel')).toHaveClass(/hidden/);

  const csvDownload = page.waitForEvent('download');
  await page.locator('#btn-export-csv').click();
  await expect((await csvDownload).suggestedFilename()).toMatch(/^bloomtype-class-AB12-\d{4}-\d{2}-\d{2}\.csv$/);

  const jsonDownload = page.waitForEvent('download');
  await page.locator('#btn-export-json').click();
  await expect((await jsonDownload).suggestedFilename()).toMatch(/^bloomtype-class-AB12-\d{4}-\d{2}-\d{2}\.json$/);

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#btn-clear-data').click();
  await page.locator('#class-code-input').fill('AB12');
  await page.locator('#btn-load-class').click();
  await expect(page.locator('#student-body tr')).toHaveCount(0);

  await page.goto('');
  await page.locator('#btn-profile').click();
  await page.locator('#player-name').fill('Ada, Jr');
  await page.locator('#class-code').fill('AB12');
  await page.locator('#btn-save-profile').click();
  await page.locator('#btn-profile').click();
  await page.locator('#class-code').fill('');
  await page.locator('#btn-save-profile').click();
  await page.goto('teacher.html');
  await page.locator('#class-code-input').fill('AB12');
  await page.locator('#btn-load-class').click();
  await expect(page.locator('#student-body tr')).toHaveCount(0);
  await expect(page.locator('#empty-state')).toContainText('No students have joined class AB12');

  await page.goto('');
  await page.locator('#btn-profile').click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#btn-delete-profile').click();
  await expect(page.locator('#menu-screen')).toHaveClass(/active/);
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => (
    key === 'bloomtype-profile'
    || key.startsWith('bloomtype_profile_')
    || key.startsWith('bloomtype-class-')
  )))).toEqual([]);
});

test('production entry points and same-origin assets load without errors', async ({ browser, baseURL }) => {
  for (const entryPoint of entryPoints) {
    const page = await browser.newPage();
    const failures = [];
    const baseOrigin = new URL(baseURL).origin;

    page.on('requestfailed', (request) => {
      if (new URL(request.url()).origin === baseOrigin) {
        failures.push(`${request.url()}: ${request.failure()?.errorText || 'request failed'}`);
      }
    });
    page.on('response', (response) => {
      if (new URL(response.url()).origin === baseOrigin && response.status() >= 400) {
        failures.push(`${response.url()}: HTTP ${response.status()}`);
      }
    });

    const response = await page.goto(entryPoint);
    expect(response?.status(), entryPoint || 'index.html').toBe(200);
    await page.waitForLoadState('networkidle');
    expect(failures, entryPoint || 'index.html').toEqual([]);
    if (entryPoint === '') {
      await page.locator('#btn-profile').click();
      await expect(page.locator('#btn-export-local-profile')).toBeVisible();
      await expect(page.locator('#btn-export-cloud-profile')).toBeHidden();
      await expect(page.locator('#btn-delete-cloud-profile')).toBeHidden();
      const downloadPromise = page.waitForEvent('download');
      await page.locator('#btn-export-local-profile').click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/^bloomtype-local-progress-\d{4}-\d{2}-\d{2}\.json$/);
      const exported = JSON.parse(readFileSync(await download.path(), 'utf8'));
      expect(exported).toMatchObject({ formatVersion: 1, source: 'local', profile: { name: 'Player' } });
    }
    await page.close();
  }
});

test('game assets, manifest, and service worker stay inside the deployment scope', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('');
  await page.waitForLoadState('networkidle');

  await expect(page.locator('#pet-hero-img')).toHaveJSProperty('complete', true);
  const pet = await page.locator('#pet-hero-img').evaluate((image) => ({
    naturalWidth: image.naturalWidth,
    pathname: new URL(image.src).pathname,
  }));
  expect(pet.naturalWidth).toBeGreaterThan(0);
  expect(pet.pathname).toContain('/magic-type-quest/assets/');

  const manifest = await page.evaluate(async () => (await fetch('manifest.json')).json());
  expect(manifest.start_url).toBe('./');

  await expect.poll(async () => page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    return registrations.map((registration) => new URL(registration.scope).pathname);
  })).toContain('/magic-type-quest/');

  expect(consoleErrors).toEqual([]);
});

test('language selection applies immediately and persists after reload', async ({ page }) => {
  await page.goto('');
  await page.click('#btn-profile');
  await page.selectOption('#language-select', 'fr');

  await expect(page.locator('#btn-save-profile')).toHaveText('Enregistrer le profil');
  await expect(page.locator('#btn-delete-profile')).toHaveText('Supprimer les progrès locaux');
  await expect(page.locator('.ach-title').first()).toHaveText('Premiers pas');
  await page.click('#btn-save-profile');
  await expect(page.locator('#pet-hero-bubble')).toHaveText(/Salut ! Je suis|jour ! Continue/);
  await page.click('#btn-lesson-select');
  await expect(page.locator('.level-card-name').first()).toContainText('Jardin de la rangée de repos');
  await expect(page.locator('.level-card[data-level="2"] .level-lock-chip')).toHaveText('VERROUILLÉ');
  await expect(page.locator('.level-card[data-level="2"]')).toHaveAttribute('title', 'Termine le niveau 1 pour débloquer');
  await page.click('#btn-lesson-back');
  await page.click('#btn-practice');
  await expect(page.locator('#practice-finger-hint')).toContainText('auriculaire gauche');
  await page.click('#btn-practice-back');
  await page.reload();
  await page.click('#btn-profile');

  await expect(page.locator('#language-select')).toHaveValue('fr');
  await expect(page.locator('#profile-screen h2')).toContainText('Mon profil');

  await page.goto('parents.html');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('.hero h1')).toContainText('Aidez votre enfant');
  await expect(page.locator('#privacy h2')).toHaveText('Ce que BloomType conserve');

  await page.goto('teacher.html');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('h1')).toContainText('Tableau de bord enseignant');
  await expect(page.locator('#lock-title')).toHaveText('🔒 Créer un NIP enseignant');
  await expect(page.locator('#btn-unlock')).toHaveText('Créer le NIP');
  await page.locator('#pin-input').fill('2468');
  await page.locator('#pin-confirm').fill('2468');
  await page.locator('#btn-unlock').click();
  await expect(page.locator('#btn-load-class')).toHaveText('🔍 Charger la classe');
  await expect(page.locator('thead th').first()).toHaveText('Élève');
  await expect(page.locator('.stat-label').first()).toHaveText('Élèves');
});

test('a weak-key drill finishes without changing curriculum progress', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('');
  // The app code loads after the menu paints, so wait for it before poking it.
  await page.waitForFunction(() => window.gameState?.profile);

  await page.evaluate(() => {
    window.gameState.profile.completedLevels = [1];
    window.gameState.profile.totalStars = 10;
    window.gameState.keyAccuracy = { a: { correct: 0, wrong: 4 } };
    document.getElementById('btn-drill').classList.remove('hidden');
  });
  await page.evaluate(() => document.getElementById('btn-drill').click());

  await expect.poll(() => page.evaluate(() => window.gameState.level)).toBe('drill');
  expect(await page.evaluate(() => Number.isFinite(window.gameState.score))).toBe(true);
  // The HUD shows a drill marker, not a level number formatted from the word 'drill'.
  await expect(page.locator('#level')).toHaveText('🎯');
  const starsBeforeCompletion = await page.evaluate(() => window.gameState.profile.totalStars);
  await page.evaluate(() => {
    const { drillLesson } = window.gameState;
    window.gameState.activeWords = [];
    window.gameState.targetWord = null;
    window.gameState.wordsSpawned = drillLesson.wordsPerLevel;
  });

  await expect(page.locator('#menu-screen')).toHaveClass(/active/);
  await expect(page.locator('#toast-title')).toHaveText('Weak-key drill complete!');
  const result = await page.evaluate(() => ({
    completedLevels: window.gameState.profile.completedLevels,
    totalStars: window.gameState.profile.totalStars,
    scoreIsFinite: Number.isFinite(window.gameState.score),
    drillLesson: window.gameState.drillLesson,
  }));
  expect(result).toEqual({
    completedLevels: [1],
    totalStars: starsBeforeCompletion,
    scoreIsFinite: true,
    drillLesson: null,
  });
});

test('home progress continues through the complete ten-level curriculum', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('bloomtype-profile', JSON.stringify({
      completedLevels: [1, 2, 3, 4, 5, 6],
    }));
  });
  await page.goto('');

  await expect(page.locator('#menu-level-badge')).toContainText('Level 7');
  await expect(page.locator('#menu-level-fill')).toHaveAttribute('style', /width:\s*60%/);
  await expect(page.locator('#menu-keyboard-mini')).not.toContainText('All levels cleared');
});

test('the installed app shell reloads while offline', async ({ context, page }) => {
  await page.goto('');
  await page.evaluate(async () => navigator.serviceWorker.ready);

  // Reload once online so the active worker controls this page and its runtime
  // cache contains the generated JS, CSS, and visible image assets.
  await page.reload();
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('.menu-brand')).toHaveText('BloomType');
    await expect(page.locator('#pet-hero-img')).toHaveJSProperty('complete', true);
    expect(await page.locator('#pet-hero-img').evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
  } finally {
    await context.setOffline(false);
  }
});

test('the installed app switches to French while offline', async ({ context, page }) => {
  await page.goto('');
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => window.gameState);
  expect(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  // French was never loaded on this page: only the worker's install cached it.
  await context.setOffline(true);
  try {
    await page.locator('#language-select').evaluate((select) => {
      select.value = 'fr';
      select.dispatchEvent(new window.Event('change'));
    });
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('#btn-start')).toContainText('Tape pour planter');
    expect(await page.evaluate(() => window.gameState.profile.locale)).toBe('fr');
  } finally {
    await context.setOffline(false);
  }
});

test('service-worker activation removes stale BloomType caches', async ({ page }) => {
  await page.goto('');
  await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    await caches.open('bloomtype-stale-verification');
    const registration = await navigator.serviceWorker.register('sw.js?cache-cleanup-verification=1');
    const worker = registration.installing || registration.waiting || registration.active;
    if (worker?.state !== 'activated') {
      await new Promise((resolve) => {
        worker.addEventListener('statechange', () => {
          if (worker.state === 'activated') resolve();
        });
      });
    }
  });

  await expect.poll(async () => page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    return caches.keys();
  })).not.toContain('bloomtype-stale-verification');
});

test('the teacher dashboard stays locked until the PIN is entered', async ({ page }) => {
  await page.goto('');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#btn-profile').click();
  await page.locator('#player-name').fill('Grace');
  await page.locator('#btn-save-profile').click();

  await page.goto('teacher.html');
  await expect(page.locator('#teacher-dashboard')).toBeHidden();
  await expect(page.locator('#pin-input')).toBeFocused();

  await page.locator('#pin-input').fill('12');
  await page.locator('#pin-confirm').fill('12');
  await page.locator('#btn-unlock').click();
  await expect(page.locator('#lock-message')).toHaveText('Use 4 to 8 digits.');
  await page.locator('#pin-input').fill('2468');
  await page.locator('#pin-confirm').fill('2469');
  await page.locator('#btn-unlock').click();
  await expect(page.locator('#lock-message')).toHaveText('The two PINs do not match.');

  await createTeacherPin(page);
  await expect(page.locator('#student-body')).toContainText('Grace');
  expect(await page.evaluate(() => localStorage.getItem('bloomtype-teacher-pin'))).not.toContain('2468');

  await page.locator('#btn-lock').click();
  await expect(page.locator('#teacher-dashboard')).toBeHidden();
  await expect(page.locator('#lock-title')).toHaveText('🔒 Teacher dashboard locked');
  // Locking removes the rendered student data from the page.
  await expect(page.locator('#student-body tr')).toHaveCount(0);
  await expect(page.locator('#class-list > *')).toHaveCount(0);

  // A new tab needs the PIN again.
  const other = await page.context().newPage();
  await other.goto('teacher.html');
  await expect(other.locator('#teacher-dashboard')).toBeHidden();
  await other.locator('#pin-input').fill('1111');
  await other.locator('#btn-unlock').click();
  await expect(other.locator('#lock-message')).toHaveText('That PIN is not right. Try again.');
  await other.locator('#pin-input').fill('2468');
  await other.locator('#btn-unlock').click();
  await expect(other.locator('#student-body')).toContainText('Grace');
  await other.locator('#new-class-name').fill('Room 1');
  await other.locator('#new-class-form button[type="submit"]').click();
  await expect(other.locator('.class-chip')).toHaveCount(1);

  // Forgetting the PIN is only possible by also deleting the class data.
  await page.reload();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#btn-forgot-pin').click();
  await expect(page.locator('#lock-title')).toHaveText('🔒 Create a teacher PIN');
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('bloomtype_profile_')
    || ['bloomtype-teacher-pin', 'bloomtype-profile', 'bloomtype-classes'].includes(key)))).toEqual([]);
});

test('skipping words never finishes a level, but typing them does', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    localStorage.setItem('bloomtype-profile', JSON.stringify({
      name: 'Tester', tutorialSeen: true, seenFingerGuide: true, completedLevels: [1],
    }));
  });
  await page.goto('');
  await page.locator('#btn-start').click();
  await expect.poll(() => page.evaluate(() => window.gameState.screen)).toBe('game');
  await expect.poll(() => page.evaluate(() => window.gameState.paused)).toBe(false);

  // Level 1 has 10 words. Skipping more than that must not finish it.
  for (let i = 0; i < 15; i++) {
    // Let the next word appear now instead of after the 4s spawn delay.
    await page.evaluate(() => { window.gameState.lastSpawn = -Infinity; });
    await expect.poll(() => page.evaluate(() => Boolean(window.gameState.targetWord))).toBe(true);
    await page.keyboard.press('Space');
  }
  expect(await page.evaluate(() => window.gameState.levelComplete)).toBe(false);
  expect(await page.evaluate(() => window.gameState.wordsCompleted)).toBe(0);

  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => { window.gameState.lastSpawn = -Infinity; });
    await expect.poll(() => page.evaluate(() => window.gameState.targetWord?.text || '')).not.toBe('');
    const text = await page.evaluate(() => window.gameState.targetWord.text);
    await page.keyboard.type(text);
  }
  await expect.poll(() => page.evaluate(() => window.gameState.levelComplete)).toBe(true);
  expect(await page.evaluate(() => window.gameState.wordsCompleted)).toBe(10);
});
