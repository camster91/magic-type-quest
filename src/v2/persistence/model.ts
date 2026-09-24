import type { BiomeId } from '../curriculum/biomeMapping';
import { DIGIT_KEYS, HOME_KEYS, LESSONS, LOWER_KEYS, PUNCTUATION_KEYS, UPPER_KEYS, type KeyId, type LessonId } from '../curriculum/domain';
import { EMPTY_MASTERY_PROFILE, type KeyEvidence, type MasteryProfile, type TypingAttempt } from '../mastery/engine';
import { mapLegacyMasteryEvidence } from '../mastery/legacyImport';
import type { LegacyProfileSnapshot } from './legacySnapshot';

export const DB_NAME = 'naturequest:v2:progress';
export const SCHEMA_VERSION = 2;
export const IMPORT_VERSION = 1;
export type StoreName = 'profiles' | 'mastery' | 'lessons' | 'missions' | 'restoration' | 'discoveries' | 'sessions' | 'settings' | 'migrations';
export const STORES: readonly StoreName[] = ['profiles', 'mastery', 'lessons', 'missions', 'restoration', 'discoveries', 'sessions', 'settings', 'migrations'];
export interface LocalProfile { readonly id: string; readonly alias: string; readonly avatar: 'fox'; readonly createdAt: number; }
export interface MissionCompletion { readonly id: string; readonly learnerId: string; readonly missionId: string; readonly encounterId: string; readonly completedAt: number; }
export interface RestorationRecord { readonly id: string; readonly learnerId: string; readonly biomeId: BiomeId; readonly stageId: string; readonly unlockedAt: number; }
export interface DiscoveryRecord { readonly id: string; readonly learnerId: string; readonly speciesId: string; readonly discoveredAt: number; }
export interface SessionSummary { readonly id: string; readonly learnerId: string; readonly lessonId: LessonId; readonly correct: number; readonly incorrect: number; readonly durationMs: number; readonly completedAt: number; readonly source: 'physical' | 'touch' | 'mixed'; }
export interface MigrationRecord { readonly id: string; readonly learnerId: string; readonly sourceKey: string; readonly sourceVersion: 0; readonly importVersion: 1; readonly importedAt: number; }
export interface LocalSettings { readonly id: string; readonly learnerId: string; readonly locale: 'en' | 'fr' | 'es'; readonly reducedMotion: boolean; readonly soundEnabled: boolean; readonly effectsVolume?: number; readonly ambienceVolume?: number; }
export interface EncounterCommit {
  readonly encounterId: string;
  readonly learnerId: string;
  readonly lessonId: LessonId;
  readonly attempts: readonly TypingAttempt[];
  readonly summary: Omit<SessionSummary, 'id' | 'learnerId' | 'lessonId'>;
  readonly missionId?: string;
  readonly biomeId?: BiomeId;
  readonly stageId?: string;
  readonly discoveryIds?: readonly string[];
}
export interface ProgressExport { readonly schemaVersion: number; readonly exportedAt: number; readonly profile: LocalProfile; readonly mastery: MasteryProfile; readonly lessons: readonly LessonId[]; readonly missions: readonly MissionCompletion[]; readonly restoration: readonly RestorationRecord[]; readonly discoveries: readonly DiscoveryRecord[]; readonly sessions: readonly SessionSummary[]; readonly settings: LocalSettings | null; }
export interface MigrationPreview { readonly sourceKey: string; readonly alias: string; readonly completedV1Levels: readonly number[]; readonly measuredKeys: number; readonly warnings: readonly string[]; readonly mastery: MasteryProfile; }

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const validNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const validCount = (value: unknown): value is number => validNumber(value) && Number.isInteger(value);
const validKey = (value: unknown): value is KeyId => typeof value === 'string' && [...HOME_KEYS, ...UPPER_KEYS, ...LOWER_KEYS, ...DIGIT_KEYS, ...PUNCTUATION_KEYS, 'Space', 'Shift'].includes(value as KeyId);
export const validProfile = (value: unknown): value is LocalProfile => object(value) && typeof value.id === 'string' && value.id.length > 0 && typeof value.alias === 'string' && value.alias.length > 0 && value.avatar === 'fox' && validNumber(value.createdAt);
export const validEvidence = (value: unknown): value is KeyEvidence => object(value) && validKey(value.key) && typeof value.introduced === 'boolean' && validCount(value.correct) && validCount(value.incorrect) && validCount(value.sampleCount) && value.sampleCount === value.correct + value.incorrect && validCount(value.firstAttemptCorrect) && validCount(value.firstAttemptTotal) && value.firstAttemptCorrect <= value.firstAttemptTotal && validCount(value.recentErrors) && validCount(value.consecutiveSuccess) && validCount(value.score) && value.score <= 100 && validCount(value.contentVersion) && value.contentVersion > 0 && (value.lastPractisedAt === null || validNumber(value.lastPractisedAt)) && (value.reviewDueAt === null || validNumber(value.reviewDueAt)) && typeof value.failedDueReview === 'boolean' && Array.isArray(value.recentCorrect) && value.recentCorrect.length <= 40 && value.recentCorrect.every((v) => typeof v === 'boolean') && Array.isArray(value.recentLatenciesMs) && value.recentLatenciesMs.length <= 40 && value.recentLatenciesMs.every(validNumber) && Array.isArray(value.sessionIds) && value.sessionIds.length <= 2 && value.sessionIds.every((v) => typeof v === 'string') && ['new', 'learning', 'familiar', 'strong', 'mastered'].includes(String(value.label));
export const validSummary = (value: unknown): value is SessionSummary => object(value) && typeof value.id === 'string' && typeof value.learnerId === 'string' && LESSONS.some((lesson) => lesson.id === value.lessonId) && validNumber(value.correct) && validNumber(value.incorrect) && validNumber(value.durationMs) && validNumber(value.completedAt) && ['physical', 'touch', 'mixed'].includes(String(value.source));
export const validRecord = (store: StoreName, value: unknown): boolean => {
  if (store === 'profiles') return validProfile(value);
  if (store === 'mastery') return object(value) && typeof value.learnerId === 'string' && validEvidence(value.evidence) && value.id === masteryKey(value.learnerId, value.evidence.key);
  if (store === 'sessions') return validSummary(value);
  if (!object(value) || typeof value.id !== 'string' || typeof value.learnerId !== 'string') return false;
  if (store === 'lessons') return LESSONS.some((lesson) => lesson.id === value.lessonId) && validNumber(value.completedAt);
  if (store === 'missions') return typeof value.missionId === 'string' && typeof value.encounterId === 'string' && validNumber(value.completedAt);
  if (store === 'restoration') return typeof value.biomeId === 'string' && typeof value.stageId === 'string' && validNumber(value.unlockedAt);
  if (store === 'discoveries') return typeof value.speciesId === 'string' && validNumber(value.discoveredAt);
  if (store === 'settings') return ['en', 'fr', 'es'].includes(String(value.locale)) && typeof value.reducedMotion === 'boolean' && typeof value.soundEnabled === 'boolean' && [value.effectsVolume, value.ambienceVolume].every((level) => level === undefined || validNumber(level) && level <= 1);
  return typeof value.sourceKey === 'string' && value.sourceVersion === 0 && value.importVersion === IMPORT_VERSION && validNumber(value.importedAt);
};

export function previewLegacy(snapshot: LegacyProfileSnapshot): MigrationPreview {
  const warnings: string[] = [];
  const raw = object(snapshot.payload) ? snapshot.payload : (warnings.push('Malformed profile; only a new local alias can be imported.'), {});
  const alias = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 40).replace(/[<>]/g, '') || 'Player' : 'Player';
  const completedV1Levels = Array.isArray(raw.completedLevels) ? [...new Set(raw.completedLevels.filter((v): v is number => Number.isInteger(v) && v >= 1 && v <= 10))].sort((a, b) => a - b) : [];
  if (raw.completedLevels !== undefined && !Array.isArray(raw.completedLevels)) warnings.push('Invalid completed levels were ignored.');
  const keyAccuracy: Record<string, { correct: number; wrong: number }> = {};
  if (object(raw.keyAccuracy)) for (const [key, value] of Object.entries(raw.keyAccuracy)) {
    if (!object(value)) { warnings.push(`Invalid aggregate for ${key} ignored.`); continue; }
    const count = (v: unknown): number => validNumber(v) ? Math.min(100000, Math.floor(v)) : 0;
    keyAccuracy[key] = { correct: count(value.correct), wrong: count(value.wrong) };
  }
  const mastery = mapLegacyMasteryEvidence({ completedLevels: completedV1Levels, keyAccuracy });
  return { sourceKey: snapshot.sourceKey, alias, completedV1Levels, measuredKeys: Object.values(mastery.keys).filter((key) => key?.sampleCount).length, warnings, mastery };
}

export const emptyProgress = (): MasteryProfile => ({ ...EMPTY_MASTERY_PROFILE, keys: {}, completedLessonIds: [] });
export const masteryKey = (learnerId: string, key: KeyId): string => `${learnerId}:${key}`;
