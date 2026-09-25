import { expect, test } from '@playwright/test';

test('throttled Meadow feedback and five scene exits stay within budgets', async ({ page }) => {
  await page.addInitScript(() => {
    const entries = []; const add = window.EventTarget.prototype.addEventListener; const remove = window.EventTarget.prototype.removeEventListener;
    window.EventTarget.prototype.addEventListener = function(type, listener, options) {
      if ((this === window || this === document) && ['resize', 'visibilitychange'].includes(type)
        && !entries.some((entry) => entry.target === this && entry.type === type && entry.listener === listener)) entries.push({ target: this, type, listener });
      return add.call(this, type, listener, options);
    };
    window.EventTarget.prototype.removeEventListener = function(type, listener, options) {
      const index = entries.findIndex((entry) => entry.target === this && entry.type === type && entry.listener === listener);
      if (index !== -1) entries.splice(index, 1);
      return remove.call(this, type, listener, options);
    };
    window.__activeSceneListeners = () => entries.length;
  });
  const session = await page.context().newCDPSession(page);
  await session.send('Network.enable');
  await session.send('Network.emulateNetworkConditions', { offline: false, latency: 100, downloadThroughput: 200_000, uploadThroughput: 80_000 });
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const start = Date.now(); await page.goto('v2/');
  await expect(page.getByRole('button', { name: 'Start Meadow' })).toBeVisible();
  const shellMs = Date.now() - start;
  await page.getByRole('button', { name: 'Start Meadow' }).click();
  await expect(page.locator('.v2-stage canvas')).toBeVisible({ timeout: 30_000 });
  const firstEntryMs = Date.now() - start;
  const fps = await page.evaluate(async () => {
    const intervals = []; let previous = 0;
    await new Promise((resolve) => {
      const frame = (now) => { if (previous) intervals.push(now - previous); previous = now; if (intervals.length < 90) requestAnimationFrame(frame); else resolve(); };
      requestAnimationFrame(frame);
    });
    return 1000 / (intervals.reduce((sum, value) => sum + value, 0) / intervals.length);
  });
  await page.locator('.v2-typing-surface').focus();
  await page.evaluate(() => {
    const surface = document.querySelector('.v2-typing-surface'); const feedback = document.querySelector('.v2-feedback');
    let began = 0; window.__feedbackLatencies = [];
    surface.addEventListener('keydown', () => { began = performance.now(); }, { capture: true });
    const observer = new window.MutationObserver(() => {
      if (began) { const startAt = began; began = 0; requestAnimationFrame(() => window.__feedbackLatencies.push(performance.now() - startAt)); }
    });
    observer.observe(feedback, { childList: true, subtree: true, characterData: true });
  });
  for (let index = 0; index < 10; index++) {
    if (index) { await page.getByRole('button', { name: 'Try the keys again' }).click(); await page.locator('.v2-typing-surface').focus(); }
    await page.keyboard.press('f'); await page.keyboard.press('j');
    await expect.poll(() => page.evaluate(() => window.__feedbackLatencies.length)).toBe((index + 1) * 2);
  }
  const latencies = await page.evaluate(() => window.__feedbackLatencies.slice().sort((a, b) => a - b));
  const inputP95Ms = latencies[Math.ceil(latencies.length * 0.95) - 1];
  expect(fps).toBeGreaterThanOrEqual(30); expect(inputP95Ms).toBeLessThan(100);
  let listenersAfterExit = null;
  for (let visit = 0; visit < 5; visit++) {
    await page.getByRole('button', { name: 'Finish for now' }).click();
    await expect(page.locator('.v2-stage canvas')).toHaveCount(0);
    const count = await page.evaluate(() => window.__activeSceneListeners());
    if (listenersAfterExit === null) listenersAfterExit = count;
    expect(count).toBe(listenersAfterExit);
    await page.getByRole('button', { name: 'Start Meadow' }).click();
    await expect(page.locator('.v2-stage canvas')).toHaveCount(1);
  }
  await page.getByRole('button', { name: 'Finish for now' }).click();
  await expect(page.locator('.v2-stage canvas')).toHaveCount(0);
  expect(await page.evaluate(() => window.__activeSceneListeners())).toBe(listenersAfterExit);
  console.log(JSON.stringify({ profile: 'Chromium 4x CPU, 100ms RTT, 1.6Mbps down, reduced motion', shellMs, firstEntryMs, fps, inputP95Ms, sceneVisits: 6, listenersAfterExit }));
  await session.detach();
});

test('failed Phaser request offers a successful retry', async ({ page }) => {
  let blocked = false;
  await page.route('**/assets/phaser.esm-*.js', async (route) => {
    if (!blocked) { blocked = true; await route.abort('failed'); } else await route.continue();
  });
  await page.goto('v2/'); await page.getByRole('button', { name: 'Start Meadow' }).click();
  await expect(page.getByRole('alert')).toContainText('could not open');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('.v2-stage canvas')).toBeVisible();
});
