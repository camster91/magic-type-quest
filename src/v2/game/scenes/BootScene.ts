import Phaser from 'phaser';
import type { CuePlayback } from '../../motion/cues';
import type { PackResource } from '../../assets/PackLoader';

/** Rendering proof only. No learner state, input, persistence, or biome content. */
export class BootScene extends Phaser.Scene {
  private scenery: Phaser.GameObjects.Graphics | undefined;
  private cueOverlay: Phaser.GameObjects.Graphics | undefined;
  private habitatAction = false;
  private readonly ownedTextures = new Set<string>();
  private cycleActive = false;
  private readinessReported = false;

  constructor(private readonly onReady: () => void, private readonly resources: ReadonlyMap<string, PackResource> = new Map(),
    private readonly onLoadFailure: (cause: Error) => void = () => {}) {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Register before starting requests: a scene may exit before create().
    this.cycleActive = true;
    this.readinessReported = false;
    this.events.once('shutdown', this.releaseScene, this);
    this.events.once('destroy', this.releaseScene, this);
    for (const resource of this.resources.values()) {
      // A texture supplied by another owner must not be queued or removed here.
      if (this.textures.exists(resource.id)) continue;
      this.ownedTextures.add(resource.id);
      if (resource.format === 'svg') this.load.svg(resource.id, resource.url);
      else this.load.image(resource.id, resource.url);
    }
  }

  create(): void {
    if (!this.cycleActive || this.readinessReported) return;
    this.readinessReported = true;
    // A finished loader queue is not proof that every image decoded. Required
    // resources must exist in the Texture Manager before typing becomes usable.
    const missing = [...this.resources.keys()].filter((id) => !this.textures.exists(id));
    if (missing.length) {
      this.onLoadFailure(new Error(`Required scene textures unavailable: ${missing.join(', ')}`));
      return;
    }
    this.scenery = this.add.graphics();
    this.drawScenery();
    this.scale.on('resize', this.drawScenery, this);
    this.onReady();
  }

  private releaseScene(): void {
    this.cycleActive = false;
    this.events.off('shutdown', this.releaseScene, this);
    this.events.off('destroy', this.releaseScene, this);
    this.scale.off('resize', this.drawScenery, this);
    this.disposeCues();
    this.scenery?.destroy(); this.scenery = undefined;
    for (const id of this.ownedTextures) if (this.textures.exists(id)) this.textures.remove(id);
    this.ownedTextures.clear();
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
