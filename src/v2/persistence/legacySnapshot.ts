/** Reserved namespace. No v2 learner data is written until #162 defines the schema. */
export const V2_STORAGE_PREFIX = 'naturequest:v2:' as const;
export const V2_MIGRATION_VERSION_KEY = `${V2_STORAGE_PREFIX}migration-version` as const;

const V1_ACTIVE_PROFILE_KEY = 'bloomtype-profile';

export interface LegacyProfileSnapshot {
  readonly importVersion: 0;
  readonly sourceKey: typeof V1_ACTIVE_PROFILE_KEY;
  readonly payload: unknown;
}

/** A detached, read-only intermediate value; caller must not persist it as-is. */
export function readV1ActiveProfileSnapshot(storage: Pick<Storage, 'getItem'>): LegacyProfileSnapshot | null {
  const raw = storage.getItem(V1_ACTIVE_PROFILE_KEY);
  if (raw === null) return null;
  return { importVersion: 0, sourceKey: V1_ACTIVE_PROFILE_KEY, payload: JSON.parse(raw) as unknown };
}
