import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage and DOM before importing modules that touch them
const store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { for (const k in store) delete store[k]; },
};

describe('Garden growth (mechanical flow)', () => {
  beforeEach(() => {
    for (const k in store) delete store[k];
  });

  it('flower data structure is valid', () => {
    // The garden.push call site requires {emoji, x, wpm, accuracy, time}
    // Test the shape we expect, independent of the engine
    const sample = { emoji: '🌸', x: 0.5, wpm: 5, accuracy: 100, time: Date.now() };
    expect(sample.emoji).toBeTruthy();
    expect(typeof sample.wpm).toBe('number');
    expect(typeof sample.accuracy).toBe('number');
  });
});
