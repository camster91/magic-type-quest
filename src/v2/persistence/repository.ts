import { contentRegistry } from '../content/registry';
import { LESSONS, type KeyId, type LessonId } from '../curriculum/domain';
import { completeLesson, deriveMastery, recordAttempt, type KeyEvidence, type LessonSession, type MasteryProfile } from '../mastery/engine';
import { DB_NAME, IMPORT_VERSION, SCHEMA_VERSION, STORES, masteryKey, previewLegacy, validProfile, validRecord, type EncounterCommit, type LocalProfile, type LocalSettings, type MigrationPreview, type ProgressExport, type StoreName } from './model';
import { readV1ProfileSnapshots, type LegacyProfileSnapshot } from './legacySnapshot';

type Row = Record<string, unknown> & { id: string; learnerId?: string };
const result = <T>(request: IDBRequest<T>): Promise<T> => new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
const transactionDone = (tx: IDBTransaction): Promise<void> => new Promise((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error ?? new Error('Progress transaction aborted')); tx.onerror = () => reject(tx.error ?? new Error('Progress transaction failed')); });
export class ProgressStorageError extends Error { constructor(readonly reason: 'unavailable' | 'corrupt', message: string) { super(message); } }
export interface ProgressState { readonly profile: LocalProfile; readonly mastery: MasteryProfile; readonly missions: readonly Row[]; readonly restoration: readonly Row[]; readonly discoveries: readonly Row[]; readonly sessions: readonly Row[]; readonly settings: Row | null; readonly problems: readonly string[]; }
export interface ApprovedSyncPort { syncApprovedExport(data: ProgressExport): Promise<void>; }
/** Deliberately no cloud implementation or import in the core bundle. */
export const CLOUD_SYNC_OFF: ApprovedSyncPort | null = null;

export class ProgressRepository {
  private constructor(private readonly db: IDBDatabase) {}
  static async open(factory?: IDBFactory): Promise<ProgressRepository> {
    try {
      const selected = factory ?? globalThis.indexedDB;
      if (!selected) throw new Error('IndexedDB is unavailable');
      const request = selected.open(DB_NAME, SCHEMA_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const name of STORES) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
      };
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        let blocked = false;
        request.onsuccess = () => { if (blocked) request.result.close(); else resolve(request.result); };
        request.onerror = () => reject(request.error);
        request.onblocked = () => { blocked = true; reject(new Error('Another tab is holding an older progress database open')); };
      });
      db.onversionchange = () => db.close();
      return new ProgressRepository(db);
    } catch (error) { throw new ProgressStorageError('unavailable', `Local progress storage could not open: ${String(error)}`); }
  }
  close(): void { this.db.close(); }
  private async write<T>(names: readonly StoreName[], operation: (tx: IDBTransaction) => Promise<T>): Promise<T> {
    const tx = this.db.transaction([...names], 'readwrite');
    const done = transactionDone(tx);
    try { const value = await operation(tx); await done; return value; }
    catch (error) { try { tx.abort(); } catch { /* already committed or aborted */ } await done.catch(() => {}); throw error; }
  }
  private async rows(name: StoreName): Promise<readonly Row[]> { return result(this.db.transaction(name, 'readonly').objectStore(name).getAll()) as Promise<readonly Row[]>; }
  private async selected(name: StoreName, learnerId: string): Promise<{ valid: Row[]; problems: string[] }> {
    const valid: Row[] = []; const problems: string[] = [];
    for (const row of await this.rows(name)) {
      if (!row || row.learnerId !== learnerId) continue;
      if (validRecord(name, row)) valid.push(row);
      else problems.push(`${name}/${String(row.id)}: invalid record isolated`);
    }
    return { valid, problems };
  }
  async createProfile(alias = 'Player', now = Date.now()): Promise<LocalProfile> {
    const profile: LocalProfile = { id: crypto.randomUUID(), alias: alias.trim().slice(0, 40) || 'Player', avatar: 'fox', createdAt: now };
    await this.write(['profiles'], async (tx) => { await result(tx.objectStore('profiles').add(profile)); });
    return profile;
  }
  async listProfiles(): Promise<{ profiles: readonly LocalProfile[]; problems: readonly string[] }> {
    const profiles: LocalProfile[] = []; const problems: string[] = [];
    for (const row of await this.rows('profiles')) validProfile(row) ? profiles.push(row) : problems.push(`profiles/${String(row?.id)}: invalid record isolated`);
    return { profiles, problems };
  }
  async read(learnerId: string): Promise<ProgressState> {
    const profile = await result(this.db.transaction('profiles', 'readonly').objectStore('profiles').get(learnerId)) as unknown;
    if (!validProfile(profile)) throw new ProgressStorageError('corrupt', `Profile ${learnerId} is missing or invalid; no data was erased`);
    const names: StoreName[] = ['mastery', 'lessons', 'missions', 'restoration', 'discoveries', 'sessions', 'settings'];
    const values = await Promise.all(names.map((name) => this.selected(name, learnerId)));
    const byName = Object.fromEntries(names.map((name, index) => [name, values[index]!.valid])) as Record<StoreName, Row[]>;
    const problems = values.flatMap((value) => value.problems);
    const keys: Partial<Record<KeyId, KeyEvidence>> = {};
    for (const row of byName.mastery) { const evidence = row.evidence as NonNullable<MasteryProfile['keys'][KeyId]>; keys[evidence.key] = evidence; }
    const completedLessonIds = byName.lessons.map((row) => row.lessonId as LessonId);
    return { profile, mastery: { keys, completedLessonIds }, missions: byName.missions, restoration: byName.restoration, discoveries: byName.discoveries, sessions: byName.sessions, settings: byName.settings[0] ?? null, problems };
  }
  /** A duplicate encounter is a no-op. Evidence and rewards share one transaction. */
  async commitEncounter(commit: EncounterCommit): Promise<{ applied: boolean }> {
    if (!commit.encounterId || !commit.learnerId || !LESSONS.some((lesson) => lesson.id === commit.lessonId) || !Number.isFinite(commit.summary.completedAt)) throw new Error('Invalid encounter');
    if (commit.attempts.some((attempt) => attempt.lessonId !== commit.lessonId || attempt.sessionId !== commit.encounterId)) throw new Error('Encounter attempt mismatch');
    if (commit.missionId) {
      const mission = contentRegistry.getMission(commit.missionId);
      if (mission.lessonId !== commit.lessonId || mission.biomeId !== commit.biomeId || mission.restorationOutcomeId !== commit.stageId) throw new Error('Mission outcome mismatch');
      for (const id of commit.discoveryIds ?? []) if (!contentRegistry.getBiome(mission.biomeId).wildlifeDiscoveryIds.includes(id)) throw new Error(`Unknown biome discovery ${id}`);
      if (!commit.attempts.some((attempt) => attempt.source === 'physical')) throw new Error('Mission rewards require physical-key evidence');
    } else if (commit.stageId || commit.discoveryIds?.length || commit.biomeId) throw new Error('Rewards require a valid mission');
    return this.write(STORES.filter((name) => name !== 'migrations' && name !== 'settings'), async (tx) => {
      const sessions = tx.objectStore('sessions');
      const id = `${commit.learnerId}:${commit.encounterId}`;
      if (await result(sessions.get(id))) return { applied: false };
      const profile = await result(tx.objectStore('profiles').get(commit.learnerId));
      if (!validProfile(profile)) throw new ProgressStorageError('corrupt', 'Profile is missing or invalid; encounter was not saved');
      const allMastery = await result(tx.objectStore('mastery').getAll()) as Row[];
      const keyRows = allMastery.filter((row) => row.learnerId === commit.learnerId);
      if (keyRows.some((row) => !validRecord('mastery', row))) throw new ProgressStorageError('corrupt', 'Mastery record needs repair; encounter was not saved');
      const keys = Object.fromEntries(keyRows.map((row) => [(row.evidence as { key: KeyId }).key, row.evidence]));
      let mastery: MasteryProfile = { keys, completedLessonIds: [] };
      for (const attempt of commit.attempts) mastery = recordAttempt(mastery, attempt);
      for (const [key, evidence] of Object.entries(mastery.keys)) await result(tx.objectStore('mastery').put({ id: masteryKey(commit.learnerId, key as KeyId), learnerId: commit.learnerId, evidence }));
      if (commit.missionId) {
        const missionId = `${commit.learnerId}:${commit.missionId}`;
        if (!await result(tx.objectStore('missions').get(missionId))) await result(tx.objectStore('missions').put({ id: missionId, learnerId: commit.learnerId, missionId: commit.missionId, encounterId: commit.encounterId, completedAt: commit.summary.completedAt }));
        const stageId = `${commit.learnerId}:${commit.stageId}`;
        if (!await result(tx.objectStore('restoration').get(stageId))) await result(tx.objectStore('restoration').put({ id: stageId, learnerId: commit.learnerId, biomeId: commit.biomeId, stageId: commit.stageId, unlockedAt: commit.summary.completedAt }));
        for (const speciesId of commit.discoveryIds ?? []) {
          const discoveryId = `${commit.learnerId}:${speciesId}`;
          if (!await result(tx.objectStore('discoveries').get(discoveryId))) await result(tx.objectStore('discoveries').put({ id: discoveryId, learnerId: commit.learnerId, speciesId, discoveredAt: commit.summary.completedAt }));
        }
      }
      await result(sessions.put({ ...commit.summary, id, learnerId: commit.learnerId, lessonId: commit.lessonId }));
      return { applied: true };
    });
  }
  async completeLessonIfEligible(learnerId: string, session: LessonSession): Promise<boolean> {
    const state = await this.read(learnerId);
    const updated = completeLesson(state.mastery, session);
    if (!updated.completedLessonIds.includes(session.lessonId) || state.mastery.completedLessonIds.includes(session.lessonId)) return false;
    await this.write(['lessons'], async (tx) => { await result(tx.objectStore('lessons').put({ id: `${learnerId}:${session.lessonId}`, learnerId, lessonId: session.lessonId, completedAt: Date.now() })); });
    return true;
  }
  async saveSettings(learnerId: string, patch: Partial<Pick<LocalSettings, 'locale' | 'reducedMotion' | 'soundEnabled'>>): Promise<LocalSettings> {
    return this.write(['profiles', 'settings'], async (tx) => {
      if (!validProfile(await result(tx.objectStore('profiles').get(learnerId)))) throw new ProgressStorageError('corrupt', 'Learner profile is missing');
      const store = tx.objectStore('settings');
      const previous = await result(store.get(learnerId)) as unknown;
      if (previous !== undefined && !validRecord('settings', previous)) throw new ProgressStorageError('corrupt', 'Settings record needs repair');
      const next: LocalSettings = { id: learnerId, learnerId, locale: 'en', reducedMotion: false, soundEnabled: true,
        ...(previous as Partial<LocalSettings> | undefined), ...patch };
      if (!validRecord('settings', next)) throw new Error('Invalid local settings');
      await result(store.put(next));
      return next;
    });
  }
  async importLegacy(snapshot: LegacyProfileSnapshot, now = Date.now()): Promise<{ profile: LocalProfile; imported: boolean; preview: MigrationPreview }> {
    const preview = previewLegacy(snapshot);
    return this.write(['profiles', 'mastery', 'migrations'], async (tx) => {
      const markerId = `v1:${snapshot.sourceKey}`;
      const marker = await result(tx.objectStore('migrations').get(markerId)) as { learnerId?: string } | undefined;
      if (marker?.learnerId) {
        const prior = await result(tx.objectStore('profiles').get(marker.learnerId));
        if (validProfile(prior)) return { profile: prior, imported: false, preview };
        throw new ProgressStorageError('corrupt', 'An imported profile needs repair; the original v1 data remains safe');
      }
      const profile: LocalProfile = { id: crypto.randomUUID(), alias: preview.alias, avatar: 'fox', createdAt: now };
      await result(tx.objectStore('profiles').add(profile));
      for (const [key, evidence] of Object.entries(preview.mastery.keys)) await result(tx.objectStore('mastery').put({ id: masteryKey(profile.id, key as KeyId), learnerId: profile.id, evidence }));
      await result(tx.objectStore('migrations').add({ id: markerId, learnerId: profile.id, sourceKey: snapshot.sourceKey, sourceVersion: 0, importVersion: IMPORT_VERSION, importedAt: now }));
      return { profile, imported: true, preview };
    });
  }
  async importAvailable(storage: Pick<Storage, 'getItem' | 'key' | 'length'>): Promise<readonly { profile: LocalProfile; imported: boolean; preview: MigrationPreview }[]> {
    const seen = new Map<string, LocalProfile>();
    const imports: { profile: LocalProfile; imported: boolean; preview: MigrationPreview }[] = [];
    for (const snapshot of readV1ProfileSnapshots(storage)) {
      const payload = snapshot.payload;
      const v1Id = payload && typeof payload === 'object' && 'uuid' in payload && typeof payload.uuid === 'string' && payload.uuid ? payload.uuid : null;
      const duplicate = v1Id ? seen.get(v1Id) : null;
      if (duplicate) {
        await this.write(['migrations'], async (tx) => {
          const store = tx.objectStore('migrations');
          const id = `v1:${snapshot.sourceKey}`;
          if (!await result(store.get(id))) await result(store.add({ id, learnerId: duplicate.id, sourceKey: snapshot.sourceKey, sourceVersion: 0, importVersion: IMPORT_VERSION, importedAt: Date.now() }));
        });
        imports.push({ profile: duplicate, imported: false, preview: previewLegacy(snapshot) });
      } else {
        const imported = await this.importLegacy(snapshot);
        imports.push(imported);
        if (v1Id) seen.set(v1Id, imported.profile);
      }
    }
    return imports;
  }
  async export(learnerId: string): Promise<ProgressExport> {
    const state = await this.read(learnerId);
    return { schemaVersion: SCHEMA_VERSION, exportedAt: Date.now(), profile: state.profile, mastery: state.mastery, lessons: state.mastery.completedLessonIds,
      missions: state.missions as unknown as ProgressExport['missions'], restoration: state.restoration as unknown as ProgressExport['restoration'], discoveries: state.discoveries as unknown as ProgressExport['discoveries'], sessions: state.sessions as unknown as ProgressExport['sessions'], settings: state.settings as unknown as ProgressExport['settings'] };
  }
  async resetLearner(learnerId: string): Promise<void> {
    await this.write(STORES, async (tx) => {
      for (const name of STORES) {
        const store = tx.objectStore(name);
        for (const row of await result(store.getAll()) as Row[]) if (row?.id === learnerId || row?.learnerId === learnerId) await result(store.delete(row.id));
      }
    });
  }
  async repairDerivedProgress(learnerId: string): Promise<readonly string[]> {
    const state = await this.read(learnerId);
    await this.write(['mastery'], async (tx) => {
      for (const [key, evidence] of Object.entries(state.mastery.keys)) {
        if (!evidence) continue;
        const derived = deriveMastery(evidence);
        await result(tx.objectStore('mastery').put({ id: masteryKey(learnerId, key as KeyId), learnerId, evidence: { ...evidence, ...derived } }));
      }
    });
    return state.problems;
  }
  static async deleteAll(factory?: IDBFactory): Promise<void> {
    const selected = factory ?? globalThis.indexedDB;
    if (!selected) throw new ProgressStorageError('unavailable', 'IndexedDB is unavailable');
    const request = selected.deleteDatabase(DB_NAME);
    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve(); request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new ProgressStorageError('unavailable', 'Close other Nature Quest tabs before deleting local data'));
    });
  }
}

export async function downloadProgress(repository: ProgressRepository, learnerId: string): Promise<void> {
  const data = await repository.export(learnerId);
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  try { const link = document.createElement('a'); link.href = url; link.download = `nature-quest-progress-${learnerId}.json`; link.click(); }
  finally { window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
