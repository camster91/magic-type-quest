import { beforeAll, describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
let document;

beforeAll(() => {
  const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8');
  document = new JSDOM(html).window.document;
});

describe('game accessibility contracts', () => {
  const dialogs = [
    'pause-overlay',
    'chapter-intro',
    'evolution-overlay',
    'level-overlay',
    'gameover-overlay',
    'finger-guide',
    'tutorial-overlay',
  ];

  it('names every game dialog and keeps it hidden from assistive technology when closed', () => {
    for (const id of dialogs) {
      const dialog = document.getElementById(id);
      expect(dialog, id).not.toBeNull();
      expect(dialog.getAttribute('role'), id).toBe('dialog');
      expect(dialog.getAttribute('aria-modal'), id).toBe('true');
      expect(dialog.getAttribute('aria-hidden'), id).toBe('true');

      const labelId = dialog.getAttribute('aria-labelledby');
      expect(labelId, id).toBeTruthy();
      expect(document.getElementById(labelId), `${id} label`).not.toBeNull();
    }
  });

  it('gives the mobile keyboard sink an accessible name without adding it to tab order', () => {
    const input = document.getElementById('mobile-input');
    expect(input.getAttribute('aria-label')).toBe('Type the current word');
    expect(input.getAttribute('tabindex')).toBe('-1');
    expect(input.hasAttribute('aria-hidden')).toBe(false);
  });

  it('provides a programmatic focus target for active gameplay', () => {
    const game = document.getElementById('game-screen');
    expect(game.getAttribute('tabindex')).toBe('-1');
    expect(game.getAttribute('aria-label')).toBe('Typing game');
  });
});
