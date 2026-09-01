import { expect, test } from '@playwright/test';

const locales = [
  { code: 'fr', profileTitle: 'Mon profil' },
  { code: 'es', profileTitle: 'Mi perfil' },
];

async function useLocale(page, locale) {
  await page.addInitScript((code) => {
    localStorage.clear();
    localStorage.setItem('bloomtype-profile', JSON.stringify({ id: 'layout-qa', locale: code }));
  }, locale);
}

async function enlargeText(page) {
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
}

async function expectNoHorizontalClipping(page, label) {
  const result = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const selector = 'html, body, body *';
    const elements = [...document.querySelectorAll(selector)];
    const clipped = elements.flatMap((element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (element.closest('.sr-only') || style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || rect.height === 0) return [];
      let ancestor = element.parentElement;
      let insideHorizontalScroller = false;
      while (ancestor) {
        const ancestorStyle = window.getComputedStyle(ancestor);
        if (['auto', 'scroll'].includes(ancestorStyle.overflowX) && ancestor.scrollWidth > ancestor.clientWidth) {
          insideHorizontalScroller = true;
          break;
        }
        ancestor = ancestor.parentElement;
      }
      if (insideHorizontalScroller) return [];
      if (rect.left >= 0 && rect.right <= viewportWidth) return [];
      return [{
        tag: element.tagName.toLowerCase(),
        id: element.id,
        className: element.className,
        text: element.textContent?.trim().slice(0, 80),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        viewportWidth,
      }];
    });
    const rawDocumentOverflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - viewportWidth;
    const internalOverflow = elements.flatMap((element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (element.closest('.sr-only') || style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || rect.height === 0) return [];
      const overflow = element.scrollWidth - element.clientWidth;
      if (overflow <= 2 || ['auto', 'scroll'].includes(style.overflowX)) return [];
      return [{ tag: element.tagName.toLowerCase(), id: element.id, className: element.className, overflow }];
    });
    return {
      // Allow only the browser's two-pixel enlarged-glyph rounding overhang.
      // The original localized heading defect exceeded 100px.
      documentOverflow: rawDocumentOverflow <= 2 ? 0 : rawDocumentOverflow,
      clipped,
      internalOverflow,
    };
  });

  expect(result, label).toEqual({ documentOverflow: 0, clipped: [], internalOverflow: [] });
}

for (const locale of locales) {
  test(`${locale.code} remains usable at 320px with enlarged text`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await useLocale(page, locale.code);

    await page.goto('');
    await page.locator('#btn-profile').click();
    await expect(page.locator('#profile-screen h2')).toContainText(locale.profileTitle);
    await expect(page.locator('#menu-screen')).toBeHidden();
    await enlargeText(page);
    await expectNoHorizontalClipping(page, `${locale.code} learner profile`);

    await page.goto('parents.html');
    await expect(page.locator('html')).toHaveAttribute('lang', locale.code);
    await enlargeText(page);
    await expectNoHorizontalClipping(page, `${locale.code} parent guidance`);

    await page.goto('teacher.html');
    await expect(page.locator('html')).toHaveAttribute('lang', locale.code);
    await enlargeText(page);
    await expectNoHorizontalClipping(page, `${locale.code} teacher dashboard`);
  });
}
