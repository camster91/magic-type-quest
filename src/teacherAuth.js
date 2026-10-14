/**
 * BloomType — the teacher's own Supabase client (pilot builds only).
 *
 * Teachers sign in with Google; students sign in anonymously (cloudLogin.js)
 * with the shared client from sync.js. On a classroom device both can
 * happen in the same browser, so the two must never share a session:
 *
 *  - Separate auth storage key. Signing a teacher in or out (or locking the
 *    teacher page) never replaces or removes the student's anonymous
 *    session, which lives under Supabase's default key.
 *  - Only this client reads the OAuth callback (`detectSessionInUrl`), and it
 *    exists only on the teacher page; the student client has it turned off.
 *  - Nothing is persisted (`persistSession: false`, memory storage). The
 *    session that comes back from a Classroom import carries Google's
 *    `provider_token`, which can read the teacher's rosters, so it must never
 *    reach localStorage. The cost: a reload signs the teacher out, and they
 *    click "Sign in with Google" again. On a shared classroom device that is
 *    also the safer default. See docs/CLOUD-CLASS-LOGIN.md.
 *  - Implicit flow: the tokens come back in the URL hash and go straight into
 *    memory. (PKCE would need its code verifier stored across the redirect.)
 *
 * Imported only by teacherCloudUI.js, which teacher.js loads behind the
 * VITE_CLOUD_CLASS_LOGIN build flag, so the public build never contains it.
 */

export const TEACHER_AUTH_STORAGE_KEY = 'bloomtype-teacher-auth';

/** A Storage-like object that lives only as long as the page. */
export function createMemoryStorage() {
  const items = new Map();
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => { items.set(key, String(value)); },
    removeItem: (key) => { items.delete(key); },
  };
}

export function teacherClientOptions() {
  return {
    auth: {
      storageKey: TEACHER_AUTH_STORAGE_KEY,
      // Never written to localStorage or sessionStorage. supabase-js keeps
      // a non-persisted session in memory; the explicit memory storage
      // keeps it there even if a future version starts honouring `storage`.
      persistSession: false,
      storage: createMemoryStorage(),
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
    },
  };
}

let teacherClient = null;

/**
 * The teacher page's Supabase client, or null without Supabase settings.
 * `createClient` and the env are injectable for tests.
 */
export async function getTeacherSupabase({
  env = import.meta.env,
  createClient = null,
} = {}) {
  if (teacherClient) return teacherClient;
  const url = env?.VITE_SUPABASE_URL;
  const key = env?.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const create = createClient || (await import('@supabase/supabase-js')).createClient;
    teacherClient = create(url, key, teacherClientOptions());
    return teacherClient;
  } catch {
    return null;
  }
}

/** Tests only: forget the cached client. */
export function resetTeacherSupabaseForTests() {
  teacherClient = null;
}
