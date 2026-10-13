/**
 * BloomType — Cloud class login (prepared, OFF by default)
 * Lets a student join a teacher's class online so the teacher sees their
 * progress from anywhere. Each device signs in anonymously, so progress does
 * not yet follow a child to a second device (that needs a recoverable
 * student identity; see the note on PR #214). It stays switched off until the privacy approvals
 * in issue #132 are done: it needs BOTH the build flag below AND Supabase
 * credentials, and neither is set in production builds.
 */
import { getSupabase, syncProfile } from './sync.js';

export function isCloudClassLoginEnabled(env = import.meta.env) {
  return env?.VITE_CLOUD_CLASS_LOGIN === 'true';
}

export function normalizeClassCode(code) {
  const clean = String(code || '').trim().toUpperCase();
  return /^[A-Z0-9]{4,10}$/.test(clean) ? clean : null;
}

/**
 * Sign in (anonymously, no email or password for the child) and join a
 * class that a teacher owns. Returns { joined, reason? }.
 */
export async function joinClassOnline(profile, code, {
  enabled = isCloudClassLoginEnabled(),
  getClient = getSupabase,
  online = () => navigator.onLine,
  sync = syncProfile,
} = {}) {
  if (!enabled) return { joined: false, reason: 'disabled' };
  const classCode = normalizeClassCode(code);
  if (!classCode) return { joined: false, reason: 'bad-code' };
  const sb = await getClient();
  if (!sb) return { joined: false, reason: 'disabled' };
  if (!online()) return { joined: false, reason: 'offline' };

  try {
    const { data } = await sb.auth.getSession();
    if (!data.session?.user) {
      const { error } = await sb.auth.signInAnonymously();
      if (error) return { joined: false, reason: 'sign-in-failed' };
    }
    const { data: exists, error } = await sb.rpc('class_code_exists', { code: classCode });
    if (error) return { joined: false, reason: 'sign-in-failed' };
    if (!exists) return { joined: false, reason: 'unknown-class' };

    // Only report success once the roster membership is really saved.
    const previous = profile.classCode;
    profile.classCode = classCode;
    if (await sync(profile) !== true) {
      profile.classCode = previous;
      return { joined: false, reason: 'sign-in-failed' };
    }
    return { joined: true };
  } catch {
    return { joined: false, reason: 'sign-in-failed' };
  }
}
