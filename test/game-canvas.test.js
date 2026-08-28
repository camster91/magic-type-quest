import { describe, expect, it, vi } from 'vitest';
import { createCanvasEffects } from '../src/gameCanvas.js';

class PendingImage {
  static instances = [];
  complete = false;
  naturalWidth = 100;
  width = 100;
  height = 100;
  constructor() { PendingImage.instances.push(this); }
  set src(value) { this.url = value; }
}

function setup({ reducedMotion = false } = {}) {
  PendingImage.instances = [];
  const gradient = { addColorStop: vi.fn() };
  const context = {
    createLinearGradient: vi.fn(() => gradient),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
    globalAlpha: 1,
  };
  const state = { canvasW: 800, canvasH: 600, currentTime: 250, activeWords: [], garden: [] };
  const getPetImage = vi.fn((frame) => `pet-${frame}.png`);
  const effects = createCanvasEffects({
    context,
    state,
    prefersReducedMotion: () => reducedMotion,
    ImageCtor: PendingImage,
    random: () => 0.5,
    getPetImage,
  });
  return { context, gradient, state, effects, getPetImage };
}

describe('canvas effects renderer', () => {
  it('draws the quiet gameplay gradient to the current canvas bounds', () => {
    const { context, gradient, effects } = setup();
    effects.drawQuietGradient();
    expect(context.createLinearGradient).toHaveBeenCalledWith(0, 0, 0, 600);
    expect(gradient.addColorStop).toHaveBeenCalledTimes(3);
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
  });

  it('delegates word rendering to each active canvas word', () => {
    const { context, state, effects } = setup();
    state.activeWords = [{ draw: vi.fn() }, { draw: vi.fn() }];
    effects.drawWords();
    expect(state.activeWords[0].draw).toHaveBeenCalledWith(context);
    expect(state.activeWords[1].draw).toHaveBeenCalledWith(context);
  });

  it('updates and draws particle fallbacks without a loaded texture', () => {
    const { context, effects } = setup();
    effects.spawnParticles(10, 20, 1);
    expect(effects.particles).toHaveLength(1);
    const initial = { ...effects.particles[0] };

    effects.updateParticles();
    effects.drawTexturedParticles();

    expect(effects.particles[0].x).not.toBe(initial.x);
    expect(effects.particles[0].y).not.toBe(initial.y);
    expect(context.arc).toHaveBeenCalledOnce();
    expect(context.globalAlpha).toBe(1);
  });

  it('suppresses particles and confetti when reduced motion is requested', () => {
    const { effects } = setup({ reducedMotion: true });
    effects.spawnParticles(10, 20, 5);
    effects.spawnConfetti(10, 20, 5);
    expect(effects.particles).toEqual([]);
  });

  it('keeps flowers visible when background assets are unavailable', () => {
    const { context, state, effects } = setup();
    state.garden = Array.from({ length: 32 }, (_, index) => ({
      type: 'flower', word: `word-${index}`, x: index + 10, scale: 1, bloomProgress: 1,
    }));
    effects.loadSceneImages();

    effects.drawGarden();

    expect(state.garden).toHaveLength(30);
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 800, 425);
    expect(context.stroke).toHaveBeenCalledTimes(30);
  });

  it('uses a stable flower image instead of changing variants every frame', () => {
    const { context, state, effects } = setup();
    state.garden = [{ type: 'rose', word: 'bloom', x: 200, scale: 1, bloomProgress: 1 }];
    effects.loadSceneImages();
    for (const image of PendingImage.instances) image.complete = true;

    effects.drawGarden();
    effects.drawGarden();

    const flowerCalls = context.drawImage.mock.calls.filter(([image]) => image.url?.includes('/flowers/'));
    expect(flowerCalls).toHaveLength(2);
    expect(flowerCalls[0][0]).toBe(flowerCalls[1][0]);
  });

  it('reloads and draws the selected pet without bounce under reduced motion', () => {
    const { context, effects, getPetImage } = setup({ reducedMotion: true });
    effects.loadSceneImages();
    effects.reloadPet('celebrate');
    const celebrate = PendingImage.instances.find((image) => image.url === 'pet-celebrate.png');
    celebrate.complete = true;

    effects.drawPet();

    expect(getPetImage).toHaveBeenCalledWith('celebrate');
    expect(context.drawImage).toHaveBeenCalledWith(celebrate, 60, 340, 100, 100);
  });
});
