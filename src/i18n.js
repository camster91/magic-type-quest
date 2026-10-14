import { supportedLocales } from './locales.js';

export const dictionaries = {
  en: {
    'cloudLogin.join': 'Join class online', 'cloudLogin.joining': 'Joining your class…',
    'cloudLogin.joined': 'You’re in! Your teacher can now see your progress.',
    'cloudLogin.bad-code': 'Type the class code from your teacher first.',
    'cloudLogin.unknown-class': 'We couldn’t find that class. Check the code with your teacher.',
    'cloudLogin.offline': 'Connect to the internet to join your class online.',
    'cloudLogin.sign-in-failed': 'Joining didn’t work. Try again or ask your teacher.',
    'cloudLogin.disabled': 'Online classes aren’t turned on yet.',
    'plant.title': 'Plants I’ve grown', 'plant.count': '{count} planted',
    'plant.today': 'Today’s plant: {plant}. Practise today to plant it.',
    'plant.plantedToday': '{plant} planted today!', 'plant.waiting': 'Today’s plant: {plant}',
    'plant.none': 'Practise on any day to plant that day’s flower.',
    'plant.sunflower': 'Sunflower', 'plant.lupine': 'Lupine', 'plant.blackEyedSusan': 'Black-eyed Susan',
    'plant.coneflower': 'Coneflower', 'plant.beeBalm': 'Bee balm', 'plant.wildRose': 'Wild rose',
    'plant.milkweed': 'Milkweed', 'plant.clover': 'Clover', 'plant.goldenrod': 'Goldenrod', 'plant.aster': 'Aster',
    'cloudLogin.bad-link': 'That link code didn’t work. It may be too old. Get a new one on your other device.',
    'cloudLogin.not-joined': 'Join your class online on this device first.',
    'link.hint': 'Play in class on more than one device? Get a link code here and type it on your other device.',
    'link.get': 'Get a code for my other devices',
    'link.made': 'Type this code in “Have a code?” on your other device. It works for 14 days.',
    'link.linked': 'Devices linked! Your progress is here now.',
    'parentLock.title': 'Grown-up lock',
    'parentLock.off': 'Add a PIN so only a grown-up can delete progress, change the class, use a code or add players.',
    'parentLock.locked': 'Grown-up settings are locked.',
    'parentLock.unlocked': 'Grown-up settings are unlocked until this tab is closed.',
    'parentLock.pin': 'PIN (4 to 8 digits)', 'parentLock.confirm': 'Type the PIN again',
    'parentLock.set': 'Set PIN', 'parentLock.unlock': 'Unlock', 'parentLock.lock': '🔒 Lock', 'parentLock.remove': 'Remove PIN',
    'parentLock.invalid': 'Use 4 to 8 digits.', 'parentLock.mismatch': 'The two PINs do not match.',
    'parentLock.wrong': 'That PIN is not right.', 'parentLock.wait': 'Too many tries. Wait {seconds} seconds.',
    'parentLock.needed': 'Ask a grown-up to unlock this with the PIN.',
    'parentLock.forgot': 'Forgot the PIN? Clearing this site’s data in the browser removes it, along with the progress saved here.',
    'restore.title': 'My Save Code',
    'restore.hint': 'Write this code down. Type it on another device to bring your progress with you.',
    'restore.copy': 'Copy', 'restore.copied': 'Copied!',
    'restore.enterLabel': 'Have a code? Type it here',
    'restore.button': 'Restore progress',
    'restore.invalid': 'That code doesn’t look right. Check each letter and try again.',
    'restore.done': 'Progress restored! Welcome back.',
    'a11y.settings': 'Reading and play', 'a11y.font': 'Letters', 'a11y.fontDefault': 'Standard',
    'a11y.fontReadable': 'Easy-read (Atkinson Hyperlegible)', 'a11y.fontDyslexic': 'OpenDyslexic',
    'a11y.highContrast': 'High contrast', 'a11y.relaxed': 'Relaxed mode: no time pressure',
    'a11y.relaxedHint': 'Words wait for you and the Daily Moment has no clock.',
    'players.title': 'Players on this device', 'players.add': '➕ Add a player', 'players.switchTo': 'Switch to {name}', 'players.onlyOne': 'Brothers and sisters can each have their own player here.', 'players.cloudOnly': 'Signed in to a class account. Sign out to switch players on this device.',
    'class.assignment': 'Your teacher asks: finish Level {level} by {due}.', 'class.assignmentNoDue': 'Your teacher asks: finish Level {level}.',
    'class.assignmentDone': 'Assignment done: Level {level}! 🎉', 'class.words': '📝 Practice class words',
    'fieldguide.title': 'Field Guide', 'fieldguide.new': 'New Field Guide card!',
    'fieldguide.locked': 'Finish Level {level} to discover', 'fieldguide.count': '{found} of {total} found',
    'fieldguide.monarch.name': 'Monarch butterfly', 'fieldguide.monarch.fact': 'Monarch caterpillars eat only milkweed leaves.',
    'fieldguide.bumblebee.name': 'Bumble bee', 'fieldguide.bumblebee.fact': 'Bumble bees carry pollen in little baskets on their back legs.',
    'fieldguide.bluebird.name': 'Eastern bluebird', 'fieldguide.bluebird.fact': 'Bluebirds nest in tree holes and in nest boxes people put up.',
    'fieldguide.milkweed.name': 'Milkweed', 'fieldguide.milkweed.fact': 'Milkweed seeds float away on soft, silky fluff.',
    'sound.on': 'Sound on', 'sound.off': 'Sound off',
    'game.meadowRestored': 'Meadow restored!', 'game.starsEarned': '{count} of 3 stars',
    'nav.lessons': 'Lessons', 'nav.practice': 'Practice', 'nav.garden': 'Garden', 'nav.profile': 'Profile',
    'nav.parents': 'Parents', 'nav.progress': 'Progress', 'nav.schools': 'For Schools', 'nav.back': 'Back', 'nav.allLessons': 'All Lessons',
    'menu.cta': 'Type to plant', 'menu.daily': '60-second Daily Moment', 'menu.lowStress': '60s · low stress',
  
    'profile.title': 'My Profile', 'profile.name': 'Your Name', 'profile.language': 'Language',
    'profile.stars': 'Stars', 'profile.best': 'Best Score', 'profile.words': 'Words', 'profile.achievements': 'Achievements',
    'profile.classCode': 'Class Code', 'profile.classPlaceholder': 'Enter code (e.g. ABC123)',
    'profile.classHint': 'Ask your teacher for a class code to share your progress.',
    'profile.voice': 'Voice Narration', 'profile.foxVoice': 'Fox voice', 'profile.save': 'Save Profile',
    'metric.score': 'Score', 'metric.finalScore': 'Final Score', 'metric.accuracy': 'Accuracy', 'metric.words': 'Words', 'metric.wordsTyped': 'Words Typed',
    'garden.title': 'My Garden', 'garden.empty': 'Your garden is empty!', 'garden.emptyHint': 'Complete levels to plant flowers here.',
    'game.level': 'Level {level}', 'game.combo': '🔥 {count} Combo!', 'game.typeWord': 'Type the word!',
    'game.levelName': 'Level {level} · {name}', 'game.levelCleared': 'Level {level} cleared — try the next!',
    'game.levelUnlock': 'Master the {name} to unlock Lv {level}', 'game.mastery': 'Keep going to become a Typing Master!',
    'game.shift': 'Hold SHIFT for capital letters!', 'game.useFinger': 'Use your {finger}',
    'game.paused': 'Paused', 'game.resume': 'Resume', 'game.quit': 'Quit to Menu', 'game.over': 'Game Over...',
    'game.levelComplete': 'Level Complete! 🌟', 'game.levelCompleteNamed': 'Level {level} Complete!', 'game.complete': 'Game Complete!', 'game.next': 'Next Level',
    'daily.title': 'Daily Moment', 'daily.subtitle': '60 seconds of focused typing',
    'daily.intro': 'No pressure. Type what you can. We will cheer you on!',
    'daily.complete': 'Daily Moment complete!', 'daily.summaryOne': '1 word · {wpm} WPM · {accuracy}% accuracy',
    'daily.summaryMany': '{count} words · {wpm} WPM · {accuracy}% accuracy',
    'drill.complete': 'Weak-key drill complete!', 'drill.summaryOne': '1 practice word · {wpm} WPM · {accuracy}% accuracy',
    'drill.summaryMany': '{count} practice words · {wpm} WPM · {accuracy}% accuracy',
    'daily.questDone': 'Quest complete!', 'practice.type': 'Type: {word}',
    'practice.wordProgress': 'Word {current} of {total}',
    'menu.dailyQuests': 'Daily Quests', 'lesson.pick': 'Pick Your Adventure!', 'practice.title': 'Practice Power!',
    'profile.delete': 'Delete local progress',
    'profile.deleteHint': 'Removes this student’s profile, progress, and class membership from this browser. It does not delete school cloud data.',
    'profile.deleteConfirm': 'Delete this student’s BloomType progress from this browser? This cannot be undone.',
    'profile.deleted': 'Progress deleted', 'profile.deletedDesc': 'This browser no longer stores the student profile.',
    'profile.deleteCloud': 'Delete cloud and local progress',
    'profile.deleteCloudConfirm': 'Permanently delete this student’s cloud and browser progress, including class and session records? This cannot be undone.',
    'profile.deletingCloud': 'Deleting cloud progress…',
    'profile.deleteCloud.not-authenticated': 'Cloud deletion requires an authenticated school session.',
    'profile.deleteCloud.offline': 'Reconnect to the internet before deleting cloud progress.',
    'profile.deleteCloud.delete-failed': 'Cloud progress was not deleted. Try again or contact the school administrator.',
    'profile.cloudDeleted': 'Cloud progress deleted',
    'profile.cloudDeletedDesc': 'Cloud and browser progress were deleted, and this browser was signed out.',
    'profile.cloudDeletedSignoutWarning': 'Cloud and browser progress were deleted, but sign-out failed. Close BloomType and ask the school administrator for help before continuing.',
    'profile.exportLocal': 'Download local progress',
    'profile.exportLocalHint': 'Downloads this browser’s student profile as JSON.',
    'profile.exportCloud': 'Download school cloud progress',
    'profile.exportingCloud': 'Preparing the complete cloud export…',
    'profile.exportCloud.not-authenticated': 'Cloud export requires an authenticated school session.',
    'profile.exportCloud.offline': 'Reconnect to the internet before exporting cloud progress.',
    'profile.exportCloud.export-failed': 'Cloud progress could not be exported. Try again or contact the school administrator.',
    'profile.exportCloudDone': 'Cloud progress downloaded.',
    'garden.planted': '{count} flowers planted', 'garden.plantedLabel': 'flowers planted', 'achievement.unlocked': 'Achievement Unlocked!',
    'practice.master': 'Practice Master', 'practice.lessonComplete': 'Lesson {name} Complete!',
    'practice.wordTyped': 'Word Typed!', 'practice.typedWord': 'You typed “{word}”!',
    'a11y.dailyStreak': 'Plants grown', 'a11y.yourProgress': 'Your progress',
    'a11y.startDaily': 'Start a 60-second Daily Moment', 'a11y.keysLearned': 'Keys you have learned',
    'a11y.petCompanion': 'Your pet companion', 'a11y.petEvolution': 'Pet evolution stage',
    'a11y.otherScreens': 'Other screens', 'a11y.startTyping': 'Start typing to plant flowers',
    'a11y.typingGame': 'Typing game', 'a11y.typeCurrentWord': 'Type the current word',
    'a11y.pauseGame': 'Pause game', 'a11y.liveProgress': 'Live typing progress',
    'a11y.levelProgress': 'Level progress', 'a11y.practiceProgress': 'Practice progress',
    'app.title': '🌸 BloomType - Garden Typing Adventure', 'a11y.schools': 'BloomType for schools',
    'metric.wpm': 'WPM', 'hud.levelShort': 'Lv', 'key.space': 'SPACE', 'a11y.pauseShortcut': 'Pause game (Esc)',
    'a11y.yourPet': 'Your pet', 'a11y.petAlt': '{name} pet', 'a11y.selectAvatar': 'Select {name} avatar',
    'a11y.achievementsList': 'Achievements list', 'players.unnamed': 'Player',
    'evolution.stage1': 'Sprout', 'evolution.stage2': 'Bud', 'evolution.stage3': 'Bloom',
    'avatar.flower': 'Flower', 'avatar.sunflower': 'Sunflower', 'avatar.dragon': 'Dragon', 'avatar.cat': 'Cat',
    'avatar.bunny': 'Bunny', 'avatar.fox': 'Fox', 'avatar.panda': 'Panda', 'avatar.robot': 'Robot',
    'avatar.owl': 'Owl', 'avatar.puppy': 'Puppy', 'common.colon': ':',
    'chapter.new': 'New Chapter', 'chapter.ready': 'Ready when you are.', 'chapter.start': 'Start lesson',
    'evolution.badge': 'Evolution!', 'common.continue': 'Continue',
    'game.bestCombo': 'Best Combo', 'game.replay': 'Replay', 'game.almost': 'Almost!',
    'game.overMessage': 'The words snuck past us! Bloom believes in you — try again!',
    'game.tryAgain': 'Try Again', 'game.drillWeak': 'Drill Weak Keys', 'game.mainMenu': 'Main Menu',
    'tutorial.welcome': 'Welcome to BloomType!', 'tutorial.welcomeLine1': 'Words bloom into flowers as you type them!',
    'tutorial.welcomeLine2': 'Type each letter before the word reaches the bottom.',
    'tutorial.how': 'How to Play', 'tutorial.howLine1': 'Look at the word at the top of the screen.',
    'tutorial.howLine2': 'Press ONE key at a time on your keyboard.',
    'tutorial.howLine3': 'Watch the keyboard light up to show you which finger to use!',
    'tutorial.scores': 'Get High Scores!', 'tutorial.scoreLine1': 'Chain words for COMBO bonuses! 🔥',
    'tutorial.scoreLine2': 'Each word plants a flower in your garden! 🌺',
    'tutorial.scoreLine3': 'Press Space to skip a tricky word.', 'tutorial.next': 'Next', 'tutorial.begin': 'Begin! 🌸',
    'finger.title': 'Home Row Position', 'finger.text': 'Rest your fingers here! 🏠', 'finger.gotIt': 'Got it! ✨',
    'finger.lp': 'left pinky', 'finger.lr': 'left ring finger', 'finger.lm': 'left middle finger', 'finger.li': 'left index finger',
    'finger.ri': 'right index finger', 'finger.rm': 'right middle finger', 'finger.rr': 'right ring finger', 'finger.rp': 'right pinky',
    'finger.leftHand': 'left hand', 'finger.rightHand': 'right hand',
    'finger.useLeftPinky': 'Use your left pinky', 'finger.useLeftHand': 'Use your left hand',
    'finger.withShift': '{finger} (hold the {side} Shift key!)', 'finger.leftShift': 'left', 'finger.rightShift': 'right',
    'lesson.completeToUnlock': 'Complete level {level} to unlock', 'lesson.locked': 'Locked',
    'map.title': 'Your world map', 'map.hint': 'Tap a place to see its levels.',
    'map.meadow': 'Meadow', 'map.pond': 'Pond', 'map.forest': 'Forest', 'map.shore': 'Shore', 'map.mountain': 'Mountain',
    'map.levels': 'Levels {first} and {last}', 'map.progress': '{done} of {total} levels done',
    'map.restored': 'All restored!', 'map.lockedHint': 'Finish level {level} to open',
    'a11y.masteredKey': '{key} mastered', 'a11y.learningKey': '{key} learning', 'game.allLevelsCleared': '🏆 All levels cleared!',
    'pet.celebrate': 'Yay! 🎉',
    'pet.keepStreakOne': 'Our first plant! 🌱', 'pet.keepStreakMany': '{count} plants in our meadow! 🌱', 'pet.plantWaiting': 'Let’s plant {plant} today!',
    'pet.greeting': 'Hi! I’m {pet} 🌸', 'pet.tryAgain': 'Try again!', 'pet.dontForget': 'Don’t forget me!',
    'pet.saysType': 'Bloom says: Type!', 'pet.dailySupport': '“I will be right here with you.” — Bloom',
    'evolution.2.title': 'Bloom is Growing!', 'evolution.2.desc': 'Your typing helped Bloom sprout new leaves!',
    'evolution.2.line': '“I feel stronger! Let’s type even faster!” — Bloom',
    'evolution.3.title': 'Legend Bloom!', 'evolution.3.desc': 'Bloom has fully bloomed! A true typing legend!',
    'evolution.3.line': '“We’re UNSTOPPABLE together!” — Bloom',
  },
};

export { supportedLocales };
let activeLocale = 'en';

// French and Spanish live in src/lang/ and load only for a player who uses
// them, so the home page never downloads them for everyone else (about
// 45 KB; e2e/page-weight.e2e.js). Until a language arrives, t() falls back
// to English: wait for loadLocale() (or use whenLocaleLoaded()) before
// switching to it.
const localeModules = {
  fr: () => import('./lang/fr.js'),
  es: () => import('./lang/es.js'),
};
const localePacks = {};
const localeLoading = {};
const packListeners = [];

function supported(locale) {
  return supportedLocales.includes(locale) ? locale : 'en';
}

/** True when `locale`'s strings are here (English always is). */
export function isLocaleLoaded(locale) {
  const name = supported(locale);
  return name === 'en' || name in localePacks;
}

/**
 * Loads a language's strings. Resolves once they are in place; never
 * rejects (a failed download leaves English showing, and the next call
 * tries again).
 */
export function loadLocale(locale) {
  const name = supported(locale);
  if (isLocaleLoaded(name)) return Promise.resolve();
  localeLoading[name] ||= localeModules[name]()
    .then((pack) => {
      localePacks[name] = pack;
      dictionaries[name] = pack.ui;
      for (const listener of packListeners) listener(name, pack);
    })
    .catch(() => {})
    .finally(() => { delete localeLoading[name]; });
  return localeLoading[name];
}

/** Runs `callback` now if `locale` is loaded, or once it has loaded. */
export function whenLocaleLoaded(locale, callback) {
  if (isLocaleLoaded(locale)) callback();
  else loadLocale(locale).then(callback);
}

/**
 * Calls `listener(locale, pack)` for each language pack, those already
 * loaded and those still to come. Modules with their own translated content
 * (story lines, lesson names) take their part of the pack this way.
 */
export function onLocalePack(listener) {
  packListeners.push(listener);
  for (const [name, pack] of Object.entries(localePacks)) listener(name, pack);
}

export function setLocale(locale) {
  activeLocale = supported(locale);
  document.documentElement.lang = activeLocale;
  return activeLocale;
}

export function getLocale() { return activeLocale; }

export function t(key, values = {}) {
  const template = dictionaries[activeLocale]?.[key] ?? dictionaries.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}

export function formatNumber(value, options) {
  return new Intl.NumberFormat(activeLocale, options).format(value);
}

export function formatDate(value, options = { dateStyle: 'medium' }) {
  return new Intl.DateTimeFormat(activeLocale, options).format(new Date(value));
}

const fingerKeyByEnglishLabel = {
  'Left Pinky': 'finger.lp', 'Left Ring': 'finger.lr', 'Left Middle': 'finger.lm', 'Left Index': 'finger.li',
  'Right Index': 'finger.ri', 'Right Middle': 'finger.rm', 'Right Ring': 'finger.rr', 'Right Pinky': 'finger.rp',
};

const avatarNameKeyByEmoji = {
  '🌸': 'flower', '🌻': 'sunflower', '🐉': 'dragon', '🐱': 'cat', '🐰': 'bunny',
  '🦊': 'fox', '🐼': 'panda', '🤖': 'robot', '🦉': 'owl', '🐶': 'puppy',
};

export function localizeAvatarName(avatar) {
  return t(`avatar.${avatarNameKeyByEmoji[avatar] || 'flower'}`);
}

export function localizeFingerLabel(label) {
  const baseLabel = Object.keys(fingerKeyByEnglishLabel).find((candidate) => label?.startsWith(candidate));
  if (!baseLabel) return label;
  const finger = t(fingerKeyByEnglishLabel[baseLabel]);
  if (label.includes('hold RIGHT Shift')) return t('finger.withShift', { finger, side: t('finger.rightShift') });
  if (label.includes('hold LEFT Shift')) return t('finger.withShift', { finger, side: t('finger.leftShift') });
  return finger;
}

export function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });
  root.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
  });
  root.querySelectorAll('[data-i18n-title]').forEach((element) => {
    element.title = t(element.dataset.i18nTitle);
  });
  root.querySelectorAll('[data-i18n-alt]').forEach((element) => {
    element.alt = t(element.dataset.i18nAlt);
  });
  root.querySelectorAll('[data-avatar-name]').forEach((element) => {
    element.setAttribute('aria-label', t('a11y.selectAvatar', { name: t(`avatar.${element.dataset.avatarName}`) }));
  });
  root.querySelectorAll('.key[data-finger]').forEach((element) => {
    const key = `finger.${element.dataset.finger}`;
    if (dictionaries.en[key]) element.dataset.fingerLabel = t(key);
  });
}
