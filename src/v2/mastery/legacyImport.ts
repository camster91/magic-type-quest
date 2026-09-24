import type { KeyId } from '../curriculum/domain';
import { DEFAULT_MASTERY_CONFIG, EMPTY_MASTERY_PROFILE, emptyKeyEvidence, type MasteryProfile } from './engine';

export interface LegacyProgress {
  readonly completedLevels?: readonly number[];
  readonly keyAccuracy?: Readonly<Record<string, { readonly correct?: number; readonly wrong?: number }>>;
}

const HISTORICAL_LEVEL_KEYS: readonly (readonly KeyId[])[] = [
  ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ['g', 'h'],
  ['Shift'],
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
];

/** A conservative, pure import proposal for #162. It never awards a v2 lesson. */
export function mapLegacyMasteryEvidence(legacy: LegacyProgress): MasteryProfile {
  const completed = new Set(legacy.completedLevels ?? []);
  const keys: Partial<Record<KeyId, ReturnType<typeof emptyKeyEvidence>>> = {};
  for (let level = 1; level <= HISTORICAL_LEVEL_KEYS.length; level++) {
    if (!completed.has(level)) continue;
    for (const key of HISTORICAL_LEVEL_KEYS[level - 1]!) {
      const raw = legacy.keyAccuracy?.[key];
      const correct = Number.isFinite(raw?.correct) ? Math.max(0, Math.floor(raw!.correct!)) : 0;
      const incorrect = Number.isFinite(raw?.wrong) ? Math.max(0, Math.floor(raw!.wrong!)) : 0;
      const sampleCount = correct + incorrect;
      const canBeFamiliar = key !== ';' && key !== 'Shift' && sampleCount >= DEFAULT_MASTERY_CONFIG.familiar.samples && correct / sampleCount >= DEFAULT_MASTERY_CONFIG.familiar.accuracy;
      keys[key] = { ...emptyKeyEvidence(key), introduced: true, correct, incorrect, sampleCount,
        score: sampleCount ? Math.round(correct / sampleCount * 100) : 0, label: canBeFamiliar ? 'familiar' : 'learning' };
    }
  }
  return { ...EMPTY_MASTERY_PROFILE, keys };
}
