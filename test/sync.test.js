import { describe, expect, it, vi } from 'vitest';
import { buildCloudProfileRow, buildCloudRosterRow, buildCloudSessionRow, createLatestSyncQueue } from '../src/sync.js';

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
