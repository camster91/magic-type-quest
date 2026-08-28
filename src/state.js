/**
 * BloomType - Game State Management
 */
import { removeStudentFromAllClasses, syncToClass } from './classroom.js';
import { syncProfile, logSession } from './sync.js';

// ===== DEFAULT STATE =====
export const defaultState = {
  screen: 'menu',
  level: 1,
  score: 0,
  combo: 0,
  maxCombo: 0,
  wordsTyped: 0,
  savedWordsTyped: 0,
  savedScoreStars: 0,
  wordsCompleted: 0,
  wordsSpawned: 0,
  totalKeystrokes: 0,
  correctKeystrokes: 0,
  health: 5,
  activeWords: [],
  targetWord: null,
  targetIndex: 0,
  gameOver: false,
  paused: false,
  currentTime: 0,
  lastSpawn: 0,
  lastFrameTime: 0,
  canvasW: 800,
  canvasH: 600,
  garden: [],
  // WPM & analytics
  levelStartTime: 0,
  keyAccuracy: {}, // { 'a': { correct: 10, wrong: 2 }, ... }
  levelWPM: 0,
  levelAccuracy: 0,
  levelComplete: false,
  skipsUsed: 0,
  // Daily Moment state (F1) — soft 60s typing session, no game-over
  dailyMoment: {
    active: false,
    startTime: 0,
    durationMs: 60_000,
    wordsTarget: 12,
  },
  // Practice Mode state
  practiceLessonId: 1,
  currentPracticeWords: [],
  practiceWordIndex: 0,
  practiceKeystrokes: 0,
  practiceCorrectKeystrokes: 0,
  practiceErrors: 0,
  practiceStartTime: 0,
  practiceWPM: 0,
  practiceAccuracy: 0,
  
  profile: {
    name: 'Player',
    avatar: '🌸',
    totalStars: 0,
    highScore: 0,
    totalWords: 0,
    completedLevels: [],
    voiceEnabled: true,
    locale: 'en',
    petEvolution: 1, // 1=sprout, 2=bud, 3=bloom
    seenEvolutions: [], // Track which evolutions the player has seen
    garden: [], // Persistent flower collection across sessions
    classCode: null, // Classroom code for teacher dashboard
    uuid: null, // Stable identifier for class sync
    keySR: {}, // Spaced repetition state for weak keys
    lastDailyMomentDate: null, // F1: ISO date of last completed Daily Moment
  },
};

// ===== LIVE GAME STATE =====
export const gameState = createGameState();

function createGameState() {
  return { ...defaultState, profile: { ...defaultState.profile } };
}

// ===== PROFILE PERSISTENCE =====
export function loadProfile() {
  try {
    const saved = localStorage.getItem('bloomtype-profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      gameState.profile = { ...defaultState.profile, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load profile:', e);
  }
}

export function saveProfile() {
  try {
    const p = gameState.profile;
    if (gameState.score > p.highScore) p.highScore = gameState.score;
    const wordsTyped = gameState.wordsTyped || 0;
    const scoreStars = Math.floor((gameState.score || 0) / 10);
    p.totalWords += Math.max(0, wordsTyped - (gameState.savedWordsTyped || 0));
    p.totalStars += Math.max(0, scoreStars - (gameState.savedScoreStars || 0));
    gameState.savedWordsTyped = wordsTyped;
    gameState.savedScoreStars = scoreStars;
    p.lastPlayed = new Date().toISOString();
    
    // Save level analytics if level was completed
    if (!p.levelStats) p.levelStats = {};
    if (gameState.levelWPM > 0) {
      p.levelStats[gameState.level] = {
        wpm: gameState.levelWPM,
        accuracy: gameState.levelAccuracy,
        score: gameState.score,
        words: gameState.wordsCompleted,
        completed: gameState.wordsCompleted >= (gameState.level <= 10 ? 5 : 0)
      };
    }
    
    // Ensure uuid for class sync
    if (!p.uuid) p.uuid = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    // Save to app key
    localStorage.setItem('bloomtype-profile', JSON.stringify(p));
    // Also save to teacher-readable key
    removeProfileCopies(p.uuid);
    const name = (p.name || 'Anonymous').replace(/[^a-zA-Z0-9]/g, '_');
    localStorage.setItem(`bloomtype_profile_${name}`, JSON.stringify(p));
    
    // Sync to class if joined
    if (p.classCode) {
      syncToClass(p);
    }
    
    // Fire-and-forget cloud sync (offline-first — never blocks)
    syncProfile(p).catch(() => {});
    if (gameState.levelWPM > 0) {
      logSession(p, {
        level: gameState.level,
        score: gameState.score,
        wpm: gameState.levelWPM,
        accuracy: gameState.levelAccuracy,
        wordsTyped: gameState.wordsTyped,
        wordsCompleted: gameState.wordsCompleted,
        maxCombo: gameState.maxCombo,
        skipsUsed: gameState.skipsUsed,
      }).catch(() => {});
    }
  } catch (e) {
    console.warn('Failed to save profile:', e);
  }
}

function removeProfileCopies(profileId) {
  if (!profileId) return;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith('bloomtype_profile_')) continue;
    try {
      if (JSON.parse(localStorage.getItem(key))?.uuid === profileId) keys.push(key);
    } catch {
      // A corrupt legacy copy is ignored rather than blocking the current save.
    }
  }
  keys.forEach((key) => localStorage.removeItem(key));
}

/** Delete the current student's progress from this browser only. */
export function deleteLocalProfile() {
  const profileId = gameState.profile?.uuid;
  if (profileId) {
    removeStudentFromAllClasses(profileId);
    removeProfileCopies(profileId);
  }
  localStorage.removeItem('bloomtype-profile');
  gameState.profile = {
    ...defaultState.profile,
    completedLevels: [],
    seenEvolutions: [],
    garden: [],
    keySR: {},
  };
}
