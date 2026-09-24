import { chromium, expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('landing.html'); });

test('fresh schema, v1 upgrade, non-destructive import, duplicate guard, export and learner reset', async ({ page }) => {
  const outcome = await page.evaluate(async () => {
    const { ProgressRepository } = await import('/magic-type-quest/src/v2/persistence/repository.ts');
    const { DB_NAME, SCHEMA_VERSION } = await import('/magic-type-quest/src/v2/persistence/model.ts');
    const v1 = window.indexedDB.open(DB_NAME, 1);
    v1.onupgradeneeded = () => v1.result.createObjectStore('profiles', { keyPath: 'id' });
    await new Promise((resolve, reject) => { v1.onsuccess = resolve; v1.onerror = reject; });
    v1.result.close();
    const original = JSON.stringify({ name: 'Scout', uuid: 'class-secret', classCode: 'ABC123', totalStars: 900,
      completedLevels: [1, 1, 99], keyAccuracy: { f: { correct: 13, wrong: 1 }, j: { correct: 3, wrong: 1 } } });
    localStorage.setItem('bloomtype-profile', original);
    const repo = await ProgressRepository.open();
    const [first] = await repo.importAvailable(localStorage);
    const [again] = await repo.importAvailable(localStorage);
    await repo.saveSettings(first.profile.id, { reducedMotion: true, locale: 'fr' });
    const state = await repo.read(first.profile.id);
    const exported = await repo.export(first.profile.id);
    const version = repo['db'].version;
    await repo.resetLearner(first.profile.id);
    const countAfterReset = (await repo.listProfiles()).profiles.length;
    repo.close();
    return { version, expected: SCHEMA_VERSION, originalIntact: localStorage.getItem('bloomtype-profile') === original,
      imported: first.imported, repeated: again.imported, sameId: first.profile.id === again.profile.id,
      alias: first.profile.alias, labels: [state.mastery.keys.f?.label, state.mastery.keys.j?.label],
      noLessons: state.mastery.completedLessonIds.length === 0, noSecret: !JSON.stringify(exported).includes('class-secret') && !JSON.stringify(exported).includes('ABC123') && !JSON.stringify(exported).includes('totalStars'),
      schema: exported.schemaVersion, settings: state.settings, countAfterReset };
  });
  expect(outcome).toMatchObject({ version: 2, expected: 2, originalIntact: true, imported: true, repeated: false,
    sameId: true, alias: 'Scout', labels: ['familiar', 'learning'], noLessons: true, noSecret: true, schema: 2,
    settings: { locale: 'fr', reducedMotion: true, soundEnabled: true }, countAfterReset: 0 });
});

test('malformed v1 values are normalised while original bytes remain untouched', async ({ page }) => {
  const outcome = await page.evaluate(async () => {
    const { ProgressRepository } = await import('/magic-type-quest/src/v2/persistence/repository.ts');
    const { readV1ProfileSnapshots } = await import('/magic-type-quest/src/v2/persistence/legacySnapshot.ts');
    localStorage.setItem('bloomtype-profile', '{broken');
    localStorage.setItem('bloomtype_profile_Alex', JSON.stringify({ name: '<Alex>', completedLevels: 'oops', keyAccuracy: { f: { correct: -5, wrong: 'NaN' } } }));
    localStorage.setItem('bloomtype-class-secret', JSON.stringify({ roster: ['private'] }));
    const snapshots = readV1ProfileSnapshots(localStorage);
    const repo = await ProgressRepository.open();
    const imported = await repo.importAvailable(localStorage);
    const profiles = await repo.listProfiles(); repo.close();
    return { keys: snapshots.map((s) => s.sourceKey), aliases: profiles.profiles.map((p) => p.alias).sort(), warnings: imported.map((p) => p.preview.warnings.length),
      original: localStorage.getItem('bloomtype-profile'), untouchedNamed: localStorage.getItem('bloomtype_profile_Alex')?.includes('oops') };
  });
  expect(outcome).toMatchObject({ keys: ['bloomtype-profile', 'bloomtype_profile_Alex'], aliases: ['Alex', 'Player'], warnings: [1, 1], original: '{broken', untouchedNamed: true });
});

test('active and named copies with one v1 UUID import as one local learner', async ({ page }) => {
  const outcome = await page.evaluate(async () => {
    const { ProgressRepository } = await import('/magic-type-quest/src/v2/persistence/repository.ts');
    const v1 = JSON.stringify({ uuid: 'legacy-class-uuid', name: 'Scout', completedLevels: [1] });
    localStorage.setItem('bloomtype-profile', v1);
    localStorage.setItem('bloomtype_profile_Scout', v1);
    const repo = await ProgressRepository.open();
    const imported = await repo.importAvailable(localStorage);
    const repeated = await repo.importAvailable(localStorage);
    const profiles = await repo.listProfiles(); repo.close();
    return { ids: imported.map((row) => row.profile.id), repeatIds: repeated.map((row) => row.profile.id),
      count: profiles.profiles.length, original: localStorage.getItem('bloomtype-profile') === v1 };
  });
  expect(outcome.count).toBe(1);
  expect(new Set([...outcome.ids, ...outcome.repeatIds]).size).toBe(1);
  expect(outcome.original).toBe(true);
});

test('encounter save is atomic and idempotent across reload, with corrupt rows isolated', async ({ page }) => {
  const first = await page.evaluate(async () => {
    const { ProgressRepository } = await import('/magic-type-quest/src/v2/persistence/repository.ts');
    const repo = await ProgressRepository.open(); const profile = await repo.createProfile('River');
    const attempt = (targetKey, correct = true) => ({ lessonId: 'meadow-fj', targetKey, correct, firstAttempt: true, at: 1000, sessionId: 'enc-1', source: 'physical' });
    const commit = { encounterId: 'enc-1', learnerId: profile.id, lessonId: 'meadow-fj', attempts: [attempt('f'), attempt('j')],
      summary: { correct: 2, incorrect: 0, durationMs: 1400, completedAt: 2000, source: 'physical' },
      missionId: 'meadow-a', biomeId: 'meadow-base', stageId: 'meadow-planting-spots' };
    const saved = await repo.commitEncounter(commit);
    const duplicate = await repo.commitEncounter(commit);
    let failed = false;
    try { await repo.commitEncounter({ ...commit, encounterId: 'enc-bad', attempts: [{ ...attempt('f'), sessionId: 'enc-bad' }, { ...attempt('z'), sessionId: 'enc-bad' }] }); }
    catch { failed = true; }
    let rolledBack = false;
    try { await repo.commitEncounter({ ...commit, encounterId: 'enc-fault', attempts: [{ ...attempt('f'), sessionId: 'enc-fault' }],
      summary: { ...commit.summary, poison: () => 'cannot clone' } }); }
    catch { rolledBack = true; }
    const state = await repo.read(profile.id);
    const tx = repo['db'].transaction('discoveries', 'readwrite');
    tx.objectStore('discoveries').put({ id: `${profile.id}:bad`, learnerId: profile.id, speciesId: 22, discoveredAt: 'invalid' });
    await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = reject; });
    repo.close(); localStorage.setItem('test-learner-id', profile.id);
    return { saved, duplicate, failed, rolledBack, correct: state.mastery.keys.f?.correct, missions: state.missions.length, stages: state.restoration.length, sessions: state.sessions.length };
  });
  expect(first).toMatchObject({ saved: { applied: true }, duplicate: { applied: false }, failed: true, rolledBack: true, correct: 1, missions: 1, stages: 1, sessions: 1 });
  await page.reload();
  const second = await page.evaluate(async () => {
    const { ProgressRepository } = await import('/magic-type-quest/src/v2/persistence/repository.ts');
    const repo = await ProgressRepository.open(); const id = localStorage.getItem('test-learner-id');
    const state = await repo.read(id); const repaired = await repo.repairDerivedProgress(id);
    const exported = await repo.export(id); repo.close();
    return { correct: state.mastery.keys.f?.correct, missions: state.missions.length, stages: state.restoration.length,
      sessions: state.sessions.length, discoveries: state.discoveries.length, problems: state.problems.length,
      repaired: repaired.length, exportSessions: exported.sessions.length };
  });
  expect(second).toMatchObject({ correct: 1, missions: 1, stages: 1, sessions: 1, discoveries: 0, problems: 1, repaired: 1, exportSessions: 1 });
});

test('storage denial has a typed error and does not touch v1 data', async ({ page }) => {
  const outcome = await page.evaluate(async () => {
    const { ProgressRepository } = await import('/magic-type-quest/src/v2/persistence/repository.ts');
    localStorage.setItem('bloomtype-profile', '{"name":"Preserved"}');
    try { await ProgressRepository.open({ open: () => { throw new Error('blocked'); } }); return 'unexpected'; }
    catch (error) { return { reason: error.reason, original: localStorage.getItem('bloomtype-profile') }; }
  });
  expect(outcome).toEqual({ reason: 'unavailable', original: '{"name":"Preserved"}' });
});

test('delete all v2 data leaves every v1 key intact', async ({ page }) => {
  const outcome = await page.evaluate(async () => {
    const { ProgressRepository } = await import('/magic-type-quest/src/v2/persistence/repository.ts');
    const v1 = '{"name":"Still here"}';
    localStorage.setItem('bloomtype-profile', v1);
    localStorage.setItem('bloomtype_profile_Still_here', v1);
    const repo = await ProgressRepository.open(); await repo.createProfile('Temporary'); repo.close();
    await ProgressRepository.deleteAll();
    const reopened = await ProgressRepository.open();
    const count = (await reopened.listProfiles()).profiles.length; reopened.close();
    return { count, active: localStorage.getItem('bloomtype-profile'), named: localStorage.getItem('bloomtype_profile_Still_here') };
  });
  expect(outcome).toEqual({ count: 0, active: '{"name":"Still here"}', named: '{"name":"Still here"}' });
});

test('progress survives a browser process restart with the same local profile directory', async () => {
  const profileDirectory = test.info().outputPath('persistent-browser');
  const url = 'http://127.0.0.1:4174/magic-type-quest/landing.html';
  const firstContext = await chromium.launchPersistentContext(profileDirectory, { headless: true });
  const firstPage = await firstContext.newPage(); await firstPage.goto(url);
  const learnerId = await firstPage.evaluate(async () => {
    const { ProgressRepository } = await import('/magic-type-quest/src/v2/persistence/repository.ts');
    const repo = await ProgressRepository.open(); const profile = await repo.createProfile('Returning learner');
    repo.close(); return profile.id;
  });
  await firstContext.close();
  const secondContext = await chromium.launchPersistentContext(profileDirectory, { headless: true });
  try {
    const secondPage = await secondContext.newPage(); await secondPage.goto(url);
    const alias = await secondPage.evaluate(async (id) => {
      const { ProgressRepository } = await import('/magic-type-quest/src/v2/persistence/repository.ts');
      const repo = await ProgressRepository.open(); const state = await repo.read(id); repo.close(); return state.profile.alias;
    }, learnerId);
    expect(alias).toBe('Returning learner');
  } finally { await secondContext.close(); }
});
