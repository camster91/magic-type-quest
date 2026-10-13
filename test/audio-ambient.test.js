// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

function fakeNode() {
  return {
    connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(),
    frequency: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
  };
}

class FakeAudioContext {
  constructor() { this.currentTime = 0; this.sampleRate = 8000; this.destination = {}; this.state = 'running'; }
  createGain() { return fakeNode(); }
  createOscillator() { return fakeNode(); }
  createBiquadFilter() { return fakeNode(); }
  createBufferSource() { return fakeNode(); }
  createBuffer(_c, length) { const data = new Float32Array(length); return { getChannelData: () => data }; }
}

async function loadAudio() {
  vi.resetModules();
  globalThis.CanvasRenderingContext2D ||= function CanvasRenderingContext2D() {};
  window.AudioContext = FakeAudioContext;
  const audio = await import('../src/audio.js');
  const { gameState } = await import('../src/state.js');
  return { audio, gameState };
}

afterEach(() => vi.useRealTimers());

describe('meadow ambience', () => {
  it('plans short, high, bird-like chirps', async () => {
    const { audio } = await loadAudio();
    for (let i = 0; i < 20; i++) {
      const notes = audio.chirpPlan();
      expect(notes.length).toBeGreaterThanOrEqual(2);
      expect(notes.length).toBeLessThanOrEqual(4);
      for (const note of notes) {
        expect(note.from).toBeGreaterThan(2000);
        expect(note.length).toBeLessThan(0.15);
      }
    }
  });

  it('plays birds on a timer and stops them cleanly', async () => {
    vi.useFakeTimers();
    const { audio, gameState } = await loadAudio();
    gameState.profile.soundEnabled = true;
    audio.initAudio();
    audio.playAmbient();
    expect(vi.getTimerCount()).toBe(1);
    audio.stopAmbient();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stays silent when sound is off', async () => {
    vi.useFakeTimers();
    const { audio, gameState } = await loadAudio();
    gameState.profile.soundEnabled = false;
    audio.initAudio();
    audio.playAmbient();
    expect(vi.getTimerCount()).toBe(0);
  });
});
