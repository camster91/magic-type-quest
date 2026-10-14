import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

// Automated screen-reader pass (docs/DEVICE-ACCESSIBILITY-QA.md). A virtual
// screen reader (@guidepup/virtual-screen-reader) walks each screen in the
// real browser, in reading order, and records what it would say. This does
// not replace the manual NVDA and VoiceOver passes; it keeps the fixes from
// that pass in place so the manual pass finds little.

// The package's browser build is one self-contained ES module; expose it on window.
const VSR_SOURCE = readFileSync(
  new URL('../node_modules/@guidepup/virtual-screen-reader/lib/esm/index.browser.js', import.meta.url),
  'utf8',
).replace(/export\s*\{\s*[\w$]+ as Virtual,\s*([\w$]+) as virtual\s*\};?/, (_, name) => `window.__vsr = ${name};`);

async function loadReader(page) {
  if (await page.evaluate(() => Boolean(window.__vsr))) return;
  await page.addScriptTag({ content: VSR_SOURCE, type: 'module' });
  await page.waitForFunction(() => window.__vsr);
}

/** Everything the virtual screen reader says from the top of the page to the end. */
async function readPage(page) {
  await loadReader(page);
  return page.evaluate(async () => {
    const reader = window.__vsr;
    await reader.start({ container: document.body });
    for (let i = 0; i < 600 && (await reader.lastSpokenPhrase()) !== 'end of document'; i++) await reader.next();
    const phrases = await reader.spokenPhraseLog();
    await reader.stop();
    return phrases;
  });
}

const headingLevels = (phrases) => phrases
  .map((phrase) => /^heading, .*, level (\d)$/.exec(phrase))
  .filter(Boolean)
  .map((match) => Number(match[1]));

/** One h1, and no heading more than one level below the one before it. */
function expectSensibleOutline(phrases) {
  const levels = headingLevels(phrases);
  expect(levels.filter((level) => level === 1), phrases.join('\n')).toHaveLength(1);
  expect(levels[0]).toBe(1);
  levels.forEach((level, i) => {
    if (i > 0) expect(level - levels[i - 1], `heading levels ${levels.join(',')}`).toBeLessThanOrEqual(1);
  });
}

/** Phrases that are only an emoji: a picture read out with no words. The
 *  content of a control that already has a name is skipped: screen readers
 *  read the name, not the content. */
const emojiOnly = (phrases) => phrases.filter((phrase, i) => /^[\p{Extended_Pictographic}\uFE0F\u200D\s]+$/u.test(phrase)
  && !/^(button|link|image), /.test(phrases[i - 1] || ''));

/** The on-screen keyboard picture is hidden: no "Q", "W", "E"… for every key. */
const keyboardKeys = (phrases) => phrases.filter((phrase) => /^([A-Z]|SPACE)$/.test(phrase));

function seed(page, profile = {}) {
  return page.addInitScript((extra) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    localStorage.setItem('bloomtype-profile', JSON.stringify({
      name: 'Ada', tutorialSeen: true, seenFingerGuide: true, completedLevels: [1],
      totalWords: 40, totalStars: 9, fieldGuide: ['monarch'], plants: { lupine: 1 }, ...extra,
    }));
  }, profile);
}

async function startLevel(page) {
  await page.locator('#btn-start').click();
  for (const id of ['#btn-close-finger-guide', '#btn-chapter-continue']) {
    if (await page.locator(id).isVisible().catch(() => false)) await page.locator(id).click();
  }
  await expect.poll(() => page.evaluate(() => window.gameState?.screen)).toBe('game');
}

async function nextWord(page) {
  await page.evaluate(() => { window.gameState.lastSpawn = -Infinity; window.gameState.nextSpawnAt = 0; });
  const next = () => page.evaluate(() => (window.gameState.levelComplete ? 'DONE' : window.gameState.targetWord?.text || ''));
  await expect.poll(next).not.toBe('');
  return next();
}

const announcer = (page) => page.locator('#sr-announcer');

/** Keep every message the live region receives, so quick ones are not missed. */
async function recordAnnouncements(page) {
  await page.evaluate(() => {
    window.__said = [];
    const region = document.getElementById('sr-announcer');
    new window.MutationObserver(() => { if (region.textContent) window.__said.push(region.textContent); })
      .observe(region, { childList: true, characterData: true, subtree: true });
  });
}
const said = (page) => page.evaluate(() => window.__said);

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('the home screen reads in order, with landmarks and named controls', async ({ page }) => {
  await seed(page);
  await page.goto('');
  await page.waitForLoadState('networkidle');
  const phrases = await readPage(page);
  const order = [
    'main',
    'heading, BloomType, level 1',
    'group, Your progress',
    'group, Keys you have learned',
    'button, Start typing to plant flowers',
    'navigation, Other screens',
    'button, Lessons',
    'button, Practice',
    'button, Garden',
    'button, Profile',
    'end of navigation, Other screens',
    'link, Parents',
    'link, Progress',
    'link, BloomType for schools',
    'end of main',
  ];
  let at = -1;
  for (const phrase of order) {
    const next = phrases.indexOf(phrase, at + 1);
    expect(next, `"${phrase}" after "${phrases[at]}"\n${phrases.join('\n')}`).toBeGreaterThan(at);
    at = next;
  }
  // The stats under the dock are words and numbers, not bare emoji.
  expect(phrases.slice(phrases.indexOf('Stars'), phrases.indexOf('Stars') + 2)).toEqual(['Stars', '9']);
  expect(emojiOnly(phrases)).toEqual([]);
  expectSensibleOutline(phrases);
});

for (const [name, button, screen] of [
  ['lessons', '#btn-lesson-select', '#lesson-select-screen'],
  ['practice', '#btn-practice', '#practice-screen'],
  ['garden', '#btn-garden', '#garden-screen'],
  ['profile', '#btn-profile', '#profile-screen'],
]) {
  test(`the ${name} screen has one h1, no skipped headings and a plain Back button`, async ({ page }) => {
    await seed(page);
    await page.goto('');
    await page.locator(button).click();
    await expect(page.locator(screen)).toHaveClass(/active/);
    const phrases = await readPage(page);
    expectSensibleOutline(phrases);
    expect(phrases).toContain('button, Back');
    expect(keyboardKeys(phrases)).toEqual([]);
    expect(emojiOnly(phrases)).toEqual([]);
  });
}

test('locked and finished lessons say so in their names', async ({ page }) => {
  await seed(page);
  await page.goto('');
  await page.locator('#btn-lesson-select').click();
  await expect(page.locator('.level-card[data-level="1"]')).toHaveAccessibleName(/Level 1 Complete!/);
  await expect(page.locator('.level-card[data-level="3"]')).toHaveAccessibleName(/Complete level 2 to unlock/);
});

test('profile controls expose their names and the chosen avatar', async ({ page }) => {
  await seed(page);
  await page.goto('');
  await page.locator('#btn-profile').click();
  await expect(page.locator('#player-name')).toHaveAccessibleName('Your Name');
  await expect(page.locator('#class-code')).toHaveAccessibleName('Class Code');
  await expect(page.locator('#voice-toggle')).toHaveAccessibleName('Voice Narration');
  await expect(page.locator('.avatar-btn[data-avatar-name="flower"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.avatar-btn[data-avatar-name="fox"]').click();
  await expect(page.locator('.avatar-btn[data-avatar-name="fox"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.avatar-btn[data-avatar-name="flower"]')).toHaveAttribute('aria-pressed', 'false');

  // Grown-up lock: focus is never left on a control that just disappeared.
  await page.locator('#grown-up-pin').fill('1357');
  await page.locator('#grown-up-pin-confirm').fill('1357');
  await page.locator('#btn-grown-up').click();
  await expect(page.locator('#btn-grown-up-lock')).toBeFocused();
  await page.locator('#btn-grown-up-lock').click();
  await expect(page.locator('#grown-up-pin')).toBeFocused();
});

test('the game reads the whole word and its controls, without decoration', async ({ page }) => {
  await seed(page);
  await page.goto('');
  await startLevel(page);
  const word = await nextWord(page);
  const phrases = await readPage(page);
  expect(phrases).toContain('heading, Typing game, level 1');
  expect(phrases).toContain('button, Pause game, Pause game (Esc)');
  expect(phrases).toContain(word);
  // No letter-by-letter word, and no keyboard picture.
  expect(phrases).not.toContain(word[0]);
  expect(keyboardKeys(phrases)).toEqual([]);
  expect(emojiOnly(phrases)).toEqual([]);
  expect(phrases).toContain('group, Live typing progress');
});

test('typing a word, a wrong key and finishing a level are announced politely', async ({ page }) => {
  await seed(page);
  await page.goto('');
  await startLevel(page);
  await expect(announcer(page)).toHaveAttribute('aria-live', 'polite');
  // The word and its hints are not live regions of their own (no per-key chatter).
  for (const id of ['#target-word', '#finger-hint', '#live-hud']) {
    await expect(page.locator(id)).not.toHaveAttribute('aria-live', /.+/);
  }

  const first = await nextWord(page);
  await expect(announcer(page)).toHaveText(`Type: ${first}`);
  // A key that is not the next letter.
  const wrong = 'qzxjv'.split('').find((key) => key !== first[0]);
  await page.keyboard.press(wrong);
  await expect(announcer(page)).toHaveText(`Try again! ${first[0]}`);

  await page.keyboard.type(first);
  const second = await nextWord(page);
  await expect(announcer(page)).toHaveText(new RegExp(`^Well done: ${first}\\. 1 of 10\\. Type: ${second}$`));

  await recordAnnouncements(page);
  for (let word = second; word !== 'DONE'; word = await nextWord(page)) await page.keyboard.type(word);
  await expect(page.locator('#level-overlay')).toBeVisible();
  await expect.poll(async () => (await said(page)).some((message) => /Level 1 Complete! [1-3] of 3 stars$/.test(message))).toBe(true);
  await expect(page.locator('#btn-next-level')).toBeFocused();
  await expect(page.locator('#level-overlay')).toHaveAccessibleName(/Meadow restored!/);
  await expect(page.locator('#level-overlay')).toHaveAccessibleDescription('Level 1 Complete!');
});

test('achievement toasts are announced', async ({ page }) => {
  await seed(page, { completedLevels: [] });
  await page.goto('');
  await startLevel(page);
  // Finishing level 1 for the first time earns "First Bloom".
  for (let word = await nextWord(page); word !== 'DONE'; word = await nextWord(page)) await page.keyboard.type(word);
  await expect(page.locator('#achievement-toast')).toBeVisible();
  // Toasts take turns; whichever is showing is the one being announced.
  await expect.poll(() => page.evaluate(() => {
    const shown = `${document.getElementById('toast-title').textContent} ${document.getElementById('toast-desc').textContent}`;
    return document.getElementById('sr-announcer').textContent.includes(shown);
  })).toBe(true);
});

test('pause returns focus to whatever opened it', async ({ page }) => {
  await seed(page);
  await page.goto('');
  await startLevel(page);

  // Opened with the button: Resume and Esc both go back to the button.
  await page.locator('#btn-pause').click();
  await expect(page.locator('#pause-overlay')).toHaveAccessibleName('Paused');
  await expect(page.locator('#btn-resume')).toBeFocused();
  await page.locator('#btn-resume').click();
  await expect(page.locator('#btn-pause')).toBeFocused();
  await page.locator('#btn-pause').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#pause-overlay')).toBeHidden();
  await expect(page.locator('#btn-pause')).toBeFocused();

  // Opened with Esc from the game: closing goes back to the game.
  await page.locator('#game-screen').focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('#btn-resume')).toBeFocused();
  // Tab stays inside the pause card.
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.locator('#btn-resume')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#game-screen')).toBeFocused();

  // Quit goes to the menu with focus on the main button.
  await page.locator('#btn-pause').click();
  await page.locator('#btn-quit').click();
  await expect(page.locator('#btn-start')).toBeFocused();
});

test('Esc closes the finger guide', async ({ page }) => {
  await seed(page, { seenFingerGuide: false, completedLevels: [] });
  await page.goto('');
  await page.waitForFunction(() => window.gameState?.profile);
  await page.locator('#btn-start').click();
  // A first-time player sees the finger guide (it takes the chapter card's place).
  await expect(page.locator('#finger-guide')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('#btn-close-finger-guide')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('[role="dialog"][aria-hidden="false"]')).toHaveCount(0);
  await expect(page.locator('#game-screen')).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.gameState.paused)).toBe(false);
});

test('Esc closes the chapter card', async ({ page }) => {
  await seed(page, { seenFingerGuide: true, completedLevels: [] });
  await page.goto('');
  await page.waitForFunction(() => window.gameState?.profile);
  await page.locator('#btn-start').click();
  await expect(page.locator('#chapter-intro')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('#btn-chapter-continue')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('[role="dialog"][aria-hidden="false"]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.gameState.paused)).toBe(false);
});

test('screens put focus on their Back button and return it to the main button', async ({ page }) => {
  await seed(page);
  await page.goto('');
  for (const [open, back] of [['#btn-lesson-select', '#btn-lesson-back'], ['#btn-garden', '#btn-garden-back'], ['#btn-profile', '#btn-profile-back']]) {
    await page.locator(open).click();
    await expect(page.locator(back)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#btn-start')).toBeFocused();
  }
});

test('typing areas are applications, so NVDA and JAWS pass letter keys to the game', async ({ page }) => {
  await seed(page);
  await page.goto('');
  // Practice: focus lands on the typing area, named by what to type.
  await page.locator('#btn-practice').click();
  const area = page.locator('#practice-area');
  await expect(area).toBeFocused();
  await expect(area).toHaveAttribute('role', 'application');
  await expect(area).toHaveAccessibleName(/^Type: \S+/);
  // Back is one Shift+Tab away.
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#btn-practice-back')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#btn-start')).toBeFocused();

  await startLevel(page);
  await expect(page.locator('#game-screen')).toBeFocused();
  await expect(page.locator('#game-screen')).toHaveAttribute('role', 'application');
  await expect(page.locator('#game-screen')).toHaveAccessibleName('Typing game');
});

test('the parents page has banner, main and footer landmarks and a sensible outline', async ({ page }) => {
  await page.goto('parents.html');
  const phrases = await readPage(page);
  for (const landmark of ['banner', 'main', 'contentinfo']) expect(phrases).toContain(landmark);
  expectSensibleOutline(phrases);
  expect(emojiOnly(phrases)).toEqual([]);
});

test('the teacher page has a main landmark, locked and unlocked, and unlocking moves focus to the dashboard', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('teacher.html');
  let phrases = await readPage(page);
  expect(phrases).toContain('main');
  expectSensibleOutline(phrases);
  await expect(page.locator('#pin-input')).toBeFocused();
  await page.locator('#pin-input').fill('2468');
  await page.locator('#pin-confirm').fill('2468');
  await page.locator('#btn-unlock').click();
  await expect(page.getByRole('heading', { name: 'My classes' })).toBeFocused();
  phrases = await readPage(page);
  expect(phrases).toContain('main');
  expectSensibleOutline(phrases);
  // Lock again: focus goes back to the PIN field.
  await page.locator('#btn-lock').click();
  await expect(page.locator('#pin-input')).toBeFocused();
});
