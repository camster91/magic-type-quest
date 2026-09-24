import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const sizes = [
  { width: 360, height: 640 }, { width: 390, height: 844 },
  { width: 768, height: 1024 }, { width: 1024, height: 768 },
  { width: 1366, height: 768 }, { width: 1440, height: 900 },
];

test('shell and canvas stay inside six representative viewports', async ({ page }) => {
  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.goto('v2/');
    await expect(page.getByRole('button', { name: 'Start Meadow' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${size.width} home overflow`).toBeLessThanOrEqual(size.width);
    if (process.env.CAPTURE_V2_SHELL === '1') await page.screenshot({ path: `docs/v2/evidence/shell-home-${size.width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Start Meadow' }).click();
    await expect(page.locator('.v2-stage canvas')).toBeVisible();
    const dimensions = await page.locator('.v2-stage canvas').evaluate((canvas) => ({
      width: canvas.getBoundingClientRect().width,
      host: canvas.parentElement.getBoundingClientRect().width,
    }));
    expect(Math.abs(dimensions.width - dimensions.host)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${size.width} world overflow`).toBeLessThanOrEqual(size.width);
    await page.getByRole('button', { name: 'Finish for now' }).click();
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await page.setViewportSize({ width: 360, height: 640 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test('semantic navigation, settings, pause and return focus work by keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('v2/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#v2-main')).toBeFocused();
  await page.getByRole('button', { name: 'Settings' }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await expect(dialog).toBeVisible();
  if (process.env.CAPTURE_V2_SHELL === '1') await page.screenshot({ path: 'docs/v2/evidence/shell-settings-1366.png', fullPage: true });
  await expect(dialog.getByRole('checkbox', { name: 'Reduce motion' })).toBeFocused();
  await dialog.getByRole('checkbox').check();
  await expect(page.locator('.v2-shell')).toHaveClass(/v2-reduced-motion/);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Settings' })).toBeFocused();
  await page.getByRole('button', { name: 'Start Meadow' }).click();
  await expect(page.locator('.v2-live')).toContainText('ready');
  if (process.env.CAPTURE_V2_SHELL === '1') await page.screenshot({ path: 'docs/v2/evidence/shell-world-1366.png', fullPage: true });
  await expect(page.getByRole('button', { name: 'Pause' })).toBeFocused();
  await page.getByRole('button', { name: 'Pause' }).click();
  const paused = page.getByRole('dialog', { name: 'Paused' });
  await expect(paused.getByRole('button', { name: 'Resume' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(paused.getByRole('button', { name: 'Finish for now' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Pause' })).toBeFocused();
  await page.getByRole('button', { name: 'Finish for now' }).click();
  await expect(page.getByRole('button', { name: 'Start Meadow' })).toBeFocused();
  await page.getByRole('button', { name: 'World Map' }).click();
  await expect(page.getByRole('heading', { name: 'World Map' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to home' }).click();
  await page.getByRole('button', { name: 'Field Guide' }).click();
  await expect(page.getByRole('heading', { name: 'Field Guide' })).toBeVisible();
});

test('failed offline world pack has visible recovery and can be retried', async ({ page, context }) => {
  await page.goto('v2/');
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Start Meadow' }).click();
  await expect(page.getByRole('alert')).toContainText('not available offline yet');
  await expect(page.getByRole('button', { name: 'Try again' })).toBeFocused();
  await context.setOffline(false);
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('.v2-stage canvas')).toBeVisible();
});

test('storage and corrupt-progress reports surface without erasing v1 data', async ({ page }) => {
  await page.goto('v2/');
  await page.evaluate(() => localStorage.setItem('bloomtype-profile', '{legacy-original}'));
  for (const kind of ['storageUnavailable', 'corruptProgress']) {
    await page.evaluate((errorKind) => {
      document.getElementById('v2-app').dispatchEvent(new window.CustomEvent('naturequest:v2:recoverable-error', { detail: { kind: errorKind } }));
    }, kind);
    await expect(page.getByRole('alert')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('alert')).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('bloomtype-profile'))).toBe('{legacy-original}');
  }
});

test('completion and destructive confirmation use semantic modal dialogs', async ({ page }) => {
  await page.goto('v2/');
  await page.evaluate(() => document.getElementById('v2-app').dispatchEvent(new window.CustomEvent('naturequest:v2:dialog-request', {
    detail: { type: 'completion', description: 'Planting spots are marked.' },
  })));
  await expect(page.getByRole('dialog', { name: 'Habitat task complete' })).toContainText('Planting spots are marked.');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.evaluate(() => document.getElementById('v2-app').dispatchEvent(new window.CustomEvent('naturequest:v2:dialog-request', {
    detail: { type: 'confirmation', description: 'Remove this local v2 learner?', onConfirm: () => { window.__confirmed = true; } },
  })));
  const confirmation = page.getByRole('dialog', { name: 'Please confirm' });
  await expect(confirmation).toContainText('Remove this local v2 learner?');
  await confirmation.getByRole('button', { name: 'Confirm' }).click();
  expect(await page.evaluate(() => window.__confirmed)).toBe(true);
});

test('home, dialog, world and map have no automated WCAG A/AA violations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('v2/');
  const check = async () => {
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(result.violations.map((violation) => ({ id: violation.id, targets: violation.nodes.map((entry) => entry.target) }))).toEqual([]);
  };
  await check();
  await page.getByRole('button', { name: 'Settings' }).click();
  await check();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Start Meadow' }).click();
  await expect(page.locator('.v2-stage canvas')).toBeVisible();
  await check();
  await page.getByRole('button', { name: 'World Map' }).click();
  await check();
});
