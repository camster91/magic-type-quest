/**
 * The fox's voice: short, pre-recorded encouragement during play.
 *
 * The clips are static files made once (see foxVoiceLines.js). This module
 * is loaded lazily the first time the fox has something to say, so the home
 * page never downloads it, and a clip is only fetched when it plays.
 *
 * Rules: at most one line every 20 seconds, never over another line or the
 * word narration, never when sound is muted or the "Fox voice" setting is
 * off, and always in the child's language. The fox never scolds.
 */
import { gameState } from './state.js';
import { dictionaries, getLocale, t } from './i18n.js';
import { FOX_VOICE_LINES, registerFoxVoiceText } from './foxVoiceLines.js';
import { foxVoiceAllowed } from './foxMoments.js';

export { FOX_MISSES_BEFORE_NUDGE, FOX_STREAK_EVERY, foxVoiceAllowed, isFoxNudge, isFoxStreak } from './foxMoments.js';

registerFoxVoiceText(dictionaries);

export const FOX_MOMENTS = ['start', 'streak', 'complete', 'miss'];
export const FOX_COOLDOWN_MS = 20_000;
// A finished level is worth waiting for: if the fox spoke recently, the
// cheer waits (up to this long) instead of being dropped.
export const FOX_PRIORITY_WAIT_MS = 12_000;
// If the word narration is still talking, try again shortly, up to this long.
export const FOX_BUSY_RETRY_MS = 400;
export const FOX_BUSY_GIVE_UP_MS = 3_000;

/** The clip ids for a moment, e.g. ['streak.1', 'streak.2']. */
export function foxLineIds(moment) {
  return Object.keys(FOX_VOICE_LINES.en).filter((id) => id.startsWith(`${moment}.`));
}

/** Pick a line for a moment, avoiding the one the fox said last time. */
export function pickFoxLine(moment, lastId = null, random = Math.random) {
  const ids = foxLineIds(moment);
  if (ids.length === 0) return null;
  const fresh = ids.length > 1 ? ids.filter((id) => id !== lastId) : ids;
  return fresh[Math.min(fresh.length - 1, Math.floor(random() * fresh.length))];
}

/**
 * Decide what to do with a moment: play now, wait, or skip.
 * Pure, so the rate limit is easy to test.
 */
export function planFoxLine({ moment, now, lastStartAt = null, busy = false,
  cooldownMs = FOX_COOLDOWN_MS, priorityWaitMs = FOX_PRIORITY_WAIT_MS }) {
  if (!FOX_MOMENTS.includes(moment)) return { action: 'skip', reason: 'unknown' };
  if (busy) return { action: 'skip', reason: 'busy' };
  const since = lastStartAt === null ? Infinity : now - lastStartAt;
  if (since >= cooldownMs) return { action: 'play' };
  const remaining = cooldownMs - since;
  if (moment === 'complete' && remaining <= priorityWaitMs) return { action: 'wait', delay: remaining };
  return { action: 'skip', reason: 'cooldown' };
}

/** Opus in WebM where the browser plays it, MP3 everywhere else. */
export function foxClipUrl(base, locale, id, canPlayOpus = true) {
  const lang = FOX_VOICE_LINES[locale] ? locale : 'en';
  return `${base}audio/fox/${lang}/${id}.${canPlayOpus ? 'webm' : 'mp3'}`;
}

/**
 * The stateful player. Everything outside the browser is injectable so the
 * timing can be tested without real audio.
 */
export function createFoxVoice({
  getProfile = () => gameState.profile,
  locale = getLocale,
  base = import.meta.env?.BASE_URL ?? '/',
  createAudio = (src) => new Audio(src),
  canPlayOpus = () => typeof Audio !== 'undefined' && new Audio().canPlayType('audio/webm; codecs="opus"') !== '',
  narrating = () => globalThis.speechSynthesis?.speaking === true,
  now = () => performance.now(),
  schedule = (fn, ms) => setTimeout(fn, ms),
  cancel = (id) => clearTimeout(id),
  random = Math.random,
} = {}) {
  let lastStartAt = null;
  let lastId = null;
  let current = null;
  let timer = null;
  let afterLine = [];
  let opus = null;

  const isSpeaking = () => current !== null;

  function finish() {
    current = null;
    const waiting = afterLine;
    afterLine = [];
    waiting.forEach((fn) => fn());
  }

  function play(moment, hooks) {
    const id = pickFoxLine(moment, lastId, random);
    if (!id) return null;
    if (opus === null) opus = canPlayOpus();
    const audio = createAudio(foxClipUrl(base, locale(), id, opus));
    current = audio;
    lastStartAt = now();
    lastId = id;
    audio.onended = finish;
    audio.onerror = finish;
    const started = audio.play?.();
    started?.catch?.(() => { if (current === audio) finish(); });
    hooks?.onLine?.(t(`fox.voice.${id}`), id);
    return id;
  }

  /** Ask the fox to speak for a moment. Returns what it decided. */
  function say(moment, hooks, waitedMs = 0) {
    if (!foxVoiceAllowed(getProfile())) return { action: 'skip', reason: 'off' };
    if (timer !== null) return { action: 'skip', reason: 'queued' };
    const plan = planFoxLine({ moment, now: now(), lastStartAt, busy: isSpeaking() });
    if (plan.action === 'play' && narrating()) {
      // Let the word narration finish first, then speak.
      if (waitedMs >= FOX_BUSY_GIVE_UP_MS) return { action: 'skip', reason: 'busy' };
      timer = schedule(() => { timer = null; say(moment, hooks, waitedMs + FOX_BUSY_RETRY_MS); }, FOX_BUSY_RETRY_MS);
      return { action: 'wait', delay: FOX_BUSY_RETRY_MS };
    }
    if (plan.action === 'wait') {
      timer = schedule(() => { timer = null; say(moment, hooks, waitedMs); }, plan.delay);
    } else if (plan.action === 'play') {
      return { action: 'play', id: play(moment, hooks) };
    }
    return plan;
  }

  /** Run something (the word narration) once the fox has finished talking. */
  function whenQuiet(fn) {
    if (isSpeaking()) afterLine.push(fn);
    else fn();
  }

  /** Stop talking now and forget anything waiting (mute, quit, new level). */
  function stop() {
    if (timer !== null) cancel(timer);
    timer = null;
    const audio = current;
    current = null;
    afterLine = [];
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      try { audio.pause(); } catch { /* already stopped */ }
    }
  }

  return { say, stop, whenQuiet, isSpeaking };
}

// One shared voice for the game.
let shared = null;
export function foxVoice() {
  shared ??= createFoxVoice();
  return shared;
}

/** Screen readers hear the line too, through a quiet live region. */
export function announceFoxLine(text, doc = globalThis.document) {
  const host = doc?.getElementById('game-screen');
  if (!host) return;
  let live = doc.getElementById('fox-caption');
  if (!live) {
    live = doc.createElement('p');
    live.id = 'fox-caption';
    live.className = 'sr-only';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    host.appendChild(live);
  }
  live.textContent = text;
}
