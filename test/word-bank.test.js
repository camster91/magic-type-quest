import { describe, expect, it, vi } from 'vitest';

describe('lazy word bank', () => {
  it('uses each lesson\'s own words until the full bank loads, then the bank', async () => {
    vi.resetModules();
    const lessons = await import('../src/lessonLevels.js');
    expect(lessons.hasWordBank()).toBe(false);
    const before = lessons.getLessonByLevel(1).words;
    expect(before).toEqual(lessons.LESSON_LEVELS[1].words);

    await lessons.loadWordBank();
    expect(lessons.hasWordBank()).toBe(true);
    const after = lessons.getLessonByLevel(1).words;
    expect(after.length).toBeGreaterThan(before.length);
    expect(after.every((word) => lessons.isTypableWord(word))).toBe(true);
  });

  it('keeps the word bank out of the first download', async () => {
    const { readFileSync } = await import('fs');
    const source = readFileSync('src/lessonLevels.js', 'utf8');
    expect(source).not.toMatch(/^import [^;]*from '\.\/words\.js'/m);
    expect(source).toMatch(/import\('\.\/words\.js'\)/);
  });
});
