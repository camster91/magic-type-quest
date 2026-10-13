/**
 * BloomType — World map habitats
 * The 10 levels are grouped into 5 habitats, two levels each. A habitat
 * "restores" in stages as its levels are finished: 0 (faded), 1 (waking up)
 * and 2 (fully restored). Pure functions only, so the map logic is testable.
 */

export const HABITATS = Object.freeze([
  Object.freeze({ id: 'meadow', emoji: '🌼', levels: Object.freeze([1, 2]) }),
  Object.freeze({ id: 'pond', emoji: '🐸', levels: Object.freeze([3, 4]) }),
  Object.freeze({ id: 'forest', emoji: '🌲', levels: Object.freeze([5, 6]) }),
  Object.freeze({ id: 'shore', emoji: '🐚', levels: Object.freeze([7, 8]) }),
  Object.freeze({ id: 'mountain', emoji: '⛰️', levels: Object.freeze([9, 10]) }),
]);

export const MAX_STAGE = 2;

function completedSet(completedLevels) {
  if (!Array.isArray(completedLevels)) return new Set();
  return new Set(completedLevels.map(Number).filter(Number.isInteger));
}

function resolve(habitat) {
  return typeof habitat === 'string' ? HABITATS.find((h) => h.id === habitat) || null : habitat || null;
}

/** The habitat a level belongs to, or null for an unknown level. */
export function habitatForLevel(level) {
  if (level === null || level === undefined || level === '') return null;
  const n = Number(level);
  return HABITATS.find((h) => h.levels.includes(n)) || null;
}

/** Restoration stage (0, 1 or 2): how many of the habitat's levels are done. */
export function habitatStage(habitat, completedLevels) {
  const h = resolve(habitat);
  if (!h) return 0;
  const done = completedSet(completedLevels);
  return h.levels.filter((level) => done.has(level)).length;
}

/**
 * A habitat opens when its first level does (level 1, or the level before it
 * is done), or once any of its own levels is done: restored or linked
 * progress can skip a level, and finished work should never look locked.
 */
export function isHabitatUnlocked(habitat, completedLevels) {
  const h = resolve(habitat);
  if (!h) return false;
  const first = h.levels[0];
  const done = completedSet(completedLevels);
  return first === 1 || done.has(first - 1) || h.levels.some((level) => done.has(level));
}

/** Everything the world map needs to draw each habitat. */
export function worldMap(completedLevels) {
  return HABITATS.map((h) => {
    const stage = habitatStage(h, completedLevels);
    return {
      id: h.id,
      emoji: h.emoji,
      levels: [...h.levels],
      stage,
      restored: stage >= MAX_STAGE,
      unlocked: isHabitatUnlocked(h, completedLevels),
      unlockLevel: h.levels[0] - 1,
    };
  });
}
