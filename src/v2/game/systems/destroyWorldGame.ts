/** The public subset of Phaser.Game needed at the DOM/world disposal boundary. */
export interface DeferredWorldGame {
  readonly isRunning: boolean;
  readonly loop: { readonly running: boolean; wake(): void };
  destroy(removeCanvas: boolean, noReturn?: boolean): void;
}

const destructionRequested = new WeakSet<DeferredWorldGame>();

/**
 * Phaser 4.2.1 destroy() only sets a flag; the next Game step does the teardown.
 * Wake a previously started, sleeping loop AFTER setting that flag. An unstarted
 * game must finish its normal boot first; waking it early has no step callback.
 * Keep noReturn false so another shell can mount on the same page.
 */
export function destroyWorldGame(game: DeferredWorldGame | null): void {
  if (!game || destructionRequested.has(game)) return;
  game.destroy(true, false);
  destructionRequested.add(game);
  if (game.isRunning && !game.loop.running) game.loop.wake();
}
