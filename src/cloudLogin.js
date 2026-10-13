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

// ===== Linked devices =====
// One child, several devices: a link code made on one device and typed on
// another joins them into one student (see supabase/schema.sql).

const LINK_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Clean what a child typed into a 12-character link code, or null. */
export function normalizeLinkCode(input) {
  const clean = String(input || '')
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  if (clean.length !== 12) return null;
  return [...clean].every((ch) => LINK_ALPHABET.includes(ch)) ? clean : null;
}

export function formatLinkCode(code) {
  return String(code || '').match(/.{1,4}/g)?.join('-') || '';
}

/**
 * Fold the child's progress from their other devices into this profile.
 * Numbers keep the highest value and levels are combined, so nothing is lost.
 */
export function mergeLinkedProgress(profile, rows = []) {
  let changed = false;
  const levels = new Set(profile.completedLevels || []);
  for (const row of rows) {
    for (const level of row.completed_levels || []) {
      if (Number.isInteger(level) && !levels.has(level)) { levels.add(level); changed = true; }
    }
    for (const [field, column] of [['totalWords', 'total_words'], ['totalStars', 'total_stars'], ['highScore', 'high_score']]) {
      const value = Number(row[column]) || 0;
      if (value > (profile[field] || 0)) { profile[field] = value; changed = true; }
    }
    if (!profile.classCode && row.class_code) { profile.classCode = row.class_code; changed = true; }
  }
  profile.completedLevels = [...levels].sort((a, b) => a - b);
  return changed;
}

/** Make a link code on this device. Returns { code } or { reason }. */
export async function createLinkCode({
  enabled = isCloudClassLoginEnabled(),
  getClient = getSupabase,
  online = () => navigator.onLine,
} = {}) {
  if (!enabled) return { reason: 'disabled' };
  const sb = await getClient();
  if (!sb) return { reason: 'disabled' };
  if (!online()) return { reason: 'offline' };
  try {
    const { data: session } = await sb.auth.getSession();
    if (!session.session?.user) return { reason: 'not-joined' };
    const { data, error } = await sb.rpc('create_link_code');
    if (error || !normalizeLinkCode(data)) return { reason: 'sign-in-failed' };
    return { code: formatLinkCode(data) };
  } catch {
    return { reason: 'sign-in-failed' };
  }
}

async function fetchStudentProfiles(sb) {
  const { data, error } = await sb.rpc('student_profiles');
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/** Join this device to the child who made the link code. Returns { linked, reason? }. */
export async function linkThisDevice(profile, input, {
  enabled = isCloudClassLoginEnabled(),
  getClient = getSupabase,
  online = () => navigator.onLine,
  sync = syncProfile,
} = {}) {
  if (!enabled) return { linked: false, reason: 'disabled' };
  const code = normalizeLinkCode(input);
  if (!code) return { linked: false, reason: 'bad-link' };
  const sb = await getClient();
  if (!sb) return { linked: false, reason: 'disabled' };
  if (!online()) return { linked: false, reason: 'offline' };
  try {
    const { data: session } = await sb.auth.getSession();
    if (!session.session?.user) {
      const { error } = await sb.auth.signInAnonymously();
      if (error) return { linked: false, reason: 'sign-in-failed' };
    }
    const { data: student, error } = await sb.rpc('link_device', { p_code: code });
    if (error) return { linked: false, reason: 'sign-in-failed' };
    if (!student) return { linked: false, reason: 'bad-link' };
    mergeLinkedProgress(profile, await fetchStudentProfiles(sb));
    if (await sync(profile) !== true) return { linked: false, reason: 'sign-in-failed' };
    return { linked: true };
  } catch {
    return { linked: false, reason: 'sign-in-failed' };
  }
}

/** On start-up, bring in progress made on the child's other devices. */
export async function refreshLinkedProgress(profile, {
  enabled = isCloudClassLoginEnabled(),
  getClient = getSupabase,
  online = () => navigator.onLine,
} = {}) {
  if (!enabled || !online()) return false;
  try {
    const sb = await getClient();
    if (!sb) return false;
    const { data: session } = await sb.auth.getSession();
    if (!session.session?.user) return false;
    return mergeLinkedProgress(profile, await fetchStudentProfiles(sb));
  } catch {
    return false;
  }
}
