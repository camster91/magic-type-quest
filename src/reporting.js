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
