import { getLocale, onLocalePack } from './i18n.js';

// Filled per language as it loads (src/lang/, see loadLocale in i18n.js).
// English needs no entry: the lessons, quests and chapters are written in it.
const content = {};
onLocalePack((locale, pack) => { content[locale] = pack.content; });

function localeContent(section) {
  return content[getLocale()]?.[section];
}

export function localizeLesson(lesson) {
  return lesson ? { ...lesson, ...(localeContent('lessons')?.[lesson.id] || {}) } : lesson;
}

export function localizeQuest(quest) {
  const translated = localeContent('quests')?.[quest.templateId];
  if (!translated) return quest;
  return {
    ...quest,
    title: translated.title,
    desc: translated.desc.replace('{target}', String(quest.target)),
  };
}

export function localizeChapter(chapter, level) {
  return chapter ? { ...chapter, ...(localeContent('chapters')?.[level] || {}) } : chapter;
}

export function localizeAchievement(achievement) {
  const translated = localeContent('achievements')?.[achievement.id];
  if (!translated) return achievement;
  return { ...achievement, title: translated[0], desc: translated[1] };
}

export function localizeAchievementCategory(key, category) {
  return { ...category, label: localeContent('achievementCategories')?.[key] || category.label };
}

export const translatedContent = content;
