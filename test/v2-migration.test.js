import { describe, expect, it, vi } from 'vitest';
import { readV1ActiveProfileSnapshot, V2_MIGRATION_VERSION_KEY, V2_STORAGE_PREFIX } from '../src/v2/persistence/legacySnapshot.ts';

describe('v2 migration boundary', () => {
  it('reserves a distinct namespace without writing learner data', () => {
    expect(V2_STORAGE_PREFIX).toBe('naturequest:v2:');
    expect(V2_MIGRATION_VERSION_KEY).toBe('naturequest:v2:migration-version');
    const storage = { getItem: vi.fn(() => JSON.stringify({ name: 'Learner', score: 3 })), setItem: vi.fn() };
    const snapshot = readV1ActiveProfileSnapshot(storage);
    expect(snapshot).toEqual({ importVersion: 0, sourceKey: 'bloomtype-profile', payload: { name: 'Learner', score: 3 } });
    expect(storage.getItem).toHaveBeenCalledExactlyOnceWith('bloomtype-profile');
    expect(storage.setItem).not.toHaveBeenCalled();
    snapshot.payload.name = 'Changed locally';
    expect(storage.getItem()).toBe(JSON.stringify({ name: 'Learner', score: 3 }));
  });

  it('does not fabricate progress and rejects malformed v1 data without changing it', () => {
    expect(readV1ActiveProfileSnapshot({ getItem: () => null })).toBeNull();
    const raw = '{bad';
    const storage = { getItem: () => raw, setItem: vi.fn() };
    expect(() => readV1ActiveProfileSnapshot(storage)).toThrow(SyntaxError);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
