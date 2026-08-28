import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameWord } from '../src/gameWord.js';
import { gameState } from '../src/state.js';

beforeEach(() => {
  globalThis.window = { __bloomtypeT15Overlay: false };
  gameState.canvasH = 620;
});

afterEach(() => {
  delete globalThis.window;
});

describe('canvas word model', () => {
  it('moves with elapsed time and derives focus scoring from its height', () => {
    const word = new GameWord('garden', 1);
    word.y = 0;
    word.glow = 1;
    word.shake = 1;

    word.update(1);

    expect(word.y).toBe(60);
    expect(word.focus).toBe(85);
    expect(word.getScoreMultiplier()).toBeCloseTo(0.925);
    expect(word.glow).toBe(0);
    expect(word.shake).toBe(0);
  });

  it('parks words without focus decay in the one-word overlay mode', () => {
    globalThis.window.__bloomtypeT15Overlay = true;
    const word = new GameWord('bloom', 2);
    word.focus = 73;

    word.update(0.5);

    expect(word.y).toBe(-200);
    expect(word.speed).toBe(0);
    expect(word.focus).toBe(73);
  });

  it('uses the canvas boundary contract for missed words', () => {
    const word = new GameWord('petal', 1);
    word.y = 400;
    expect(word.isAtBottom()).toBe(false);
    word.y = 401;
    expect(word.isAtBottom()).toBe(true);
  });

  it('draws the target pill, typed underline, word, and target arrow', () => {
    const context = {
      beginPath: vi.fn(), roundRect: vi.fn(), fill: vi.fn(), stroke: vi.fn(),
      fillText: vi.fn(), fillRect: vi.fn(),
    };
    const word = new GameWord('rose', 1);
    Object.assign(word, { x: 50, y: 80, width: 100, isTarget: true, matched: 2, typedWidth: 24 });

    word.draw(context);

    expect(context.roundRect).toHaveBeenCalledTimes(3);
    expect(context.fillRect).toHaveBeenCalledWith(60, 92, 24, 5);
    expect(context.fillText).toHaveBeenCalledWith('rose', 60, 80);
    expect(context.fillText).toHaveBeenCalledWith('▶', 100, 50);
  });

  it('does not draw canvas content in one-word overlay mode', () => {
    globalThis.window.__bloomtypeT15Overlay = true;
    const context = { fillText: vi.fn() };
    new GameWord('quiet', 1).draw(context);
    expect(context.fillText).not.toHaveBeenCalled();
  });
});
