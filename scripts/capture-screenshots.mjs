// Captures the screenshots used for directory and marketplace listings
// (see docs/growth/screenshots/README.md).
//
//   npm run build
//   npm run screenshots [-- outDir] [-- --png-all]
//
// The script serves dist/ with `vite preview` on a free port, plays through
// the app with a made-up demo profile ("Demo") and made-up demo students in a
// demo class ("Room 12"), and writes the images. It never uses real data.
// Animations, sound and the fox voice are off so the shots are stable.
// Set CHROMIUM_PATH to use a specific Chromium build.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { join } from 'node:path';

const args = process.argv.slice(2);
const pngAll = args.includes('--png-all');
const outDir = args.find((a) => !a.startsWith('--')) || 'docs/growth/screenshots';
const executablePath = process.env.CHROMIUM_PATH || undefined;

if (!existsSync('dist/index.html')) {
  console.error('dist/ is missing. Run `npm run build` first.');
  process.exit(1);
}

// ---------- sizes ----------
// desktop: 1280x800, the Chrome Web Store / Google Workspace Marketplace size.
// phone: 360x640 CSS px at 3x = 1080x1920, the common portrait phone size.
// small: 640x400, the small Chrome Web Store size.
const SIZES = {
  desktop: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  phone: { viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  small: { viewport: { width: 640, height: 400 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
};

// Shots a store requires as PNG are saved as PNG; the rest as WebP.
// The Chrome Web Store takes up to five 1280x800 or 640x400 PNG/JPEG shots.
const PNG_SHOTS = new Set([
  'en-desktop-home', 'en-desktop-gameplay', 'en-desktop-teacher-dashboard', 'en-small-home',
]);

// ---------- demo data (all made up) ----------
const today = new Date();
const day = (offset) => {
  const d = new Date(today);
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const QUIET = { soundEnabled: false, voiceEnabled: false, foxVoiceEnabled: false };
const WORDS = ['sad', 'lad', 'fall', 'ask', 'flask', 'salad', 'dad', 'all', 'lass', 'add', 'jak', 'falls'];
const FLOWERS = ['flower', 'sunflower', 'daisy', 'tulip', 'rose'];

function demoProfile(locale = 'en', overrides = {}) {
  return {
    ...QUIET,
    uuid: 'demo-profile', name: 'Demo', avatar: '🦊', locale,
    tutorialSeen: true, seenFingerGuide: true,
    completedLevels: [1, 2, 3], totalWords: 186, totalStars: 9, highScore: 1450,
    petEvolution: 2, seenEvolutions: [2],
    fieldGuide: ['monarch', 'bumblebee', 'bluebird'],
    plants: { sunflower: 2, lupine: 1, coneflower: 1, clover: 1 },
    plantedDays: [day(0), day(1), day(2), day(3), day(5)], lastPlantDate: day(0),
    lastDailyMomentDate: day(0), streak: 4, lastStreakDate: day(0),
    garden: WORDS.map((word, i) => ({
      type: FLOWERS[i % FLOWERS.length], x: 100, y: 400, scale: 0.8, bloomProgress: 1,
      plantedAt: new Date(today.getTime() - i * 3_600_000).toISOString(), level: 1 + (i % 3), word,
    })),
    gardenTotal: 186,
    levelStats: { 1: { wpm: 12, accuracy: 95 }, 2: { wpm: 13, accuracy: 93 }, 3: { wpm: 14, accuracy: 94 } },
    practiceLog: { [day(0)]: 9, [day(1)]: 7, [day(2)]: 6, [day(3)]: 8, [day(5)]: 5 },
    minutesPractised: 35,
    keySR: Object.fromEntries([...'asdfjkl'].map((k) => [k, { correct: 14, wrong: 0 }])
      .concat([['g', { correct: 2, wrong: 3 }], ['h', { correct: 2, wrong: 2 }]])),
    lastPlayed: today.toISOString(),
    ...overrides,
  };
}

const demoStudent = (uuid, name, avatar, wpm, accuracy, levels, minutes, weak) => ({
  ...QUIET,
  uuid, name, avatar, tutorialSeen: true, totalWords: levels.length * 60, totalStars: levels.length * 3,
  completedLevels: levels,
  levelStats: Object.fromEntries(levels.map((level) => [level, { wpm, accuracy }])),
  practiceLog: { [day(0)]: Math.ceil(minutes / 2), [day(1)]: Math.floor(minutes / 2) },
  minutesPractised: minutes,
  keySR: Object.fromEntries([...'asdfjkl'].map((k) => [k, { correct: 12, wrong: 0 }]).concat(weak.map((k) => [k, { correct: 1, wrong: 4 }]))),
  lastPlayed: today.toISOString(),
});
const STUDENTS = [
  demoStudent('demo-ava', 'Ava', '🦊', 14, 94, [1, 2, 3], 24, ['q', 'p']),
  demoStudent('demo-ben', 'Ben', '🐰', 9, 88, [1], 16, ['z', 'x']),
  demoStudent('demo-cleo', 'Cleo', '🦉', 12, 91, [1, 2], 20, ['g']),
  demoStudent('demo-dev', 'Dev', '🐼', 16, 96, [1, 2, 3, 4], 31, ['b', 'n']),
  demoStudent('demo-mia', 'Mia', '🐱', 11, 90, [1, 2], 18, ['y']),
];

// ---------- server ----------
function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

// The running preview server, so the signal handlers can stop it.
let previewChild = null;

async function startPreview() {
  const port = await freePort();
  const child = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32',
  });
  previewChild = child;
  child.stderr.on('data', (d) => process.stderr.write(d));
  const url = `http://127.0.0.1:${port}/magic-type-quest/`;
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return { url, child };
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  await stopPreview(child);
  throw new Error(`vite preview did not start on port ${port}`);
}

// Stops the whole preview process group (npx and vite) and waits for it to exit.
function stopPreview(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  const exited = new Promise((resolve) => child.once('exit', resolve));
  const signal = (sig) => {
    try {
      if (process.platform === 'win32') child.kill(sig);
      else process.kill(-child.pid, sig);
    } catch { /* already gone */ }
  };
  signal('SIGTERM');
  const force = setTimeout(() => signal('SIGKILL'), 3000);
  return exited.finally(() => clearTimeout(force));
}

// ---------- capture helpers ----------
const STABLE_CSS = `
  *, *::before, *::after { caret-color: transparent !important; }
  .toast, #toast-container, #achievement-toast { display: none !important; }
`;

const written = [];

async function save(page, name, encoder) {
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(250);
  const png = await page.screenshot({ animations: 'disabled', caret: 'hide', scale: 'device' });
  const asPng = pngAll || PNG_SHOTS.has(name);
  const file = join(outDir, `${name}.${asPng ? 'png' : 'webp'}`);
  if (asPng) {
    await writeFile(file, png);
  } else {
    // Chromium encodes WebP itself, so no image tooling is needed.
    const dataUrl = await encoder.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      return canvas.toDataURL('image/webp', 0.82);
    }, `data:image/png;base64,${png.toString('base64')}`);
    await writeFile(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
  }
  written.push(file);
  console.log('wrote', file);
}

async function newPage(browser, baseURL, size, profile) {
  const context = await browser.newContext({ ...SIZES[size], baseURL, reducedMotion: 'reduce', serviceWorkers: 'block' });
  await context.addInitScript(({ profileJson, css }) => {
    window.print = () => {};
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      localStorage.clear();
      if (profileJson) localStorage.setItem('bloomtype-profile', profileJson);
    }
    const addStyle = () => {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    };
    if (document.head) addStyle(); else document.addEventListener('DOMContentLoaded', addStyle);
  }, { profileJson: profile ? JSON.stringify(profile) : null, css: STABLE_CSS });
  return context.newPage();
}

async function openApp(page) {
  await page.goto('');
  // The app code loads after the menu paints.
  await page.waitForFunction(() => window.gameState?.profile, null, { timeout: 15_000 });
  await page.waitForLoadState('networkidle').catch(() => {});
}

async function startLevel(page) {
  await page.locator('#btn-start').click();
  for (const id of ['#btn-close-finger-guide', '#btn-chapter-continue']) {
    if (await page.locator(id).isVisible().catch(() => false)) await page.locator(id).click();
  }
  await page.waitForFunction(() => window.gameState?.screen === 'game');
  await page.locator('#game-screen').focus();
}

async function nextWord(page) {
  await page.evaluate(() => { window.gameState.lastSpawn = -Infinity; window.gameState.nextSpawnAt = 0; });
  await page.waitForFunction(() => window.gameState.levelComplete || window.gameState.targetWord?.text);
  return page.evaluate(() => (window.gameState.levelComplete ? null : window.gameState.targetWord.text));
}

// ---------- screens ----------
async function shootHome(browser, base, encoder, locale, size) {
  const page = await newPage(browser, base, size, demoProfile(locale));
  await openApp(page);
  await save(page, `${locale}-${size}-home`, encoder);
  await page.context().close();
}

async function shootGameplay(browser, base, encoder, locale, size) {
  const page = await newPage(browser, base, size, demoProfile(locale));
  await openApp(page);
  await startLevel(page);
  // Type two words, then stop halfway through the third.
  // Type at a child-like pace so the speed readout looks believable.
  const delay = 420;
  for (let i = 0; i < 2; i++) await page.keyboard.type(await nextWord(page), { delay });
  const word = await nextWord(page);
  await page.waitForTimeout(900); // let the new word drift into view
  await page.keyboard.type(word.slice(0, Math.ceil(word.length / 2)), { delay });
  await page.evaluate(() => { window.gameState.paused = true; });
  await save(page, `${locale}-${size}-gameplay`, encoder);
  await page.context().close();
}

async function shootLevelComplete(browser, base, encoder, size) {
  // A newer player finishing level 1, which restores the meadow.
  const page = await newPage(browser, base, size, demoProfile('en', {
    completedLevels: [], fieldGuide: [], petEvolution: 1, seenEvolutions: [], totalStars: 0, levelStats: {},
  }));
  await openApp(page);
  await startLevel(page);
  for (let i = 0; i < 40; i++) {
    const word = await nextWord(page);
    if (!word) break;
    await page.keyboard.type(word);
  }
  await page.locator('#level-overlay').waitFor({ state: 'visible' });
  await page.waitForTimeout(600);
  await save(page, `en-${size}-level-complete`, encoder);
  await page.context().close();
}

async function shootMenuScreen(browser, base, encoder, size, button, screen, name, scrollTo) {
  const page = await newPage(browser, base, size, demoProfile('en'));
  await openApp(page);
  await page.locator(button).click();
  await page.locator(`${screen}.active`).waitFor();
  if (scrollTo) {
    await page.locator(scrollTo).evaluate((el) => el.scrollIntoView({ block: 'start' }));
  }
  await page.waitForLoadState('networkidle').catch(() => {});
  await save(page, `en-${size}-${name}`, encoder);
  await page.context().close();
}

async function shootParents(browser, base, encoder, size) {
  const page = await newPage(browser, base, size, demoProfile('en'));
  await page.goto('parents.html');
  await page.locator('#family-progress').waitFor({ state: 'visible' });
  await page.locator('#family-progress').evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await page.waitForLoadState('networkidle').catch(() => {});
  await save(page, `en-${size}-parents`, encoder);
  await page.context().close();
}

async function shootHomeschoolRecord(browser, base, encoder, size) {
  const page = await newPage(browser, base, size, demoProfile('en'));
  await page.goto('parents.html');
  await page.locator('#family-progress').waitFor({ state: 'visible' });
  // window.print is stubbed; the print layout is shown instead.
  await page.locator('#family-progress button', { hasText: /homeschool/i }).first().click();
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await save(page, `en-${size}-homeschool-record`, encoder);
  await page.context().close();
}

async function shootAccessibility(browser, base, encoder, size) {
  const page = await newPage(browser, base, size, demoProfile('en', { font: 'readable', highContrast: true, relaxed: true }));
  await openApp(page);
  await page.locator('#btn-profile').click();
  await page.locator('#profile-screen.active').waitFor();
  await page.locator('label[for="language-select"]').evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await save(page, `en-${size}-accessibility`, encoder);
  await page.context().close();
}

async function shootLanding(browser, base, encoder, size) {
  const page = await newPage(browser, base, size, null);
  await page.goto('landing.html');
  await page.waitForLoadState('networkidle').catch(() => {});
  await save(page, `en-${size}-landing-hero`, encoder);
  await page.context().close();
}

async function shootTeacher(browser, base, encoder, sizes) {
  const page = await newPage(browser, base, 'desktop', null);
  await page.goto('teacher.html');
  await page.locator('#pin-input').fill('2468');
  await page.locator('#pin-confirm').fill('2468');
  await page.locator('#btn-unlock').click();
  await page.locator('#teacher-dashboard').waitFor();
  await page.locator('#new-class-name').fill('Room 12');
  await page.locator('#new-class-form button[type="submit"]').click();
  const code = (await page.locator('#settings-class-code').textContent()).trim();
  // Demo students join the class on this device.
  for (const student of STUDENTS) {
    await page.evaluate((profile) => localStorage.setItem('bloomtype-profile', JSON.stringify(profile)), student);
    await page.goto('');
    await page.waitForFunction(() => window.gameState?.profile);
    await page.locator('#btn-profile').click();
    await page.locator('#player-name').fill(student.name);
    await page.locator('#class-code').fill(code);
    await page.locator('#btn-save-profile').click();
    await page.waitForTimeout(200);
  }
  for (const size of sizes) {
    await page.setViewportSize(SIZES[size].viewport);
    await page.goto('teacher.html');
    await page.locator('#teacher-dashboard').waitFor();
    await page.locator(`.class-chip[data-code="${code}"]`).click();
    await page.locator('#student-body tr', { hasText: 'Ava' }).waitFor();
    await page.locator('#classes-title').evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await page.evaluate(() => window.scrollBy(0, -16));
    await save(page, `en-${size}-teacher-class-setup`, encoder);
    await page.locator('.toolbar').evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await page.evaluate(() => window.scrollBy(0, -16));
    await save(page, `en-${size}-teacher-dashboard`, encoder);
  }
  await page.context().close();
}

// ---------- run ----------
await mkdir(outDir, { recursive: true });
let browser;
let stopping = false;
// Ctrl-C or SIGTERM skips `finally`, so stop the detached preview server here.
for (const [sig, code] of [['SIGINT', 130], ['SIGTERM', 143]]) {
  process.once(sig, async () => {
    stopping = true;
    console.error(`\n${sig}: stopping the preview server`);
    await browser?.close().catch(() => {});
    await stopPreview(previewChild);
    process.exit(code);
  });
}
const { url, child } = await startPreview();
try {
  // Our own signal handlers close the browser and stop the preview server.
  browser = await chromium.launch({
    executablePath, args: ['--mute-audio'], handleSIGINT: false, handleSIGTERM: false, handleSIGHUP: false,
  });
  const encoder = await browser.newPage();

  for (const size of ['desktop', 'phone', 'small']) await shootHome(browser, url, encoder, 'en', size);
  for (const size of ['desktop', 'phone']) {
    await shootGameplay(browser, url, encoder, 'en', size);
    await shootLevelComplete(browser, url, encoder, size);
    await shootMenuScreen(browser, url, encoder, size, '#btn-lesson-select', '#lesson-select-screen', 'world-map');
    if (size === 'desktop') {
      // On a laptop the plants, Field Guide and garden fit on one screen.
      await shootMenuScreen(browser, url, encoder, size, '#btn-garden', '#garden-screen', 'garden-field-guide');
    } else {
      await shootMenuScreen(browser, url, encoder, size, '#btn-garden', '#garden-screen', 'field-guide', '.field-guide');
      await shootMenuScreen(browser, url, encoder, size, '#btn-garden', '#garden-screen', 'garden', '#garden-stats');
    }
    await shootParents(browser, url, encoder, size);
    await shootAccessibility(browser, url, encoder, size);
    await shootLanding(browser, url, encoder, size);
  }
  await shootHomeschoolRecord(browser, url, encoder, 'desktop');
  await shootTeacher(browser, url, encoder, ['desktop']);
  for (const locale of ['fr', 'es']) {
    for (const size of ['desktop', 'phone']) {
      await shootHome(browser, url, encoder, locale, size);
      await shootGameplay(browser, url, encoder, locale, size);
    }
  }
  console.log(`\n${written.length} screenshots in ${outDir}`);
} catch (err) {
  // A signal closed the browser under us; the handler stops the server and exits.
  if (stopping) await new Promise(() => {});
  throw err;
} finally {
  await browser?.close();
  await stopPreview(child);
}
