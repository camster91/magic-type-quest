import Phaser from 'phaser';
import type { CuePlayback } from '../../motion/cues';

/** Rendering proof only. No learner state, input, persistence, or biome content. */
export class BootScene extends Phaser.Scene {
  private scenery?: Phaser.GameObjects.Graphics;
  private cueOverlay: Phaser.GameObjects.Graphics | undefined;
  private habitatAction = false;

  constructor(private readonly onReady: () => void) {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.scenery = this.add.graphics();
    this.drawScenery();
    this.scale.on('resize', this.drawScenery, this);
    this.events.once('shutdown', () => { this.scale.off('resize', this.drawScenery, this); this.disposeCues(); });
    this.onReady();
  }

  private drawScenery(): void {
    if (!this.scenery) return;
    const { width, height } = this.scale;
    this.scenery.clear();
    this.scenery.fillStyle(0xe5f3ec).fillRect(0, 0, width, height);
    this.scenery.fillStyle(0xb8d8bb).fillRect(0, height * 0.66, width, height * 0.34);
    if (this.habitatAction) {
      this.scenery.fillStyle(0x739b74).fillEllipse(width * 0.5, height * 0.8, Math.max(28, width * 0.09), Math.max(10, height * 0.035));
      this.scenery.lineStyle(2, 0x426c57).strokeEllipse(width * 0.5, height * 0.8, Math.max(28, width * 0.09), Math.max(10, height * 0.035));
    }
  }

  /** A restrained rendering fixture for the shared cue tokens; #167 replaces these graphics with approved layers. */
  playWorldCue(cue: CuePlayback): void {
    if (!this.scene.isActive() || cue.durationMs === 0 || cue.tier === 'ambient') return;
    this.disposeCues();
    const { width, height } = this.scale;
    const overlay = this.add.graphics(); this.cueOverlay = overlay;
    overlay.fillStyle(cue.id === 'input.incorrect' ? 0x6a9184 : 0xd9a65f, 0.55);
    overlay.fillEllipse(width * 0.5, height * 0.78, Math.max(24, width * 0.06), Math.max(12, height * 0.035));
    overlay.alpha = 0;
    this.tweens.add({ targets: overlay, alpha: 0.65, duration: cue.durationMs, ease: cue.easing, yoyo: true,
      onComplete: () => { if (this.cueOverlay === overlay) this.cueOverlay = undefined; overlay.destroy(); } });
  }
  applyFinalState(cue: CuePlayback): void {
    if (cue.id === 'sequence.complete') { this.habitatAction = true; this.drawScenery(); }
  }
  pauseAmbient(): void { /* No ambient loop exists before #167 art and #164 audio approval. */ }
  resumeAmbient(): void { /* Optional ambience is absent in this fixture. */ }
  disposeCues(): void { if (this.cueOverlay) { this.tweens.killTweensOf(this.cueOverlay); this.cueOverlay.destroy(); } this.cueOverlay = undefined; }
}
