import { describe, expect, it } from 'vitest';
import { getLevelScoreBonus, resetGameSession } from '../src/gameSession.js';

function dirtyState() {
  return {
    profile: { name: 'Ada' },
    canvasW: 800,
    canvasH: 600,
    score: 999,
    activeWords: [{ text: 'old' }],
    keyAccuracy: { a: { correct: 3, wrong: 1 } },
    totalFocusBonus: 42,
    lastFocus: 12,
    drillLesson: { name: 'old drill' },
    dailyMoment: { active: true, durationMs: 60_000 },
  };
}

describe('game session initialization', () => {
  it('resets mutable gameplay fields while preserving profile and canvas state', () => {
    const state = dirtyState();
    const profile = state.profile;

    resetGameSession(state, { level: 4, health: 5, now: 1234 });

    expect(state).toMatchObject({
      screen: 'game', level: 4, health: 5, score: 0, combo: 0,
      wordsCompleted: 0, savedWordsTyped: 0, savedScoreStars: 0,
      totalKeystrokes: 0, gameOver: false,
      paused: false, levelStartTime: 1234, adaptiveSpeed: 1,
      totalFocusBonus: 0, lastFocus: null, drillLesson: null,
    });
    expect(state.profile).toBe(profile);
    expect(state.canvasW).toBe(800);
    expect(state.canvasH).toBe(600);
    expect(state.activeWords).toEqual([]);
    expect(state.keyAccuracy).toEqual({});
    expect(state.dailyMoment.active).toBe(false);
  });

  it('owns the drill lesson override instead of relying on a caller side effect', () => {
    const state = dirtyState();
    const drillLesson = { name: 'Weak Keys', words: ['ask'] };
    resetGameSession(state, { level: 'drill', health: 3, drillLesson, now: 20 });
    expect(state.drillLesson).toBe(drillLesson);
    expect(state.level).toBe('drill');
    expect(state.health).toBe(3);
  });

  it('activates explicit Daily Moment configuration and clears drill state', () => {
    const state = dirtyState();
    const dailyMoment = { active: true, wordsTarget: 12, durationMs: 60_000 };
    resetGameSession(state, { level: 2, health: 999, dailyMoment, now: 30 });
    expect(state.dailyMoment).toBe(dailyMoment);
    expect(state.drillLesson).toBeNull();
    expect(state.health).toBe(999);
  });

  it('allocates fresh collections on every reset', () => {
    const state = dirtyState();
    resetGameSession(state, { level: 1, health: 5, now: 1 });
    const firstWords = state.activeWords;
    const firstAccuracy = state.keyAccuracy;
    resetGameSession(state, { level: 2, health: 4, now: 2 });
    expect(state.activeWords).not.toBe(firstWords);
    expect(state.keyAccuracy).not.toBe(firstAccuracy);
  });
});

describe('level score bonus', () => {
  it('awards curriculum levels without turning named modes into NaN', () => {
    expect(getLevelScoreBonus(4)).toBe(8);
    expect(getLevelScoreBonus('drill')).toBe(0);
    expect(getLevelScoreBonus(undefined)).toBe(0);
  });
});
