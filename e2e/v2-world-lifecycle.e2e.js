import { expect, test } from '@playwright/test';

// These tests use Vite source imports and the real Phaser runtime. They belong
// to the existing source-mode persistence/browser configuration, not preview.
async function mountFixture(page, { invalidImage = false, delayedFirstLoad = false } = {}) {
  await page.goto('v2/');
  await expect(page.getByRole('button', { name: 'Start Meadow' })).toBeVisible();
  await page.evaluate(async ({ invalidImage, delayedFirstLoad }) => {
    // Dispose the ordinary entry through its real lifecycle hook before mounting
    // a controlled source-mode fixture. No production test globals are added.
    window.dispatchEvent(new window.Event('pagehide'));
    window.__worldGlobalBaseline = window.__readWorldListeners?.();
    const { mountV2Shell, loadV2World } = await import('/magic-type-quest/src/v2/app/V2Shell.ts');
    const { Phaser, BootScene } = await loadV2World();
    const image = new Blob([invalidImage ? 'not-an-image' : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4"><rect width="4" height="4" fill="#426c57"/></svg>'],
      { type: invalidImage ? 'image/webp' : 'image/svg+xml' });
    const url = URL.createObjectURL(image);
    window.__worldFixtureURL = url;
    window.__worldFixtureDestroyed = false;
    window.__worldFixtureGameCount = 0;
    window.__worldBlobViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      if (event.blockedURI.startsWith('blob:')) window.__worldBlobViolations.push(event.violatedDirective);
    });
    const resources = new Map([['fixture.required', { id: 'fixture.required', url, bytes: image.size, format: invalidImage ? 'webp' : 'svg' }]]);
    class FixtureScene extends BootScene {
      constructor(onReady, _resources, onLoadFailure) { super(onReady, resources, onLoadFailure); }
    }
    class FixtureGame extends Phaser.Game {
      constructor(config) {
        super(config);
        window.__worldFixtureGame = this;
        window.__worldFixtureDestroyed = false;
        window.__worldFixtureGameCount++;
        this.events.once('destroy', () => { window.__worldFixtureDestroyed = true; });
      }
    }
    let calls = 0;
    const firstLoad = new Promise((resolve) => { window.__allowFirstWorldLoad = resolve; });
    window.__mountWorldFixture = () => mountV2Shell(document.getElementById('v2-app'), async () => {
      calls++;
      if (delayedFirstLoad && calls === 1) await firstLoad;
      return { Phaser: { ...Phaser, Game: FixtureGame }, BootScene: FixtureScene };
    });
    window.__disposeWorldFixture = window.__mountWorldFixture();
  }, { invalidImage, delayedFirstLoad });
}

async function startReady(page) {
  await page.getByRole('button', { name: 'Start Meadow' }).click();
  await expect(page.getByRole('button', { name: 'Use touch keyboard' })).toBeEnabled();
  await expect(page.locator('.v2-stage canvas')).toHaveCount(1);
}

test.afterEach(async ({ page }) => {
  await page.evaluate(() => {
    window.__disposeWorldFixture?.();
    if (window.__worldFixtureURL) URL.revokeObjectURL(window.__worldFixtureURL);
  });
});

test('approved local Blob decoding works under the v2 document policy', async ({ page }) => {
  await mountFixture(page); await startReady(page);
  expect(await page.evaluate(() => window.__worldBlobViolations)).toEqual([]);
  expect(await page.evaluate(() => window.__worldFixtureGame.textures.exists('fixture.required'))).toBe(true);
});

test('undecodable required art exposes recovery and never enables typing', async ({ page }) => {
  await mountFixture(page, { invalidImage: true });
  await page.getByRole('button', { name: 'Start Meadow' }).click();
  await expect(page.getByRole('alert')).toContainText('could not open');
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Use touch keyboard' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Try the keys again' })).toBeDisabled();
  await expect(page.locator('.v2-stage canvas')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__worldFixtureDestroyed)).toBe(true);
});

test('five scene exits release textures and cues, then sleeping-game disposal completes', async ({ page }) => {
  await mountFixture(page); await startReady(page);
  const exits = [];
  for (let visit = 0; visit < 5; visit++) {
    await page.locator('.v2-typing-surface').focus();
    await page.keyboard.press('f');
    await page.getByRole('button', { name: 'Finish for now' }).click();
    await expect(page.locator('.v2-stage canvas')).toHaveCount(0);
    exits.push(await page.evaluate(() => {
      const game = window.__worldFixtureGame;
      const scene = game.scene.getScene('BootScene');
      // Read the three documented internal queues of the pinned Phaser 4.2.1
      // Clock. A changed engine contract must fail, not silently count as zero.
      const timerQueues = ['_active', '_pendingInsertion', '_pendingRemoval'].map((key) => {
        if (!Array.isArray(scene.time[key])) throw new Error(`Unexpected Phaser Clock queue: ${key}`);
        return scene.time[key].length;
      });
      return { timerQueues, textures: Object.keys(game.textures.list).sort(), resizeListeners: game.scale.listenerCount('resize'),
        sceneShutdownListeners: scene.events.listenerCount('shutdown'), sceneDestroyListeners: scene.events.listenerCount('destroy'),
        tweens: scene.tweens.getTweens().length, running: game.loop.running, activeScenes: game.scene.getScenes(true).length };
    }));
    expect(exits[visit].textures).not.toContain('fixture.required');
    expect(exits[visit]).toMatchObject({ timerQueues: [0, 0, 0], tweens: 0, running: false, activeScenes: 0 });
    if (visit) expect(exits[visit]).toEqual(exits[0]);
    if (visit < 4) await startReady(page);
  }
  await page.evaluate(() => window.__disposeWorldFixture());
  await expect.poll(() => page.evaluate(() => window.__worldFixtureDestroyed)).toBe(true);
  expect(await page.evaluate(() => window.__worldFixtureGameCount)).toBe(1);
  await expect(page.locator('#v2-app')).toBeEmpty();
});

test('leaving during module loading cannot mount a stale world', async ({ page }) => {
  await mountFixture(page, { delayedFirstLoad: true });
  await page.getByRole('button', { name: 'Start Meadow' }).click();
  await page.getByRole('button', { name: 'Finish for now' }).click();
  await page.evaluate(() => window.__allowFirstWorldLoad());
  await expect(page.getByRole('button', { name: 'Start Meadow' })).toBeVisible();
  await expect(page.locator('.v2-stage canvas')).toHaveCount(0);
  expect(await page.evaluate(() => window.__worldFixtureGameCount)).toBe(0);
});

test('a newer visit is not replaced by a late cancelled module load', async ({ page }) => {
  await mountFixture(page, { delayedFirstLoad: true });
  await page.getByRole('button', { name: 'Start Meadow' }).click();
  await page.getByRole('button', { name: 'Finish for now' }).click();
  await startReady(page);
  await page.evaluate(() => window.__allowFirstWorldLoad());
  await expect(page.locator('.v2-stage canvas')).toHaveCount(1);
  expect(await page.evaluate(() => window.__worldFixtureGameCount)).toBe(1);
  await expect(page.getByRole('alert')).toBeHidden();
});

test('a completed load respects the open pause dialog and its focus', async ({ page }) => {
  await mountFixture(page, { delayedFirstLoad: true });
  await page.getByRole('button', { name: 'Start Meadow' }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Paused' })).toBeVisible();
  await page.evaluate(() => window.__allowFirstWorldLoad());
  await expect(page.getByRole('button', { name: 'Use touch keyboard', includeHidden: true })).toBeEnabled();
  expect(await page.evaluate(() => Boolean(document.activeElement.closest('dialog')))).toBe(true);
  expect(await page.evaluate(() => window.__worldFixtureGame.scene.isPaused('BootScene'))).toBe(true);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('.v2-typing-surface').focus(); await page.keyboard.press('f');
  await expect(page.locator('.v2-practice-progress')).toHaveText('1 of 2 keys');
});

async function trackWorldListeners(page) {
  await page.addInitScript(() => {
    const entries = []; const add = window.EventTarget.prototype.addEventListener; const remove = window.EventTarget.prototype.removeEventListener;
    const selected = (target, type) => (target === window || target === document) && ['visibilitychange', 'blur', 'focus', 'resize'].includes(type);
    const captureOf = (options) => typeof options === 'boolean' ? options : Boolean(options?.capture);
    window.EventTarget.prototype.addEventListener = function(type, handler, options) {
      const result = add.call(this, type, handler, options); const capture = captureOf(options);
      if (handler && selected(this, type) && !entries.some((entry) => entry.target === this && entry.type === type && entry.handler === handler && entry.capture === capture)) entries.push({ target: this, type, handler, capture });
      return result;
    };
    window.EventTarget.prototype.removeEventListener = function(type, handler, options) {
      const capture = captureOf(options); const index = entries.findIndex((entry) => entry.target === this && entry.type === type && entry.handler === handler && entry.capture === capture);
      if (index >= 0) entries.splice(index, 1);
      return remove.call(this, type, handler, options);
    };
    window.__readWorldListeners = () => ['visibilitychange', 'blur', 'focus', 'resize'].map((type) => entries.filter((entry) => entry.type === type).length);
    window.__hostBlur = () => {}; window.__hostFocus = () => {};
    window.onblur = window.__hostBlur; window.onfocus = window.__hostFocus;
  });
}

test('five whole-shell lifetimes return global listeners to baseline without replacing host handlers', async ({ page }) => {
  await trackWorldListeners(page); await mountFixture(page);
  const baseline = await page.evaluate(() => window.__worldGlobalBaseline);
  for (let lifetime = 0; lifetime < 5; lifetime++) {
    if (lifetime) await page.evaluate(() => { window.__disposeWorldFixture = window.__mountWorldFixture(); });
    await startReady(page);
    expect(await page.evaluate(() => window.onblur === window.__hostBlur && window.onfocus === window.__hostFocus)).toBe(true);
    await page.evaluate(() => window.__disposeWorldFixture());
    await expect.poll(() => page.evaluate(() => window.__worldFixtureDestroyed)).toBe(true);
    await expect.poll(() => page.evaluate(() => window.__readWorldListeners())).toEqual(baseline);
  }
  expect(await page.evaluate(() => window.__worldFixtureGameCount)).toBe(5);
});

test('cancellation during native preBoot finishes teardown without installing global visibility handlers', async ({ page }) => {
  await trackWorldListeners(page); await page.goto('v2/');
  await page.evaluate(async () => {
    window.dispatchEvent(new window.Event('pagehide'));
    const { loadV2World } = await import('/magic-type-quest/src/v2/app/V2Shell.ts');
    const { createWorldGame } = await import('/magic-type-quest/src/v2/game/systems/createWorldGame.ts');
    const { Phaser } = await loadV2World();
    window.__worldGlobalBaseline = window.__readWorldListeners();
    window.__cancelledBootDestroyed = false;
    const parent = document.createElement('div'); document.body.append(parent);
    window.__cancelledBootGame = createWorldGame(Phaser, { type: Phaser.CANVAS, parent, width: 32, height: 32, audio: { noAudio: true },
      callbacks: { preBoot: (game) => {
        game.events.once('destroy', () => { window.__cancelledBootDestroyed = true; parent.remove(); });
        game.destroy(true, false);
      } },
    });
  });
  await expect.poll(() => page.evaluate(() => window.__cancelledBootDestroyed)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__readWorldListeners())).toEqual(await page.evaluate(() => window.__worldGlobalBaseline));
  expect(await page.evaluate(() => window.onblur === window.__hostBlur && window.onfocus === window.__hostFocus)).toBe(true);
});
