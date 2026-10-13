import { describe, expect, it } from 'vitest';
import { webcrypto } from 'node:crypto';
import { ATTEMPTS_KEY, LOCKOUT_MS, MAX_ATTEMPTS, PIN_KEY, createTeacherLock, isValidPin } from '../src/teacherLock.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

function setup() {
  const clock = { time: 1_000_000 };
  const local = memoryStorage();
  const session = memoryStorage();
  const lock = createTeacherLock({ local, session, crypto: webcrypto, now: () => clock.time });
  return { clock, local, session, lock };
}

describe('teacher PIN lock', () => {
  it('accepts only 4 to 8 digit PINs', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('12345678')).toBe(true);
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('123456789')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
    expect(isValidPin(1234)).toBe(false);
  });

  it('stores only a salted hash and unlocks this tab after setup', async () => {
    const { local, lock } = setup();
    expect(lock.hasPin()).toBe(false);
    expect(lock.isUnlocked()).toBe(false);
    await lock.setPin('2468');
    const stored = local.getItem(PIN_KEY);
    expect(stored).not.toContain('2468');
    expect(JSON.parse(stored)).toMatchObject({ salt: expect.stringMatching(/^[0-9a-f]{32}$/), hash: expect.stringMatching(/^[0-9a-f]{64}$/) });
    expect(lock.isUnlocked()).toBe(true);
    await expect(lock.setPin('1357')).rejects.toThrow('already set');
  });

  it('needs the right PIN again after locking', async () => {
    const { lock } = setup();
    await lock.setPin('2468');
    lock.lock();
    expect(lock.isUnlocked()).toBe(false);
    expect(await lock.unlock('1111')).toBe('wrong');
    expect(lock.isUnlocked()).toBe(false);
    expect(await lock.unlock('2468')).toBe('ok');
    expect(lock.isUnlocked()).toBe(true);
  });

  it('makes the user wait after repeated wrong PINs', async () => {
    const { clock, local, lock } = setup();
    await lock.setPin('2468');
    lock.lock();
    for (let i = 1; i < MAX_ATTEMPTS; i++) expect(await lock.unlock('0000')).toBe('wrong');
    expect(await lock.unlock('0000')).toBe('locked');
    // Even the right PIN is refused during the wait.
    expect(await lock.unlock('2468')).toBe('locked');
    expect(lock.lockedForMs()).toBe(LOCKOUT_MS);
    clock.time += LOCKOUT_MS;
    expect(await lock.unlock('2468')).toBe('ok');
    expect(local.getItem(ATTEMPTS_KEY)).toBeNull();
  });

  it('a forgotten PIN can only be reset by clearing class data', async () => {
    const { lock } = setup();
    await lock.setPin('2468');
    lock.lock();
    let cleared = false;
    lock.resetAndClearData(() => { cleared = true; });
    expect(cleared).toBe(true);
    expect(lock.hasPin()).toBe(false);
    expect(lock.isUnlocked()).toBe(false);
  });

  it('treats a damaged PIN record as no PIN, never as unlocked', async () => {
    const { local, session, lock } = setup();
    local.setItem(PIN_KEY, '{"salt":"x","hash":"y"}');
    session.setItem('bloomtype-teacher-unlocked', '1');
    expect(lock.hasPin()).toBe(false);
    expect(lock.isUnlocked()).toBe(false);
    expect(await lock.unlock('2468')).toBe('wrong');
  });
});
