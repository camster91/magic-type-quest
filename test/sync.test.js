import { describe, expect, it } from 'vitest';
import { buildCloudProfileRow, buildCloudRosterRow } from '../src/sync.js';

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
});
