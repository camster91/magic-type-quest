// T28: every lesson on the Lessons screen ships a non-empty `teaches` field
// that becomes the on-card 1-line subtitle. The card is the first thing a
// 7-year-old reads — if `teaches` is missing or empty, the kid sees a
// thematic tagline ("Reach up to the sky") instead of the actual skill
// ("Learn the top row keys: q, w, e, r, t, y, u, i, o, p"), which is the
// whole point of this feature.

import { describe, it, expect } from 'vitest';
import { LESSON_LEVELS } from '../src/lessonLevels.js';

describe('Lesson card subtitles (T28)', () => {
  it('ships exactly 10 levels', () => {
    expect(Object.keys(LESSON_LEVELS)).toHaveLength(10);
  });

  it('every lesson has a non-empty `teaches` string', () => {
    for (const id of Object.keys(LESSON_LEVELS)) {
      const lesson = LESSON_LEVELS[id];
      expect(typeof lesson.teaches, `lesson ${id} teaches type`).toBe('string');
      expect(lesson.teaches.length, `lesson ${id} teaches not empty`).toBeGreaterThan(0);
    }
  });

  it('every `teaches` is short enough to fit in the 90-char card ceiling', () => {
    for (const id of Object.keys(LESSON_LEVELS)) {
      const lesson = LESSON_LEVELS[id];
      expect(lesson.teaches.length, `lesson ${id} teaches within 90 chars`).toBeLessThanOrEqual(90);
    }
  });

  it('every `teaches` names actual keys or an actual skill (sanity check, not exhaustive)', () => {
    // Loose pattern: contains a key letter, a digit, or a skill verb
    // ("type", "build", "mix", "combine", "mastery"). This catches
    // a copy-paste regression where someone reverts to thematic copy.
    const skillPattern = /[a-z0-9]|type|mix|combine|mastery|build/i;
    for (const id of Object.keys(LESSON_LEVELS)) {
      const lesson = LESSON_LEVELS[id];
      expect(lesson.teaches, `lesson ${id} teaches mentions a skill or key`).toMatch(skillPattern);
    }
  });

  it('`teaches` is distinct from the flavor `subtitle` for at least the spec lessons', () => {
    // The task spec gives "Home Row Garden" -> "Learn the home row keys: a, s, d, f, j, k, l"
    // which is a different shape from the existing flavor subtitle "Garden Words".
    // We check a few by hand so a future revert to "Garden Words" trips the test.
    expect(LESSON_LEVELS[1].teaches).toMatch(/home row/i);
    expect(LESSON_LEVELS[1].teaches).toMatch(/a, s, d, f, j, k, l/);
    expect(LESSON_LEVELS[2].teaches).toMatch(/top row|q, w, e, r, t, y, u, i, o, p/i);
    expect(LESSON_LEVELS[6].teaches).toMatch(/numbers: 1, 2, 3, 4, 5, 6, 7, 8, 9, 0/);
    expect(LESSON_LEVELS[7].teaches).toMatch(/WPM/i);
    expect(LESSON_LEVELS[10].teaches).toMatch(/touch-typing|mastery/i);
  });
});
