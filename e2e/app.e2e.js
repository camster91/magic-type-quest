import { expect, test } from '@playwright/test';

const entryPoints = ['', 'parents.html', 'teacher.html', 'landing.html'];

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
  await page.click('#btn-save-profile');
  await page.reload();
  await page.click('#btn-profile');

  await expect(page.locator('#language-select')).toHaveValue('fr');
  await expect(page.locator('#profile-screen h2')).toContainText('Mon profil');
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
