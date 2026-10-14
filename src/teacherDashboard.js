/**
 * BloomType — multi-class dashboard logic (pilot builds only). Pure
 * functions, no network and no DOM, so the class switcher, the per-class
 * report rows and the school admin totals are all unit-tested.
 */
import { mergeLinkedRosterRows } from './reporting.js';
import { nameKey } from './roster/importer.js';

const DAY_MS = 86_400_000;

/**
 * The classes in the switcher: open classes first by name, then (only when
 * asked for) archived ones.
 */
export function classesForSwitcher(classes = [], { showArchived = false } = {}) {
  const byName = (a, b) => String(a.name).localeCompare(String(b.name), undefined, { sensitivity: 'base', numeric: true });
  const open = classes.filter((c) => !c.archived_at).sort(byName);
  const archived = showArchived ? classes.filter((c) => c.archived_at).sort(byName) : [];
  return [...open, ...archived];
}

/** Keep the class the teacher had open, or fall back to the first one. */
export function pickSelectedClass(classes = [], preferredId = null) {
  return classes.find((c) => c.id === preferredId) || classes[0] || null;
}

/** Practice minutes per profile over the last 7 days, from session rows. */
export function weeklyMinutesByProfile(sessions = [], now = new Date()) {
  const since = now.getTime() - 7 * DAY_MS;
  const minutes = new Map();
  for (const s of sessions) {
    const at = new Date(s.created_at).getTime();
    if (!Number.isFinite(at) || at <= since || at > now.getTime() + DAY_MS) continue;
    const seconds = Math.min(1800, Math.max(0, Number(s.duration_seconds) || 0));
    minutes.set(s.profile_id, (minutes.get(s.profile_id) || 0) + seconds / 60);
  }
  return minutes;
}

const round1 = (n) => Math.round(n * 10) / 10;

/**
 * One report row per student for a cloud class:
 *  - joined students (class_roster), one row per child across linked
 *    devices, with their minutes this week from game_sessions;
 *  - imported students (roster_students) who have not joined yet, marked
 *    notJoined so the teacher can chase them.
 * An imported name matches a joined student when the names are equal, or
 * when the child typed just the first name and only one imported student
 * has it.
 */
export function buildCloudClassRows({ roster = [], imported = [], sessions = [], now = new Date() } = {}) {
  const minutes = weeklyMinutesByProfile(sessions, now);
  const minutesByStudent = new Map();
  for (const row of roster) {
    const key = row.student_id || row.profile_id;
    minutesByStudent.set(key, (minutesByStudent.get(key) || 0) + (minutes.get(row.profile_id) || 0));
  }
  const joined = mergeLinkedRosterRows(roster).map((row) => ({
    ...row,
    minutes7d: round1(minutesByStudent.get(row.student_id || row.profile_id) || 0),
  }));

  const firstNameCounts = new Map();
  for (const s of imported) {
    const first = nameKey(s.display_name).split(' ')[0];
    firstNameCounts.set(first, (firstNameCounts.get(first) || 0) + 1);
  }
  const unmatched = [...imported];
  for (const row of joined) {
    const typed = nameKey(row.name);
    if (!typed) continue;
    let index = unmatched.findIndex((s) => nameKey(s.display_name) === typed);
    if (index < 0 && !typed.includes(' ') && firstNameCounts.get(typed) === 1) {
      index = unmatched.findIndex((s) => nameKey(s.display_name).split(' ')[0] === typed);
    }
    if (index >= 0) {
      row.rosterName = unmatched[index].display_name;
      unmatched.splice(index, 1);
    }
  }
  const waiting = unmatched
    .sort((a, b) => String(a.display_name).localeCompare(String(b.display_name)))
    .map((s) => ({
      name: s.display_name,
      avatar: '🌱',
      completed_levels: [],
      total_words: 0,
      total_stars: 0,
      minutes7d: null,
      notJoined: true,
    }));
  return [...joined, ...waiting];
}

/** School-wide totals for the admin view, from school_class_summary rows. */
export function summarizeSchool(rows = []) {
  const open = rows.filter((r) => !r.archived);
  return {
    classes: open.length,
    archivedClasses: rows.length - open.length,
    students: open.reduce((sum, r) => sum + (Number(r.student_count) || 0), 0),
    activeStudents: open.reduce((sum, r) => sum + (Number(r.active_students_7d) || 0), 0),
    weeklyMinutes: round1(open.reduce((sum, r) => sum + (Number(r.weekly_minutes) || 0), 0)),
  };
}

/**
 * The admin table rows. Only these aggregate fields are kept, whatever the
 * server sends, so a future column can never put a child's name on screen.
 */
export function adminRows(rows = []) {
  return rows.map((r) => ({
    classId: r.class_id,
    className: r.class_name,
    teacherName: r.teacher_name || '',
    archived: Boolean(r.archived),
    students: Number(r.student_count) || 0,
    imported: Number(r.imported_count) || 0,
    activeStudents: Number(r.active_students_7d) || 0,
    weeklyMinutes: round1(Number(r.weekly_minutes) || 0),
  }));
}
