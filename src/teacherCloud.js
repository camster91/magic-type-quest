/**
 * BloomType — teacher cloud API (pilot builds only, OFF by default).
 *
 * Teacher sign-in with Google through Supabase Auth, the teacher's classes,
 * per-class reports, roster import and the school admin summary. Every
 * function takes the Supabase client, so tests pass a mock. This module is
 * loaded only behind `import.meta.env.VITE_CLOUD_CLASS_LOGIN === 'true'`,
 * so the public build never contains it.
 */
import { buildCloudClassRows } from './teacherDashboard.js';
import { CLASSROOM_SCOPES } from './roster/googleClassroom.js';
import { importRosterToClass } from './roster/importer.js';

function throwIf(error) {
  if (error) throw error;
}

/** The page URL to come back to after Google, without any old hash or query. */
export function teacherRedirectUrl(href, extraQuery = '') {
  const url = new URL(href);
  url.hash = '';
  url.search = extraQuery;
  return url.toString();
}

/**
 * Start Google sign-in. With `classroom: true` it also asks for read-only
 * access to the teacher's Classroom courses and rosters (incremental
 * consent: only when the teacher chooses to import).
 */
export async function signInWithGoogle(sb, { redirectTo, classroom = false } = {}) {
  const options = { redirectTo, queryParams: { prompt: 'select_account' } };
  if (classroom) {
    options.scopes = CLASSROOM_SCOPES.join(' ');
    options.queryParams = { prompt: 'consent', include_granted_scopes: 'true' };
  }
  const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options });
  throwIf(error);
}

/**
 * The signed-in teacher, or null. Anonymous (student) sessions never count.
 * providerToken is Google's access token, present only just after a Google
 * redirect. `sb` must be the teacher client (teacherAuth.js), which keeps
 * the session in memory only, so the token is never stored.
 */
export async function getTeacherSession(sb) {
  const { data, error } = await sb.auth.getSession();
  throwIf(error);
  const session = data?.session;
  const user = session?.user;
  if (!user || user.is_anonymous || !user.email) return null;
  const meta = user.user_metadata || {};
  return {
    userId: user.id,
    email: user.email,
    displayName: meta.full_name || meta.name || '',
    providerToken: session.provider_token || null,
  };
}

/** Turn an invite into a teacher account on first sign-in. Returns the role or null. */
export async function claimTeacherRole(sb, displayName = '') {
  const { data, error } = await sb.rpc('claim_teacher_invite', { p_display_name: displayName || null });
  throwIf(error);
  return data === 'teacher' || data === 'admin' ? data : null;
}

export async function signOutTeacher(sb) {
  const { error } = await sb.auth.signOut({ scope: 'local' });
  throwIf(error);
}

export async function listMyClasses(sb) {
  const { data, error } = await sb
    .from('classes')
    .select('id, name, class_code, archived_at, roster_provider, external_class_id, created_at')
    .order('created_at', { ascending: true });
  throwIf(error);
  return data || [];
}

export async function createCloudClass(sb, name) {
  const { data, error } = await sb.rpc('create_class', { p_name: name });
  throwIf(error);
  return Array.isArray(data) ? data[0] : data;
}

export async function renameCloudClass(sb, classId, name) {
  const { error } = await sb.rpc('rename_class', { p_class_id: classId, p_name: name });
  throwIf(error);
}

export async function setCloudClassArchived(sb, classId, archived) {
  const { error } = await sb.rpc('set_class_archived', { p_class_id: classId, p_archived: Boolean(archived) });
  throwIf(error);
}

function rosterQuery(sb, classCode) {
  return sb.from('class_roster').select('*').eq('class_code', classCode).order('total_stars', { ascending: false });
}

/**
 * The joined roster of a class code the signed-in teacher owns, read with
 * the teacher's client (the page's typed-code view). Null on any error.
 */
export async function fetchRosterByCode(sb, classCode) {
  try {
    const { data, error } = await rosterQuery(sb, classCode);
    throwIf(error);
    return data || [];
  } catch {
    return null;
  }
}

/**
 * Everything one class report needs, read under RLS: the joined roster
 * (via teacher_codes, as before), the imported names, and this week's
 * minutes per joined device. The minutes are summed in the database
 * (class_weekly_minutes), so a busy class never runs into the API's
 * 1,000-row response limit and loses minutes.
 */
export async function fetchCloudClassReport(sb, cls, now = new Date()) {
  const [roster, imported, weekly] = await Promise.all([
    rosterQuery(sb, cls.class_code),
    sb.from('roster_students').select('display_name, provider, external_id').eq('class_id', cls.id),
    sb.rpc('class_weekly_minutes', { p_class_id: cls.id }),
  ]);
  throwIf(roster.error);
  throwIf(imported.error);
  throwIf(weekly.error);
  return buildCloudClassRows({
    roster: roster.data || [],
    imported: imported.data || [],
    weeklyMinutes: Array.isArray(weekly.data) ? weekly.data : [],
    now,
  });
}

export { importRosterToClass };

/** School admin: one aggregate row per class. Never student names. */
export async function fetchSchoolSummary(sb) {
  const { data, error } = await sb.rpc('school_class_summary');
  throwIf(error);
  return data || [];
}

export async function inviteTeacher(sb, email, role = 'teacher') {
  const { data, error } = await sb.rpc('admin_invite_teacher', { p_email: email, p_role: role });
  throwIf(error);
  return data !== false;
}
