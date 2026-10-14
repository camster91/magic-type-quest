/**
 * BloomType — ClassLink roster adapter (OneRoster 1.1). STUB.
 *
 * ClassLink Roster Server speaks IMS OneRoster 1.1 REST. The mapping below
 * (classes and students → the provider-neutral import) is real and tested;
 * the network part waits for a signed ClassLink partner agreement.
 *
 * TODO(partner: ClassLink) — needs a signed ClassLink partner agreement:
 *   1. Register BloomType in the ClassLink partner portal and get the
 *      Roster Server OAuth 1.0a / 2.0 client credentials per district.
 *   2. Obtain each district's tenant URL (e.g.
 *      https://<district>-ca-v2.oneroster.com/ims/oneroster/v1p1) at
 *      onboarding; store it server-side, never in the browser bundle.
 *   3. Sign requests on a server (Supabase Edge Function): client secrets
 *      must never ship to the browser. The browser then calls that function
 *      with the teacher's Supabase session instead of calling ClassLink.
 *   4. Request only the `name` fields of users (givenName, familyName,
 *      sourcedId); never `email`, `phone` or `demographics`.
 *   5. Add the function's origin to the pilot connect-src (vite.config.js).
 */
import { RosterProviderError } from './googleClassroom.js';

export const ONEROSTER_PATHS = {
  teacherClasses: (teacherSourcedId) => `/teachers/${encodeURIComponent(teacherSourcedId)}/classes`,
  classStudents: (classSourcedId) => `/classes/${encodeURIComponent(classSourcedId)}/students`,
};

/** OneRoster `classes` payload → [{ externalClassId, name }]. */
export function mapOneRosterClasses(payload) {
  return (payload?.classes || [])
    .filter((c) => c?.sourcedId && c.status !== 'tobedeleted')
    .map((c) => ({ externalClassId: String(c.sourcedId), name: c.title || String(c.sourcedId) }));
}

/** OneRoster `users` payload → the provider-neutral import. Emails are never read. */
export function mapOneRosterStudents(classSourcedId, payload) {
  return {
    provider: 'classlink',
    externalClassId: String(classSourcedId),
    students: (payload?.users || [])
      .filter((u) => u?.sourcedId && u.status !== 'tobedeleted' && (!u.role || u.role === 'student'))
      .map((u) => ({ externalId: String(u.sourcedId), givenName: u.givenName || '', familyName: u.familyName || '' })),
  };
}

export function createClassLinkAdapter({ rosterFunctionUrl = null, fetchImpl = globalThis.fetch } = {}) {
  const configured = Boolean(rosterFunctionUrl);
  async function notReady() {
    // TODO(partner: ClassLink): call the server-side roster function here.
    throw new RosterProviderError('partner-required', 'ClassLink needs a signed partner agreement.');
  }
  return {
    id: 'classlink',
    requiresPartner: true,
    isConfigured: () => configured,
    async listClasses() {
      if (!configured) return notReady();
      // TODO(partner: ClassLink): GET `${rosterFunctionUrl}/classes`, map with mapOneRosterClasses.
      void fetchImpl;
      return notReady();
    },
    async fetchRoster(classSourcedId) {
      if (!configured) return notReady();
      // TODO(partner: ClassLink): GET `${rosterFunctionUrl}/classes/:id/students`,
      // map with mapOneRosterStudents(classSourcedId, payload).
      void classSourcedId;
      return notReady();
    },
  };
}
