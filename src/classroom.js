/**
 * BloomType — Classroom Data Sync (localStorage)
 * No backend required. Students enter a class code; their profile syncs
 * to a shared localStorage key. Teachers open the Teacher page and read it.
 */

const PREFIX = 'bloomtype-class';

function readClassData(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}

/** Normalize class code to uppercase, trim whitespace. */
export function normalizeClassCode(code) {
  return (code || '').toUpperCase().trim().replace(/\s+/g, '');
}

/** Join a class: attach code to profile, do initial sync. */
export function joinClass(profile, rawCode) {
  const code = normalizeClassCode(rawCode);
  const previousCode = normalizeClassCode(profile.classCode);
  if (!profile.uuid) {
    profile.uuid = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  const studentId = profile.uuid;
  if (previousCode && previousCode !== code) removeStudent(previousCode, studentId);
  if (!code) {
    delete profile.classCode;
    return null;
  }
  profile.classCode = code;
  syncToClass(profile);
  return code;
}

/** Sync current profile snapshot into class-scoped localStorage. */
export function syncToClass(profile) {
  if (!profile.classCode) return;
  const key = `${PREFIX}-${profile.classCode}`;
  const data = readClassData(key);
  const id = profile.uuid || profile.name || 'unknown';
  data[id] = {
    name: profile.name || 'Player',
    avatar: profile.avatar || '🌸',
    classCode: profile.classCode,
    updatedAt: new Date().toISOString(),
    lastPlayed: profile.lastPlayed || null,
    totalStars: profile.totalStars || 0,
    highScore: profile.highScore || 0,
    totalWords: profile.totalWords || 0,
    completedLevels: profile.completedLevels || [],
    achievements: (profile.achievements || []).length,
    gardenCount: (profile.garden || []).length,
  };
  localStorage.setItem(key, JSON.stringify(data));
}

/** Get class roster from localStorage. */
export function getClassData(code) {
  const key = `${PREFIX}-${normalizeClassCode(code)}`;
  if (!localStorage.getItem(key)) return null;
  return readClassData(key);
}

/** Export class data as downloadable JSON blob. */
export function exportClassData(code) {
  const data = getClassData(code);
  if (!data) return null;
  const payload = {
    classCode: normalizeClassCode(code),
    exportedAt: new Date().toISOString(),
    students: Object.values(data),
  };
  return JSON.stringify(payload, null, 2);
}

/** Remove a student from class data (teacher action). */
export function removeStudent(code, studentId) {
  const key = `${PREFIX}-${normalizeClassCode(code)}`;
  const data = readClassData(key);
  delete data[studentId];
  if (Object.keys(data).length === 0) localStorage.removeItem(key);
  else localStorage.setItem(key, JSON.stringify(data));
}

/** Remove one student from every local class, including stale legacy copies. */
export function removeStudentFromAllClasses(studentId) {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(`${PREFIX}-`)) keys.push(key);
  }
  for (const key of keys) {
    const data = readClassData(key);
    delete data[studentId];
    if (Object.keys(data).length === 0) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(data));
  }
}
