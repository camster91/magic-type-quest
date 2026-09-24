// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { getFingerGuidance, TypingInputService } from '../src/v2/input/TypingInputService.ts';

let active;
afterEach(() => { active?.dispose(); document.body.replaceChildren(); active = null; });

function setup(sequence = 'fj', lessonId = 'meadow-fj') {
  active?.dispose();
  const surface = document.createElement('div'); surface.tabIndex = 0;
  const input = document.createElement('input'); input.setAttribute('aria-label', 'Touch typing practice');
  const button = document.createElement('button'); button.textContent = 'Settings';
  document.body.append(surface, input, button);
  const events = []; const announcements = [];
  active = new TypingInputService(surface, input, (event) => events.push(event), (message) => announcements.push(message));
  active.start({ sequence, lessonId, missionId: 'meadow-a' });
  return { surface, input, button, events, announcements, service: active };
}

function press(surface, key, options = {}) {
  const event = new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options });
  surface.dispatchEvent(event);
  return event;
}

describe('TypingInputService (#161)', () => {
  it('normalises a physical sequence and emits typed evidence without storing text', () => {
    const { surface, events, service } = setup();
    expect(press(surface, 'f').defaultPrevented).toBe(true);
    expect(service.getPosition()).toBe(1);
    expect(service.getCapability()).toBe('physical');
    expect(service.getVisualState()).toEqual({ target: 'j', pressedCorrect: 'f', pressedIncorrect: null });
    press(surface, 'j');
    expect(events.filter((event) => event.type === 'correctKey')).toHaveLength(2);
    expect(events.find((event) => event.type === 'keyAttempt')).toMatchObject({ expectedKey: 'f', receivedKey: 'f', lessonId: 'meadow-fj', missionId: 'meadow-a', shiftExpected: false, shiftUsed: false, scorable: true, source: 'physical', position: 0 });
    expect(events.at(-1).type).toBe('sequenceComplete');
    expect(press(surface, 'f').defaultPrevented).toBe(false);
  });

  it('preserves browser shortcuts, Tab, modifiers and IME composition', () => {
    const { surface, input, button, events, service } = setup();
    for (const [key, options] of [['Tab', {}], ['Control', {}], ['Shift', {}], ['r', { ctrlKey: true }], ['l', { metaKey: true }], ['+', { ctrlKey: true }], ['f', { altKey: true }], ['Process', {}], ['Dead', {}]]) {
      expect(press(surface, key, options).defaultPrevented).toBe(false);
    }
    input.dispatchEvent(new window.Event('compositionstart'));
    expect(press(surface, 'f', { isComposing: true }).defaultPrevented).toBe(false);
    input.dispatchEvent(new window.Event('compositionend'));
    button.focus(); press(button, 'f'); press(button, ' ');
    expect(events.filter((event) => event.type === 'keyAttempt')).toHaveLength(0);
    surface.focus();
    expect(press(surface, 'Escape').defaultPrevented).toBe(true);
    expect(events.find((event) => event.type === 'pauseRequested')).toBeTruthy();
    service.suspend();
    expect(press(surface, 'f').defaultPrevented).toBe(false);
    service.resume(); expect(document.activeElement).toBe(surface);
  });

  it('requires explicit Shift for capitals and shifted punctuation, with supportive retry', () => {
    const { service, events } = setup('Ff Jj', 'river-shift');
    expect(service.injectKey('F', false)).toBe(true);
    expect(events.at(-1).type).toBe('incorrectKey');
    expect(events.at(-1).shiftExpected).toBe(true);
    service.retry(); expect(events.at(-1).type).toBe('retryRequested');
    expect(service.injectKey('F', true)).toBe(true);
    expect(service.getPosition()).toBe(1);
    const punctuation = setup('a?', 'mountain-punctuation');
    punctuation.service.injectKey('a');
    punctuation.service.injectKey('?', false);
    expect(punctuation.events.at(-1).type).toBe('incorrectKey');
    punctuation.service.injectKey('?', true);
    expect(punctuation.events.at(-1).type).toBe('sequenceComplete');
  });

  it('rejects out-of-curriculum sequences and handles numbers and Space in scope', () => {
    expect(() => setup('fg')).toThrow(/Unintroduced key g/);
    const { service } = setup('1 2', 'mountain-numbers');
    for (const key of ['1', ' ', '2']) service.injectKey(key);
    expect(service.getPosition()).toBe(3);
    expect(getFingerGuidance('F')).toMatchObject({ finger: 'leftIndex', shiftHand: 'right' });
    expect(getFingerGuidance('J')).toMatchObject({ finger: 'rightIndex', shiftHand: 'left' });
    expect(getFingerGuidance(' ')).toMatchObject({ finger: 'leftThumb', shiftHand: null });
  });

  it('marks touch input unscored, prevents paste and disables dormant touch focus', () => {
    const { service, input, events } = setup();
    expect(input.tabIndex).toBe(-1);
    service.enableTouchFallback(); expect(document.activeElement).toBe(input);
    input.value = 'f'; input.dispatchEvent(new window.InputEvent('input', { inputType: 'insertText' }));
    expect(events.find((event) => event.type === 'correctKey')).toMatchObject({ scorable: false, source: 'touch' });
    input.value = 'jj'; input.dispatchEvent(new window.InputEvent('input', { inputType: 'insertFromPaste' }));
    expect(service.getPosition()).toBe(1);
    service.suspend(); expect(input.tabIndex).toBe(-1);
  });

  it('throttles announcements while preserving completion and repeated-error guidance', () => {
    const { service, announcements } = setup();
    service.injectKey('x', false, 'physical', 100);
    service.injectKey('x', false, 'physical', 200);
    service.injectKey('x', false, 'physical', 300);
    expect(announcements).toEqual(['Try f again.', 'Try f with the suggested finger. Take your time.']);
    service.injectKey('f', false, 'physical', 400);
    service.injectKey('j', false, 'physical', 500);
    expect(announcements.at(-1)).toMatch(/Sequence complete/);
  });
});
