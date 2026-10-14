import { expect, test } from '@playwright/test';

test('the landing videos wait for a click and carry captions', async ({ page }) => {
  const videoRequests = [];
  page.on('request', (request) => {
    if (/\/media\/.+\.(mp4|webm)$/.test(request.url())) videoRequests.push(request.url());
  });
  await page.goto('landing.html');
  await page.waitForLoadState('networkidle');

  for (const id of ['#trailer-video', '#teacher-demo-video']) {
    const video = page.locator(id);
    await expect(video).toHaveAttribute('preload', 'none');
    await expect(video).toHaveAttribute('controls', '');
    await expect(video).toHaveAttribute('playsinline', '');
    // The light WebP poster arrives as the video nears the screen.
    await video.scrollIntoViewIfNeeded();
    await expect(video).toHaveAttribute('poster', /\.webp$/);
    await expect(video).not.toHaveAttribute('autoplay');
    const tracks = video.locator('track[kind="captions"]');
    await expect(tracks).toHaveCount(3);
    expect(await tracks.evaluateAll((list) => list.map((t) => t.srclang))).toEqual(['en', 'fr', 'es']);
    // Each video has a visible description under it.
    const describedBy = await video.getAttribute('aria-describedby');
    await expect(page.locator(`#${describedBy}`)).toBeVisible();
  }
  // Nothing heavy downloads until someone presses play.
  expect(videoRequests).toEqual([]);
});

test('the price list shows the three school plans and the free-for-families promise', async ({ page }) => {
  await page.goto('landing.html');
  const plans = page.locator('#pricing .price-card');
  await expect(plans).toHaveCount(3);
  await expect(plans.locator('.price-tier')).toHaveText(['Classroom', 'School', 'District']);
  await expect(plans.locator('.num')).toHaveText(['$39', '$299', '$0.75']);
  await expect(page.locator('#pricing .pilot-note')).toContainText('Free pilot of up to 8 weeks');
  await expect(page.getByRole('link', { name: 'Request a quote' })).toHaveCount(3);
  await expect(page.locator('#families .promise')).toHaveCount(3);
});

test('the captions follow the page language', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bloomtype-profile', JSON.stringify({ locale: 'fr' })));
  await page.goto('landing.html');
  await expect(page.locator('#pricing-title')).toHaveText('Des prix simples pour les écoles');
  await expect(page.locator('#teacher-demo-video track[default]')).toHaveAttribute('srclang', 'fr');
});
