/**
 * Local PIN locks: the teacher dashboard and the grown-up settings in the game.
 *
 * Student progress lives in this browser's localStorage, so this lock keeps
 * children on a shared device out of classmates' data. It is not protection
 * against someone who opens developer tools; the data itself is not encrypted.
 * The PIN is never stored: only a salted PBKDF2-SHA-256 hash.
 */

export const PIN_KEY = 'bloomtype-teacher-pin';
export const ATTEMPTS_KEY = 'bloomtype-teacher-pin-attempts';
export const UNLOCK_KEY = 'bloomtype-teacher-unlocked';
export const PARENT_KEYS = {
  pinKey: 'bloomtype-parent-pin',
  attemptsKey: 'bloomtype-parent-pin-attempts',
  unlockKey: 'bloomtype-parent-unlocked',
};
export const MAX_ATTEMPTS = 5;
export const LOCKOUT_MS = 30_000;
const ITERATIONS = 150_000;

export function isValidPin(pin) {
  return typeof pin === 'string' && /^\d{4,8}$/.test(pin);
}

function toHex(bytes) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex) {
  return new Uint8Array(hex.match(/../g).map((pair) => parseInt(pair, 16)));
}

async function hashPin(pin, salt, iterations, subtle) {
  const key = await subtle.importKey('raw', new globalThis.TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return toHex(bits);
}

function readJSON(storage, key) {
  try { return JSON.parse(storage.getItem(key) || 'null'); } catch { return null; }
}

/**
 * Create a lock bound to the given storage. `local` keeps the PIN hash and
 * failed-attempt counter; `session` remembers an unlock for this tab only.
 */
export function createTeacherLock({
  local = globalThis.localStorage,
  session = globalThis.sessionStorage,
  crypto = globalThis.crypto,
  now = () => Date.now(),
  pinKey = PIN_KEY,
  attemptsKey = ATTEMPTS_KEY,
  unlockKey = UNLOCK_KEY,
} = {}) {
  function storedPin() {
    const record = readJSON(local, pinKey);
    return record && /^[0-9a-f]{32}$/.test(record.salt) && /^[0-9a-f]{64}$/.test(record.hash) && Number.isInteger(record.iterations)
      ? record
      : null;
  }

  function attempts() {
    const record = readJSON(local, attemptsKey);
    return { count: Number(record?.count) || 0, lockedUntil: Number(record?.lockedUntil) || 0 };
  }

  return {
    hasPin: () => storedPin() !== null,
    isUnlocked: () => storedPin() !== null && session.getItem(unlockKey) === '1',
    lockedForMs: () => Math.max(0, attempts().lockedUntil - now()),

    async setPin(pin) {
      if (!isValidPin(pin)) throw new Error('PIN must be 4 to 8 digits');
      if (storedPin()) throw new Error('A PIN is already set');
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const hash = await hashPin(pin, salt, ITERATIONS, crypto.subtle);
      local.setItem(pinKey, JSON.stringify({ salt: toHex(salt), hash, iterations: ITERATIONS }));
      local.removeItem(attemptsKey);
      session.setItem(unlockKey, '1');
    },

    /** Returns 'ok', 'wrong' or 'locked'. */
    async unlock(pin) {
      const record = storedPin();
      if (!record) return 'wrong';
      const state = attempts();
      if (state.lockedUntil > now()) return 'locked';
      const hash = isValidPin(pin) ? await hashPin(pin, fromHex(record.salt), record.iterations, crypto.subtle) : '';
      if (hash === record.hash) {
        local.removeItem(attemptsKey);
        session.setItem(unlockKey, '1');
        return 'ok';
      }
      const count = state.count + 1;
      const lockedUntil = count >= MAX_ATTEMPTS ? now() + LOCKOUT_MS : 0;
      local.setItem(attemptsKey, JSON.stringify({ count: lockedUntil ? 0 : count, lockedUntil }));
      return lockedUntil ? 'locked' : 'wrong';
    },

    lock() {
      session.removeItem(unlockKey);
    },

    /** Turn the lock off. Only works while it is unlocked. */
    removePin() {
      if (session.getItem(unlockKey) !== '1') return false;
      local.removeItem(pinKey);
      local.removeItem(attemptsKey);
      session.removeItem(unlockKey);
      return true;
    },

    /** Forgotten PIN: remove the PIN together with every local class record. */
    resetAndClearData(clearStudentData) {
      clearStudentData();
      local.removeItem(pinKey);
      local.removeItem(attemptsKey);
      session.removeItem(unlockKey);
    },
  };
}

/** The optional grown-up lock for settings inside the game. */
export function createParentLock(options = {}) {
  return createTeacherLock({ ...PARENT_KEYS, ...options });
}
