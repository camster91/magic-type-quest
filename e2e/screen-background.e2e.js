import { expect, test } from '@playwright/test';

// A transform on the active screen (even scale(1)) makes its position: fixed
// background scroll away with the content, leaving a bare strip on phones.
test.use({ viewport: { width: 390, height: 844 } });

for (const [button, screen] of [['#btn-garden', '#garden-screen'], ['#btn-profile', '#profile-screen']]) {
  test(`the meadow background stays put while ${screen} scrolls on a phone`, async ({ page }) => {
    await page.goto('');
    await page.waitForFunction(() => window.gameState?.profile);
    await page.locator(button).click();
    await expect(page.locator(screen)).toHaveClass(/active/);
    await expect.poll(() => page.locator(screen).evaluate((el) => window.getComputedStyle(el).transform)).toBe('none');
    await page.locator(screen).evaluate((el) => { el.scrollTop = el.scrollHeight; });
    const box = await page.locator(`${screen} > .menu-bg`).boundingBox();
    expect(box.y).toBe(0);
    expect(box.height).toBe(844);
  });
}
