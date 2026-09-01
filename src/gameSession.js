/**
 * Reset mutable per-session state while preserving the learner profile and
 * long-lived canvas dimensions. Mode-specific data is supplied explicitly.
 */
export function createSessionId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
}

export function resetGameSession(state, {
  level,
  health,
  now = performance.now(),
  sessionId = createSessionId(),
  drillLesson = null,
  dailyMoment = null,
} = {}) {
  Object.assign(state, {
    screen: 'game',
    sessionId,
    level,
    score: 0,
    combo: 0,
    maxCombo: 0,
    wordsTyped: 0,
    savedWordsTyped: 0,
    savedScoreStars: 0,
    sessionLogged: false,
    sessionLogInFlight: false,
    wordsCompleted: 0,
    wordsSpawned: 0,
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    health,
    activeWords: [],
    targetWord: null,
    targetIndex: 0,
    gameOver: false,
    paused: false,
    lastSpawn: 0,
    lastFrameTime: 0,
    garden: [],
    levelStartTime: now,
    keyAccuracy: {},
    levelWPM: 0,
    levelAccuracy: 0,
    levelComplete: false,
    skipsUsed: 0,
    adaptiveSpeed: 1,
    lastAdaptiveCheck: 0,
    totalFocusBonus: 0,
    lastFocus: null,
    drillLesson,
    dailyMoment: dailyMoment || { ...(state.dailyMoment || {}), active: false },
  });
  return state;
}

/** Curriculum levels earn a small level bonus; named modes never do. */
export function getLevelScoreBonus(level) {
  return Number.isInteger(level) && level > 0 ? level * 2 : 0;
}
