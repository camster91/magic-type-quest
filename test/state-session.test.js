import { beforeEach, describe, expect, it, vi } from 'vitest';

const { logSession } = vi.hoisted(() => ({ logSession: vi.fn(() => Promise.resolve()) }));

vi.mock('../src/sync.js', () => ({
  logSession,
  syncProfile: vi.fn(() => Promise.resolve()),
}));
vi.mock('../src/classroom.js', () => ({
  removeStudentFromAllClasses: vi.fn(),
  syncToClass: vi.fn(),
}));

import { buildLevelSessionSnapshot, finalizeLevelSession, gameState, saveProfile } from '../src/state.js';

function memoryStorage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

describe('terminal curriculum session persistence', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
    logSession.mockClear();
    Object.assign(gameState, {
      level: 3,
      score: 420,
      levelWPM: 18,
      levelAccuracy: 94,
      wordsTyped: 12,
      wordsCompleted: 12,
      maxCombo: 7,
      skipsUsed: 1,
      savedWordsTyped: 0,
      savedScoreStars: 0,
      sessionLogged: false,
      profile: {
        name: 'Ada', avatar: '🌸', uuid: 'student-1', classCode: null,
        totalStars: 0, totalWords: 0, highScore: 0, completedLevels: [],
      },
    });
  });

  it('builds snapshots only for numbered curriculum levels', () => {
    expect(buildLevelSessionSnapshot(gameState, true)).toMatchObject({
      level: 3, wpm: 18, wordsCompleted: 12, completed: true,
    });
    expect(buildLevelSessionSnapshot({ ...gameState, level: 'drill' }, true)).toBeNull();
    expect(buildLevelSessionSnapshot({ ...gameState, level: 11 }, true)).toBeNull();
  });

  it('logs and stores one exact terminal result across repeated finalization', () => {
    finalizeLevelSession({ completed: true });
    finalizeLevelSession({ completed: true });

    expect(logSession).toHaveBeenCalledTimes(1);
    expect(logSession).toHaveBeenCalledWith(gameState.profile, expect.objectContaining({
      level: 3, score: 420, completed: true,
    }));
    expect(gameState.profile.levelStats[3]).toEqual({
      wpm: 18, accuracy: 94, score: 420, words: 12, completed: true,
    });
    expect(gameState.profile.totalWords).toBe(12);
    expect(gameState.profile.totalStars).toBe(42);
  });

  it('never logs analytics during routine autosaves', () => {
    saveProfile();
    saveProfile();
    expect(logSession).not.toHaveBeenCalled();
  });

  it('persists named modes locally without creating invalid cloud session rows', () => {
    gameState.level = 'drill';
    finalizeLevelSession({ completed: false });
    expect(logSession).not.toHaveBeenCalled();
    expect(gameState.profile.levelStats).toBeUndefined();
    expect(localStorage.getItem('bloomtype-profile')).not.toBeNull();
  });

  it('does not erase prior mastery when a replayed level ends unsuccessfully', () => {
    gameState.profile.levelStats = { 3: { completed: true, score: 500 } };
    finalizeLevelSession({ completed: false });
    expect(gameState.profile.levelStats[3].completed).toBe(true);
  });
});
