/**
 * BloomType — teacher classes on this device
 * A teacher creates a class, gets a code to give students, and can set an
 * assignment and a spelling list. Stored in this browser only.
 */

const KEY = 'bloomtype-classes';
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
const MAX_WORDS = 100;

function readAll() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '{}');
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

/** A 6-character code with no look-alike letters (no I, L, O, 0, 1, U). */
export function generateClassCode(taken = [], random = Math.random) {
  const used = new Set(taken);
  for (let tries = 0; tries < 50; tries++) {
    let code = '';
    for (let i = 0; i < 6; i++) code += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
    if (!used.has(code)) return code;
  }
  throw new Error('Could not create a unique class code');
}

export function listClasses() {
  return Object.entries(readAll())
    .map(([code, meta]) => ({ code, ...meta }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

export function getClassMeta(code) {
  return code ? readAll()[code] || null : null;
}

export function createClass(name, random = Math.random) {
  const all = readAll();
  const code = generateClassCode(Object.keys(all), random);
  all[code] = {
    name: String(name || '').trim().slice(0, 40) || 'My class',
    createdAt: new Date().toISOString(),
    assignment: null,
    words: [],
  };
  writeAll(all);
  return code;
}

export function updateClass(code, patch) {
  const all = readAll();
  if (!all[code]) return null;
  all[code] = { ...all[code], ...patch };
  writeAll(all);
  return all[code];
}

export function deleteClass(code) {
  const all = readAll();
  delete all[code];
  writeAll(all);
}

/** Turn pasted text into a clean, typable spelling list. */
export function cleanWordList(text) {
  const seen = new Set();
  const words = [];
  for (const raw of String(text || '').split(/[\s,;.]+/)) {
    const word = raw.toLowerCase();
    if (!/^[a-z]{2,14}$/.test(word) || seen.has(word)) continue;
    seen.add(word);
    words.push(word);
    if (words.length >= MAX_WORDS) break;
  }
  return words;
}

/**
 * An assignment asks students to finish a level by a date.
 * Returns 'done', 'late', 'not-yet' or 'none'.
 */
export function assignmentStatus(completedLevels, assignment, now = new Date()) {
  if (!assignment?.level) return 'none';
  if ((completedLevels || []).includes(Number(assignment.level))) return 'done';
  if (assignment.due && new Date(`${assignment.due}T23:59:59`) < now) return 'late';
  return 'not-yet';
}

/** A drill lesson built from the class spelling list, or null. */
export function buildClassWordsLesson(meta) {
  const words = cleanWordList((meta?.words || []).join(' '));
  if (words.length === 0) return null;
  return {
    id: 'class-words',
    name: meta.name,
    keys: [],
    words,
    practicePatterns: [],
    speed: 0.35,
    spawnRate: 4000,
    wordsPerLevel: Math.min(words.length, 20),
    health: 5,
    icon: '📝',
    isDrill: true,
  };
}
