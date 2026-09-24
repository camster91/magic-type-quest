export type CueId = 'input.correct' | 'input.incorrect' | 'sequence.complete' | 'mission.restore' | 'wildlife.arrival' | 'biome.milestone' | 'navigation.enter' | 'ambient.meadow';
export type MotionTier = 'ambient' | 'input' | 'sequence' | 'mission' | 'milestone' | 'navigation';
export type EasingToken = 'Linear' | 'Sine.easeOut' | 'Cubic.easeOut';
export const MOTION_TOKENS = {
  instant: 0, input: 90, short: 220, medium: 650, milestone: 1000, reducedFade: 120,
} as const;
export interface CueDefinition { readonly id: CueId; readonly tier: MotionTier; readonly duration: keyof typeof MOTION_TOKENS; readonly easing: EasingToken; readonly reduced: 'instant' | 'reducedFade'; readonly audioId: string | null; readonly announce: boolean; readonly finalState: string; }
export interface CuePlayback { readonly id: CueId; readonly tier: MotionTier; readonly durationMs: number; readonly easing: EasingToken; readonly reducedMotion: boolean; readonly finalState: string; }

export const CUES: Readonly<Record<CueId, CueDefinition>> = {
  'input.correct': { id: 'input.correct', tier: 'input', duration: 'input', easing: 'Sine.easeOut', reduced: 'instant', audioId: 'audio.key.correct', announce: false, finalState: 'target-acknowledged' },
  'input.incorrect': { id: 'input.incorrect', tier: 'input', duration: 'input', easing: 'Sine.easeOut', reduced: 'instant', audioId: 'audio.key.retry', announce: false, finalState: 'target-awaiting-retry' },
  'sequence.complete': { id: 'sequence.complete', tier: 'sequence', duration: 'short', easing: 'Cubic.easeOut', reduced: 'reducedFade', audioId: 'audio.sequence.complete', announce: true, finalState: 'habitat-action-visible' },
  'mission.restore': { id: 'mission.restore', tier: 'mission', duration: 'medium', easing: 'Cubic.easeOut', reduced: 'reducedFade', audioId: 'audio.restoration', announce: true, finalState: 'restored-stage-visible' },
  'wildlife.arrival': { id: 'wildlife.arrival', tier: 'mission', duration: 'medium', easing: 'Sine.easeOut', reduced: 'instant', audioId: 'audio.discovery', announce: true, finalState: 'wildlife-visible' },
  'biome.milestone': { id: 'biome.milestone', tier: 'milestone', duration: 'milestone', easing: 'Cubic.easeOut', reduced: 'reducedFade', audioId: 'audio.biome.milestone', announce: true, finalState: 'milestone-visible' },
  'navigation.enter': { id: 'navigation.enter', tier: 'navigation', duration: 'short', easing: 'Sine.easeOut', reduced: 'instant', audioId: 'audio.ui.confirm', announce: false, finalState: 'scene-visible' },
  'ambient.meadow': { id: 'ambient.meadow', tier: 'ambient', duration: 'medium', easing: 'Sine.easeOut', reduced: 'instant', audioId: 'audio.ambient.meadow', announce: false, finalState: 'ambient-rest' },
};

export function validateCues(catalogue: Readonly<Record<string, CueDefinition>> = CUES): readonly string[] {
  const errors: string[] = [];
  for (const [id, cue] of Object.entries(catalogue)) {
    if (id !== cue.id || !(cue.duration in MOTION_TOKENS) || !(cue.reduced in MOTION_TOKENS)) errors.push(`${id}: invalid cue/token`);
    if (!['Linear', 'Sine.easeOut', 'Cubic.easeOut'].includes(cue.easing) || !cue.finalState) errors.push(`${id}: missing easing/final state`);
    if (cue.tier === 'ambient' && cue.announce) errors.push(`${id}: ambient cues must not announce repeatedly`);
  }
  return errors;
}

export interface CueHost { playWorldCue(cue: CuePlayback): void; applyFinalState(cue: CuePlayback): void; pauseAmbient(): void; resumeAmbient(): void; dispose(): void; }
export interface CueAudio { play(id: string): Promise<boolean>; pauseAmbient(): void; resumeAmbient(): void; dispose(): void; }
export class CueDirector {
  private reduced = false;
  private disposed = false;
  constructor(private readonly host: CueHost, private readonly audio: CueAudio, private readonly announce: (message: string) => void,
    private readonly documentRef: Pick<Document, 'hidden' | 'addEventListener' | 'removeEventListener'> = document,
    private readonly prefersReduced: () => boolean = () => matchMedia('(prefers-reduced-motion: reduce)').matches) {
    documentRef.addEventListener('visibilitychange', this.visibilityChanged);
  }
  setReducedMotion(value: boolean): void { this.reduced = value; }
  request(id: CueId, summary?: string): CuePlayback | null {
    if (this.disposed) return null;
    const cue = CUES[id];
    const reducedMotion = this.reduced || this.prefersReduced();
    const playback: CuePlayback = { id, tier: cue.tier, durationMs: MOTION_TOKENS[reducedMotion ? cue.reduced : cue.duration],
      easing: reducedMotion ? 'Linear' : cue.easing, reducedMotion, finalState: cue.finalState };
    if (this.documentRef.hidden && cue.tier === 'ambient') return null;
    if (!this.documentRef.hidden) this.host.playWorldCue(playback);
    this.host.applyFinalState(playback);
    if (cue.audioId && !this.documentRef.hidden) void this.audio.play(cue.audioId);
    if (cue.announce && summary) this.announce(summary);
    return playback;
  }
  private readonly visibilityChanged = (): void => {
    if (this.documentRef.hidden) { this.host.pauseAmbient(); this.audio.pauseAmbient(); }
    else { this.host.resumeAmbient(); this.audio.resumeAmbient(); }
  };
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; this.documentRef.removeEventListener('visibilitychange', this.visibilityChanged);
    this.host.dispose(); this.audio.dispose();
  }
}
