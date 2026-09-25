import type Phaser from 'phaser';
import { bindWorldVisibility, type WorldVisibilityEnvironment } from '../../app/bindWorldVisibility';

/**
 * A shared Phaser 4.2.1 startup adapter, not a biome-specific engine.
 * The protected start() hook is guarded against upstream source drift by tests.
 * All rendering, boot, scene and teardown methods otherwise remain Phaser's.
 */
export function createWorldGame(Engine: typeof Phaser, config: Phaser.Types.Core.GameConfig,
  environment: WorldVisibilityEnvironment = { document, window }): Phaser.Game {
  // Closure-owned state also works when the base constructor starts synchronously:
  // derived instance-field initializers must not overwrite an already-bound scope.
  const releases = new WeakMap<Phaser.Game, () => void>();
  const requested = new WeakSet<Phaser.Game>();
  const started = new WeakSet<Phaser.Game>();
  const events = Engine.Core.Events;
  class OwnedWorldGame extends Engine.Game {
    protected override start(): void {
      if (started.has(this)) return;
      started.add(this);
      this.isRunning = true;
      this.config.postBoot(this);
      if (!requested.has(this)) {
        const handlers = [
          [events.HIDDEN, this.onHidden], [events.VISIBLE, this.onVisible],
          [events.BLUR, this.onBlur], [events.FOCUS, this.onFocus],
        ] as const;
        const releaseBrowser = bindWorldVisibility(this.events, environment);
        let released = false;
        const release = (): void => {
          if (released) return;
          released = true;
          releaseBrowser();
          for (const [event, handler] of handlers) this.events.off(event, handler, this);
          this.events.off(events.DESTROY, release);
          releases.delete(this);
        };
        releases.set(this, release);
        for (const [event, handler] of handlers) this.events.on(event, handler, this);
        this.events.once(events.DESTROY, release);
      }
      try {
        // Bind ownership before starting: a synchronous first step may destroy
        // a cancelled game. No listener may be installed after that destruction.
        this.loop.start(this.renderer ? this.step.bind(this) : this.headlessStep.bind(this));
      } catch (cause) { releases.get(this)?.(); throw cause; }
    }

    override destroy(removeCanvas: boolean, noReturn = false): void {
      if (requested.has(this)) return;
      requested.add(this);
      // Remove browser callbacks now, even if a hidden page delays the next frame.
      releases.get(this)?.();
      super.destroy(removeCanvas, noReturn);
    }
  }
  // Focus is controlled by semantic DOM controls, not window.focus() during boot.
  return new OwnedWorldGame({ ...config, autoFocus: false });
}
