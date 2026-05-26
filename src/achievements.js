/**
 * BloomType — Achievement System
 * 15+ achievements across 5 categories.
 */

export const ACHIEVEMENT_CATEGORIES = {
  speed: { label: 'Speed', icon: '⚡', color: '#FBBF24' },
  accuracy: { label: 'Precision', icon: '🎯', color: '#34D399' },
  combo: { label: 'Combo', icon: '🔥', color: '#EF4444' },
  volume: { label: 'Volume', icon: '📝', color: '#8B5CF6' },
  mastery: { label: 'Mastery', icon: '👑', color: '#EC4899' },
};

export const ACHIEVEMENTS = [
  // === SPEED ===
  { id: 'speed_10', category: 'speed', title: 'First Steps', desc: 'Reach 10 WPM in any level', icon: '🐢', target: { wpm: 10 } },
  { id: 'speed_20', category: 'speed', title: 'Speed Walker', desc: 'Reach 20 WPM', icon: '🏃', target: { wpm: 20 } },
  { id: 'speed_30', category: 'speed', title: 'Zoom Zoom', desc: 'Reach 30 WPM', icon: '🚀', target: { wpm: 30 } },
  { id: 'speed_40', category: 'speed', title: 'Lightning Fingers', desc: 'Reach 40 WPM', icon: '⚡', target: { wpm: 40 } },

  // === ACCURACY ===
  { id: 'accuracy_80', category: 'accuracy', title: 'Careful Typist', desc: 'Finish a level with 80%+ accuracy', icon: '🔍', target: { accuracy: 80 } },
  { id: 'accuracy_95', category: 'accuracy', title: 'Perfectionist', desc: 'Finish a level with 95%+ accuracy', icon: '💎', target: { accuracy: 95 } },
  { id: 'accuracy_100', category: 'accuracy', title: 'Flawless', desc: 'Finish a level with 100% accuracy', icon: '✨', target: { accuracy: 100 } },
  { id: 'no_miss_5', category: 'accuracy', title: 'Steady Hand', desc: 'Type 5 words in a row without a single miss', icon: '🤚', target: { streakCorrect: 5 } },

  // === COMBO ===
  { id: 'combo_5', category: 'combo', title: 'On Fire', desc: 'Hit a 5x combo', icon: '🔥', target: { combo: 5 } },
  { id: 'combo_10', category: 'combo', title: 'Inferno', desc: 'Hit a 10x combo', icon: '🌋', target: { combo: 10 } },
  { id: 'combo_15', category: 'combo', title: 'Legendary', desc: 'Hit a 15x combo', icon: '☄️', target: { combo: 15 } },

  // === VOLUME ===
  { id: 'words_50', category: 'volume', title: 'Word Collector', desc: 'Type 50 words total', icon: '📚', target: { totalWords: 50 } },
  { id: 'words_200', category: 'volume', title: 'Librarian', desc: 'Type 200 words total', icon: '📖', target: { totalWords: 200 } },
  { id: 'words_500', category: 'volume', title: 'Novelist', desc: 'Type 500 words total', icon: '📜', target: { totalWords: 500 } },

  // === MASTERY ===
  { id: 'level_1', category: 'mastery', title: 'First Bloom', desc: 'Complete Level 1', icon: '🌸', target: { level: 1 } },
  { id: 'level_5', category: 'mastery', title: 'Halfway Hero', desc: 'Complete Level 5', icon: '🏙️', target: { level: 5 } },
  { id: 'level_10', category: 'mastery', title: 'Legend', desc: 'Complete all 10 levels', icon: '👑', target: { level: 10 } },
  { id: 'evolution_2', category: 'mastery', title: 'Growing Up', desc: 'Help Bloom evolve once', icon: '🌿', target: { evolution: 2 } },
  { id: 'evolution_3', category: 'mastery', title: 'Fully Bloomed', desc: 'Help Bloom reach final form', icon: '🌺', target: { evolution: 3 } },
  { id: 'all_levels_3star', category: 'mastery', title: 'Garden Master', desc: 'Complete every level', icon: '🏆', target: { allLevels: true } },
];

/** Check all achievements against current game state. Returns array of newly unlocked IDs. */
export function checkAchievements(profile, gameState) {
  const unlocked = new Set(profile.achievements || []);
  const newlyUnlocked = [];

  for (const ach of ACHIEVEMENTS) {
    if (unlocked.has(ach.id)) continue;

    let hit = false;
    const t = ach.target;

    if (t.wpm && (gameState.levelWPM || 0) >= t.wpm) hit = true;
    if (t.accuracy && (gameState.levelAccuracy || 0) >= t.accuracy && gameState.wordsCompleted > 0) hit = true;
    if (t.combo && (gameState.maxCombo || 0) >= t.combo) hit = true;
    if (t.totalWords && (profile.totalWords || 0) >= t.totalWords) hit = true;
    if (t.level && (profile.completedLevels || []).includes(t.level)) hit = true;
    if (t.evolution && (profile.petEvolution || 1) >= t.evolution) hit = true;
    if (t.allLevels && (profile.completedLevels || []).length >= 10) hit = true;
    if (t.streakCorrect && (gameState.streakCorrect || 0) >= t.streakCorrect) hit = true;

    if (hit) {
      unlocked.add(ach.id);
      newlyUnlocked.push(ach);
    }
  }

  if (newlyUnlocked.length > 0) {
    profile.achievements = Array.from(unlocked);
  }

  return newlyUnlocked;
}

/** Get display stats for the profile screen. */
export function getAchievementStats(profile) {
  const unlocked = new Set(profile.achievements || []);
  const total = ACHIEVEMENTS.length;
  const byCategory = {};

  for (const [key, cat] of Object.entries(ACHIEVEMENT_CATEGORIES)) {
    const catAchs = ACHIEVEMENTS.filter(a => a.category === key);
    const catUnlocked = catAchs.filter(a => unlocked.has(a.id));
    byCategory[key] = {
      ...cat,
      total: catAchs.length,
      unlocked: catUnlocked.length,
      pct: Math.round((catUnlocked.length / catAchs.length) * 100),
    };
  }

  return {
    total,
    unlocked: unlocked.size,
    pct: Math.round((unlocked.size / total) * 100),
    byCategory,
    nextUnlock: ACHIEVEMENTS.find(a => !unlocked.has(a.id)) || null,
  };
}

/** Get sorted list of all achievements with unlock status for UI rendering. */
export function getAllAchievements(profile) {
  const unlocked = new Set(profile.achievements || []);
  return ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: unlocked.has(a.id),
    categoryInfo: ACHIEVEMENT_CATEGORIES[a.category],
  }));
}
