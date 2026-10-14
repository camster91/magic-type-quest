// When the fox has something to say. Tiny and loaded with the game, so the
// game can decide without downloading the voice module (src/foxVoice.js).

export const FOX_STREAK_EVERY = 5;
export const FOX_MISSES_BEFORE_NUDGE = 3;

/** A streak line every few words in a row (5, 10, 15…). */
export function isFoxStreak(combo, every = FOX_STREAK_EVERY) {
  return combo > 0 && combo % every === 0;
}

/** A gentle "keep going" once, after a few misses on the same word. */
export function isFoxNudge(missesThisWord, threshold = FOX_MISSES_BEFORE_NUDGE) {
  return missesThisWord === threshold;
}

/** The fox talks only when sound is on and the Fox voice setting is on. */
export function foxVoiceAllowed(profile) {
  return profile?.soundEnabled !== false && profile?.foxVoiceEnabled !== false;
}
