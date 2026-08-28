/**
 * BloomType — Offline-First Sync Layer
 * All writes go to localStorage immediately. If Supabase credentials are
 * configured, writes are queued and synced in the background.
 * The game works 100% offline; cloud sync is an upgrade, not a gate.
 */

let supabaseClient = null;

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
  const { data } = await sb.auth.getSession();
  return Boolean(data.session?.user);
}

async function getAuthenticatedSupabase() {
  const sb = await getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  if (!data.session?.user) return null;
  return { sb, user: data.session.user };
}

/** Background sync of profile + session snapshot. Fire-and-forget. */
export async function syncProfile(profile) {
  const cloud = await getAuthenticatedSupabase();
  if (!cloud) return;
  const { sb, user } = cloud;
  if (!navigator.onLine) return; // Queue handled by syncPending
  try {
    const { error } = await sb.from('profiles').upsert({
      id: user.id,
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
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
  } catch (e) {
    console.warn('Sync failed:', e);
  }
}

/** Log a game session to the cloud for analytics. */
export async function logSession(profile, session) {
  const cloud = await getAuthenticatedSupabase();
  if (!cloud || !navigator.onLine) return;
  const { sb, user } = cloud;
  try {
    const { error } = await sb.from('game_sessions').insert({
      profile_id: user.id,
      level: session.level,
      score: session.score || 0,
      wpm: session.wpm || 0,
      accuracy: session.accuracy || 0,
      words_typed: session.wordsTyped || 0,
      words_completed: session.wordsCompleted || 0,
      max_combo: session.maxCombo || 0,
      skips_used: session.skipsUsed || 0,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
  } catch (e) {
    console.warn('Session log failed:', e);
  }
}

/** Sync class roster to cloud (teacher-side). */
export async function syncClassRoster(classCode, students) {
  const cloud = await getAuthenticatedSupabase();
  if (!cloud || !navigator.onLine) return;
  const { sb } = cloud;
  try {
    const rows = Object.values(students).map(st => ({
      class_code: classCode,
      profile_id: st.id || st.name,
      name: st.name,
      avatar: st.avatar,
      total_words: st.totalWords || 0,
      total_stars: st.totalStars || 0,
      high_score: st.highScore || 0,
      completed_levels: st.completedLevels || [],
      updated_at: new Date().toISOString(),
    }));
    const { error } = await sb.from('class_roster').upsert(rows, { onConflict: 'class_code,profile_id' });
    if (error) throw error;
  } catch (e) {
    console.warn('Class sync failed:', e);
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
