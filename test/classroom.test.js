import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getClassData, joinClass, normalizeClassCode } from '../src/classroom.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

describe('classroom membership', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
  });

  it('normalizes class codes and writes the current student snapshot', () => {
    const profile = {
      uuid: 'student-1', name: 'Ada', classCode: null, totalWords: 12,
      lastPlayed: '2026-08-28T12:00:00.000Z',
    };
    expect(normalizeClassCode(' ab 12 ')).toBe('AB12');
    expect(joinClass(profile, ' ab 12 ')).toBe('AB12');
    expect(getClassData('ab12')['student-1']).toMatchObject({
      name: 'Ada', classCode: 'AB12', totalWords: 12,
      lastPlayed: '2026-08-28T12:00:00.000Z',
    });
  });

  it('removes stale membership when a student changes or leaves a class', () => {
    const profile = { uuid: 'student-1', name: 'Ada' };
    joinClass(profile, 'FIRST');
    joinClass(profile, 'SECOND');
    expect(getClassData('FIRST')).toBeNull();
    expect(getClassData('SECOND')).toHaveProperty('student-1');

    expect(joinClass(profile, '')).toBeNull();
    expect(profile.classCode).toBeUndefined();
    expect(getClassData('SECOND')).toBeNull();
  });

  it('recovers from a corrupt class snapshot instead of blocking profile save', () => {
    localStorage.setItem('bloomtype-class-ABC123', '{broken');
    const profile = { uuid: 'student-1', name: 'Ada' };
    expect(() => joinClass(profile, 'ABC123')).not.toThrow();
    expect(getClassData('ABC123')).toHaveProperty('student-1');
  });
});
