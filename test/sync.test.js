import { describe, expect, it, vi } from 'vitest';
import {
  buildCloudProfileRow,
  buildCloudProgressExport,
  buildCloudRosterRow,
  buildCloudSessionRow,
  buildLocalProgressExport,
  createCloudProfileController,
  createLatestSyncQueue,
  deleteAuthenticatedCloudProfile,
  deleteCloudProfileRows,
  fetchAllOwnedRows,
} from '../src/sync.js';

describe('authenticated cloud row mapping', () => {
  const profile = {
    uuid: 'local-only-id',
    name: 'Ada',
    avatar: '🌸',
    classCode: 'ABC123',
    totalWords: 20,
    totalStars: 3,
    highScore: 80,
    completedLevels: [1, 2],
  };

  it('binds profile and roster records to the authenticated identity', () => {
    const timestamp = '2026-08-28T00:00:00.000Z';
    expect(buildCloudProfileRow(profile, 'auth-user-id', timestamp)).toMatchObject({
      id: 'auth-user-id', class_code: 'ABC123', total_words: 20,
    });
    expect(buildCloudRosterRow(profile, 'auth-user-id', timestamp)).toEqual({
      class_code: 'ABC123',
      profile_id: 'auth-user-id',
      name: 'Ada',
      avatar: '🌸',
      total_words: 20,
      total_stars: 3,
      high_score: 80,
      completed_levels: [1, 2],
      updated_at: timestamp,
    });
  });

  it('does not create a roster row after the student leaves a class', () => {
    expect(buildCloudRosterRow({ ...profile, classCode: null }, 'auth-user-id')).toBeNull();
  });

  it('maps a stable attempt id into an idempotent session row', () => {
    expect(buildCloudSessionRow({
      sessionId: '70d9e983-2c3a-4e0f-9a69-f4bd1099ff02',
      level: 3, score: 90, wordsCompleted: 12,
    }, 'auth-user-id', '2026-08-28T00:00:00.000Z')).toMatchObject({
      session_id: '70d9e983-2c3a-4e0f-9a69-f4bd1099ff02',
      profile_id: 'auth-user-id', level: 3, score: 90, words_completed: 12,
    });
  });
});

describe('latest profile sync queue', () => {
  it('serializes the active write and coalesces queued values to the newest snapshot', async () => {
    const releases = [];
    const written = [];
    const enqueue = createLatestSyncQueue(async (value) => {
      written.push(value);
      await new Promise((resolve) => releases.push(resolve));
    });

    const first = enqueue({ totalWords: 1 });
    const second = enqueue({ totalWords: 2 });
    const third = enqueue({ totalWords: 3 });
    expect(written).toEqual([{ totalWords: 1 }]);

    releases.shift()();
    await vi.waitFor(() => {
      expect(written).toEqual([{ totalWords: 1 }, { totalWords: 3 }]);
    });
    releases.shift()();
    await Promise.all([first, second, third]);
  });

  it('continues with the newest pending value after an earlier write fails', async () => {
    const written = [];
    let releaseFirst;
    const enqueue = createLatestSyncQueue(async (value) => {
      written.push(value);
      if (value === 'old') {
        await new Promise((resolve) => { releaseFirst = resolve; });
        throw new Error('offline');
      }
    });

    const oldWrite = enqueue('old');
    const newWrite = enqueue('new');
    releaseFirst();
    await expect(oldWrite).rejects.toThrow('offline');
    await expect(newWrite).resolves.toBeUndefined();
    expect(written).toEqual(['old', 'new']);
  });
});

describe('cloud profile deletion', () => {
  it('deletes only the authenticated profile row', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ delete: remove }));

    await deleteCloudProfileRows({ from }, 'auth-user-id');

    expect(from).toHaveBeenCalledWith('profiles');
    expect(remove).toHaveBeenCalledOnce();
    expect(eq).toHaveBeenCalledWith('id', 'auth-user-id');
  });

  it('surfaces a rejected profile deletion instead of reporting success', async () => {
    const failure = { message: 'denied' };
    const eq = vi.fn().mockResolvedValue({ error: failure });
    const sb = { from: vi.fn(() => ({ delete: () => ({ eq }) })) };
    await expect(deleteCloudProfileRows(sb, 'auth-user-id')).rejects.toBe(failure);
  });

  it('signs out only the current browser after deleting cloud learning data', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const sb = { from: () => ({ delete: () => ({ eq }) }), auth: { signOut } };

    await expect(deleteAuthenticatedCloudProfile(sb, 'auth-user-id')).resolves.toEqual({
      deleted: true,
      signedOut: true,
    });
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('reports deleted data truthfully when local sign-out fails', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const sb = {
      from: () => ({ delete: () => ({ eq }) }),
      auth: { signOut: vi.fn().mockResolvedValue({ error: { message: 'network' } }) },
    };

    await expect(deleteAuthenticatedCloudProfile(sb, 'auth-user-id')).resolves.toEqual({
      deleted: true,
      signedOut: false,
      reason: 'sign-out-failed',
    });
  });

  it('runs deletion after an active save and blocks later profile recreation', async () => {
    const events = [];
    let releaseSave;
    const controller = createCloudProfileController({
      sync: async (profile) => {
        events.push(`save:${profile.totalWords}`);
        await new Promise((resolve) => { releaseSave = resolve; });
      },
      remove: async () => {
        events.push('delete');
        return { deleted: true, signedOut: true };
      },
    });

    const save = controller.sync({ totalWords: 1 });
    const deletion = controller.remove();
    await expect(controller.sync({ totalWords: 2 })).resolves.toBe(false);
    expect(events).toEqual(['save:1']);

    releaseSave();
    await save;
    await expect(deletion).resolves.toEqual({ deleted: true, signedOut: true });
    expect(events).toEqual(['save:1', 'delete']);
    await expect(controller.sync({ totalWords: 3 })).resolves.toBe(false);
  });

  it('allows a later retry when deletion does not run', async () => {
    const sync = vi.fn();
    const controller = createCloudProfileController({
      sync,
      remove: vi.fn().mockResolvedValue({ deleted: false, reason: 'offline' }),
    });

    await expect(controller.remove()).resolves.toEqual({ deleted: false, reason: 'offline' });
    await controller.sync({ totalWords: 4 });
    expect(sync).toHaveBeenCalledWith({ totalWords: 4 });
  });
});

describe('student progress export', () => {
  it('creates a versioned immutable local profile export', () => {
    const profile = { name: 'Ada', completedLevels: [1] };
    const payload = buildLocalProgressExport(profile, '2026-09-01T00:00:00.000Z');
    profile.completedLevels.push(2);
    expect(payload).toEqual({
      formatVersion: 1,
      exportedAt: '2026-09-01T00:00:00.000Z',
      source: 'local',
      profile: { name: 'Ada', completedLevels: [1] },
    });
  });

  it('paginates every owned row with stable inclusive ranges', async () => {
    const ranges = [];
    const pages = [[{ id: 1 }, { id: 2 }], [{ id: 3 }]];
    const sb = {
      from: () => ({
        select() { return this; },
        eq() { return this; },
        order() { return this; },
        range(from, to) {
          ranges.push([from, to]);
          return Promise.resolve({ data: pages.shift(), error: null });
        },
      }),
    };

    await expect(fetchAllOwnedRows(sb, 'game_sessions', 'profile_id', 'user-1', 2))
      .resolves.toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(ranges).toEqual([[0, 1], [2, 3]]);
  });

  it('fails the export instead of silently returning a partial page', async () => {
    const failure = { message: 'timeout' };
    const sb = {
      from: () => ({
        select() { return this; }, eq() { return this; }, order() { return this; },
        range: () => Promise.resolve({ data: [{ id: 1 }], error: failure }),
      }),
    };
    await expect(fetchAllOwnedRows(sb, 'game_sessions', 'profile_id', 'user-1'))
      .rejects.toBe(failure);
  });

  it('exports only the authenticated identity across profile, session, and roster queries', async () => {
    const filters = [];
    const rows = {
      profiles: [{ id: 'user-1', name: 'Ada' }],
      game_sessions: [{ id: 4, profile_id: 'user-1' }],
      class_roster: [{ id: 7, profile_id: 'user-1' }],
    };
    const sb = {
      from(table) {
        return {
          select() { return this; },
          eq(column, value) { filters.push([table, column, value]); return this; },
          order() { return this; },
          range: () => Promise.resolve({ data: rows[table], error: null }),
        };
      },
    };

    await expect(buildCloudProgressExport(sb, 'user-1', '2026-09-01T00:00:00.000Z'))
      .resolves.toEqual({
        formatVersion: 1,
        exportedAt: '2026-09-01T00:00:00.000Z',
        source: 'cloud',
        accountId: 'user-1',
        profile: { id: 'user-1', name: 'Ada' },
        sessions: [{ id: 4, profile_id: 'user-1' }],
        rosterMemberships: [{ id: 7, profile_id: 'user-1' }],
      });
    expect(filters).toEqual([
      ['profiles', 'id', 'user-1'],
      ['game_sessions', 'profile_id', 'user-1'],
      ['class_roster', 'profile_id', 'user-1'],
    ]);
  });
});
