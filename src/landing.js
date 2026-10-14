/**
 * BloomType — For Schools page (landing.html)
 * Shows the page in the learner's saved language, or the browser's.
 * The static markup is English, so English visitors download no
 * dictionaries and the page is never rewritten for them (that would restart
 * Largest Contentful Paint). Never import the game from here.
 */
import { getPreferredLocale } from './locales.js';

async function translatePage() {
  const { initializePageTranslations, pageT } = await import('./pageTranslations.js');
  initializePageTranslations();

  // Text that lives in attributes the shared helper does not cover.
  document.querySelector('meta[name="description"]')?.setAttribute('content', pageT('landing.metaDescription'));
  const featured = document.querySelector('.price-card.featured');
  if (featured) featured.dataset.badge = pageT('landing.mostPopular');
  // The inline demo canvas reads its chip labels from these on every frame.
  const demo = document.getElementById('demo-canvas');
  if (demo) {
    demo.dataset.streakLabel = pageT('landing.demoStreak');
    demo.dataset.rankLabel = pageT('landing.demoRank');
  }
}

if (getPreferredLocale() !== 'en') translatePage();
