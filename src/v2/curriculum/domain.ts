export type LowercaseKey = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z';
export type DigitKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
export type PunctuationKey = ',' | '.' | ';' | '?' | '!';
export type KeyId = LowercaseKey | DigitKey | PunctuationKey | 'Space' | 'Shift';
export type FingerId = 'leftPinky' | 'leftRing' | 'leftMiddle' | 'leftIndex' | 'leftThumb' | 'rightThumb' | 'rightIndex' | 'rightMiddle' | 'rightRing' | 'rightPinky';
export type HandId = 'left' | 'right';
export type LessonId = 'meadow-fj' | 'meadow-growth' | 'meadow-review' | 'forest-upper' | 'wetlands-lower' | 'river-shift' | 'mountain-numbers' | 'mountain-punctuation' | 'reserve-fluency';
export type LocaleId = 'en' | 'fr' | 'es';
export type MasteryLabel = 'new' | 'learning' | 'familiar' | 'strong' | 'mastered';
export type PracticeMode = 'lesson' | 'practice' | 'daily' | 'drill' | 'review';

export interface SkillSet { readonly keys: readonly KeyId[]; }
export interface PrerequisiteSet { readonly lessons: readonly LessonId[]; readonly keys: readonly KeyId[]; }
export interface LocaleRules { readonly locales: readonly LocaleId[]; readonly accentedCharacters: readonly string[]; readonly fallback: 'patternsOnly'; }
export interface ShiftRule { readonly requiredForCapitals: boolean; readonly introduced: boolean; }
export interface PunctuationRule { readonly allowed: readonly PunctuationKey[]; readonly requiresShift: readonly ('?' | '!')[]; }
export interface PracticeItem {
  readonly id: string;
  readonly text: string;
  readonly kind: 'word' | 'pattern';
  readonly locales: readonly LocaleId[];
}
export interface LessonDefinition {
  readonly id: LessonId;
  readonly displayNameKey: string;
  readonly introducedKeys: readonly KeyId[];
  readonly reviewKeys: readonly KeyId[];
  readonly allowedAssessedKeys: readonly KeyId[];
  readonly prerequisites: PrerequisiteSet;
  readonly targetItemSource: readonly PracticeItem[];
  readonly itemLength: { readonly min: number; readonly max: number };
  readonly shift: ShiftRule;
  readonly punctuation: PunctuationRule;
  readonly numbersAllowed: boolean;
  readonly locale: LocaleRules;
  readonly completion: { readonly requiredKeys: 'introduced'; readonly minimumState: MasteryLabel };
  readonly contentVersion: number;
}

export const HOME_KEYS: readonly LowercaseKey[] = ['f', 'j', 'a', 's', 'd', 'k', 'l', 'g', 'h'];
export const UPPER_KEYS: readonly LowercaseKey[] = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
export const LOWER_KEYS: readonly LowercaseKey[] = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];
export const DIGIT_KEYS: readonly DigitKey[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
export const PUNCTUATION_KEYS: readonly PunctuationKey[] = [',', '.', ';', '?', '!'];

const ALL_LOCALES: readonly LocaleId[] = ['en', 'fr', 'es'];
const PATTERN = (id: string, text: string): PracticeItem => ({ id, text, kind: 'pattern', locales: ALL_LOCALES });
const WORD = (id: string, text: string): PracticeItem => ({ id, text, kind: 'word', locales: ['en'] });

function lesson(definition: Omit<LessonDefinition, 'locale' | 'completion' | 'contentVersion' | 'itemLength'> & {
  itemLength?: LessonDefinition['itemLength'];
}): LessonDefinition {
  return {
    ...definition,
    locale: { locales: ALL_LOCALES, accentedCharacters: [], fallback: 'patternsOnly' },
    completion: { requiredKeys: 'introduced', minimumState: 'familiar' },
    itemLength: definition.itemLength ?? { min: 2, max: 24 },
    contentVersion: 1,
  };
}

const NONE: readonly PunctuationKey[] = [];
const NO_SHIFT: ShiftRule = { requiredForCapitals: false, introduced: false };
const YES_SHIFT: ShiftRule = { requiredForCapitals: true, introduced: false };
const NO_PUNCTUATION: PunctuationRule = { allowed: NONE, requiresShift: [] };

export const LESSONS: readonly LessonDefinition[] = [
  lesson({ id: 'meadow-fj', displayNameKey: 'lesson.meadowFj', introducedKeys: ['f', 'j'], reviewKeys: [], allowedAssessedKeys: ['f', 'j'], prerequisites: { lessons: [], keys: [] }, targetItemSource: [PATTERN('fj', 'fj'), PATTERN('jf', 'jf'), PATTERN('ffjj', 'ffjj')], shift: NO_SHIFT, punctuation: NO_PUNCTUATION, numbersAllowed: false }),
  lesson({ id: 'meadow-growth', displayNameKey: 'lesson.meadowGrowth', introducedKeys: ['a', 's', 'd', 'k', 'l', 'Space'], reviewKeys: ['f', 'j'], allowedAssessedKeys: ['f', 'j', 'a', 's', 'd', 'k', 'l', 'Space'], prerequisites: { lessons: ['meadow-fj'], keys: ['f', 'j'] }, targetItemSource: [PATTERN('home-pattern', 'asdf jkl'), WORD('dad', 'dad'), WORD('sad', 'sad'), WORD('ask', 'ask'), WORD('fall', 'fall')], shift: NO_SHIFT, punctuation: NO_PUNCTUATION, numbersAllowed: false }),
  lesson({ id: 'meadow-review', displayNameKey: 'lesson.meadowReview', introducedKeys: ['g', 'h'], reviewKeys: ['f', 'j', 'a', 's', 'd', 'k', 'l', 'Space'], allowedAssessedKeys: [...HOME_KEYS, 'Space'], prerequisites: { lessons: ['meadow-growth'], keys: ['f', 'j', 'a', 's', 'd', 'k', 'l', 'Space'] }, targetItemSource: [PATTERN('gh', 'gh'), PATTERN('home-review', 'asdf ghjkl'), WORD('glad', 'glad'), WORD('half', 'half'), WORD('glass', 'glass')], shift: NO_SHIFT, punctuation: NO_PUNCTUATION, numbersAllowed: false }),
  lesson({ id: 'forest-upper', displayNameKey: 'lesson.forestUpper', introducedKeys: UPPER_KEYS, reviewKeys: [...HOME_KEYS, 'Space'], allowedAssessedKeys: [...HOME_KEYS, 'Space', ...UPPER_KEYS], prerequisites: { lessons: ['meadow-review'], keys: [...HOME_KEYS, 'Space'] }, targetItemSource: [PATTERN('upper-pattern', 'qwertyuiop'), WORD('tree', 'tree'), WORD('quiet', 'quiet'), WORD('type', 'type'), WORD('upper', 'upper')], shift: NO_SHIFT, punctuation: NO_PUNCTUATION, numbersAllowed: false }),
  lesson({ id: 'wetlands-lower', displayNameKey: 'lesson.wetlandsLower', introducedKeys: LOWER_KEYS, reviewKeys: [...HOME_KEYS, 'Space', ...UPPER_KEYS], allowedAssessedKeys: [...HOME_KEYS, 'Space', ...UPPER_KEYS, ...LOWER_KEYS], prerequisites: { lessons: ['forest-upper'], keys: [...UPPER_KEYS] }, targetItemSource: [PATTERN('lower-pattern', 'zxcv bnm'), WORD('zoo', 'zoo'), WORD('box', 'box'), WORD('van', 'van'), WORD('moss', 'moss')], shift: NO_SHIFT, punctuation: NO_PUNCTUATION, numbersAllowed: false }),
  lesson({ id: 'river-shift', displayNameKey: 'lesson.riverShift', introducedKeys: ['Shift'], reviewKeys: [...HOME_KEYS, 'Space', ...UPPER_KEYS, ...LOWER_KEYS], allowedAssessedKeys: [...HOME_KEYS, 'Space', ...UPPER_KEYS, ...LOWER_KEYS, 'Shift'], prerequisites: { lessons: ['wetlands-lower'], keys: [...LOWER_KEYS] }, targetItemSource: [PATTERN('shift-pattern', 'Ff Jj'), WORD('Fox', 'Fox'), WORD('Tree', 'Tree'), WORD('River', 'River')], shift: { requiredForCapitals: true, introduced: true }, punctuation: NO_PUNCTUATION, numbersAllowed: false }),
  lesson({ id: 'mountain-numbers', displayNameKey: 'lesson.mountainNumbers', introducedKeys: DIGIT_KEYS, reviewKeys: [...HOME_KEYS, 'Space', ...UPPER_KEYS, ...LOWER_KEYS, 'Shift'], allowedAssessedKeys: [...HOME_KEYS, 'Space', ...UPPER_KEYS, ...LOWER_KEYS, 'Shift', ...DIGIT_KEYS], prerequisites: { lessons: ['river-shift'], keys: ['Shift'] }, targetItemSource: [PATTERN('number-run', '123 456'), PATTERN('number-review', '7890'), PATTERN('number-alternate', '2468 1357')], shift: YES_SHIFT, punctuation: NO_PUNCTUATION, numbersAllowed: true }),
  lesson({ id: 'mountain-punctuation', displayNameKey: 'lesson.mountainPunctuation', introducedKeys: PUNCTUATION_KEYS, reviewKeys: [...HOME_KEYS, 'Space', ...UPPER_KEYS, ...LOWER_KEYS, 'Shift', ...DIGIT_KEYS], allowedAssessedKeys: [...HOME_KEYS, 'Space', ...UPPER_KEYS, ...LOWER_KEYS, 'Shift', ...DIGIT_KEYS, ...PUNCTUATION_KEYS], prerequisites: { lessons: ['mountain-numbers'], keys: [...DIGIT_KEYS, 'Shift'] }, targetItemSource: [PATTERN('punctuation-basic', 'a,b.'), PATTERN('punctuation-shift', 'a; b!'), WORD('question', 'why?')], shift: YES_SHIFT, punctuation: { allowed: PUNCTUATION_KEYS, requiresShift: ['?', '!'] }, numbersAllowed: true }),
  lesson({ id: 'reserve-fluency', displayNameKey: 'lesson.reserveFluency', introducedKeys: [], reviewKeys: [...HOME_KEYS, 'Space', ...UPPER_KEYS, ...LOWER_KEYS, 'Shift', ...DIGIT_KEYS, ...PUNCTUATION_KEYS], allowedAssessedKeys: [...HOME_KEYS, 'Space', ...UPPER_KEYS, ...LOWER_KEYS, 'Shift', ...DIGIT_KEYS, ...PUNCTUATION_KEYS], prerequisites: { lessons: ['mountain-punctuation'], keys: [...PUNCTUATION_KEYS] }, targetItemSource: [PATTERN('combined-review', 'asdf qwer zxcv 123'), WORD('field-note', 'Fox at 2.'), WORD('meadow', 'meadow')], shift: YES_SHIFT, punctuation: { allowed: PUNCTUATION_KEYS, requiresShift: ['?', '!'] }, numbersAllowed: true }),
];

export const LESSON_ORDER: readonly LessonId[] = LESSONS.map((entry) => entry.id);

export function getLesson(id: LessonId): LessonDefinition {
  const found = LESSONS.find((entry) => entry.id === id);
  if (!found) throw new Error(`Unknown lesson: ${id}`);
  return found;
}

export function getNextLesson(profile: { readonly completedLessonIds: readonly LessonId[] }): LessonDefinition | null {
  return LESSONS.find((entry) => entry.prerequisites.lessons.every((id) => profile.completedLessonIds.includes(id)) && !profile.completedLessonIds.includes(entry.id)) ?? null;
}

export function getAllowedKeys(id: LessonId): readonly KeyId[] { return getLesson(id).allowedAssessedKeys; }

export function getPracticeItems(id: LessonId, locale: LocaleId): readonly PracticeItem[] {
  const definition = getLesson(id);
  if (!definition.locale.locales.includes(locale)) throw new Error(`Unsupported locale: ${locale}`);
  return definition.targetItemSource.filter((item) => item.locales.includes(locale));
}

export function validatePracticeItem(item: PracticeItem, id: LessonId, locale: LocaleId, _mode: PracticeMode = 'lesson'): readonly string[] {
  const definition = getLesson(id);
  const failures: string[] = [];
  if (!definition.locale.locales.includes(locale) || !item.locales.includes(locale)) failures.push(`Locale ${locale} is not reviewed for ${item.id}`);
  if (item.text.length < definition.itemLength.min || item.text.length > definition.itemLength.max) failures.push(`Length outside ${definition.itemLength.min}–${definition.itemLength.max}`);
  const allowed = new Set(definition.allowedAssessedKeys);
  for (const char of item.text) {
    if (/[A-Z]/u.test(char)) {
      if (!definition.shift.requiredForCapitals || !allowed.has('Shift')) failures.push(`Shift not taught for ${char}`);
      if (!allowed.has(char.toLowerCase() as LowercaseKey)) failures.push(`Unintroduced key ${char}`);
    } else if (/[a-z]/u.test(char)) {
      if (!allowed.has(char as LowercaseKey)) failures.push(`Unintroduced key ${char}`);
    } else if (/[0-9]/u.test(char)) {
      if (!definition.numbersAllowed || !allowed.has(char as DigitKey)) failures.push(`Number not taught: ${char}`);
    } else if (char === ' ') {
      if (!allowed.has('Space')) failures.push('Space not taught');
    } else if (PUNCTUATION_KEYS.includes(char as PunctuationKey)) {
      if (!definition.punctuation.allowed.includes(char as PunctuationKey) || !allowed.has(char as PunctuationKey)) failures.push(`Punctuation not taught: ${char}`);
      if ((char === '?' || char === '!') && !allowed.has('Shift')) failures.push(`Shift not taught for ${char}`);
    } else if (!definition.locale.accentedCharacters.includes(char)) failures.push(`Undocumented locale character ${char}`);
  }
  return failures;
}

export function auditCurriculum(): readonly string[] {
  const failures: string[] = [];
  const previouslyIntroduced = new Set<KeyId>();
  const previousLessons = new Set<LessonId>();
  for (const definition of LESSONS) {
    const label = definition.id;
    if (!definition.prerequisites.lessons.every((id) => previousLessons.has(id))) failures.push(`${label}: future lesson prerequisite`);
    if (!definition.prerequisites.keys.every((key) => previouslyIntroduced.has(key))) failures.push(`${label}: unintroduced key prerequisite`);
    if (!definition.reviewKeys.every((key) => previouslyIntroduced.has(key))) failures.push(`${label}: review key not previously introduced`);
    if (definition.introducedKeys.some((key) => previouslyIntroduced.has(key))) failures.push(`${label}: duplicate key introduction`);
    const permitted = new Set([...previouslyIntroduced, ...definition.introducedKeys]);
    if (definition.allowedAssessedKeys.some((key) => !permitted.has(key))) failures.push(`${label}: allowed assessed key not taught`);
    if (definition.introducedKeys.some((key) => !definition.allowedAssessedKeys.includes(key))) failures.push(`${label}: introduced key missing from assessment contract`);
    if (definition.targetItemSource.length === 0) failures.push(`${label}: no content`);
    for (const locale of definition.locale.locales) {
      const items = getPracticeItems(definition.id, locale);
      if (items.length === 0) failures.push(`${label}/${locale}: no reviewed content`);
      for (const item of items) {
        for (const failure of validatePracticeItem(item, definition.id, locale)) failures.push(`${label}/${locale}/${item.id}: ${failure}`);
      }
    }
    definition.introducedKeys.forEach((key) => previouslyIntroduced.add(key));
    previousLessons.add(label);
  }
  return failures;
}
