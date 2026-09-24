/** V2 keys and database are independent of all v1 storage. */
export const V2_STORAGE_PREFIX = 'naturequest:v2:' as const;
export const V2_MIGRATION_VERSION_KEY = `${V2_STORAGE_PREFIX}migration-version` as const;

export const V1_ACTIVE_PROFILE_KEY = 'bloomtype-profile';

export interface LegacyProfileSnapshot {
  readonly importVersion: 0;
  readonly sourceKey: string;
  readonly payload: unknown;
}

/** A detached, read-only intermediate value; caller must not persist it as-is. */
export function readV1ActiveProfileSnapshot(storage: Pick<Storage, 'getItem'>): LegacyProfileSnapshot | null {
  const raw = storage.getItem(V1_ACTIVE_PROFILE_KEY);
  if (raw === null) return null;
  return { importVersion: 0, sourceKey: V1_ACTIVE_PROFILE_KEY, payload: JSON.parse(raw) as unknown };
}

/** Named v1 copies are independent learners. Class roster keys are intentionally excluded. */
export function readV1ProfileSnapshots(storage: Pick<Storage, 'getItem' | 'key' | 'length'>): readonly LegacyProfileSnapshot[] {
  const keys = [V1_ACTIVE_PROFILE_KEY];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith('bloomtype_profile_')) keys.push(key);
  }
  return [...new Set(keys)].flatMap((key) => {
    const raw = storage.getItem(key);
    if (raw === null) return [];
    try { return [{ importVersion: 0 as const, sourceKey: key, payload: JSON.parse(raw) as unknown }]; }
    catch { return [{ importVersion: 0 as const, sourceKey: key, payload: null }]; }
  });
}
