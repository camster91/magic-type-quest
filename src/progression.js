/**
 * Resolve the learner's current curriculum position from persisted completion
 * data. Legacy profiles can contain duplicates, gaps, or invalid values, so the
 * calculation normalizes them before deriving progress.
 */
export function getCurriculumProgress(completedLevels, totalLevels) {
  const total = Number.isInteger(totalLevels) && totalLevels > 0 ? totalLevels : 1;
  const completed = new Set(
    (Array.isArray(completedLevels) ? completedLevels : [])
      .filter((level) => Number.isInteger(level) && level >= 1 && level <= total),
  );
  const currentLevel = Array.from({ length: total }, (_, index) => index + 1)
    .find((level) => !completed.has(level)) ?? total;

  return {
    currentLevel,
    completedCount: completed.size,
    isComplete: completed.size === total,
    percent: (completed.size / total) * 100,
  };
}
