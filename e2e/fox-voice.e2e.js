import { expect, test } from '@playwright/test';

// The fox's pre-recorded voice: it loads only during play, speaks in the
// child's language, and the mute button (or the Fox voice setting) stops it
// completely: no clip is fetched and nothing plays.

function seed(page, profile) {
  return page.addInitScript((saved) => {
    window.__foxPlays = [];
    window.__foxPauses = 0;
    // Record clip playback instead of making noise in the test browser.
    window.HTMLMediaElement.prototype.play = function play() {
      // The silent clip that unlocks audio on iOS isn't a fox line.
      if (!this.src.startsWith('data:')) window.__foxPlays.push(this.src);
      return Promise.resolve();
    };
    window.HTMLMediaElement.prototype.pause = function pause() { window.__foxPauses += 1; };
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    // Word narration off so the fox never waits for the speech engine.
    localStorage.setItem('bloomtype-profile', JSON.stringify({
      tutorialSeen: true, seenFingerGuide: true, voiceEnabled: false, ...saved,
    }));
  }, profile);
}

function watchFoxRequests(page) {
  const requests = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/audio/fox/') || /\/foxVoice[-.]/.test(url)) requests.push(url);
  });
  return requests;
}

async function startPlaying(page) {
  await page.locator('#btn-start').click();
  for (const id of ['#btn-close-finger-guide', '#btn-chapter-continue']) {
    if (await page.locator(id).isVisible().catch(() => false)) await page.locator(id).click();
  }
  await expect.poll(() => page.evaluate(() => window.gameState.targetWord?.text || '')).not.toBe('');
}

async function missThreeTimes(page) {
  const word = await page.evaluate(() => window.gameState.targetWord.text);
  const wrong = word[0] === 'q' ? 'z' : 'q';
  for (let i = 0; i < 3; i++) await page.keyboard.press(wrong);
}

test('the fox greets the child in their language, and only during play', async ({ page }) => {
  await seed(page, { locale: 'fr' });
  const requests = watchFoxRequests(page);
  await page.goto('');
  await page.waitForLoadState('networkidle');
  expect(requests, 'the home page never downloads the fox voice').toEqual([]);

  await startPlaying(page);
  await expect.poll(() => page.evaluate(() => window.__foxPlays.length)).toBe(1);
  const [clip] = await page.evaluate(() => window.__foxPlays);
  expect(clip).toMatch(/\/audio\/fox\/fr\/start\.\d\.(webm|mp3)$/);
  await expect(page.locator('#fox-caption')).toHaveText(/./);

  // Three misses inside the cooldown do not make the fox talk again.
  await missThreeTimes(page);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__foxPlays.length)).toBe(1);
});

test('muting stops the fox voice: nothing is fetched or played', async ({ page }) => {
  await seed(page, { soundEnabled: false });
  const requests = watchFoxRequests(page);
  await page.goto('');
  await startPlaying(page);
  await missThreeTimes(page);
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.__foxPlays)).toEqual([]);
  expect(requests).toEqual([]);
});

test('pressing mute while the fox talks silences it', async ({ page }) => {
  await seed(page, {});
  await page.goto('');
  await startPlaying(page);
  await expect.poll(() => page.evaluate(() => window.__foxPlays.length)).toBe(1);
  await page.locator('#btn-sound').click();
  await expect.poll(() => page.evaluate(() => window.__foxPauses)).toBeGreaterThan(0);
});

test('the Fox voice setting can be switched off and is remembered', async ({ page }) => {
  await seed(page, { locale: 'es' });
  const requests = watchFoxRequests(page);
  await page.goto('');
  await page.locator('#btn-profile').click();
  const toggle = page.locator('#fox-voice-toggle');
  await expect(toggle).toBeChecked();
  await expect(page.locator('label', { has: toggle })).toContainText('Voz del zorro');
  await toggle.uncheck();
  await page.locator('#btn-save-profile').click();

  await page.reload();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('bloomtype-profile')).foxVoiceEnabled)).toBe(false);
  await startPlaying(page);
  await missThreeTimes(page);
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.__foxPlays)).toEqual([]);
  expect(requests).toEqual([]);
});

test.describe('slow network', () => {
  // The service worker would fetch the voice code itself, out of reach of page.route.
  test.use({ serviceWorkers: 'block' });

test('quitting while the fox voice is still loading keeps the home screen quiet', async ({ page }) => {
  await seed(page, {});
  // A slow network: the voice code arrives only after the child has already
  // quit. Holding it until then (rather than for a fixed time) keeps the test
  // honest on a busy machine, where reaching the quit button can take longer.
  let releaseVoice;
  const voiceHeld = new Promise((resolve) => { releaseVoice = resolve; });
  await page.route(/\/foxVoice[-.][^/]*\.js$/, async (route) => {
    await voiceHeld;
    await route.continue();
  });
  await page.goto('');
  await startPlaying(page);
  await page.locator('#btn-pause').click();
  await page.locator('#btn-quit').click();
  await expect(page.locator('#menu-screen')).toHaveClass(/active/);
  releaseVoice();
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => window.__foxPlays)).toEqual([]);
});
});
