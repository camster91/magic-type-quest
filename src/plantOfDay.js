/**
 * BloomType — plant of the day
 * Each day has its own native meadow plant. Practising that day plants it in
 * the child's meadow, so the collection only ever grows. There is nothing to
 * lose: missing a day just means that day's plant waits for another time.
 */
import { dayKey } from './practiceLog.js';

export const PLANTS = [
  { id: 'sunflower', emoji: '🌻' },
  { id: 'lupine', emoji: '🪻' },
  { id: 'blackEyedSusan', emoji: '🌼' },
  { id: 'coneflower', emoji: '🌸' },
  { id: 'beeBalm', emoji: '🌺' },
  { id: 'wildRose', emoji: '🌹' },
  { id: 'milkweed', emoji: '🌿' },
  { id: 'clover', emoji: '🍀' },
  { id: 'goldenrod', emoji: '🌾' },
  { id: 'aster', emoji: '💐' },
];

// Practice that counts toward planting today's plant (minutes in the day).
export const MINUTES_TO_PLANT = 0.5;

function dayNumber(key) {
  const [y, m, d] = key.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** The plant for a calendar day. Neighbouring days always differ. */
export function plantForDay(key = dayKey()) {
  // 3 shares no factor with 10, so ten days in a row show all ten plants.
  return PLANTS[(dayNumber(key) * 3) % PLANTS.length];
}

/** How many plants this child has grown: one for each day they practised. */
export function gardenDays(profile) {
  return Object.values(profile?.plants || {}).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

export function plantedToday(profile, date = new Date()) {
  return profile?.lastPlantDate === dayKey(date);
}

/** True when today's plant is still waiting for a returning child. */
export function plantWaiting(profile, date = new Date()) {
  return gardenDays(profile) > 0 && !plantedToday(profile, date);
}

/** Plant today's plant once the day's practice is long enough. Returns it if new. */
export function plantToday(profile, date = new Date()) {
  if (!profile || plantedToday(profile, date)) return null;
  const key = dayKey(date);
  if ((Number(profile.practiceLog?.[key]) || 0) < MINUTES_TO_PLANT) return null;
  const plant = plantForDay(key);
  const plants = profile.plants && typeof profile.plants === 'object' ? profile.plants : {};
  profile.plants = { ...plants, [plant.id]: (Number(plants[plant.id]) || 0) + 1 };
  profile.lastPlantDate = key;
  return plant;
}

/** The child's plants, most grown first: [{ ...plant, count }]. */
export function grownPlants(profile) {
  return PLANTS
    .map((plant) => ({ ...plant, count: Number(profile?.plants?.[plant.id]) || 0 }))
    .filter((plant) => plant.count > 0)
    .sort((a, b) => b.count - a.count);
}
