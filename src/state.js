/**
 * BloomType - Game State Management
 */
import { removeStudentFromAllClasses, syncToClass } from './classroom.js';
import { syncProfile, logSession } from './sync.js';
import { recordPractice } from './practiceLog.js';
import { backfillPlants } from './plantOfDay.js';
import { activePlayMs } from './gameSession.js';

// ===== DEFAULT STATE =====
export const defaultState = {
  screen: 'menu',
  sessionId: null,
  level: 1,
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
    fieldGuide: [], // Wildlife cards discovered by restoring meadows
    plants: {}, // Plant of the day: how many of each plant this child has grown
    plantedDays: [], // Days already planted, so no day counts twice
    classCode: null, // Classroom code for teacher dashboard
    uuid: null, // Stable identifier for class sync
    keySR: {}, // Spaced repetition state for weak keys
    lastDailyMomentDate: null, // F1: ISO date of last completed Daily Moment
  },
};

const PROFILE_ARRAY_FIELDS = ['completedLevels', 'seenEvolutions', 'garden', 'fieldGuide', 'plantedDays'];
const PROFILE_OBJECT_FIELDS = ['keySR', 'plants'];

// ===== LIVE GAME STATE =====
export const gameState = createGameState();

function createGameState() {
  return { ...defaultState, profile: normalizeProfile() };
}

/**
 * Merge saved data over the defaults, giving every profile its own arrays
 * and objects and replacing fields with the wrong type, so a damaged save
 * cannot crash the game or leak state between profiles.
 */
export function normalizeProfile(saved = {}) {
  const source = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  const profile = { ...defaultState.profile, ...source };
  for (const field of PROFILE_ARRAY_FIELDS) {
    profile[field] = Array.isArray(source[field]) ? source[field] : [];
  }
  for (const field of PROFILE_OBJECT_FIELDS) {
    const value = source[field];
    profile[field] = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  return profile;
}

// ===== PROFILE PERSISTENCE =====
export function loadProfile() {
  try {
    const saved = localStorage.getItem('bloomtype-profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      gameState.profile = normalizeProfile(parsed);
      backfillPlants(gameState.profile);
    }
  } catch (e) {
    console.warn('Failed to load profile:', e);
  }
}

/** Save the profile. markPlayed: false keeps the "last played" time as it was. */
export function saveProfile({ markPlayed = true } = {}) {
  try {
    const p = gameState.profile;
    if (gameState.score > p.highScore) p.highScore = gameState.score;
    const wordsTyped = gameState.wordsTyped || 0;
    const scoreStars = Math.floor((gameState.score || 0) / 10);
    p.totalWords += Math.max(0, wordsTyped - (gameState.savedWordsTyped || 0));
    p.totalStars += Math.max(0, scoreStars - (gameState.savedScoreStars || 0));
    gameState.savedWordsTyped = wordsTyped;
    gameState.savedScoreStars = scoreStars;
    if (markPlayed) p.lastPlayed = new Date().toISOString();
    
    // Ensure uuid for class sync
    if (!p.uuid) p.uuid = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    // Save to app key
    localStorage.setItem('bloomtype-profile', JSON.stringify(p));
    // Also save to teacher-readable key
    removeProfileCopies(p.uuid);
    const name = (p.name || 'Anonymous').replace(/[^a-zA-Z0-9]/g, '_');
    localStorage.setItem(profileCopyKey(name, p.uuid), JSON.stringify(p));
    
    // Sync to class if joined
    if (p.classCode) {
      syncToClass(p);
    }
    
    // Fire-and-forget cloud sync (offline-first — never blocks)
    syncProfile(p).catch(() => {});
  } catch (e) {
    console.warn('Failed to save profile:', e);
  }
}

export function buildLevelSessionSnapshot(state, completed = false) {
  if (!state.sessionId || !Number.isInteger(state.level) || state.level < 1 || state.level > 10) return null;
  return {
    sessionId: state.sessionId,
    level: state.level,
    score: state.score || 0,
    wpm: state.levelWPM || 0,
    accuracy: state.levelAccuracy || 0,
    wordsTyped: state.wordsTyped || 0,
    wordsCompleted: state.wordsCompleted || 0,
    maxCombo: state.maxCombo || 0,
    skipsUsed: state.skipsUsed || 0,
    // Active play time for the weekly minutes reports, capped like the
    // local practice log (one sitting counts for at most 30 minutes).
    durationSeconds: Math.min(1800, Math.round(activePlayMs(state, performance.now()) / 1000)),
    completed: Boolean(completed),
  };
}

/** Persist one terminal curriculum attempt without logging routine autosaves. */
export function finalizeLevelSession({ completed = false } = {}) {
  const snapshot = buildLevelSessionSnapshot(gameState, completed);
  if (snapshot) {
    const p = gameState.profile;
    if (!p.levelStats) p.levelStats = {};
    const previous = p.levelStats[snapshot.level] || {};
    const wasCompleted = previous.completed === true;
    p.levelStats[snapshot.level] = {
      wpm: snapshot.wpm,
      // The fastest run is kept, so a slower replay never lowers "Best WPM".
      bestWpm: Math.max(Number(previous.bestWpm ?? previous.wpm) || 0, snapshot.wpm || 0),
      accuracy: snapshot.accuracy,
      score: snapshot.score,
      words: snapshot.wordsCompleted,
      completed: snapshot.completed || wasCompleted,
    };
  }

  if (snapshot && !gameState.practiceRecorded && gameState.levelStartTime) {
    gameState.practiceRecorded = true;
    recordPractice(gameState.profile, activePlayMs(gameState, performance.now()));
  }

  saveProfile();
  if (snapshot && !gameState.sessionLogged && !gameState.sessionLogInFlight) {
    gameState.sessionLogInFlight = true;
    logSession(gameState.profile, snapshot)
      .then((saved) => { gameState.sessionLogged = saved === true; })
      .catch(() => {})
      .finally(() => { gameState.sessionLogInFlight = false; });
  }
}

// Two children with the same name on one device must not overwrite each
// other's copy, so a clash adds the start of the student's id.
function profileCopyKey(name, profileId) {
  const key = `bloomtype_profile_${name}`;
  try {
    const existing = JSON.parse(localStorage.getItem(key));
    if (existing?.uuid && existing.uuid !== profileId) return `${key}_${String(profileId).slice(0, 8)}`;
  } catch {
    // A corrupt copy is simply replaced.
  }
  return key;
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
  gameState.profile = normalizeProfile();
}
