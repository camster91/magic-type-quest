/**
 * Reset mutable per-session state while preserving the learner profile and
 * long-lived canvas dimensions. Mode-specific data is supplied explicitly.
 */
export function resetGameSession(state, {
  level,
  health,
  now = performance.now(),
  drillLesson = null,
  dailyMoment = null,
} = {}) {
  Object.assign(state, {
    screen: 'game',
    level,
    score: 0,
    combo: 0,
    maxCombo: 0,
    wordsTyped: 0,
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
