import Phaser from 'phaser';

/** Rendering proof only. No learner state, input, persistence, or biome content. */
export class BootScene extends Phaser.Scene {
  private scenery?: Phaser.GameObjects.Graphics;

  constructor(private readonly onReady: () => void) {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.scenery = this.add.graphics();
    this.drawScenery();
    this.scale.on('resize', this.drawScenery, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.drawScenery, this));
    this.onReady();
  }

  private drawScenery(): void {
    if (!this.scenery) return;
    const { width, height } = this.scale;
    this.scenery.clear();
    this.scenery.fillStyle(0xe5f3ec).fillRect(0, 0, width, height);
    this.scenery.fillStyle(0xb8d8bb).fillRect(0, height * 0.66, width, height * 0.34);
  }
}
