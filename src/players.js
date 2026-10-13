/**
 * BloomType — players on this device
 * Brothers and sisters can share one computer. Every saved player keeps a
 * copy under `bloomtype_profile_*`; switching loads that copy as the active
 * profile. Nothing leaves the device.
 */

const ACTIVE_KEY = 'bloomtype-profile';
const COPY_PREFIX = 'bloomtype_profile_';

function parse(raw) {
  try {
    const value = JSON.parse(raw);
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
}

/** Every player saved on this device, newest activity first, one per id. */
export function listPlayers(storage = localStorage) {
  const byId = new Map();
  const consider = (profile, key) => {
    if (!profile?.uuid) return;
    const seen = byId.get(profile.uuid);
    if (!seen || String(profile.lastPlayed || '') > String(seen.profile.lastPlayed || '')) {
      byId.set(profile.uuid, { profile, key });
    }
  };
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith(COPY_PREFIX)) consider(parse(storage.getItem(key)), key);
  }
  consider(parse(storage.getItem(ACTIVE_KEY)), ACTIVE_KEY);
  return [...byId.values()]
    .map(({ profile }) => profile)
    .sort((a, b) => String(b.lastPlayed || '').localeCompare(String(a.lastPlayed || '')));
}

export function activePlayerId(storage = localStorage) {
  return parse(storage.getItem(ACTIVE_KEY))?.uuid || null;
}

/** Make another saved player the active one. Returns true on success. */
export function switchPlayer(uuid, storage = localStorage) {
  const player = listPlayers(storage).find((p) => p.uuid === uuid);
  if (!player) return false;
  storage.setItem(ACTIVE_KEY, JSON.stringify(player));
  return true;
}

/** Start a fresh player; the current one stays saved as a copy. */
export function startNewPlayer(storage = localStorage) {
  storage.removeItem(ACTIVE_KEY);
}
