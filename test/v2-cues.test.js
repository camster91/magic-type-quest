// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CueDirector, CUES, MOTION_TOKENS, validateCues } from '../src/v2/motion/cues.ts';
import { AudioCueService } from '../src/v2/audio/AudioCueService.ts';
import { AUDIO_MANIFEST, audioById, validateAudioManifest } from '../src/v2/audio/manifest.ts';

let director;
let sound;
afterEach(() => { director?.dispose(); sound?.dispose(); director = null; sound = null; });

function fixture() {
  const host = { playWorldCue: vi.fn(), applyFinalState: vi.fn(), pauseAmbient: vi.fn(), resumeAmbient: vi.fn(), dispose: vi.fn() };
  const audio = { play: vi.fn(async () => false), pauseAmbient: vi.fn(), resumeAmbient: vi.fn(), dispose: vi.fn() };
  const announce = vi.fn(); const visibility = new window.EventTarget(); visibility.hidden = false;
  director = new CueDirector(host, audio, announce, visibility, () => false);
  return { host, audio, announce, visibility };
}

describe('shared motion and audio cues (#164)', () => {
  it('maps every motion tier to a bounded token and a silent semantic result', () => {
    expect(validateCues()).toEqual([]); expect(validateAudioManifest()).toEqual([]);
    expect(new Set(Object.values(CUES).map((cue) => cue.tier))).toEqual(new Set(['ambient', 'input', 'sequence', 'mission', 'milestone', 'navigation']));
    expect(AUDIO_MANIFEST).toHaveLength(9);
    const { host, audio, announce } = fixture();
    const correct = director.request('input.correct');
    expect(correct.durationMs).toBe(MOTION_TOKENS.input);
    expect(host.playWorldCue).toHaveBeenCalledWith(correct);
    expect(host.applyFinalState).toHaveBeenCalledWith(correct);
    expect(announce).not.toHaveBeenCalled();
    expect(audio.play).toHaveBeenCalledWith('audio.key.correct');
    director.request('sequence.complete', 'A planting spot is marked.');
    expect(announce).toHaveBeenCalledOnce();
    expect(announce).toHaveBeenCalledWith('A planting spot is marked.');
  });

  it('reduced motion uses instant/static or brief fade while preserving final state and DOM information', () => {
    const { host, announce } = fixture(); director.setReducedMotion(true);
    expect(director.request('input.incorrect').durationMs).toBe(0);
    const result = director.request('mission.restore', 'The flowers have grown.');
    expect(result).toMatchObject({ durationMs: 120, easing: 'Linear', reducedMotion: true, finalState: 'restored-stage-visible' });
    expect(host.applyFinalState).toHaveBeenCalledWith(result);
    expect(announce).toHaveBeenCalledWith('The flowers have grown.');
  });

  it('pauses ambient work in hidden tabs and releases listeners and host/audio once', () => {
    const { host, audio, visibility } = fixture();
    visibility.hidden = true; visibility.dispatchEvent(new window.Event('visibilitychange'));
    expect(host.pauseAmbient).toHaveBeenCalledOnce(); expect(audio.pauseAmbient).toHaveBeenCalledOnce();
    expect(director.request('ambient.meadow')).toBeNull();
    const final = director.request('mission.restore', 'Habitat restored');
    expect(host.playWorldCue).not.toHaveBeenCalled(); expect(host.applyFinalState).toHaveBeenCalledWith(final);
    visibility.hidden = false; visibility.dispatchEvent(new window.Event('visibilitychange'));
    expect(host.resumeAmbient).toHaveBeenCalledOnce(); expect(audio.resumeAmbient).toHaveBeenCalledOnce();
    director.dispose(); director.dispose();
    expect(host.dispose).toHaveBeenCalledOnce(); expect(audio.dispose).toHaveBeenCalledOnce();
    visibility.dispatchEvent(new window.Event('visibilitychange'));
    expect(host.pauseAmbient).toHaveBeenCalledOnce();
  });

  it('never starts sound before unlock, respects mute/volume, and cleans completed or rejected media', async () => {
    const original = audioById.get('audio.key.correct');
    audioById.set('audio.key.correct', { ...original, status: 'implemented', durationMs: 90,
      sources: [{ path: 'public/assets/v2/audio/correct.webm', format: 'webm', bytes: 100 }],
      provenance: { origin: 'manual', licence: 'owned', referenceId: 'test' } });
    const media = [];
    const createMedia = () => {
      const element = new window.EventTarget();
      Object.assign(element, { src: '', loop: false, volume: 0, currentTime: 0, play: vi.fn(async () => {}), pause: vi.fn() });
      media.push(element); return element;
    };
    try {
      sound = new AudioCueService(createMedia, () => true);
      expect(await sound.play('audio.key.correct')).toBe(false);
      expect(media).toHaveLength(0);
      sound.unlock(); sound.setPreferences({ effectsVolume: 0.2, muted: true });
      expect(await sound.play('audio.key.correct')).toBe(false);
      sound.setPreferences({ muted: false });
      expect(await sound.play('audio.key.correct')).toBe(true);
      expect(media[0].volume).toBe(0.2);
      media[0].dispatchEvent(new window.Event('ended'));
      sound.setPreferences({ effectsVolume: 1.8, ambienceVolume: -1 });
      expect(sound.getPreferences()).toMatchObject({ effectsVolume: 1, ambienceVolume: 0 });
      expect(await sound.play('audio.key.correct')).toBe(true);
      sound.dispose(); expect(media[1].pause).toHaveBeenCalledOnce();
      expect(media[1].currentTime).toBe(0);
    } finally { audioById.set('audio.key.correct', original); }
  });
});
