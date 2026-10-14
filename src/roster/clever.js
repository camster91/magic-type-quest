/**
 * BloomType — Clever roster adapter (Clever API v3.0). STUB.
 *
 * The mapping from Clever sections and students to the provider-neutral
 * import is real and tested; the network part waits for a signed Clever
 * partner agreement.
 *
 * TODO(partner: Clever) — needs a signed Clever partner agreement:
 *   1. Apply as a Clever partner and create the BloomType app (Clever SSO +
 *      Secure Sync). Districts then share sections with the app.
 *   2. Use "Log in with Clever" (OAuth 2.0) for teachers; exchange the code
 *      for a district-app token on a server (Supabase Edge Function). The
 *      client secret must never ship to the browser.
 *   3. Read only: GET /v3.0/users/{teacherId}/sections and
 *      GET /v3.0/sections/{id}/users?role=student, and only the `id` and
 *      `name` fields. Turn off email, DOB, demographics and contacts in the
 *      app's data-access settings.
 *   4. Add the function's origin to the pilot connect-src (vite.config.js).
 */
import { RosterProviderError } from './googleClassroom.js';

export const CLEVER_PATHS = {
  teacherSections: (teacherId) => `/v3.0/users/${encodeURIComponent(teacherId)}/sections`,
  sectionStudents: (sectionId) => `/v3.0/sections/${encodeURIComponent(sectionId)}/users?role=student`,
};

/** Clever `sections` payload → [{ externalClassId, name }]. */
export function mapCleverSections(payload) {
  return (payload?.data || [])
    .map((entry) => entry?.data || entry)
    .filter((s) => s?.id)
    .map((s) => ({ externalClassId: String(s.id), name: s.name || String(s.id) }));
}

/** Clever section `users` payload → the provider-neutral import. Emails are never read. */
export function mapCleverStudents(sectionId, payload) {
  return {
    provider: 'clever',
    externalClassId: String(sectionId),
    students: (payload?.data || [])
      .map((entry) => entry?.data || entry)
      .filter((u) => u?.id)
      .map((u) => ({ externalId: String(u.id), givenName: u.name?.first || '', familyName: u.name?.last || '' })),
  };
}

export function createCleverAdapter({ rosterFunctionUrl = null, fetchImpl = globalThis.fetch } = {}) {
  const configured = Boolean(rosterFunctionUrl);
  async function notReady() {
    // TODO(partner: Clever): call the server-side roster function here.
    throw new RosterProviderError('partner-required', 'Clever needs a signed partner agreement.');
  }
  return {
    id: 'clever',
    requiresPartner: true,
    isConfigured: () => configured,
    async listClasses() {
      if (!configured) return notReady();
      // TODO(partner: Clever): GET `${rosterFunctionUrl}/sections`, map with mapCleverSections.
      void fetchImpl;
      return notReady();
    },
    async fetchRoster(sectionId) {
      if (!configured) return notReady();
      // TODO(partner: Clever): GET `${rosterFunctionUrl}/sections/:id/students`,
      // map with mapCleverStudents(sectionId, payload).
      void sectionId;
      return notReady();
    },
  };
}
