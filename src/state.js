/**
 * BloomType - Game State Management
 */

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
  profile: {
    name: 'Player',
    avatar: '🌸',
    totalStars: 0,
    highScore: 0,
    totalWords: 0,
    completedLevels: [],
    voiceEnabled: true,
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
    
    // Save to app key
    localStorage.setItem('bloomtype-profile', JSON.stringify(p));
    // Also save to teacher-readable key
    const name = (p.name || 'Anonymous').replace(/[^a-zA-Z0-9]/g, '_');
    localStorage.setItem(`bloomtype_profile_${name}`, JSON.stringify(p));
  } catch (e) {
    console.warn('Failed to save profile:', e);
  }
}
