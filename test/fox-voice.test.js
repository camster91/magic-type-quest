// @vitest-environment jsdom
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  FOX_BUSY_GIVE_UP_MS, FOX_COOLDOWN_MS, FOX_MOMENTS, FOX_PRIORITY_WAIT_MS,
  announceFoxLine, createFoxVoice, foxClipUrl, foxLineIds, foxVoiceAllowed,
  isFoxNudge, isFoxStreak, pickFoxLine, planFoxLine,
} from '../src/foxVoice.js';
import { FOX_VOICE_LINES } from '../src/foxVoiceLines.js';
import { loadLocale, dictionaries, setLocale, t } from '../src/i18n.js';

// French and Spanish load on demand (src/lang/); the checks below need them.
await Promise.all(['fr', 'es'].map((locale) => loadLocale(locale)));

const ROOT = resolve(import.meta.dirname, '..');

describe('fox voice script', () => {
  it('has the same eight short lines in English, French and Spanish', () => {
    const ids = Object.keys(FOX_VOICE_LINES.en).sort();
    expect(ids).toHaveLength(8);
    expect(Object.keys(FOX_VOICE_LINES.fr).sort()).toEqual(ids);
    expect(Object.keys(FOX_VOICE_LINES.es).sort()).toEqual(ids);
    for (const moment of FOX_MOMENTS) expect(foxLineIds(moment).length).toBeGreaterThanOrEqual(2);
    for (const lines of Object.values(FOX_VOICE_LINES)) {
      for (const text of Object.values(lines)) expect(text.split(/\s+/).length).toBeLessThanOrEqual(8);
    }
  });

  it('never scolds', () => {
    const all = Object.values(FOX_VOICE_LINES).flatMap((lines) => Object.values(lines)).join(' ').toLowerCase();
    for (const word of ['wrong', 'bad', 'no!', 'mistake', 'faux', 'erreur', 'mal', 'incorrect']) {
      expect(all).not.toContain(word);
    }
  });

  it('registers the lines as fox.voice.* i18n keys for captions', () => {
    for (const locale of ['en', 'fr', 'es']) {
      setLocale(locale);
      for (const [id, text] of Object.entries(FOX_VOICE_LINES[locale])) {
        expect(dictionaries[locale][`fox.voice.${id}`]).toBe(text);
        expect(t(`fox.voice.${id}`)).toBe(text);
      }
    }
    setLocale('en');
  });

  it('ships a small Opus and MP3 clip for every line', () => {
    for (const [locale, lines] of Object.entries(FOX_VOICE_LINES)) {
      for (const id of Object.keys(lines)) {
        for (const ext of ['webm', 'mp3']) {
          const file = resolve(ROOT, 'public/audio/fox', locale, `${id}.${ext}`);
          expect(existsSync(file), file).toBe(true);
          expect(statSync(file).size).toBeLessThan(30 * 1024);
        }
      }
    }
  });
});

describe('picking a line', () => {
  it('picks a line for the moment and avoids repeating the last one', () => {
    expect(pickFoxLine('streak', null, () => 0)).toBe('streak.1');
    expect(pickFoxLine('streak', 'streak.1', () => 0)).toBe('streak.2');
    expect(pickFoxLine('streak', 'streak.2', () => 0.99)).toBe('streak.1');
    for (let i = 0; i < 20; i++) expect(pickFoxLine('miss', 'miss.1')).toBe('miss.2');
  });

  it('returns nothing for an unknown moment', () => {
    expect(pickFoxLine('scold')).toBeNull();
  });

  it('uses the active language for the clip, with English as the fallback', () => {
    expect(foxClipUrl('/magic-type-quest/', 'fr', 'start.1')).toBe('/magic-type-quest/audio/fox/fr/start.1.webm');
    expect(foxClipUrl('/', 'es', 'miss.2', false)).toBe('/audio/fox/es/miss.2.mp3');
    expect(foxClipUrl('/', 'de', 'start.1')).toBe('/audio/fox/en/start.1.webm');
  });
});

describe('when the fox speaks', () => {
  it('speaks every fifth word in a row and once after three misses', () => {
    expect([1, 4, 5, 6, 10, 15].map((n) => isFoxStreak(n))).toEqual([false, false, true, false, true, true]);
    expect(isFoxStreak(0)).toBe(false);
    expect([1, 2, 3, 4, 5].map((n) => isFoxNudge(n))).toEqual([false, false, true, false, false]);
  });

  it('stays quiet when muted or when Fox voice is off', () => {
    expect(foxVoiceAllowed({})).toBe(true);
    expect(foxVoiceAllowed({ soundEnabled: false })).toBe(false);
    expect(foxVoiceAllowed({ foxVoiceEnabled: false })).toBe(false);
  });
});

describe('rate limit', () => {
  it('plays the first line and then waits at least 20 seconds', () => {
    expect(FOX_COOLDOWN_MS).toBeGreaterThanOrEqual(20_000);
    expect(FOX_COOLDOWN_MS).toBeLessThanOrEqual(30_000);
    expect(planFoxLine({ moment: 'start', now: 0 })).toEqual({ action: 'play' });
    expect(planFoxLine({ moment: 'streak', now: 5_000, lastStartAt: 0 })).toEqual({ action: 'skip', reason: 'cooldown' });
    expect(planFoxLine({ moment: 'streak', now: FOX_COOLDOWN_MS, lastStartAt: 0 })).toEqual({ action: 'play' });
  });

  it('never speaks over another line', () => {
    expect(planFoxLine({ moment: 'complete', now: 60_000, lastStartAt: 0, busy: true })).toEqual({ action: 'skip', reason: 'busy' });
  });

  it('lets a finished level wait for the cooldown instead of dropping the cheer', () => {
    const soon = FOX_COOLDOWN_MS - 4_000;
    expect(planFoxLine({ moment: 'complete', now: soon, lastStartAt: 0 })).toEqual({ action: 'wait', delay: 4_000 });
    expect(planFoxLine({ moment: 'complete', now: FOX_COOLDOWN_MS - FOX_PRIORITY_WAIT_MS - 1, lastStartAt: 0 }).action).toBe('skip');
  });

  it('ignores unknown moments', () => {
    expect(planFoxLine({ moment: 'oops', now: 0 }).action).toBe('skip');
  });
});

function harness(profile = {}) {
  let clock = 0;
  const timers = [];
  const audios = [];
  const voice = createFoxVoice({
    getProfile: () => profile,
    locale: () => 'fr',
    base: '/b/',
    canPlayOpus: () => true,
    narrating: () => harness.narrating,
    now: () => clock,
    random: () => 0,
    schedule: (fn, ms) => { timers.push({ fn, at: clock + ms }); return timers.length - 1; },
    cancel: (id) => { timers[id] = null; },
    createAudio: (src) => {
      const audio = { src, play: vi.fn(() => Promise.resolve()), pause: vi.fn() };
      audios.push(audio);
      return audio;
    },
  });
  const advance = (ms) => {
    clock += ms;
    for (let i = 0; i < timers.length; i++) {
      const timer = timers[i];
      if (timer && timer.at <= clock) { timers[i] = null; timer.fn(); }
    }
  };
  return { voice, audios, advance };
}
harness.narrating = false;

describe('fox voice player', () => {
  it('plays a clip in the active language and shows its caption', () => {
    const { voice, audios } = harness();
    const onLine = vi.fn();
    expect(voice.say('start', { onLine })).toEqual({ action: 'play', id: 'start.1' });
    expect(audios[0].src).toBe('/b/audio/fox/fr/start.1.webm');
    expect(audios[0].play).toHaveBeenCalled();
    expect(onLine).toHaveBeenCalledWith(expect.any(String), 'start.1');
    expect(voice.isSpeaking()).toBe(true);
  });

  it('does not create or fetch any audio when muted or switched off', () => {
    for (const profile of [{ soundEnabled: false }, { foxVoiceEnabled: false }]) {
      const { voice, audios } = harness(profile);
      expect(voice.say('start').action).toBe('skip');
      expect(audios).toHaveLength(0);
    }
  });

  it('holds back a second line inside the cooldown, then speaks again', () => {
    const { voice, audios, advance } = harness();
    voice.say('start');
    audios[0].onended();
    advance(5_000);
    expect(voice.say('streak').action).toBe('skip');
    advance(FOX_COOLDOWN_MS);
    expect(voice.say('streak').action).toBe('play');
    expect(audios).toHaveLength(2);
  });

  it('plays a waiting level-complete cheer when the cooldown ends', () => {
    const { voice, audios, advance } = harness();
    voice.say('start');
    audios[0].onended();
    advance(FOX_COOLDOWN_MS - 3_000);
    expect(voice.say('complete').action).toBe('wait');
    expect(audios).toHaveLength(1);
    advance(3_000);
    expect(audios).toHaveLength(2);
    expect(audios[1].src).toContain('/complete.');
  });

  it('waits for the word narration, and gives up if it never stops', () => {
    harness.narrating = true;
    const { voice, audios, advance } = harness();
    expect(voice.say('start').action).toBe('wait');
    advance(400);
    harness.narrating = false;
    advance(400);
    expect(audios).toHaveLength(1);

    harness.narrating = true;
    const second = harness();
    expect(second.voice.say('start').action).toBe('wait');
    for (let t = 0; t <= FOX_BUSY_GIVE_UP_MS + 800; t += 400) second.advance(400);
    expect(second.audios).toHaveLength(0);
    harness.narrating = false;
  });

  it('stop() silences the fox and forgets a waiting line', () => {
    const { voice, audios, advance } = harness();
    voice.say('start');
    voice.stop();
    expect(audios[0].pause).toHaveBeenCalled();
    expect(voice.isSpeaking()).toBe(false);
    advance(FOX_COOLDOWN_MS - 2_000);
    voice.say('complete');
    voice.stop();
    advance(5_000);
    expect(audios).toHaveLength(1);
  });

  it('reads the next word only after the fox has finished', () => {
    const { voice, audios } = harness();
    const speak = vi.fn();
    voice.say('start');
    voice.whenQuiet(speak);
    expect(speak).not.toHaveBeenCalled();
    audios[0].onended();
    expect(speak).toHaveBeenCalledTimes(1);
    voice.whenQuiet(speak);
    expect(speak).toHaveBeenCalledTimes(2);
  });

  it('announces the line to screen readers in the game screen', () => {
    document.body.innerHTML = '<section id="game-screen"></section>';
    announceFoxLine('Keep going!');
    const live = document.getElementById('fox-caption');
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toBe('Keep going!');
    announceFoxLine('Hooray!');
    expect(document.querySelectorAll('#fox-caption')).toHaveLength(1);
  });
});
