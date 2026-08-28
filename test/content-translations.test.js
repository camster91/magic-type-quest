import { beforeEach, describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../src/achievements.js';
import {
  localizeAchievement, localizeChapter, localizeLesson, localizeQuest, translatedContent,
} from '../src/contentTranslations.js';
import { LESSON_LEVELS } from '../src/lessonLevels.js';
import { generateDailyQuests } from '../src/quests.js';
import { CHAPTERS } from '../src/story.js';
import { setLocale } from '../src/i18n.js';

beforeEach(() => {
  globalThis.document = { documentElement: { lang: 'en' } };
  setLocale('en');
});

describe('localized curriculum content', () => {
  it('covers every lesson, achievement, quest template, and chapter in French and Spanish', () => {
    const lessonIds = Object.keys(LESSON_LEVELS).sort();
    const achievementIds = ACHIEVEMENTS.map(({ id }) => id).sort();
    const questIds = ['accuracy', 'combo', 'complete_level', 'no_skip', 'practice', 'reach_wpm', 'type_words'];
    const chapterIds = Object.keys(CHAPTERS).sort();

    for (const locale of ['fr', 'es']) {
      const localeContent = translatedContent[locale];
      expect(Object.keys(localeContent.lessons).sort(), `${locale} lessons`).toEqual(lessonIds);
      expect(Object.keys(localeContent.achievements).sort(), `${locale} achievements`).toEqual(achievementIds);
      expect(Object.keys(localeContent.quests).sort(), `${locale} quests`).toEqual(questIds);
      expect(Object.keys(localeContent.chapters).sort(), `${locale} chapters`).toEqual(chapterIds);
    }
  });

  it('localizes dynamic content without changing progression identifiers', () => {
    setLocale('fr');
    const lesson = localizeLesson(LESSON_LEVELS[1]);
    const achievement = localizeAchievement(ACHIEVEMENTS[0]);
    const quest = localizeQuest(generateDailyQuests('2026-08-28')[0]);
    const chapter = localizeChapter(CHAPTERS[1], 1);

    expect(lesson.id).toBe(1);
    expect(lesson.name).toContain('Jardin');
    expect(achievement.id).toBe('speed_10');
    expect(achievement.title).toBe('Premiers pas');
    expect(quest.id).toContain('2026-08-28');
    expect(quest.desc).not.toContain('{target}');
    expect(chapter.theme).toBe('spring');
    expect(chapter.title).toBe('Le jardin s’éveille');
  });
});
