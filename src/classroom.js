/**
 * BloomType — Classroom Data Sync (localStorage)
 * No backend required. Students enter a class code; their profile syncs
 * to a shared localStorage key. Teachers open the Teacher page and read it.
 */

const PREFIX = 'bloomtype-class';

/** Normalize class code to uppercase, trim whitespace. */
function normalizeCode(code) {
  return (code || '').toUpperCase().trim().replace(/\s+/g, '');
}

/** Join a class: attach code to profile, do initial sync. */
export function joinClass(profile, rawCode) {
  const code = normalizeCode(rawCode);
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
  const data = JSON.parse(localStorage.getItem(key) || '{}');
  const id = profile.uuid || profile.name || 'unknown';
  data[id] = {
    name: profile.name || 'Player',
    avatar: profile.avatar || '🌸',
    classCode: profile.classCode,
    updatedAt: new Date().toISOString(),
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
  const key = `${PREFIX}-${normalizeCode(code)}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Export class data as downloadable JSON blob. */
export function exportClassData(code) {
  const data = getClassData(code);
  if (!data) return null;
  const payload = {
    classCode: normalizeCode(code),
    exportedAt: new Date().toISOString(),
    students: Object.values(data),
  };
  return JSON.stringify(payload, null, 2);
}

/** Remove a student from class data (teacher action). */
export function removeStudent(code, studentId) {
  const key = `${PREFIX}-${normalizeCode(code)}`;
  const data = JSON.parse(localStorage.getItem(key) || '{}');
  delete data[studentId];
  localStorage.setItem(key, JSON.stringify(data));
}
