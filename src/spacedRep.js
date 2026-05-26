/**
 * BloomType — Spaced Repetition Tracker (lightweight)
 * Tracks per-key practice history to prioritize review items.
 */

/** Update SR stats for a key after practice/gameplay. */
export function recordKeyPractice(profile, key, correct) {
  if (!profile.keySR) profile.keySR = {};
  const sr = profile.keySR[key] = profile.keySR[key] || {
    correct: 0, wrong: 0, streak: 0, lastPracticed: null, interval: 1,
  };
  
  sr.lastPracticed = new Date().toISOString();
  if (correct) {
    sr.correct++;
    sr.streak++;
    // Increase interval on success (simplified SM-2)
    sr.interval = Math.min(30, sr.interval * (sr.streak >= 2 ? 2.5 : 1.5));
  } else {
    sr.wrong++;
    sr.streak = 0;
    sr.interval = 1; // Reset on failure
  }
}

/** Get keys that are due for review (interval elapsed since last practice). */
export function getDueKeys(profile, max = 5) {
  if (!profile.keySR) return [];
  const now = Date.now();
  const due = [];
  
  for (const [key, sr] of Object.entries(profile.keySR)) {
    const last = sr.lastPracticed ? new Date(sr.lastPracticed).getTime() : 0;
    const elapsedDays = (now - last) / (1000 * 60 * 60 * 24);
    if (elapsedDays >= sr.interval) {
      const accuracy = sr.correct + sr.wrong > 0 ? sr.correct / (sr.correct + sr.wrong) : 1;
      due.push({ key, priority: sr.interval / (accuracy + 0.1), accuracy });
    }
  }
  
  return due
    .sort((a, b) => b.priority - a.priority)
    .slice(0, max)
    .map(d => d.key);
}

/** Build practice words prioritizing due keys. */
export function buildReviewWords(profile, allWords, count = 30) {
  const due = getDueKeys(profile, 5);
  if (due.length === 0) return [];
  
  const dueSet = new Set(due.map(k => k.toLowerCase()));
  const matches = allWords.filter(w => {
    return w.toLowerCase().split('').some(c => dueSet.has(c));
  });
  
  const shuffled = [...matches].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
