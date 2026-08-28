import { expect, test } from '@playwright/test';

const entryPoints = ['', 'parents.html', 'teacher.html', 'landing.html'];

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
