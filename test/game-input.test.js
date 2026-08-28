import { describe, expect, it, vi } from 'vitest';
import { createGameInputController, trapDialogFocus } from '../src/gameInput.js';

function setup({ requiresShift = false, words = [] } = {}) {
  const state = {
    screen: 'game',
    gameOver: false,
    paused: false,
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    activeWords: words,
    targetWord: null,
    targetIndex: 0,
  };
  const callbacks = {
    onCorrectKeystroke: vi.fn(),
    onWrongKeystroke: vi.fn(),
    completeWord: vi.fn(),
    skipWord: vi.fn(),
    togglePause: vi.fn(),
    showShiftHint: vi.fn(),
    updateTargetDisplay: vi.fn(),
    updateKeyboardHighlight: vi.fn(),
  };
  const controller = createGameInputController({
    state,
    getLesson: () => ({ requiresShift }),
    measureTypedWidth: (text) => text.length * 10,
    getActiveElement: () => null,
    getOpenDialog: () => null,
    ...callbacks,
  });
  return { state, callbacks, controller };
}

describe('game input controller', () => {
  it('captures a word and advances it with measured progress', () => {
    const word = { text: 'ask', isTarget: false, matched: 0 };
    const { state, callbacks, controller } = setup({ words: [word] });

    controller.processKeystroke('a');
    expect(state.targetWord).toBe(word);
    expect(word).toMatchObject({ isTarget: true, matched: 1, typedWidth: 10, glow: 1 });
    expect(state).toMatchObject({ targetIndex: 1, totalKeystrokes: 1, correctKeystrokes: 1 });

    controller.processKeystroke('s');
    expect(word).toMatchObject({ matched: 2, typedWidth: 20 });
    expect(callbacks.updateTargetDisplay).toHaveBeenCalledOnce();
    expect(callbacks.updateKeyboardHighlight).toHaveBeenCalledOnce();
  });

  it('completes a one-character lesson word on its first key', () => {
    const { callbacks, controller } = setup({ words: [{ text: 'f', isTarget: false }] });
    controller.processKeystroke('f');
    expect(callbacks.completeWord).toHaveBeenCalledOnce();
  });

  it('ignores modifier keys and requires Shift for capital lessons', () => {
    const { state, callbacks, controller } = setup({
      requiresShift: true,
      words: [{ text: 'A', isTarget: false }],
    });

    controller.processKeystroke('Shift', true);
    expect(state.totalKeystrokes).toBe(0);
    expect(callbacks.onWrongKeystroke).not.toHaveBeenCalled();

    controller.processKeystroke('a', false);
    expect(callbacks.onWrongKeystroke).toHaveBeenCalledWith('a');
    expect(callbacks.showShiftHint).toHaveBeenCalledOnce();
    expect(state.totalKeystrokes).toBe(0);
  });

  it('accepts an uppercase character from a mobile keyboard', () => {
    const { state, callbacks, controller } = setup({
      requiresShift: true,
      words: [{ text: 'A', isTarget: false }],
    });
    const input = { value: 'A' };

    controller.handleMobileInput({ target: input, data: 'A', inputType: 'insertText' });

    expect(state.correctKeystrokes).toBe(1);
    expect(callbacks.completeWord).toHaveBeenCalledOnce();
    expect(input.value).toBe('');
  });

  it('routes Escape, Space, and mobile Backspace without typing', () => {
    const { callbacks, controller } = setup();
    const escape = { key: 'Escape', repeat: false, preventDefault: vi.fn() };
    const space = { key: ' ', repeat: false, preventDefault: vi.fn() };

    controller.handleKey(escape);
    controller.handleKey(space);
    const input = { value: 'x' };
    controller.handleMobileInput({ target: input, data: null, inputType: 'deleteContentBackward' });

    expect(callbacks.togglePause).toHaveBeenCalledOnce();
    expect(callbacks.skipWord).toHaveBeenCalledTimes(2);
    expect(escape.preventDefault).toHaveBeenCalledOnce();
    expect(space.preventDefault).toHaveBeenCalledOnce();
    expect(input.value).toBe('');
  });

  it('does not capture gameplay keys from a real text field', () => {
    const { state, callbacks } = setup({ words: [{ text: 'a', isTarget: false }] });
    const controller = createGameInputController({
      state,
      getLesson: () => ({ requiresShift: false }),
      measureTypedWidth: () => 10,
      getActiveElement: () => ({ id: 'profile-name', tagName: 'INPUT' }),
      getOpenDialog: () => null,
      ...callbacks,
    });

    controller.handleKey({ key: 'a', repeat: false, preventDefault: vi.fn() });
    expect(state.totalKeystrokes).toBe(0);
  });

  it('wraps focus within the active dialog', () => {
    const first = { focus: vi.fn(), getClientRects: () => [1] };
    const last = { focus: vi.fn(), getClientRects: () => [1] };
    const dialog = {
      querySelectorAll: () => [first, last],
      contains: (element) => element === first || element === last,
    };
    const root = {
      activeElement: last,
      querySelectorAll: () => [dialog],
    };
    const event = { key: 'Tab', shiftKey: false, preventDefault: vi.fn() };

    trapDialogFocus(event, root);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(first.focus).toHaveBeenCalledOnce();
  });
});
