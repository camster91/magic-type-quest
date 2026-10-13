/**
 * BloomType — practice log
 * Minutes practised per day, kept on the device. Teachers and parents see
 * totals and weekly summaries; nothing here leaves the browser.
 */

import { plantToday } from './plantOfDay.js';

const MAX_DAYS = 400;
// One sitting counts for at most 30 minutes, so a tab left open overnight
// does not inflate the record.
const MAX_SESSION_MINUTES = 30;

const round1 = (n) => Math.round(n * 10) / 10;

export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Add a practice session's duration (in ms) to the profile's log. */
export function recordPractice(profile, ms, date = new Date()) {
  if (!profile) return 0;
  const minutes = round1(Math.min(MAX_SESSION_MINUTES, Math.max(0, Number(ms) || 0) / 60000));
  if (minutes <= 0) return 0;
  const log = { ...(profile.practiceLog || {}) };
  const key = dayKey(date);
  log[key] = round1((log[key] || 0) + minutes);
  const keys = Object.keys(log).sort();
  for (const old of keys.slice(0, Math.max(0, keys.length - MAX_DAYS))) delete log[old];
  profile.practiceLog = log;
  profile.minutesPractised = round1((profile.minutesPractised || 0) + minutes);
  plantToday(profile, date);
  return minutes;
}

/** Minutes and active days over the last `days` days, ending today. */
export function practiceSummary(profile, days = 7, now = new Date()) {
  const log = profile?.practiceLog || {};
  let minutes = 0;
  let activeDays = 0;
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const value = log[dayKey(date)] || 0;
    minutes += value;
    if (value > 0) activeDays++;
  }
  return { minutes: round1(minutes), activeDays };
}

/** Every logged day, oldest first: [{ date, minutes }]. */
export function practiceDays(profile) {
  return Object.entries(profile?.practiceLog || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, minutes]) => ({ date, minutes }));
}
