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

/** Lazy-load Supabase client. Returns null if no credentials. */
export async function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const url = import.meta.env?.VITE_SUPABASE_URL;
  const key = import.meta.env?.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabaseClient = createClient(url, key);
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

export function buildCloudRosterRow(profile, userId, updatedAt = new Date().toISOString()) {
  if (!profile.classCode) return null;
  return {
    class_code: profile.classCode,
    profile_id: userId,
    name: profile.name,
    avatar: profile.avatar,
    total_words: profile.totalWords || 0,
    total_stars: profile.totalStars || 0,
    high_score: profile.highScore || 0,
    completed_levels: profile.completedLevels || [],
    updated_at: updatedAt,
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
    created_at: createdAt,
  };
}

async function syncProfileSnapshot(profile) {
  const cloud = await getAuthenticatedSupabase();
  if (!cloud) return;
  const { sb, user } = cloud;
  if (!navigator.onLine) return; // Local state remains authoritative; a later save retries.
  try {
    const updatedAt = new Date().toISOString();
    const { error } = await sb.from('profiles').upsert(
      buildCloudProfileRow(profile, user.id, updatedAt),
      { onConflict: 'id' },
    );
    if (error) throw error;

    // Keep exactly one self-owned roster membership in sync with the profile.
    // RLS restricts both deletion and insertion to the authenticated user ID.
    const { error: deleteError } = await sb
      .from('class_roster')
      .delete()
      .eq('profile_id', user.id);
    if (deleteError) throw deleteError;

    const rosterRow = buildCloudRosterRow(profile, user.id, updatedAt);
    if (rosterRow) {
      const { error: rosterError } = await sb
        .from('class_roster')
        .upsert(rosterRow, { onConflict: 'class_code,profile_id' });
      if (rosterError) throw rosterError;
    }
  } catch (e) {
    console.warn('Sync failed:', e);
  }
}

/** Delete all self-owned learning data. Foreign keys cascade sessions/roster. */
export async function deleteCloudProfileRows(sb, userId) {
  const { error } = await sb
    .from('profiles')
    .delete()
    .eq('id', userId);
  if (error) throw error;
}

export async function deleteAuthenticatedCloudProfile(sb, userId) {
  await deleteCloudProfileRows(sb, userId);
  const { error } = await sb.auth.signOut({ scope: 'local' });
  return error
    ? { deleted: true, signedOut: false, reason: 'sign-out-failed' }
    : { deleted: true, signedOut: true };
}

async function deleteCloudProfileSnapshot() {
  const cloud = await getAuthenticatedSupabase();
  if (!cloud) return { deleted: false, reason: 'not-authenticated' };
  if (!navigator.onLine) return { deleted: false, reason: 'offline' };
  const { sb, user } = cloud;
  try {
    const result = await deleteAuthenticatedCloudProfile(sb, user.id);
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
