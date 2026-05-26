/**
 * BloomType — Error-Focused Drill Mode
 * Detects weak keys from gameplay and generates targeted mini-lessons.
 */

import { getLessonByLevel } from './lessonLevels.js';

/** Analyze keyAccuracy and return the worst keys (most wrong %). */
export function getWeakKeys(keyAccuracy, max = 3) {
  if (!keyAccuracy || Object.keys(keyAccuracy).length === 0) return [];
  const scored = Object.entries(keyAccuracy).map(([key, stats]) => {
    const total = (stats.correct || 0) + (stats.wrong || 0);
    const wrongRate = total > 3 ? (stats.wrong || 0) / total : 0;
    return { key, wrongRate, total, wrong: stats.wrong || 0 };
  });
  return scored
    .filter(s => s.total >= 3 && s.wrong > 0) // Need enough data and some mistakes
    .sort((a, b) => b.wrongRate - a.wrongRate)
    .slice(0, max)
    .map(s => s.key);
}

/** Generate a mini-lesson word list containing only weak keys. */
export function generateDrillWords(weakKeys, allWords, count = 20) {
  if (!weakKeys || weakKeys.length === 0) return [];
  const weakSet = new Set(weakKeys.map(k => k.toLowerCase()));
  const matches = allWords.filter(w => {
    const chars = w.toLowerCase().split('');
    return chars.some(c => weakSet.has(c));
  });
  if (matches.length === 0) return [];
  // Shuffle and take requested count
  const shuffled = [...matches].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** Build a drill lesson object from weak keys. */
export function buildDrillLesson(weakKeys, profile) {
  if (!weakKeys || weakKeys.length === 0) return null;
  const allWords = [];
  // Collect words from all levels
  for (let i = 1; i <= 10; i++) {
    const lesson = getLessonByLevel(i);
    if (lesson.words) allWords.push(...lesson.words);
  }
  const drillWords = generateDrillWords(weakKeys, allWords, 25);
  if (drillWords.length === 0) return null;

  return {
    id: 'drill',
    name: `Drill: ${weakKeys.join(', ').toUpperCase()}`,
    subtitle: 'Fix Your Tricky Keys!',
    description: `Focus practice on the keys you miss most: ${weakKeys.join(', ').toUpperCase()}`,
    keys: weakKeys,
    words: drillWords,
    practicePatterns: weakKeys.map(k => `${k}${k}${k} ${k}${k}${k}`),
    speed: 0.35, // Slower than normal for drill mode
    spawnRate: 5000,
    wordsPerLevel: drillWords.length,
    health: 5,
    badge: 'drill',
    icon: '🎯',
    estimatedTime: '3 min',
    isDrill: true,
  };
}
