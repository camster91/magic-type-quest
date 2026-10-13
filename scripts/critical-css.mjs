// Menu first, then the rest (docs/TODO-100.md, Speed).
//
// The home page used to download the full stylesheet (~12 KB gzipped) and
// the app code (~63 KB gzipped) before the menu could paint, all competing
// with the fonts and the pet for a phone's bandwidth. At build time this
// plugin rewrites index.html so the menu paints from the HTML alone:
//
//   <style>…only the menu's rules…</style>
//   <noscript><link rel="stylesheet" href="main.css"></noscript>
//   …menu…
//   <script>…after the menu's largest paint: add main.css and main.js…</script>
//
// styles.css stays the one source of truth: the inline rules are picked from
// it, so they follow the same colour-token rule (test/css-tokens.test.js).
// The CSP allows this: style-src and script-src both include 'unsafe-inline'.
// Dev mode (vite serve) is untouched.
import postcss from 'postcss';
import { JSDOM } from 'jsdom';

// The first screen. Everything a child sees before the first tap is in here.
const FIRST_SCREEN = '#menu-screen';

// Pseudo-classes and pseudo-elements that depend on state or generated
// content. They are stripped before matching, so `.btn:focus-visible` counts
// as critical when `.btn` is on the menu (over-including is safe)...
const PSEUDO = /::?[a-z-]+(\((?:[^()]|\([^()]*\))*\))?/gi;
// ...except pointer states: nothing is hovered or pressed at first paint,
// and the full stylesheet arrives moments later. Leaving them out keeps the
// page inside its download budget (e2e/page-weight.e2e.js).
const POINTER_STATE = /:(hover|active)\b/i;

// What src/main.js adds to the menu on start-up, before the full stylesheet
// may have arrived. Without these the mini keyboard and the empty-stats row
// would flash unstyled. Keep in step with updateHomeProgressCard(),
// updateMenuStats() and updateHomePet() in src/main.js.
const SCRIPT_STATE = [
  { selector: '#menu-keyboard-mini', append: '<span class="km-key mastered learning"></span>' },
  { selector: '.menu-bottom', addClass: 'menu-bottom-empty' },
  { selector: '#streak-prominent', addClass: 'streak-gold' },
  { selector: '#btn-daily-moment', addClass: 'plant-waiting' },
  { selector: '#pet-hero', addClass: 'celebrate' },
  { selector: '#pet-hero-bubble', addClass: 'visible' },
];

function firstScreenElements(document) {
  const screen = document.querySelector(FIRST_SCREEN);
  if (!screen) throw new Error(`critical-css: ${FIRST_SCREEN} not found`);
  for (const { selector, append, addClass } of SCRIPT_STATE) {
    const el = screen.querySelector(selector);
    if (!el) continue;
    if (append) el.insertAdjacentHTML('beforeend', append);
    if (addClass) el.classList.add(addClass);
  }
  // Everything on the menu counts, hidden parts too: script reveals some of
  // them (the plant-of-the-day card, the class banner) straight away. Only
  // parts switched off with an inline display:none, which script never
  // shows on the menu (the quests panel, the dock's filler links), are out.
  const off = (el) => el.closest('[style*="display:none"], [style*="display: none"]');
  return [document.documentElement, document.body, screen, ...[...screen.querySelectorAll('*')].filter((el) => !off(el))];
}

function selectorMatches(selector, elements) {
  if (POINTER_STATE.test(selector)) return false;
  const plain = selector.replace(PSEUDO, '').trim();
  // `::after` on its own, or a selector that was only pseudo parts.
  const base = plain === '' || /[>+~]$/.test(plain) ? `${plain}*` : plain;
  try {
    return elements.some((el) => el.matches(base));
  } catch {
    return true; // Unknown syntax: keep it rather than risk a flash.
  }
}

/**
 * Returns the subset of `css` that styles the first screen of `html`.
 * Keeps :root tokens, @font-face, and every rule (inside @media/@supports
 * too) with a selector that matches an element on the menu. Drops
 * @keyframes: animations start once the full stylesheet arrives.
 */
export function extractCriticalCss(css, html) {
  const { document } = new JSDOM(html).window;
  const elements = firstScreenElements(document);
  const root = postcss.parse(css);

  root.walkAtRules((rule) => {
    if (/keyframes$/i.test(rule.name)) rule.remove();
  });
  root.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
    if (!rule.selectors.some((sel) => selectorMatches(sel, elements))) rule.remove();
  });
  // Drop @media/@supports blocks left empty.
  let removed = true;
  while (removed) {
    removed = false;
    root.walkAtRules((rule) => {
      if (rule.nodes && rule.nodes.length === 0) { rule.remove(); removed = true; }
    });
  }
  // Keep only the fonts the menu's rules name. The easy-read fonts come
  // with the full stylesheet, together with the rules that use them.
  const families = new Set();
  root.walkDecls(/^font(-family)?$/, (decl) => {
    if (decl.parent.type === 'atrule') return; // the @font-face itself
    for (const name of decl.value.split(',')) families.add(fontName(name));
  });
  root.walkAtRules('font-face', (rule) => {
    let family = '';
    rule.walkDecls('font-family', (decl) => { family = fontName(decl.value); });
    if (!families.has(family)) rule.remove();
  });
  root.walkComments((comment) => comment.remove());
  return root.toString().trim();
}

function fontName(value) {
  return value.trim().replace(/^.*\s(?=['"])/, '').replace(/['"]/g, '').toLowerCase();
}

/**
 * The stylesheet minus the @font-face rules already in `critical`. Declaring
 * a font twice makes the browser fetch it again when the stylesheet arrives.
 */
export function withoutFontFaces(css, critical) {
  const inline = new Set();
  postcss.parse(critical).walkAtRules('font-face', (rule) => { inline.add(rule.toString()); });
  const root = postcss.parse(css);
  root.walkAtRules('font-face', (rule) => { if (inline.has(rule.toString())) rule.remove(); });
  return root.toString();
}

/** Drops comments and indentation from built HTML (it has no <pre>). */
export function compactHtml(html) {
  if (/<(pre|textarea)\b/i.test(html)) return html;
  return html.replace(/<!--[\s\S]*?-->/g, '').replace(/\n[ \t]+/g, '\n').replace(/\n{2,}/g, '\n');
}

/**
 * Runs in the page (serialised into an inline script). Adds the full
 * stylesheet and the app code once the menu has had its largest paint, so
 * they never compete with the menu's own fonts and pet for bandwidth.
 * Browsers without Largest Contentful Paint load straight away; a hidden tab
 * (which never paints) loads after a second.
 */
export function loadAfterMenuPaint(stylesheet, entry, preloads) {
  let started = false;
  const load = () => {
    if (started) return;
    started = true;
    const add = (tag, props) => document.head.appendChild(Object.assign(document.createElement(tag), { crossOrigin: '' }, props));
    add('link', { rel: 'stylesheet', href: stylesheet });
    for (const href of preloads) add('link', { rel: 'modulepreload', href });
    add('script', { type: 'module', src: entry });
  };
  if (window.PerformanceObserver?.supportedEntryTypes?.includes('largest-contentful-paint')) {
    new window.PerformanceObserver(load).observe({ type: 'largest-contentful-paint', buffered: true });
    setTimeout(load, 1000);
  } else {
    load();
  }
}

/**
 * Runs in the page, in <head>. A tap on a menu button before the app code
 * has started would do nothing, so it is held and replayed once main.js
 * calls window.__bloomtypeReady(). Links work without script and pass through.
 */
export function holdEarlyTaps() {
  let held = null;
  const hold = (event) => {
    const button = event.target.closest?.('button');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    held = button;
  };
  document.addEventListener('click', hold, true);
  window.__bloomtypeReady = () => {
    document.removeEventListener('click', hold, true);
    held?.click();
  };
}

const STYLESHEET =/[ \t]*<link rel="stylesheet" crossorigin href="([^"]+\.css)">\n?/;
const ENTRY = /[ \t]*<script type="module" crossorigin src="([^"]+\.js)"><\/script>\n?/;
const MODULE_PRELOAD = /[ \t]*<link rel="modulepreload" crossorigin href="([^"]+\.js)">\n?/g;

/**
 * Rewrites the built index.html (see the top of this file). Returns the new
 * HTML and the inline CSS.
 */
export function menuFirstHtml(html, css) {
  const sheet = html.match(STYLESHEET);
  const entry = html.match(ENTRY);
  if (!sheet || !entry) throw new Error('critical-css: stylesheet or entry script not found in index.html');
  const preloads = [...html.matchAll(MODULE_PRELOAD)];
  const args = [sheet[1], entry[1], preloads.map((match) => match[1])].map((arg) => JSON.stringify(arg)).join(', ');
  const critical = extractCriticalCss(css, html);
  const head = [
    `<style>${critical}</style>`,
    `<noscript><link rel="stylesheet" crossorigin href="${sheet[1]}"></noscript>`,
    `<script>(${holdEarlyTaps.toString()})();</script>`,
  ].join('\n  ');
  let out = html.replace(entry[0], '').replace(sheet[0], `  ${head}\n`);
  for (const match of preloads) out = out.replace(match[0], '');
  const loader = `<script>(${loadAfterMenuPaint.toString()})(${args});</script>\n`;
  return { html: compactHtml(out.replace('</body>', `${loader}</body>`)), critical };
}

/** Vite plugin: applies menuFirstHtml to the built index.html only. */
export function criticalCss() {
  return {
    name: 'bloomtype-critical-css',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle || !/(^|[\\/])index\.html$/.test(ctx.filename)) return html;
        const href = html.match(STYLESHEET)?.[1];
        const asset = href && Object.values(ctx.bundle).find((file) => file.type === 'asset' && href.endsWith(`/${file.fileName}`));
        if (!asset) throw new Error(`critical-css: stylesheet ${href} not found in the bundle`);
        const { html: out, critical } = menuFirstHtml(html, String(asset.source));
        // Only index.html uses this stylesheet, and its inline <style> already
        // declares the menu's fonts.
        asset.source = withoutFontFaces(String(asset.source), critical);
        return out;
      },
    },
  };
}
