import { BIOME_ORDER, LESSON_BIOMES, type BiomeId } from '../curriculum/biomeMapping';
import { LESSONS, type KeyId, type LessonDefinition, type LessonId, type MasteryLabel } from '../curriculum/domain';

export interface MasteryThreshold { readonly samples: number; readonly accuracy: number; }
export interface MasteryConfig {
  readonly familiar: MasteryThreshold;
  readonly strong: MasteryThreshold;
  readonly mastered: MasteryThreshold & { readonly sessions: number };
  readonly rollingWindow: number;
  readonly stableWindow: number;
  readonly demotionWindow: number;
  readonly demotionErrors: number;
  readonly lessonAccuracy: number;
  readonly lessonMinimumAttempts: number;
  readonly reviewIntervalMs: number;
  readonly latencyCeilingMs: number;
}

export const DEFAULT_MASTERY_CONFIG: MasteryConfig = {
  familiar: { samples: 12, accuracy: 0.8 },
  strong: { samples: 25, accuracy: 0.9 },
  mastered: { samples: 40, accuracy: 0.95, sessions: 2 },
  rollingWindow: 40,
  stableWindow: 10,
  demotionWindow: 10,
  demotionErrors: 3,
  lessonAccuracy: 0.8,
  lessonMinimumAttempts: 12,
  reviewIntervalMs: 24 * 60 * 60 * 1000,
  latencyCeilingMs: 12000,
};

export const MASTERY_ORDER: readonly MasteryLabel[] = ['new', 'learning', 'familiar', 'strong', 'mastered'];
export interface KeyEvidence {
  readonly key: KeyId;
  readonly introduced: boolean;
  readonly correct: number;
  readonly incorrect: number;
  readonly firstAttemptCorrect: number;
  readonly firstAttemptTotal: number;
  readonly recentCorrect: readonly boolean[];
  readonly recentLatenciesMs: readonly number[];
  readonly recentErrors: number;
  readonly lastPractisedAt: number | null;
  readonly reviewDueAt: number | null;
  readonly failedDueReview: boolean;
  readonly consecutiveSuccess: number;
  readonly sampleCount: number;
  readonly sessionIds: readonly string[];
  readonly score: number;
  readonly label: MasteryLabel;
  readonly contentVersion: number;
}
export interface MasteryProfile {
  readonly keys: Readonly<Partial<Record<KeyId, KeyEvidence>>>;
  readonly completedLessonIds: readonly LessonId[];
}
export interface TypingAttempt {
  readonly lessonId: LessonId;
  readonly targetKey: KeyId;
  readonly correct: boolean;
  readonly firstAttempt: boolean;
  readonly latencyMs?: number;
  readonly at: number;
  readonly sessionId: string;
  readonly source: 'physical' | 'touch' | 'guided';
  readonly review?: boolean;
}
export interface LessonSession {
  readonly lessonId: LessonId;
  readonly mode: 'lesson' | 'review' | 'practice' | 'drill' | 'daily';
  readonly correct: number;
  readonly incorrect: number;
  readonly unintroducedKeyViolations: number;
}

export const EMPTY_MASTERY_PROFILE: MasteryProfile = { keys: {}, completedLessonIds: [] };
const ratio = (correct: number, total: number): number => total ? correct / total : 0;
const rank = (label: MasteryLabel): number => MASTERY_ORDER.indexOf(label);

export function emptyKeyEvidence(key: KeyId, contentVersion = 1): KeyEvidence {
  return { key, introduced: false, correct: 0, incorrect: 0, firstAttemptCorrect: 0, firstAttemptTotal: 0,
    recentCorrect: [], recentLatenciesMs: [], recentErrors: 0, lastPractisedAt: null, reviewDueAt: null,
    failedDueReview: false, consecutiveSuccess: 0, sampleCount: 0, sessionIds: [], score: 0, label: 'new', contentVersion };
}

export function introduceKey(evidence: KeyEvidence): KeyEvidence {
  return evidence.introduced ? evidence : { ...evidence, introduced: true, label: 'learning' };
}

export function medianLatency(evidence: KeyEvidence): number | null {
  if (!evidence.recentLatenciesMs.length) return null;
  const sorted = [...evidence.recentLatenciesMs].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export function deriveMastery(evidence: KeyEvidence, config: MasteryConfig = DEFAULT_MASTERY_CONFIG): Pick<KeyEvidence, 'score' | 'label'> {
  if (!evidence.introduced) return { score: 0, label: 'new' };
  const accuracy = ratio(evidence.recentCorrect.filter(Boolean).length, evidence.recentCorrect.length);
  const stable = evidence.recentCorrect.slice(-config.stableWindow);
  const stableAccuracy = ratio(stable.filter(Boolean).length, stable.length);
  const slow = (medianLatency(evidence) ?? 0) > config.latencyCeilingMs;
  let candidate: MasteryLabel = 'learning';
  if (evidence.sampleCount >= config.familiar.samples && accuracy >= config.familiar.accuracy) candidate = 'familiar';
  if (evidence.sampleCount >= config.strong.samples && accuracy >= config.strong.accuracy && stable.length >= config.stableWindow && stableAccuracy >= config.strong.accuracy && !slow) candidate = 'strong';
  if (evidence.sampleCount >= config.mastered.samples && accuracy >= config.mastered.accuracy && stableAccuracy >= config.mastered.accuracy && evidence.sessionIds.length >= config.mastered.sessions && !evidence.failedDueReview && !slow) candidate = 'mastered';

  // Hysteresis: a single error can block promotion, but sustained errors or a
  // failed due review are required to lower an already attained label.
  const recent = evidence.recentCorrect.slice(-config.demotionWindow);
  const sustained = recent.length >= config.demotionWindow && recent.filter((value) => !value).length >= config.demotionErrors;
  const prior = evidence.label;
  if (rank(candidate) < rank(prior) && !sustained && !evidence.failedDueReview) candidate = prior;
  if (rank(candidate) < rank(prior) && sustained) candidate = MASTERY_ORDER[Math.max(rank(candidate), rank(prior) - 1)]!;
  if (rank(candidate) < rank(prior) && evidence.failedDueReview) candidate = MASTERY_ORDER[Math.max(rank(candidate), rank(prior) - 1)]!;
  return { score: Math.round(accuracy * 100), label: candidate };
}

export function recordAttempt(profile: MasteryProfile, attempt: TypingAttempt, config: MasteryConfig = DEFAULT_MASTERY_CONFIG): MasteryProfile {
  const lesson = LESSONS.find(({ id }) => id === attempt.lessonId);
  if (!lesson || !lesson.allowedAssessedKeys.includes(attempt.targetKey)) throw new Error(`Unintroduced key ${attempt.targetKey} in ${attempt.lessonId}`);
  if (!attempt.sessionId || !Number.isFinite(attempt.at)) throw new Error('Attempt needs a session and finite timestamp');
  const existing = introduceKey(profile.keys[attempt.targetKey] ?? emptyKeyEvidence(attempt.targetKey, lesson.contentVersion));
  if (attempt.source !== 'physical') return { ...profile, keys: { ...profile.keys, [attempt.targetKey]: existing } };
  if (attempt.latencyMs !== undefined && (!Number.isFinite(attempt.latencyMs) || attempt.latencyMs < 0)) throw new Error('Invalid latency');
  const wasDue = existing.reviewDueAt !== null && attempt.at >= existing.reviewDueAt;
  const recentCorrect = [...existing.recentCorrect, attempt.correct].slice(-config.rollingWindow);
  const updated: KeyEvidence = {
    ...existing,
    correct: existing.correct + Number(attempt.correct), incorrect: existing.incorrect + Number(!attempt.correct),
    firstAttemptCorrect: existing.firstAttemptCorrect + Number(attempt.firstAttempt && attempt.correct),
    firstAttemptTotal: existing.firstAttemptTotal + Number(attempt.firstAttempt),
    recentCorrect, recentLatenciesMs: attempt.latencyMs === undefined ? existing.recentLatenciesMs : [...existing.recentLatenciesMs, attempt.latencyMs].slice(-config.rollingWindow),
    recentErrors: recentCorrect.slice(-config.demotionWindow).filter((value) => !value).length,
    lastPractisedAt: attempt.at,
    reviewDueAt: attempt.correct ? attempt.at + config.reviewIntervalMs : existing.reviewDueAt,
    failedDueReview: attempt.review && wasDue ? !attempt.correct : existing.failedDueReview,
    consecutiveSuccess: attempt.correct ? existing.consecutiveSuccess + 1 : 0,
    sampleCount: existing.sampleCount + 1,
    sessionIds: existing.sessionIds.includes(attempt.sessionId) ? existing.sessionIds : [...existing.sessionIds, attempt.sessionId].slice(-config.mastered.sessions),
  };
  const derived = deriveMastery(updated, config);
  return { ...profile, keys: { ...profile.keys, [attempt.targetKey]: { ...updated, ...derived } } };
}

export function keyMeetsState(profile: MasteryProfile, key: KeyId, minimum: MasteryLabel): boolean {
  return rank(profile.keys[key]?.label ?? 'new') >= rank(minimum);
}

export function canCompleteLesson(profile: MasteryProfile, session: LessonSession, config: MasteryConfig = DEFAULT_MASTERY_CONFIG): boolean {
  const lesson = LESSONS.find(({ id }) => id === session.lessonId);
  if (!lesson || session.mode !== 'lesson' || session.unintroducedKeyViolations || session.correct + session.incorrect < config.lessonMinimumAttempts) return false;
  return ratio(session.correct, session.correct + session.incorrect) >= config.lessonAccuracy &&
    lesson.introducedKeys.every((key) => keyMeetsState(profile, key, lesson.completion.minimumState));
}

export function completeLesson(profile: MasteryProfile, session: LessonSession, config: MasteryConfig = DEFAULT_MASTERY_CONFIG): MasteryProfile {
  const lesson = LESSONS.find(({ id }) => id === session.lessonId);
  if (!lesson || !lesson.prerequisites.lessons.every((id) => profile.completedLessonIds.includes(id)) || !canCompleteLesson(profile, session, config)) return profile;
  if (profile.completedLessonIds.includes(session.lessonId)) return profile;
  return { ...profile, completedLessonIds: [...profile.completedLessonIds, session.lessonId] };
}

export function canEnterBiome(profile: MasteryProfile, biome: BiomeId): boolean {
  const index = BIOME_ORDER.indexOf(biome);
  if (index < 0) return false;
  return LESSONS.filter((lesson) => BIOME_ORDER.indexOf(LESSON_BIOMES[lesson.id]) < index)
    .every((lesson) => profile.completedLessonIds.includes(lesson.id) && lesson.introducedKeys.every((key) => keyMeetsState(profile, key, lesson.completion.minimumState)));
}

export function getNextMasteryGoal(profile: MasteryProfile): { lesson: LessonDefinition; key: KeyId | null; reason: string } | null {
  const lesson = LESSONS.find((entry) => !profile.completedLessonIds.includes(entry.id));
  if (!lesson) return null;
  const key = lesson.introducedKeys.find((id) => !keyMeetsState(profile, id, lesson.completion.minimumState)) ?? null;
  return { lesson, key, reason: key ? `${key}: ${profile.keys[key]?.label ?? 'new'}; needs ${lesson.completion.minimumState}` : `${lesson.id}: complete an accurate lesson session` };
}

export function selectWeakDueKeys(profile: MasteryProfile, lessonId: LessonId, now: number, max = 3): readonly KeyId[] {
  const lesson = LESSONS.find(({ id }) => id === lessonId);
  if (!lesson) throw new Error(`Unknown lesson ${lessonId}`);
  return lesson.reviewKeys.filter((key) => {
    const evidence = profile.keys[key];
    return evidence?.introduced && evidence.reviewDueAt !== null && evidence.reviewDueAt <= now;
  }).sort((a, b) => {
    const left = profile.keys[a]!; const right = profile.keys[b]!;
    return left.score - right.score || (left.reviewDueAt ?? 0) - (right.reviewDueAt ?? 0);
  }).slice(0, Math.max(0, Math.min(max, 3)));
}

export function inspectMastery(profile: MasteryProfile, key: KeyId): string {
  const evidence = profile.keys[key] ?? emptyKeyEvidence(key);
  const accuracy = ratio(evidence.correct, evidence.sampleCount);
  const next = getNextMasteryGoal(profile);
  return `${key}: ${evidence.label} (${evidence.sampleCount} scored, ${Math.round(accuracy * 100)}% accuracy, ${evidence.recentErrors} recent errors, ${evidence.sessionIds.length} sessions, due ${evidence.reviewDueAt ?? 'none'}); next ${next?.reason ?? 'curriculum complete'}`;
}
