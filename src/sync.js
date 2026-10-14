/**
 * BloomType — Offline-First Sync Layer
 * All writes go to localStorage immediately. If Supabase credentials are
 * configured, writes are queued and synced in the background.
 * The game works 100% offline; cloud sync is an upgrade, not a gate.
 */

let supabaseClient = null;

/**
 * Serialize writes and coalesce anything queued behind the active request to
 * the newest value. Every caller settles after the write that includes (or
 * supersedes) its value, and one failed write never blocks a newer snapshot.
 */
export function createLatestSyncQueue(worker) {
  let active = false;
  let pendingValue;
  let pendingWaiters = [];

  async function drain() {
    active = true;
    while (pendingWaiters.length > 0) {
      const value = pendingValue;
      const waiters = pendingWaiters;
      pendingValue = undefined;
      pendingWaiters = [];
      try {
        const result = await worker(value);
        waiters.forEach(({ resolve }) => resolve(result));
      } catch (error) {
        waiters.forEach(({ reject }) => reject(error));
      }
    }
    active = false;
    // An enqueue can land after the loop condition but before active resets.
    if (pendingWaiters.length > 0) void drain();
  }

  return function enqueue(value) {
    pendingValue = value;
    const completion = new Promise((resolve, reject) => {
      pendingWaiters.push({ resolve, reject });
    });
    if (!active) void drain();
    return completion;
  };
}

/**
 * The student client keeps Supabase's default auth storage key, so existing
 * anonymous sessions survive. It never reads a session from the URL:
 * students sign in anonymously with no redirect, and an OAuth callback on
 * the teacher page belongs to the teacher's own client (teacherAuth.js),
 * which must not end up in, or replace, the student's session.
 */
export function studentClientOptions() {
  return { auth: { detectSessionInUrl: false } };
}

/** Lazy-load Supabase client. Returns null if no credentials. */
export async function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const url = import.meta.env?.VITE_SUPABASE_URL;
  const key = import.meta.env?.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabaseClient = createClient(url, key, studentClientOptions());
    return supabaseClient;
  } catch {
    return null;
  }
}

/** Check if we have Supabase configured. */
export async function hasCloudSync() {
  const sb = await getSupabase();
  if (!sb) return false;
  try {
    const { data } = await sb.auth.getSession();
    return Boolean(data.session?.user);
  } catch {
    return false;
  }
}

async function getAuthenticatedSupabase() {
  const sb = await getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    if (!data.session?.user) return null;
    return { sb, user: data.session.user };
  } catch {
    return null;
  }
}

export function buildCloudProfileRow(profile, userId, updatedAt = new Date().toISOString()) {
  return {
    id: userId,
    name: profile.name,
    avatar: profile.avatar,
    high_score: profile.highScore || 0,
    total_words: profile.totalWords || 0,
    total_stars: profile.totalStars || 0,
    completed_levels: profile.completedLevels || [],
    achievements: profile.achievements || [],
    garden: profile.garden || [],
    key_sr: profile.keySR || {},
    class_code: profile.classCode || null,
    updated_at: updatedAt,
  };
}

export function buildClassMembershipArgs(profile) {
  return {
    p_class_code: profile.classCode || null,
    p_name: profile.name,
    p_avatar: profile.avatar,
    p_total_words: profile.totalWords || 0,
    p_total_stars: profile.totalStars || 0,
    p_high_score: profile.highScore || 0,
    p_completed_levels: profile.completedLevels || [],
  };
}

export function buildCloudSessionRow(session, userId, createdAt = new Date().toISOString()) {
  return {
    session_id: session.sessionId,
    profile_id: userId,
    level: session.level,
    score: session.score || 0,
    wpm: session.wpm || 0,
    accuracy: session.accuracy || 0,
    words_typed: session.wordsTyped || 0,
    words_completed: session.wordsCompleted || 0,
    max_combo: session.maxCombo || 0,
    skips_used: session.skipsUsed || 0,
    duration_seconds: Number.isFinite(session.durationSeconds)
      ? Math.min(1800, Math.max(0, Math.round(session.durationSeconds)))
      : null,
    created_at: createdAt,
  };
}

export function buildLocalProgressExport(profile, exportedAt = new Date().toISOString()) {
  return {
    formatVersion: 1,
    exportedAt,
    source: 'local',
    profile: JSON.parse(JSON.stringify(profile)),
  };
}

/** Fetch every self-owned row without silently accepting Supabase row limits. */
export async function fetchAllOwnedRows(sb, table, ownerColumn, userId, pageSize = 500) {
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await sb
      .from(table)
      .select('*')
      .eq(ownerColumn, userId)
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    const page = data || [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

/**
 * Export one student's cloud learning data. `deviceIds` lists the accounts of
 * every device linked to the same child (just this account when none are).
 */
export async function buildCloudProgressExport(
  sb,
  userId,
  exportedAt = new Date().toISOString(),
  pageSize = 500,
  deviceIds = [userId],
) {
  const ids = [...new Set([userId, ...deviceIds])];
  const all = (table, column) => Promise.all(ids.map((id) => fetchAllOwnedRows(sb, table, column, id, pageSize)))
    .then((lists) => lists.flat());
  const [profiles, sessions, rosterMemberships] = await Promise.all([
    all('profiles', 'id'),
    all('game_sessions', 'profile_id'),
    all('class_roster', 'profile_id'),
  ]);
  const payload = {
    formatVersion: 1,
    exportedAt,
    source: 'cloud',
    accountId: userId,
    profile: profiles.find((row) => row.id === userId) || null,
    sessions,
    rosterMemberships,
  };
  if (ids.length > 1) payload.linkedProfiles = profiles.filter((row) => row.id !== userId);
  return payload;
}

/** The accounts of every device linked to the signed-in child. */
async function fetchStudentDeviceIds(sb, userId) {
  const { data, error } = await sb.rpc('my_student_device_ids');
  if (error) throw error;
  const ids = (Array.isArray(data) ? data : []).map((row) => (typeof row === 'string' ? row : row?.my_student_device_ids))
    .filter(Boolean);
  return ids.length ? ids : [userId];
}

/** Export the authenticated student's cloud learning data, across linked devices. */
export async function exportCloudProgress() {
  const cloud = await getAuthenticatedSupabase();
  if (!cloud) return { exported: false, reason: 'not-authenticated' };
  if (!navigator.onLine) return { exported: false, reason: 'offline' };
  try {
    const deviceIds = await fetchStudentDeviceIds(cloud.sb, cloud.user.id);
    return {
      exported: true,
      payload: await buildCloudProgressExport(cloud.sb, cloud.user.id, undefined, undefined, deviceIds),
    };
  } catch (error) {
    console.warn('Cloud export failed:', error);
    return { exported: false, reason: 'export-failed' };
  }
}

/** Returns true only when the profile and class membership both saved. */
async function syncProfileSnapshot(profile) {
  const cloud = await getAuthenticatedSupabase();
  if (!cloud) return false;
  const { sb, user } = cloud;
  if (!navigator.onLine) return false; // Local state remains authoritative; a later save retries.
  try {
    const updatedAt = new Date().toISOString();
    const { error } = await sb.from('profiles').upsert(
      buildCloudProfileRow(profile, user.id, updatedAt),
      { onConflict: 'id' },
    );
    if (error) throw error;

    // Keep exactly one self-owned roster membership in sync with the profile.
    // One RPC call is one transaction, and it still runs under roster RLS.
    const { error: rosterError } = await sb.rpc(
      'sync_class_membership',
      buildClassMembershipArgs(profile),
    );
    if (rosterError) throw rosterError;
    return true;
  } catch (e) {
    console.warn('Sync failed:', e);
    return false;
  }
}

/**
 * Delete all self-owned learning data and the sign-in account itself. The
 * RPC acts only on auth.uid(); foreign keys cascade sessions and roster rows.
 */
export async function deleteCloudAccount(sb) {
  const { error } = await sb.rpc('delete_my_account');
  if (error) throw error;
}

export async function deleteAuthenticatedCloudProfile(sb) {
  await deleteCloudAccount(sb);
  const { error } = await sb.auth.signOut({ scope: 'local' });
  return error
    ? { deleted: true, signedOut: false, reason: 'sign-out-failed' }
    : { deleted: true, signedOut: true };
}

async function deleteCloudProfileSnapshot() {
  const cloud = await getAuthenticatedSupabase();
  if (!cloud) return { deleted: false, reason: 'not-authenticated' };
  if (!navigator.onLine) return { deleted: false, reason: 'offline' };
  const { sb } = cloud;
  try {
    const result = await deleteAuthenticatedCloudProfile(sb);
    if (!result.signedOut) console.warn('Cloud data deleted, but sign-out failed');
    return result;
  } catch (e) {
    console.warn('Cloud deletion failed:', e);
    return { deleted: false, reason: 'delete-failed' };
  }
}

/**
 * Serialize profile saves and deletion through one queue. Once deletion is
 * requested, later saves are rejected so they cannot recreate the profile.
 */
export function createCloudProfileController({ sync, remove }) {
  let deletionRequested = false;
  const enqueue = createLatestSyncQueue((mutation) => (
    mutation.type === 'delete' ? remove() : sync(mutation.profile)
  ));

  return {
    sync(profile) {
      if (deletionRequested) return Promise.resolve(false);
      return enqueue({ type: 'sync', profile });
    },
    async remove() {
      deletionRequested = true;
      try {
        const result = await enqueue({ type: 'delete' });
        if (!result?.deleted) deletionRequested = false;
        return result;
      } catch (error) {
        deletionRequested = false;
        throw error;
      }
    },
  };
}

const profileController = createCloudProfileController({
  sync: syncProfileSnapshot,
  remove: deleteCloudProfileSnapshot,
});

/** Background sync of the newest immutable profile snapshot. */
export function syncProfile(profile) {
  const snapshot = JSON.parse(JSON.stringify(profile));
  return profileController.sync(snapshot);
}

/** Delete authenticated cloud learning data and prevent queued recreation. */
export function deleteCloudProfile() {
  return profileController.remove();
}

/** Log a game session to the cloud for analytics. */
export async function logSession(profile, session) {
  const cloud = await getAuthenticatedSupabase();
  if (!cloud || !navigator.onLine) return false;
  const { sb, user } = cloud;
  try {
    const { error } = await sb.from('game_sessions').insert(
      buildCloudSessionRow(session, user.id),
    );
    // A retry of an already accepted attempt is successful by definition.
    if (error?.code === '23505') return true;
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('Session log failed:', e);
    return false;
  }
}

/** Teacher: fetch class roster from cloud. */
export async function fetchClassRoster(classCode) {
  const cloud = await getAuthenticatedSupabase();
  if (!cloud) return null;
  const { sb } = cloud;
  try {
    const { data, error } = await sb
      .from('class_roster')
      .select('*')
      .eq('class_code', classCode)
      .order('total_stars', { ascending: false });
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('Fetch class failed:', e);
    return null;
  }
}
