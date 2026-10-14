/**
 * BloomType — Google Classroom roster adapter (pilot builds only).
 *
 * Uses the teacher's own Google OAuth access token (Supabase returns it as
 * session.provider_token right after a Google sign-in that asked for the
 * Classroom scopes below). It only reads:
 *   GET /v1/courses?teacherId=me              (the teacher's active courses)
 *   GET /v1/courses/{id}/students             (each student's id and name)
 * We never ask for classroom.profile.emails or photos, and the importer
 * drops them if Google sends them anyway. The token is used in memory for
 * the import and never stored.
 */
export const CLASSROOM_API = 'https://classroom.googleapis.com/v1';
export const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
];
const MAX_PAGES = 20;

export class RosterProviderError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'RosterProviderError';
    this.code = code;
  }
}

function errorFor(status) {
  if (status === 401) return new RosterProviderError('auth-expired');
  if (status === 403) return new RosterProviderError('scope-missing');
  if (status === 404) return new RosterProviderError('not-found');
  if (status === 429) return new RosterProviderError('rate-limited');
  return new RosterProviderError('provider-error', `HTTP ${status}`);
}

export function createGoogleClassroomAdapter({ accessToken, fetchImpl = globalThis.fetch } = {}) {
  async function get(path, params = {}) {
    if (!accessToken) throw new RosterProviderError('auth-required');
    const url = new URL(`${CLASSROOM_API}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value != null && value !== '') url.searchParams.set(key, value);
    }
    let response;
    try {
      response = await fetchImpl(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });
    } catch {
      throw new RosterProviderError('network');
    }
    if (!response.ok) throw errorFor(response.status);
    try {
      return await response.json();
    } catch {
      throw new RosterProviderError('bad-response');
    }
  }

  async function paged(path, key, params) {
    const items = [];
    let pageToken;
    for (let page = 0; page < MAX_PAGES; page++) {
      const data = await get(path, { ...params, pageSize: 100, pageToken });
      items.push(...(Array.isArray(data?.[key]) ? data[key] : []));
      pageToken = data?.nextPageToken;
      if (!pageToken) break;
    }
    return items;
  }

  return {
    id: 'google',
    requiresPartner: false,
    isConfigured: () => Boolean(accessToken),

    /** The teacher's active courses: [{ externalClassId, name }]. */
    async listClasses() {
      const courses = await paged('/courses', 'courses', { teacherId: 'me', courseStates: 'ACTIVE' });
      return courses
        .filter((course) => course?.id)
        .map((course) => ({
          externalClassId: String(course.id),
          name: [course.name, course.section].filter(Boolean).join(' · ') || String(course.id),
        }));
    },

    /** One course's students in the provider-neutral import shape. */
    async fetchRoster(courseId) {
      const students = await paged(`/courses/${encodeURIComponent(courseId)}/students`, 'students', {});
      return {
        provider: 'google',
        externalClassId: String(courseId),
        // Only the opaque Google user id and a name are read; emailAddress,
        // photoUrl and every other profile field are left behind here.
        students: students.map((student) => {
          const name = student?.profile?.name || {};
          const externalId = String(student?.userId ?? student?.profile?.id ?? '');
          return name.givenName || name.familyName
            ? { externalId, givenName: name.givenName || '', familyName: name.familyName || '' }
            : { externalId, displayName: name.fullName || '' };
        }),
      };
    },
  };
}
