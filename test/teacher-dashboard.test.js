import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  adminRows,
  buildCloudClassRows,
  classesForSwitcher,
  pickSelectedClass,
  summarizeSchool,
  weeklyMinutesByProfile,
} from '../src/teacherDashboard.js';
import {
  claimTeacherRole,
  createCloudClass,
  fetchCloudClassReport,
  fetchSchoolSummary,
  getTeacherSession,
  inviteTeacher,
  listMyClasses,
  renameCloudClass,
  setCloudClassArchived,
  signInWithGoogle,
  teacherRedirectUrl,
} from '../src/teacherCloud.js';
import { pilotConnectOrigins, widenConnectSrc } from '../scripts/pilot-csp.mjs';

const root = resolve(import.meta.dirname, '..');
const NOW = new Date('2026-10-14T12:00:00Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

describe('class switcher', () => {
  const classes = [
    { id: 'c', name: 'Room 10', archived_at: null },
    { id: 'a', name: 'room 2', archived_at: null },
    { id: 'z', name: 'Old class', archived_at: '2026-06-30T00:00:00Z' },
  ];

  it('lists open classes by name (numbers in order) and hides archived ones', () => {
    expect(classesForSwitcher(classes).map((c) => c.id)).toEqual(['a', 'c']);
  });

  it('adds archived classes last when asked', () => {
    expect(classesForSwitcher(classes, { showArchived: true }).map((c) => c.id)).toEqual(['a', 'c', 'z']);
  });

  it('keeps the class the teacher had open, or falls back to the first', () => {
    const visible = classesForSwitcher(classes);
    expect(pickSelectedClass(visible, 'c').id).toBe('c');
    expect(pickSelectedClass(visible, 'z').id).toBe('a');
    expect(pickSelectedClass([], 'a')).toBeNull();
  });
});

describe('per-class report rows', () => {
  const roster = [
    { profile_id: 'p1', student_id: 's1', name: 'Ava', total_stars: 3, total_words: 40, completed_levels: [1, 2], updated_at: daysAgo(1) },
    // Ava's second (linked) device.
    { profile_id: 'p1b', student_id: 's1', name: 'Ava', total_stars: 5, total_words: 10, completed_levels: [3], updated_at: daysAgo(2) },
    { profile_id: 'p2', student_id: 'p2', name: 'Ben Ortiz', total_stars: 1, completed_levels: [], updated_at: daysAgo(3) },
  ];
  const sessions = [
    { profile_id: 'p1', duration_seconds: 600, created_at: daysAgo(1) },
    { profile_id: 'p1b', duration_seconds: 300, created_at: daysAgo(2) },
    { profile_id: 'p1', duration_seconds: 9999, created_at: daysAgo(3) },
    { profile_id: 'p2', duration_seconds: 120, created_at: daysAgo(10) },
    { profile_id: 'p2', duration_seconds: null, created_at: daysAgo(1) },
  ];

  it('sums this week\'s minutes per profile, capping one sitting at 30 minutes', () => {
    const minutes = weeklyMinutesByProfile(sessions, NOW);
    expect(minutes.get('p1')).toBe(40);
    expect(minutes.get('p1b')).toBe(5);
    expect(minutes.get('p2')).toBe(0);
  });

  it('shows one row per child across linked devices, with their weekly minutes', () => {
    const rows = buildCloudClassRows({ roster, sessions, now: NOW });
    expect(rows).toHaveLength(2);
    const ava = rows.find((r) => r.name === 'Ava');
    expect(ava.minutes7d).toBe(45);
    expect(ava.total_stars).toBe(5);
    expect(ava.completed_levels).toEqual([1, 2, 3]);
    expect(rows.find((r) => r.name === 'Ben Ortiz').minutes7d).toBe(0);
  });

  it('matches imported names to joined students and lists the rest as not joined', () => {
    const imported = [
      { display_name: 'Ava T.' },
      { display_name: 'Ben O.' },
      { display_name: 'Cleo R.' },
      { display_name: 'Ben Ortiz' },
    ];
    const rows = buildCloudClassRows({ roster, imported, sessions, now: NOW });
    // "Ben Ortiz" matches exactly; "Ava" matches the only imported Ava.
    expect(rows.find((r) => r.name === 'Ava').rosterName).toBe('Ava T.');
    expect(rows.find((r) => r.name === 'Ben Ortiz').rosterName).toBe('Ben Ortiz');
    const waiting = rows.filter((r) => r.notJoined);
    expect(waiting.map((r) => r.name)).toEqual(['Ben O.', 'Cleo R.']);
    expect(waiting[0]).toMatchObject({ completed_levels: [], minutes7d: null });
  });

  it('does not guess when a typed first name fits two imported students', () => {
    const rows = buildCloudClassRows({
      roster: [{ profile_id: 'p9', name: 'sam', completed_levels: [] }],
      imported: [{ display_name: 'Sam A.' }, { display_name: 'Sam B.' }],
    });
    expect(rows[0].rosterName).toBeUndefined();
    expect(rows.filter((r) => r.notJoined)).toHaveLength(2);
  });
});

describe('school admin view', () => {
  const raw = [
    { class_id: '1', class_name: 'Room 1', teacher_name: 'Ms A', archived: false, student_count: 20, imported_count: 22, active_students_7d: 15, weekly_minutes: '120.5', student_names: ['leak'] },
    { class_id: '2', class_name: 'Room 2', teacher_name: null, archived: false, student_count: 18, imported_count: 0, active_students_7d: 9, weekly_minutes: 60 },
    { class_id: '3', class_name: 'Old', teacher_name: 'Mr B', archived: true, student_count: 30, imported_count: 0, active_students_7d: 0, weekly_minutes: 0 },
  ];

  it('totals the open classes only', () => {
    expect(summarizeSchool(raw)).toEqual({ classes: 2, archivedClasses: 1, students: 38, activeStudents: 24, weeklyMinutes: 180.5 });
  });

  it('keeps only aggregate fields, whatever the server sends', () => {
    const rows = adminRows(raw);
    expect(Object.keys(rows[0]).sort()).toEqual(['activeStudents', 'archived', 'classId', 'className', 'imported', 'students', 'teacherName', 'weeklyMinutes']);
    expect(JSON.stringify(rows)).not.toContain('leak');
    expect(rows[0].weeklyMinutes).toBe(120.5);
  });
});

// A chainable stand-in for the Supabase query builder.
function mockSupabase({ tables = {}, rpc = {}, session = null } = {}) {
  const calls = [];
  const from = vi.fn((table) => {
    const query = { table, filters: [] };
    calls.push(query);
    const builder = {
      select: (cols) => { query.select = cols; return builder; },
      eq: (col, val) => { query.filters.push(['eq', col, val]); return builder; },
      in: (col, val) => { query.filters.push(['in', col, val]); return builder; },
      gte: (col, val) => { query.filters.push(['gte', col, val]); return builder; },
      order: () => builder,
      then: (resolveFn, rejectFn) => Promise.resolve({ data: tables[table] || [], error: null }).then(resolveFn, rejectFn),
    };
    return builder;
  });
  return {
    calls,
    from,
    rpc: vi.fn(async (name) => ({ data: rpc[name] ?? null, error: null })),
    auth: {
      getSession: vi.fn(async () => ({ data: { session }, error: null })),
      signInWithOAuth: vi.fn(async () => ({ error: null })),
      signOut: vi.fn(async () => ({ error: null })),
    },
  };
}

describe('teacher cloud API (mocked Supabase)', () => {
  it('signs teachers in with Google, asking for Classroom scopes only to import', async () => {
    const sb = mockSupabase();
    await signInWithGoogle(sb, { redirectTo: 'https://x/teacher.html' });
    expect(sb.auth.signInWithOAuth).toHaveBeenLastCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://x/teacher.html', queryParams: { prompt: 'select_account' } },
    });
    await signInWithGoogle(sb, { redirectTo: 'https://x/teacher.html?import=google', classroom: true });
    const { options } = sb.auth.signInWithOAuth.mock.calls[1][0];
    expect(options.scopes).toBe('https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.rosters.readonly');
  });

  it('never treats an anonymous (student) session as a teacher', async () => {
    const anonymous = mockSupabase({ session: { user: { id: 'kid', is_anonymous: true } } });
    await expect(getTeacherSession(anonymous)).resolves.toBeNull();
    const teacher = mockSupabase({ session: { provider_token: 'g-token', user: { id: 't1', email: 'a@school.example', user_metadata: { full_name: 'Ms A' } } } });
    await expect(getTeacherSession(teacher)).resolves.toEqual({ userId: 't1', email: 'a@school.example', displayName: 'Ms A', providerToken: 'g-token' });
  });

  it('claims an invite and accepts only known roles', async () => {
    await expect(claimTeacherRole(mockSupabase({ rpc: { claim_teacher_invite: 'admin' } }), 'Ms A')).resolves.toBe('admin');
    await expect(claimTeacherRole(mockSupabase({ rpc: { claim_teacher_invite: 'superuser' } }))).resolves.toBeNull();
    await expect(claimTeacherRole(mockSupabase())).resolves.toBeNull();
  });

  it('creates, renames and archives classes through the RPCs', async () => {
    const sb = mockSupabase({ rpc: { create_class: [{ id: 'c1', class_code: 'ABCD2345' }] } });
    await expect(createCloudClass(sb, 'Room 1')).resolves.toEqual({ id: 'c1', class_code: 'ABCD2345' });
    await renameCloudClass(sb, 'c1', 'Room 1A');
    await setCloudClassArchived(sb, 'c1', true);
    expect(sb.rpc.mock.calls).toEqual([
      ['create_class', { p_name: 'Room 1' }],
      ['rename_class', { p_class_id: 'c1', p_name: 'Room 1A' }],
      ['set_class_archived', { p_class_id: 'c1', p_archived: true }],
    ]);
    await listMyClasses(sb);
    expect(sb.calls.at(-1).table).toBe('classes');
  });

  it('builds a class report from the roster, imported names and this week\'s sessions', async () => {
    const sb = mockSupabase({
      tables: {
        class_roster: [{ profile_id: 'p1', student_id: 'p1', name: 'Ava', completed_levels: [1] }],
        roster_students: [{ display_name: 'Ava T.' }, { display_name: 'Ben O.' }],
        game_sessions: [{ profile_id: 'p1', duration_seconds: 600, created_at: daysAgo(1) }],
      },
    });
    const rows = await fetchCloudClassReport(sb, { id: 'c1', class_code: 'ABCD2345' }, NOW);
    expect(rows.map((r) => [r.name, r.minutes7d, Boolean(r.notJoined)])).toEqual([['Ava', 10, false], ['Ben O.', null, true]]);
    const [roster, imported, sessions] = sb.calls;
    expect(roster.filters).toContainEqual(['eq', 'class_code', 'ABCD2345']);
    expect(imported.filters).toContainEqual(['eq', 'class_id', 'c1']);
    expect(imported.select).not.toMatch(/email/);
    expect(sessions.filters).toContainEqual(['in', 'profile_id', ['p1']]);
    expect(sessions.filters).toContainEqual(['gte', 'created_at', daysAgo(7)]);
  });

  it('reads the admin summary and sends invites through RPCs', async () => {
    const sb = mockSupabase({ rpc: { school_class_summary: [{ class_id: '1' }], admin_invite_teacher: false } });
    await expect(fetchSchoolSummary(sb)).resolves.toEqual([{ class_id: '1' }]);
    await expect(inviteTeacher(sb, 'b@school.example')).resolves.toBe(false);
  });

  it('returns to the teacher page without an old token hash', () => {
    expect(teacherRedirectUrl('https://x.example/magic-type-quest/teacher.html?import=google#access_token=abc'))
      .toBe('https://x.example/magic-type-quest/teacher.html');
    expect(teacherRedirectUrl('https://x.example/teacher.html', '?import=google')).toBe('https://x.example/teacher.html?import=google');
  });
});

describe('pilot-only boundary', () => {
  it('loads the cloud dashboard only behind the static build flag', () => {
    const teacher = readFileSync(resolve(root, 'src/teacher.js'), 'utf8');
    expect(teacher).toMatch(/if \(import\.meta\.env\.VITE_CLOUD_CLASS_LOGIN === 'true'\) \{\s*import\('\.\/teacherCloudUI\.js'\)/);
    expect(teacher).not.toMatch(/^import .*teacherCloud/m);
    // Every cloud panel starts hidden in the markup.
    const html = readFileSync(resolve(root, 'teacher.html'), 'utf8');
    for (const id of ['cloud-signin', 'cloud-panel', 'admin-panel']) {
      expect(html).toMatch(new RegExp(`id="${id}"[^>]*\\shidden[\\s>]`));
    }
  });

  it('widens connect-src only for a pilot build with Supabase settings', () => {
    const html = '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; connect-src \'self\'; object-src \'none\'">';
    expect(pilotConnectOrigins({})).toEqual([]);
    expect(pilotConnectOrigins({ VITE_SUPABASE_URL: 'https://p.supabase.co' })).toEqual([]);
    expect(pilotConnectOrigins({ VITE_CLOUD_CLASS_LOGIN: 'true' })).toEqual([]);
    const origins = pilotConnectOrigins({ VITE_CLOUD_CLASS_LOGIN: 'true', VITE_SUPABASE_URL: 'https://p.supabase.co/' });
    expect(origins).toEqual(['https://p.supabase.co', 'wss://p.supabase.co', 'https://classroom.googleapis.com']);
    expect(widenConnectSrc(html, origins)).toContain("connect-src 'self' https://p.supabase.co wss://p.supabase.co https://classroom.googleapis.com;");
    expect(widenConnectSrc(html, [])).toBe(html);
    expect(() => pilotConnectOrigins({ VITE_CLOUD_CLASS_LOGIN: 'true', VITE_SUPABASE_URL: 'http://p.example' })).toThrow('HTTPS');
  });
});
