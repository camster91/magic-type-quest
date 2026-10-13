import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { gzipSync } from 'zlib';
import { colourLiterals } from './helpers/cssColors.js';
import { extractCriticalCss, menuFirstHtml, withoutFontFaces } from '../scripts/critical-css.mjs';

// The home page paints the menu from inline CSS, then loads the rest
// (scripts/critical-css.mjs). These guard what goes inline.
const css = readFileSync('styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const critical = extractCriticalCss(css, html);

const builtHtml = `<html><head>
  <script type="module" crossorigin src="/b/assets/main-1.js"></script>
  <link rel="modulepreload" crossorigin href="/b/assets/utils-2.js">
  <link rel="stylesheet" crossorigin href="/b/assets/main-3.css">
</head><body><div id="menu-screen" class="screen active"><button class="btn-play">Go</button></div>
<div id="game-screen" class="screen"><div class="hud"></div></div>
</body></html>`;

describe('critical CSS for the menu', () => {
  it('keeps the tokens, the fonts and the menu rules', () => {
    expect(critical).toMatch(/^@font-face/);
    expect(critical).toContain(':root');
    for (const selector of ['.screen.active', '#menu-screen', '.menu-bg', '.progress-card', '.pet-hero-img', '.menu-dock']) {
      expect(critical, selector).toContain(selector);
    }
  });

  it('covers what main.js adds to the menu before the full stylesheet loads', () => {
    expect(critical).toContain('.km-key');
    expect(critical).toContain('.menu-bottom-empty');
  });

  it('leaves out other screens and animations', () => {
    expect(critical).not.toMatch(/:hover|:active/);
    for (const selector of ['.virtual-keyboard', '.garden-grid', '.level-card', '.gameover-stats', '@keyframes']) {
      expect(critical, selector).not.toContain(selector);
    }
  });

  it('uses colour tokens only, like styles.css', () => {
    const rootEnd = critical.indexOf('}', critical.indexOf(':root'));
    expect(colourLiterals(critical.slice(rootEnd + 1))).toEqual([]);
  });

  it('stays small enough to inline', () => {
    expect(gzipSync(critical).length).toBeLessThan(6 * 1024);
    expect(gzipSync(critical).length).toBeLessThan(gzipSync(css).length / 2);
  });
});

describe('menu-first index.html', () => {
  const { html: out } = menuFirstHtml(builtHtml, '.screen{opacity:0}.btn-play{color:var(--text)}.btn-play:hover{color:var(--accent)}.hud{color:var(--text)}');

  it('inlines the menu rules and drops render-blocking CSS and JS', () => {
    expect(out).toContain('<style>.screen{opacity:0}.btn-play{color:var(--text)}</style>');
    expect(out).not.toMatch(/<link rel="stylesheet"[^>]*>(?!<\/noscript>)/);
    expect(out).not.toContain('<script type="module"');
    expect(out).not.toContain('rel="modulepreload"');
    expect(out).not.toContain('<!--');
  });

  it('holds taps made before the app code starts', () => {
    expect(out).toMatch(/<script>\(function holdEarlyTaps[\s\S]*?__bloomtypeReady[\s\S]*?<\/script>\n<\/head>/);
    expect(readFileSync('src/main.js', 'utf8')).toContain('window.__bloomtypeReady?.()');
  });

  it('declares the fonts once, inline, so they are not fetched twice', () => {
    const full = '@font-face{font-family:A;src:url(a.woff2)}@font-face{font-family:B;src:url(b.woff2)}.x{color:var(--text)}';
    expect(withoutFontFaces(full, '@font-face{font-family:A;src:url(a.woff2)}')).toBe('@font-face{font-family:B;src:url(b.woff2)}.x{color:var(--text)}');
    expect(critical).toContain('Nunito');
    expect(critical).not.toContain('OpenDyslexic');
  });

  it('keeps a no-script stylesheet and loads everything after the first paint', () => {
    expect(out).toContain('<noscript><link rel="stylesheet" crossorigin href="/b/assets/main-3.css"></noscript>');
    const loader = out.match(/<script>([\s\S]*?)<\/script>\n<\/body>/)?.[1];
    expect(loader).toContain('largest-contentful-paint');
    expect(loader).toContain('"/b/assets/main-3.css", "/b/assets/main-1.js", ["/b/assets/utils-2.js"]');
  });
});
