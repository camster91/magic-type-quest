/** Escape a value according to RFC 4180-style CSV rules. */
export function csvCell(value) {
  const raw = String(value ?? '');
  const text = /^\s*[=+\-@]/u.test(raw) ? `'${raw}` : raw;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function createRosterCSV(students) {
  const headers = ['Name', 'Level', 'Words', 'Score', 'Stars', 'Status', 'Source'];
  const rows = students.map((student) => headers.map((header) => (
    csvCell(student[header.toLowerCase()])
  )).join(','));
  return [headers.join(','), ...rows].join('\r\n');
}

export function createRosterExport(classCode, students, exportedAt = new Date().toISOString()) {
  return JSON.stringify({ classCode: classCode || 'all', exportedAt, students }, null, 2);
}

/**
 * Weak keys: lowest accuracy first, among keys tried at least 3 times and
 * missed more than 1 time in 10 (a key at 90%+ counts as learned).
 */
export function weakKeysFrom(keySR = {}, count = 3) {
  return Object.entries(keySR)
    .map(([key, sr]) => ({ key, tries: (sr?.correct || 0) + (sr?.wrong || 0), wrong: sr?.wrong || 0 }))
    .filter((k) => /^[a-z0-9]$/i.test(k.key) && k.tries >= 3 && k.wrong / k.tries > 0.1)
    .sort((a, b) => (b.wrong / b.tries) - (a.wrong / a.tries) || a.key.localeCompare(b.key))
    .slice(0, count)
    .map((k) => k.key.toLowerCase());
}

/** The numbers a teacher or parent needs, from one student profile. */
export function summarizeStudent(profile = {}, now = new Date()) {
  const stats = Object.values(profile.levelStats || {});
  const wpm = stats.map((s) => Number(s.bestWpm ?? s.wpm) || 0).filter((n) => n > 0);
  const accuracy = stats.map((s) => Number(s.accuracy) || 0).filter((n) => n > 0);
  const log = profile.practiceLog || {};
  let minutes7d = 0;
  let activeDays7d = 0;
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (log[key] > 0) { minutes7d += log[key]; activeDays7d++; }
  }
  return {
    bestWpm: wpm.length ? Math.max(...wpm) : 0,
    avgAccuracy: accuracy.length ? Math.round(accuracy.reduce((a, b) => a + b, 0) / accuracy.length) : null,
    weakKeys: weakKeysFrom(profile.keySR),
    minutes7d: Math.round(minutes7d * 10) / 10,
    activeDays7d,
    minutesTotal: Math.round((profile.minutesPractised || 0) * 10) / 10,
  };
}

const REPORT_HEADERS = [
  ['name', 'Name'], ['level', 'Levels done'], ['bestWpm', 'Best WPM'], ['avgAccuracy', 'Accuracy %'],
  ['weakKeys', 'Weak keys'], ['minutes7d', 'Minutes (7 days)'], ['minutesTotal', 'Minutes (total)'],
  ['words', 'Words'], ['stars', 'Stars'], ['lastPlayed', 'Last played'], ['assignment', 'Assignment'],
  ['saveCode', 'Save code'],
];

/** One CSV row per student with the full report columns. */
export function createClassReportCSV(rows) {
  const header = REPORT_HEADERS.map(([, label]) => csvCell(label)).join(',');
  const lines = rows.map((row) => REPORT_HEADERS.map(([key]) => {
    const value = row[key];
    return csvCell(Array.isArray(value) ? value.join(' ') : value ?? '');
  }).join(','));
  return [header, ...lines].join('\r\n');
}

/**
 * Cloud roster rows from one child's linked devices share a student_id.
 * Fold them into one row: the newest name and avatar, the highest totals and
 * every level finished on any device.
 */
export function mergeLinkedRosterRows(rows = []) {
  const byStudent = new Map();
  for (const row of rows) {
    const key = row.student_id || row.profile_id || row;
    const seen = byStudent.get(key);
    if (!seen) {
      byStudent.set(key, { ...row, completed_levels: [...(row.completed_levels || [])] });
      continue;
    }
    const newer = String(row.updated_at || '') > String(seen.updated_at || '');
    const merged = newer ? { ...seen, ...row } : seen;
    for (const field of ['total_words', 'total_stars', 'high_score']) {
      merged[field] = Math.max(Number(seen[field]) || 0, Number(row[field]) || 0);
    }
    merged.completed_levels = [...new Set([...(seen.completed_levels || []), ...(row.completed_levels || [])])]
      .sort((a, b) => a - b);
    merged.updated_at = newer ? row.updated_at : seen.updated_at;
    byStudent.set(key, merged);
  }
  return [...byStudent.values()];
}
