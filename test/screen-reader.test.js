// @vitest-environment jsdom
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { announce } from '../src/gamePresentation.js';
import { createGameInputController } from '../src/gameInput.js';

// Contracts from the automated screen-reader pass
// (docs/DEVICE-ACCESSIBILITY-QA.md, "Automated / virtual screen-reader pass").
// The browser walk is in e2e/screen-reader.e2e.js.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const page = (file) => new JSDOM(readFileSync(resolve(root, file), 'utf8')).window.document;

describe('learner app markup', () => {
  const doc = page('index.html');

  it('has one main landmark holding every screen, and a polite announcer outside it', () => {
    const mains = doc.querySelectorAll('main');
    expect(mains).toHaveLength(1);
    for (const screen of doc.querySelectorAll('.screen')) expect(mains[0].contains(screen), screen.id).toBe(true);
    const announcer = doc.getElementById('sr-announcer');
    expect(announcer.getAttribute('role')).toBe('status');
    expect(announcer.getAttribute('aria-live')).toBe('polite');
    expect(mains[0].contains(announcer)).toBe(false);
  });

  it('gives every screen exactly one h1 and no skipped heading levels outside dialogs', () => {
    for (const screen of doc.querySelectorAll('.screen')) {
      const headings = [...screen.querySelectorAll('h1, h2, h3, h4, h5, h6')]
        .filter((heading) => !heading.closest('[role="dialog"]'))
        .map((heading) => Number(heading.tagName[1]));
      expect(headings.filter((level) => level === 1), screen.id).toHaveLength(1);
      expect(headings[0], screen.id).toBe(1);
      headings.forEach((level, i) => {
        if (i > 0) expect(level - headings[i - 1], `${screen.id}: ${headings}`).toBeLessThanOrEqual(1);
      });
    }
  });

  it('starts every game dialog with an h2', () => {
    for (const dialog of doc.querySelectorAll('#game-screen [role="dialog"]')) {
      expect(dialog.querySelector('h1, h2, h3')?.tagName, dialog.id).toBe('H2');
    }
  });

  it('hides the keyboard pictures and keeps their keys out of the Tab order', () => {
    for (const id of ['virtual-keyboard-game', 'virtual-keyboard-practice']) {
      expect(doc.getElementById(id).getAttribute('aria-hidden'), id).toBe('true');
    }
    expect(doc.querySelectorAll('.key[tabindex]')).toHaveLength(0);
    // The practice keyboard is copied from the game one at start-up.
    expect(doc.querySelectorAll('#virtual-keyboard-practice .key')).toHaveLength(0);
  });

  it('keeps per-keystroke text out of live regions', () => {
    for (const id of ['target-word', 'finger-hint', 'live-hud', 'pet-bubble']) {
      expect(doc.getElementById(id).hasAttribute('aria-live'), id).toBe(false);
    }
  });

  it('hides decorative emoji in headings and Back buttons', () => {
    const emoji = /\p{Extended_Pictographic}|←/u;
    for (const element of doc.querySelectorAll('h1, h2, h3, .btn-back')) {
      for (const node of element.childNodes) {
        if (node.nodeType === 3) expect(emoji.test(node.textContent), element.outerHTML).toBe(false);
      }
    }
  });

  it('labels the menu stats with words, not only emoji', () => {
    for (const stat of doc.querySelectorAll('.menu-stat')) {
      expect(stat.querySelector('.ms-icon').getAttribute('aria-hidden')).toBe('true');
      expect(stat.querySelector('.sr-only[data-i18n]')).not.toBeNull();
    }
  });

  it('names text fields by label, not only by placeholder', () => {
    expect(doc.querySelector('label[for="class-code"]')).not.toBeNull();
    expect(doc.getElementById('player-name').getAttribute('data-i18n-aria-label')).toBe('profile.name');
  });

  it('describes the level-complete and game-over dialogs', () => {
    expect(doc.getElementById(doc.getElementById('level-overlay').getAttribute('aria-describedby'))).not.toBeNull();
    expect(doc.getElementById(doc.getElementById('gameover-overlay').getAttribute('aria-describedby'))).not.toBeNull();
  });
});

describe('grown-up pages markup', () => {
  it('gives the parents page banner, main and footer landmarks', () => {
    const doc = page('parents.html');
    expect(doc.querySelectorAll('body > header, body > main, body > footer')).toHaveLength(3);
  });

  it('keeps the teacher page in one main landmark, with print cards outside it', () => {
    const doc = page('teacher.html');
    expect(doc.querySelectorAll('main')).toHaveLength(1);
    expect(doc.querySelector('main #teacher-lock')).not.toBeNull();
    expect(doc.querySelector('main #teacher-dashboard')).not.toBeNull();
    // The print stylesheet shows only body > #print-cards.
    expect(doc.querySelector('body > #print-cards')).not.toBeNull();
    expect(doc.getElementById('classes-title').getAttribute('tabindex')).toBe('-1');
  });
});

describe('announce', () => {
  afterEach(() => vi.useRealTimers());

  it('puts one message in the polite live region, re-reading repeated words', () => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="sr-announcer" role="status" aria-live="polite"></div>';
    const region = document.getElementById('sr-announcer');
    announce('Type: cat');
    expect(region.textContent).toBe('');
    vi.advanceTimersByTime(100);
    expect(region.textContent).toBe('Type: cat');
    announce('Type: cat');
    expect(region.textContent).toBe('');
    vi.advanceTimersByTime(100);
    expect(region.textContent).toBe('Type: cat');
    // A newer message replaces one not yet said.
    announce('first');
    announce('second');
    vi.advanceTimersByTime(100);
    expect(region.textContent).toBe('second');
    // ...unless it queues: a quest toast and then "level complete" are both read.
    announce('Quest complete!');
    announce('Level 1 Complete!', { queue: true });
    vi.advanceTimersByTime(100);
    expect(region.textContent).toBe('Quest complete! Level 1 Complete!');
    // The queue is emptied once read.
    announce('Type: cat', { queue: true });
    vi.advanceTimersByTime(100);
    expect(region.textContent).toBe('Type: cat');
  });
});

describe('Escape in game dialogs', () => {
  function setup(openDialogId, gameOver = false) {
    document.body.innerHTML = `
      <button id="btn-chapter-continue"></button>
      <button id="btn-close-finger-guide"></button>
      <button id="btn-evolution-continue"></button>`;
    const clicks = [];
    document.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => clicks.push(button.id)));
    const togglePause = vi.fn();
    const controller = createGameInputController({
      state: { screen: 'game', gameOver, paused: true, activeWords: [], targetWord: null, targetIndex: 0 },
      getLesson: () => ({}),
      measureTypedWidth: () => 0,
      onCorrectKeystroke: vi.fn(), onWrongKeystroke: vi.fn(), completeWord: vi.fn(), skipWord: vi.fn(),
      togglePause, showShiftHint: vi.fn(), updateTargetDisplay: vi.fn(), updateKeyboardHighlight: vi.fn(),
      getActiveElement: () => null,
      getOpenDialog: () => (openDialogId ? { id: openDialogId } : null),
    });
    const press = () => {
      const event = { key: 'Escape', repeat: false, preventDefault: vi.fn() };
      controller.handleKey(event);
      return event;
    };
    return { clicks, togglePause, press };
  }

  it.each([
    ['chapter-intro', 'btn-chapter-continue', false],
    ['finger-guide', 'btn-close-finger-guide', false],
    ['evolution-overlay', 'btn-evolution-continue', true],
  ])('closes %s with its own button', (dialog, button, gameOver) => {
    const { clicks, togglePause, press } = setup(dialog, gameOver);
    expect(press().preventDefault).toHaveBeenCalled();
    expect(clicks).toEqual([button]);
    expect(togglePause).not.toHaveBeenCalled();
  });

  it('leaves the level-complete and game-over cards to their buttons', () => {
    for (const dialog of ['level-overlay', 'gameover-overlay']) {
      const { clicks, togglePause, press } = setup(dialog, true);
      press();
      expect(clicks).toEqual([]);
      expect(togglePause).not.toHaveBeenCalled();
    }
  });
});
