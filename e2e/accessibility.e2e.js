import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const standards = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

function summarize(violations) {
  return violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.map((node) => node.target.join(' ')),
  }));
}

const surfaces = [
  { name: 'learner home', path: '' },
  { name: 'parent guidance', path: 'parents.html' },
  { name: 'teacher dashboard', path: 'teacher.html' },
  { name: 'school landing page', path: 'landing.html' },
];

for (const surface of surfaces) {
  test(`${surface.name} has no automated WCAG A or AA violations`, async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto(surface.path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).withTags(standards).analyze();
    expect(summarize(results.violations)).toEqual([]);
  });
}

test('learner profile controls have no automated WCAG A or AA violations', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('');
  await page.locator('#btn-profile').click();
  await expect(page.locator('#profile-screen')).toHaveClass(/active/);
  const results = await new AxeBuilder({ page }).withTags(standards).analyze();
  expect(summarize(results.violations)).toEqual([]);
});
