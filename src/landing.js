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

// Captions start in the page language. The videos themselves stay unloaded
// (preload="none") until someone presses play.
function selectCaptionLanguage(locale) {
  for (const video of document.querySelectorAll('video.landing-video')) {
    for (const track of video.querySelectorAll('track')) track.default = track.srclang === locale;
  }
}

// Posters load as a video nears the screen, so they never compete with the
// fonts and the hero on first load. Without IntersectionObserver, load now.
function lazyPosters() {
  const videos = [...document.querySelectorAll('video[data-poster]')];
  const show = (video) => { video.poster = video.dataset.poster; };
  if (!('IntersectionObserver' in window)) return videos.forEach(show);
  const observer = new window.IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      show(entry.target);
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '600px 0px' });
  videos.forEach((video) => observer.observe(video));
}

lazyPosters();
const locale = getPreferredLocale();
if (locale !== 'en') {
  selectCaptionLanguage(locale);
  translatePage();
}
