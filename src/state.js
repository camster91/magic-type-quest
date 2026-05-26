/**
 * BloomType - Game State Management
 */
import { syncToClass } from './classroom.js';

// ===== DEFAULT STATE =====
export const defaultState = {
  screen: 'menu',
  level: 1,
  score: 0,
  combo: 0,
  maxCombo: 0,
  wordsTyped: 0,
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
    petEvolution: 1, // 1=sprout, 2=bud, 3=bloom
    seenEvolutions: [], // Track which evolutions the player has seen
    garden: [], // Persistent flower collection across sessions
    classCode: null, // Classroom code for teacher dashboard
    uuid: null, // Stable identifier for class sync
    keySR: {}, // Spaced repetition state for weak keys
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
    p.totalWords += gameState.wordsTyped || 0;
    p.totalStars += Math.floor((gameState.score || 0) / 10);
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
    const name = (p.name || 'Anonymous').replace(/[^a-zA-Z0-9]/g, '_');
    localStorage.setItem(`bloomtype_profile_${name}`, JSON.stringify(p));
    
    // Sync to class if joined
    if (p.classCode) {
      syncToClass(p);
    }
  } catch (e) {
    console.warn('Failed to save profile:', e);
  }
}
