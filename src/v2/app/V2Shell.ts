import Phaser from 'phaser';
import { BootScene } from '../game/scenes/BootScene';

/** The DOM owns navigation and status; the game instance owns only its stage. */
export function mountV2Shell(root: HTMLElement): () => void {
  root.replaceChildren();

  const main = document.createElement('main');
  main.className = 'v2-shell';
  const header = document.createElement('header');
  const heading = document.createElement('h1');
  heading.textContent = 'Nature Quest';
  const description = document.createElement('p');
  description.textContent = 'Development preview of the habitat world.';
  const back = document.createElement('a');
  back.href = '../';
  back.textContent = 'Return to BloomType';
  header.append(heading, description, back);

  const stage = document.createElement('div');
  stage.className = 'v2-stage';
  stage.setAttribute('aria-hidden', 'true');
  const status = document.createElement('p');
  status.className = 'v2-status';
  status.setAttribute('role', 'status');
  status.textContent = 'Loading world preview';
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Close preview';
  main.append(header, stage, status, close);
  root.append(main);

  let disposed = false;
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: stage,
    width: 960,
    height: 540,
    backgroundColor: '#e5f3ec',
    scale: { mode: Phaser.Scale.RESIZE, width: 960, height: 540 },
    scene: [new BootScene(() => {
      if (disposed) return;
      game.canvas.setAttribute('aria-hidden', 'true');
      game.canvas.setAttribute('tabindex', '-1');
      status.textContent = 'World preview ready';
    })],
    audio: { noAudio: true },
  });

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    close.removeEventListener('click', dispose);
    game.destroy(true);
    root.replaceChildren();
  };
  close.addEventListener('click', dispose);
  return dispose;
}
