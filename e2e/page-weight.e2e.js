import { expect, test } from '@playwright/test';

// Keep first loads fast on school Chromebooks and phones. These budgets are
// what got the home page from Lighthouse 32 to 99; a heavy image fails here.
const PAGES = ['', 'parents.html', 'teacher.html', 'landing.html'];
const PAGE_BUDGET = 500 * 1024;
const IMAGE_BUDGET = 150 * 1024;

for (const path of PAGES) {
  test(`${path || 'home'} stays within its download budget`, async ({ page }) => {
    const sizes = [];
    page.on('response', async (response) => {
      const body = await response.body().catch(() => null);
      if (body) sizes.push({ url: response.url(), bytes: body.length, type: response.request().resourceType() });
    });
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    const total = sizes.reduce((sum, item) => sum + item.bytes, 0);
    const heavyImages = sizes.filter((item) => item.type === 'image' && item.bytes > IMAGE_BUDGET);
    expect(heavyImages.map((item) => `${item.url} ${Math.round(item.bytes / 1024)} KB`)).toEqual([]);
    expect(total).toBeLessThan(PAGE_BUDGET);
  });
}
