import { describe, expect, it, vi } from 'vitest';
import { createCanvasEffects } from '../src/gameCanvas.js';

class PendingImage {
  complete = false;
  set src(value) { this.url = value; }
}

function setup({ reducedMotion = false } = {}) {
  const gradient = { addColorStop: vi.fn() };
  const context = {
    createLinearGradient: vi.fn(() => gradient),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
    globalAlpha: 1,
  };
  const state = { canvasW: 800, canvasH: 600, activeWords: [] };
  const effects = createCanvasEffects({
    context,
    state,
    prefersReducedMotion: () => reducedMotion,
    ImageCtor: PendingImage,
    random: () => 0.5,
  });
  return { context, gradient, state, effects };
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
});
