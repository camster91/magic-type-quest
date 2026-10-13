/**
 * BloomType — Field Guide
 * Restoring a meadow (finishing a level for the first time) discovers a
 * wildlife card. Cards hold one short, checked fact a young reader can read.
 * Facts and their sources are listed in docs/v2/FIELD-GUIDE-FACTS.md.
 */

export const FIELD_GUIDE = [
  { id: 'monarch', level: 1, image: 'assets/fieldguide/monarch.webp' },
  { id: 'bumblebee', level: 2, image: 'assets/fieldguide/bumblebee.webp' },
  { id: 'bluebird', level: 3, image: 'assets/fieldguide/bluebird.webp' },
  { id: 'milkweed', level: 4, image: 'assets/fieldguide/milkweed.webp' },
];

const list = (value) => (Array.isArray(value) ? value : []);

/**
 * Cards this profile has found, in Field Guide order. Levels finished before
 * the Field Guide existed count too, so older profiles see their cards.
 */
export function discoveredCards(profile = {}) {
  const found = new Set(list(profile?.fieldGuide));
  const done = new Set(list(profile?.completedLevels));
  return FIELD_GUIDE.filter((card) => found.has(card.id) || done.has(card.level));
}

/**
 * Record the card for a completed level. Returns the card if it is new,
 * otherwise null. Older profiles catch up on cards for levels already done.
 */
export function discoverForLevel(profile, level) {
  if (!profile) return null;
  const found = new Set(list(profile.fieldGuide));
  const done = new Set([...list(profile.completedLevels), level]);
  let fresh = null;
  for (const card of FIELD_GUIDE) {
    if (done.has(card.level) && !found.has(card.id)) {
      found.add(card.id);
      if (card.level === level) fresh = card;
    }
  }
  profile.fieldGuide = FIELD_GUIDE.filter((card) => found.has(card.id)).map((card) => card.id);
  return fresh;
}
