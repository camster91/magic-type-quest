/**
 * BloomType — Restore codes
 * A short, account-free code that carries a student's progress to another
 * device. It holds no name and no identifiers: only level, star, word and
 * pet progress plus a few weak keys. Restoring never lowers progress.
 *
 * Layout (80 bits = 16 Crockford base32 chars, shown as XXXX-XXXX-XXXX-XXXX):
 *   version 3 | levels 10 | stars 16 | words 17 | pet 2 | avatar 4 |
 *   locale 2 | weak keys 3x5 | spare 1 | checksum 10
 */

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const VERSION = 1;
const CHECKSUM_BITS = 10;
const DATA_BITS = 70;

export const RESTORE_AVATARS = ['🌸', '🌻', '🐉', '🐱', '🐰', '🦊', '🐼', '🤖', '🦉', '🐶'];
export const RESTORE_LOCALES = ['en', 'fr', 'es'];

const FIELDS = [
  ['version', 3],
  ['levels', 10],
  ['stars', 16],
  ['words', 17],
  ['pet', 2],
  ['avatar', 4],
  ['locale', 2],
  ['key1', 5],
  ['key2', 5],
  ['key3', 5],
  ['spare', 1],
];

function clampInt(value, bits) {
  const max = 2 ** bits - 1;
  const n = Math.floor(Number(value) || 0);
  return Math.max(0, Math.min(max, n));
}

function pushBits(bits, value, width) {
  for (let i = width - 1; i >= 0; i--) bits.push(Math.floor(value / 2 ** i) % 2);
}

function readBits(bits, start, width) {
  let value = 0;
  for (let i = 0; i < width; i++) value = value * 2 + bits[start + i];
  return value;
}

function checksum(dataBits) {
  // FNV-1a over the data bits, folded to 10 bits.
  const padded = dataBits.concat(new Array((8 - (dataBits.length % 8)) % 8).fill(0));
  let hash = 0x811c9dc5;
  for (let i = 0; i < padded.length; i += 8) {
    hash ^= readBits(padded, i, 8);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return (hash ^ (hash >>> 10) ^ (hash >>> 20)) & 0x3ff;
}

function keyIndex(key) {
  const code = String(key || '').toLowerCase().charCodeAt(0);
  return code >= 97 && code <= 122 && String(key).length === 1 ? code - 96 : 0;
}

/** Pick up to three weak letter keys (lowest accuracy first). */
function weakKeys(keySR = {}) {
  return Object.entries(keySR)
    .filter(([key, sr]) => keyIndex(key) && (sr?.wrong || 0) > 0)
    .map(([key, sr]) => ({ key: key.toLowerCase(), accuracy: (sr.correct || 0) / ((sr.correct || 0) + sr.wrong) }))
    .sort((a, b) => a.accuracy - b.accuracy || a.key.localeCompare(b.key))
    .slice(0, 3)
    .map((entry) => entry.key);
}

/** Build the restore code for a profile. */
export function encodeRestoreCode(profile = {}) {
  let levels = 0;
  for (const level of profile.completedLevels || []) {
    if (Number.isInteger(level) && level >= 1 && level <= 10) levels |= 1 << (level - 1);
  }
  const keys = weakKeys(profile.keySR);
  const values = {
    version: VERSION,
    levels,
    stars: clampInt(profile.totalStars, 16),
    words: clampInt(profile.totalWords, 17),
    pet: clampInt((profile.petEvolution || 1) - 1, 2),
    avatar: Math.max(0, RESTORE_AVATARS.indexOf(profile.avatar)),
    locale: Math.max(0, RESTORE_LOCALES.indexOf(profile.locale)),
    key1: keyIndex(keys[0]),
    key2: keyIndex(keys[1]),
    key3: keyIndex(keys[2]),
    spare: 0,
  };

  const bits = [];
  for (const [name, width] of FIELDS) pushBits(bits, values[name], width);
  pushBits(bits, checksum(bits), CHECKSUM_BITS);

  let chars = '';
  for (let i = 0; i < bits.length; i += 5) chars += ALPHABET[readBits(bits, i, 5)];
  return chars.match(/.{4}/g).join('-');
}

/** Normalize what a child typed: drop spaces/dashes, fix look-alike letters. */
export function normalizeRestoreCode(input) {
  return String(input || '')
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
}

/** Decode a restore code. Returns progress data, or null if it is not valid. */
export function decodeRestoreCode(input) {
  const chars = normalizeRestoreCode(input);
  if (chars.length !== 16) return null;

  const bits = [];
  for (const ch of chars) {
    const value = ALPHABET.indexOf(ch);
    if (value < 0) return null;
    pushBits(bits, value, 5);
  }

  const dataBits = bits.slice(0, DATA_BITS);
  if (readBits(bits, DATA_BITS, CHECKSUM_BITS) !== checksum(dataBits)) return null;

  const values = {};
  let offset = 0;
  for (const [name, width] of FIELDS) {
    values[name] = readBits(dataBits, offset, width);
    offset += width;
  }
  if (values.version !== VERSION) return null;
  if (values.pet > 2 || values.avatar >= RESTORE_AVATARS.length || values.locale >= RESTORE_LOCALES.length) return null;

  const completedLevels = [];
  for (let level = 1; level <= 10; level++) {
    if (values.levels & (1 << (level - 1))) completedLevels.push(level);
  }
  const weak = [values.key1, values.key2, values.key3]
    .filter((index) => index >= 1 && index <= 26)
    .map((index) => String.fromCharCode(96 + index));

  return {
    completedLevels,
    totalStars: values.stars,
    totalWords: values.words,
    petEvolution: values.pet + 1,
    avatar: RESTORE_AVATARS[values.avatar],
    locale: RESTORE_LOCALES[values.locale],
    weakKeys: weak,
  };
}

function hasProgress(profile) {
  return (profile.totalWords || 0) > 0
    || (profile.totalStars || 0) > 0
    || (profile.completedLevels || []).length > 0;
}

/**
 * Merge restored progress into a profile in place. Every number keeps the
 * higher value, so restoring an old code can never erase newer progress.
 */
export function mergeRestoredProgress(profile, data) {
  const fresh = !hasProgress(profile);
  const levels = new Set([...(profile.completedLevels || []), ...data.completedLevels]);
  profile.completedLevels = [...levels].sort((a, b) => a - b);
  profile.totalStars = Math.max(profile.totalStars || 0, data.totalStars);
  profile.totalWords = Math.max(profile.totalWords || 0, data.totalWords);
  profile.petEvolution = Math.max(profile.petEvolution || 1, data.petEvolution);
  if (fresh) {
    profile.avatar = data.avatar;
    profile.locale = data.locale;
  }
  if (!profile.keySR) profile.keySR = {};
  for (const key of data.weakKeys) {
    if (!profile.keySR[key]) {
      profile.keySR[key] = { correct: 0, wrong: 1, streak: 0, lastPracticed: null, interval: 1 };
    }
  }
  return profile;
}
