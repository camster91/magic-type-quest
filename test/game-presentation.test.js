// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from '../src/i18n.js';
import { highlightTargetKey, showKeyFeedback } from '../src/gamePresentation.js';

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = `
    <div id="virtual-keyboard-practice"><span class="key" data-key="a"></span></div>
    <div id="virtual-keyboard-game"><span class="key" data-key="a"></span></div>
    <div id="finger-hint"></div>
  `;
  globalThis.Element.prototype.scrollIntoView = vi.fn();
  setLocale('fr');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('game keyboard presentation', () => {
  it('highlights both keyboards and shows a localized finger hint', () => {
    highlightTargetKey('a');

    const keys = [...document.querySelectorAll('.key[data-key="a"]')];
    expect(keys).toHaveLength(2);
    expect(keys.every((key) => key.classList.contains('target'))).toBe(true);
    expect(document.getElementById('finger-hint').textContent).toBe('auriculaire gauche');
    expect(globalThis.Element.prototype.scrollIntoView).toHaveBeenCalledOnce();

    highlightTargetKey(null);
    expect(keys.every((key) => !key.classList.contains('target'))).toBe(true);
  });

  it('applies and clears key feedback on every rendered keyboard', () => {
    const keys = [...document.querySelectorAll('.key[data-key="a"]')];
    showKeyFeedback('A', false);
    expect(keys.every((key) => key.classList.contains('wrong'))).toBe(true);

    vi.advanceTimersByTime(300);
    expect(keys.every((key) => !key.classList.contains('wrong'))).toBe(true);
  });
});
