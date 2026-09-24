import { describe, expect, it } from 'vitest';
import { DEFAULT_MASTERY_CONFIG, EMPTY_MASTERY_PROFILE, canCompleteLesson, canEnterBiome, completeLesson, deriveMastery, emptyKeyEvidence, getNextMasteryGoal, inspectMastery, introduceKey, keyMeetsState, medianLatency, recordAttempt, selectWeakDueKeys } from '../src/v2/mastery/engine.ts';
import { mapLegacyMasteryEvidence } from '../src/v2/mastery/legacyImport.ts';

function expose(profile, key, count, lessonId = 'meadow-fj', options = {}) {
  for (let index = 0; index < count; index++) profile = recordAttempt(profile, {
    lessonId, targetKey: key, correct: options.errors?.includes(index) !== true,
    firstAttempt: true, latencyMs: options.latencyMs ?? 5000,
    at: 1000 + index * 1000, sessionId: index < 20 ? 'first' : 'second', source: 'physical', review: options.review,
  });
  return profile;
}

describe('mastery evidence and thresholds (#158)', () => {
  it('uses numeric evidence for all five states and requires multiple sessions for mastery', () => {
    expect(emptyKeyEvidence('f').label).toBe('new');
    expect(introduceKey(emptyKeyEvidence('f')).label).toBe('learning');
    let profile = expose(EMPTY_MASTERY_PROFILE, 'f', 11);
    expect(profile.keys.f.label).toBe('learning');
    profile = expose(profile, 'j', 12);
    expect(profile.keys.j.label).toBe('familiar');
    profile = expose(profile, 'f', 25);
    expect(profile.keys.f.label).toBe('strong');
    profile = expose(profile, 'j', 40);
    expect(profile.keys.j.label).toBe('mastered');
    expect(profile.keys.j.sessionIds).toEqual(['first', 'second']);
    expect(profile.keys.j.sampleCount).toBe(52);
    expect(profile.keys.j.firstAttemptCorrect).toBe(52);
    expect(medianLatency(profile.keys.j)).toBe(5000);
    expect(inspectMastery(profile, 'j')).toMatch(/mastered.*52 scored.*next/);
    let singleSession = EMPTY_MASTERY_PROFILE;
    for (let index = 0; index < 40; index++) singleSession = recordAttempt(singleSession, { lessonId: 'meadow-fj', targetKey: 'f', correct: true, firstAttempt: true, at: index, sessionId: 'only', source: 'physical' });
    expect(singleSession.keys.f.label).toBe('strong');
  });

  it('honours 80/90/95 percent boundaries and stable recent samples', () => {
    const familiar = expose(EMPTY_MASTERY_PROFILE, 'f', 12, 'meadow-fj', { errors: [0, 1] });
    expect(familiar.keys.f.label).toBe('familiar');
    const below = expose(EMPTY_MASTERY_PROFILE, 'f', 12, 'meadow-fj', { errors: [0, 1, 2] });
    expect(below.keys.f.label).toBe('learning');
    const strong = expose(EMPTY_MASTERY_PROFILE, 'f', 25, 'meadow-fj', { errors: [0, 1] });
    expect(strong.keys.f.label).toBe('strong');
    const mastered = expose(EMPTY_MASTERY_PROFILE, 'f', 40, 'meadow-fj', { errors: [0, 1] });
    expect(mastered.keys.f.label).toBe('mastered');
    expect(DEFAULT_MASTERY_CONFIG.mastered.accuracy).toBe(0.95);
  });

  it('does not demote for slow accurate input or one mistake; sustained errors or failed due review demote', () => {
    let profile = expose(EMPTY_MASTERY_PROFILE, 'f', 40);
    expect(profile.keys.f.label).toBe('mastered');
    const attempt = (correct, at, review = false) => { profile = recordAttempt(profile, { lessonId: 'meadow-fj', targetKey: 'f', correct, firstAttempt: true, latencyMs: 30000, at, sessionId: 'third', source: 'physical', review }); };
    attempt(true, 50000);
    expect(profile.keys.f.label).toBe('mastered');
    attempt(false, 51000);
    expect(profile.keys.f.label).toBe('mastered');
    attempt(false, 52000);
    attempt(false, 53000);
    expect(profile.keys.f.label).toBe('strong');
    // An overdue review failure also requires a bounded demotion.
    attempt(false, 53000 + DEFAULT_MASTERY_CONFIG.reviewIntervalMs, true);
    expect(profile.keys.f.label).toBe('familiar');
    attempt(true, 54000 + DEFAULT_MASTERY_CONFIG.reviewIntervalMs, true);
    expect(profile.keys.f.failedDueReview).toBe(false);
  });

  it('does not treat touch or guided input as physical-keyboard mastery and rejects future keys', () => {
    const touch = recordAttempt(EMPTY_MASTERY_PROFILE, { lessonId: 'meadow-fj', targetKey: 'f', correct: true, firstAttempt: true, at: 1, sessionId: 'one', source: 'touch' });
    expect(touch.keys.f.label).toBe('learning');
    expect(touch.keys.f.sampleCount).toBe(0);
    expect(() => recordAttempt(touch, { lessonId: 'meadow-fj', targetKey: 'g', correct: true, firstAttempt: true, at: 2, sessionId: 'one', source: 'physical' })).toThrow(/Unintroduced key/);
    expect(() => recordAttempt(touch, { lessonId: 'meadow-fj', targetKey: 'f', correct: true, firstAttempt: true, latencyMs: -1, at: 2, sessionId: 'one', source: 'physical' })).toThrow(/Invalid latency/);
  });
});

describe('mastery progression selectors', () => {
  it('completes a lesson only after accurate scored evidence, and never from a review session', () => {
    let profile = expose(expose(EMPTY_MASTERY_PROFILE, 'f', 12), 'j', 12);
    const session = { lessonId: 'meadow-fj', mode: 'lesson', correct: 24, incorrect: 0, unintroducedKeyViolations: 0 };
    expect(canCompleteLesson(profile, session)).toBe(true);
    expect(canCompleteLesson(profile, { ...session, mode: 'review' })).toBe(false);
    expect(canCompleteLesson(profile, { ...session, incorrect: 7 })).toBe(false);
    expect(canCompleteLesson(profile, { ...session, unintroducedKeyViolations: 1 })).toBe(false);
    expect(canEnterBiome(profile, 'forest-trail')).toBe(false);
    profile = completeLesson(profile, session);
    expect(completeLesson(profile, session)).toBe(profile);
    expect(profile.completedLessonIds).toEqual(['meadow-fj']);
    expect(getNextMasteryGoal(profile)?.lesson.id).toBe('meadow-growth');
    expect(getNextMasteryGoal(profile)?.key).toBe('a');
    expect(keyMeetsState(profile, 'f', 'familiar')).toBe(true);
    expect(canEnterBiome(profile, 'meadow-base')).toBe(true);
  });

  it('unlocks biomes only from prerequisite lesson and key mastery, without XP or stars', () => {
    const profile = { keys: {}, completedLessonIds: ['meadow-fj', 'meadow-growth', 'meadow-review'] };
    expect(canEnterBiome(profile, 'forest-trail')).toBe(false);
    const relevant = ['f', 'j', 'a', 's', 'd', 'k', 'l', 'Space', 'g', 'h'];
    const mastered = { ...profile, keys: Object.fromEntries(relevant.map((key) => [key, { ...introduceKey(emptyKeyEvidence(key)), label: 'familiar' }])) };
    expect(canEnterBiome(mastered, 'forest-trail')).toBe(true);
    expect(canEnterBiome(mastered, 'wetlands')).toBe(false);
    expect(canEnterBiome(mastered, 'wildlife-reserve')).toBe(false);
  });

  it('picks at most three weakest due keys from the current review scope', () => {
    const due = (key, score) => ({ ...introduceKey(emptyKeyEvidence(key)), score, reviewDueAt: 10 });
    const profile = { keys: { f: due('f', 50), j: due('j', 80), a: due('a', 70), g: due('g', 10), z: due('z', 1) }, completedLessonIds: [] };
    expect(selectWeakDueKeys(profile, 'meadow-growth', 10)).toEqual(['f', 'j']);
    expect(selectWeakDueKeys(profile, 'meadow-review', 10)).toEqual(['f', 'a', 'j']);
    expect(selectWeakDueKeys(profile, 'meadow-review', 9)).toEqual([]);
  });

  it('maps legacy history conservatively and never awards v2 completion', () => {
    const imported = mapLegacyMasteryEvidence({ completedLevels: [1, 2], keyAccuracy: { f: { correct: 40, wrong: 0 }, j: { correct: 3, wrong: 3 }, ';': { correct: 40, wrong: 0 } } });
    expect(imported.keys.f.label).toBe('familiar');
    expect(imported.keys.j.label).toBe('learning');
    expect(imported.keys[';'].label).toBe('learning');
    expect(imported.completedLessonIds).toEqual([]);
    expect(imported.keys.g).toBeUndefined();
    expect(deriveMastery(emptyKeyEvidence('a')).label).toBe('new');
  });
});
