import { describe, expect, it } from 'vitest';
import { getCurriculumProgress } from '../src/progression.js';

describe('curriculum progress', () => {
  it('continues into level 7 after the original six-level curriculum', () => {
    expect(getCurriculumProgress([1, 2, 3, 4, 5, 6], 10)).toEqual({
      currentLevel: 7,
      completedCount: 6,
      isComplete: false,
      percent: 60,
    });
  });

  it('stops at the first incomplete level when legacy progress has gaps', () => {
    expect(getCurriculumProgress([1, 3, 4], 10).currentLevel).toBe(2);
  });

  it('ignores duplicates and invalid persisted level values', () => {
    expect(getCurriculumProgress([1, 1, 2, 0, 11, '3'], 10)).toMatchObject({
      currentLevel: 3,
      completedCount: 2,
      percent: 20,
    });
  });

  it('reports completion only when every curriculum level is complete', () => {
    expect(getCurriculumProgress([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10)).toEqual({
      currentLevel: 10,
      completedCount: 10,
      isComplete: true,
      percent: 100,
    });
  });
});
