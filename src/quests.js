/**
 * BloomType — Daily Quest System
 * 3 quests per calendar day. Resets at midnight. Drives retention.
 */

const QUEST_TEMPLATES = [
  { id: 'type_words', type: 'volume', title: 'Word Collector', desc: 'Type {target} words today', icon: '📝', min: 10, max: 30, step: 10 },
  { id: 'complete_level', type: 'session', title: 'Level Crusher', desc: 'Complete any level', icon: '🏆', fixed: 1 },
  { id: 'reach_wpm', type: 'speed', title: 'Speed Demon', desc: 'Hit {target} WPM in a level', icon: '⚡', min: 15, max: 30, step: 5 },
  { id: 'combo', type: 'combo', title: 'Combo King', desc: 'Get a {target}x combo', icon: '🔥', min: 5, max: 10, step: 1 },
  { id: 'accuracy', type: 'precision', title: 'Sharp Shooter', desc: 'Finish a level with {target}% accuracy', icon: '🎯', min: 85, max: 95, step: 5 },
  { id: 'practice', type: 'session', title: 'Practice Makes Perfect', desc: 'Play Practice mode once', icon: '🎯', fixed: 1 },
  { id: 'no_skip', type: 'challenge', title: 'No Skips!', desc: 'Complete a level without pressing Space', icon: '🚫', fixed: 1 },
];

/** Generate 3 quests for a given day. Deterministic based on date string. */
export function generateDailyQuests(dateStr) {
  // Simple pseudo-random based on date string hash
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) seed = (seed * 31 + dateStr.charCodeAt(i)) & 0x7fffffff;
  const rng = () => { seed = (seed * 16807) & 0x7fffffff; return seed / 0x7fffffff; };

  const shuffled = [...QUEST_TEMPLATES].sort(() => rng() - 0.5);
  const picked = shuffled.slice(0, 3);

  return picked.map((t, i) => {
    let target = t.fixed || 1;
    if (!t.fixed) {
      const range = (t.max - t.min) / t.step;
      target = t.min + Math.floor(rng() * (range + 1)) * t.step;
    }
    return {
      id: `${t.id}_${dateStr}_${i}`,
      templateId: t.id,
      title: t.title,
      desc: t.desc.replace('{target}', target),
      icon: t.icon,
      type: t.type,
      target,
      progress: 0,
      completed: false,
    };
  });
}

/** Get or create today's quests. */
export function getTodaysQuests(profile) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  if (profile.questDate !== today || !profile.dailyQuests || profile.dailyQuests.length === 0) {
    profile.questDate = today;
    profile.dailyQuests = generateDailyQuests(today);
    // Check streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    if (profile.lastQuestDate === yesterdayStr) {
      profile.streak = (profile.streak || 0) + 1;
    } else if (profile.lastQuestDate !== today) {
      profile.streak = 1; // First day or broken streak
    }
    profile.lastQuestDate = today;
  }

  return profile.dailyQuests;
}

/** Evaluate quest progress against current game state. Returns newly completed quests. */
export function evaluateQuests(profile, gameState) {
  const quests = getTodaysQuests(profile);
  const newlyCompleted = [];

  for (const q of quests) {
    if (q.completed) continue;

    let hit = false;
    switch (q.templateId) {
      case 'type_words':
        q.progress = Math.min(gameState.wordsTyped || 0, q.target);
        if (q.progress >= q.target) hit = true;
        break;
      case 'complete_level':
        if ((profile.completedLevels || []).includes(gameState.level)) hit = true;
        break;
      case 'reach_wpm':
        if ((gameState.levelWPM || 0) >= q.target) hit = true;
        break;
      case 'combo':
        if ((gameState.maxCombo || 0) >= q.target) hit = true;
        break;
      case 'accuracy':
        if (gameState.levelComplete && (gameState.levelAccuracy || 0) >= q.target) hit = true;
        break;
      case 'practice':
        if (gameState.screen === 'practice' && (gameState.practiceWordIndex || 0) >= 5) hit = true;
        break;
      case 'no_skip':
        if (gameState.levelComplete && (gameState.skipsUsed || 0) === 0) hit = true;
        break;
    }

    if (hit) {
      q.completed = true;
      q.progress = q.target;
      newlyCompleted.push(q);
    }
  }

  // Save back
  profile.dailyQuests = quests;

  return newlyCompleted;
}

/** Count how many of today's quests are completed. */
export function getQuestCompletion(profile) {
  const quests = profile.dailyQuests || [];
  const completed = quests.filter(q => q.completed).length;
  return { completed, total: quests.length, allDone: completed >= quests.length && quests.length > 0 };
}
