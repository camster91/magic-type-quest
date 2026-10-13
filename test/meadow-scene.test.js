import { describe, expect, it, vi } from 'vitest';
import { createMeadowScene, meadowPlan, MEADOW_ART } from '../src/v2/meadowScene.js';

describe('meadow restoration plan', () => {
  it('starts as a damaged meadow with nothing planted', () => {
    expect(meadowPlan(0, 0)).toEqual({ restored: 0, mid: 0, foreground: 0, plants: [], visitors: [] });
  });

  it('plants one flower per word and grows earlier ones', () => {
    const plan = meadowPlan(0.3, 3);
    expect(plan.plants.map((p) => p.stage)).toEqual([2, 1, 0]);
  });

  it('brings wildlife back in order as progress grows', () => {
    expect(meadowPlan(0.35, 4).visitors).toEqual(['beehotel', 'bee']);
    expect(meadowPlan(1, 10).visitors).toEqual(['beehotel', 'bee', 'nestbox', 'monarch', 'bluebird', 'monarch2', 'cottontail']);
  });

  it('is fully restored at the end of a level', () => {
    const plan = meadowPlan(1, 10);
    expect(plan).toMatchObject({ restored: 1, mid: 1, foreground: 1 });
    expect(plan.plants).toHaveLength(10);
  });

  it('clamps bad input', () => {
    expect(meadowPlan(-2, -5).plants).toEqual([]);
    expect(meadowPlan(9, 99).plants).toHaveLength(12);
    expect(meadowPlan(NaN, undefined).restored).toBe(0);
  });

  it('only uses v2 meadow art', () => {
    for (const url of Object.values(MEADOW_ART)) expect(url).toMatch(/assets\/v2\/meadow\/[\w.]+\.webp$/);
  });
});

describe('meadow scene drawing', () => {
  function fakeImage() {
    return class {
      constructor() { this.complete = true; this.naturalWidth = 400; this.naturalHeight = 200; }
    };
  }
  const ctx2d = () => ({
    drawImage: vi.fn(), save: vi.fn(), restore: vi.fn(), translate: vi.fn(), scale: vi.fn(), globalAlpha: 1,
  });

  it('waits for art, then paints layers and sprites without errors', () => {
    const context = ctx2d();
    const scene = createMeadowScene({
      context,
      state: { canvasW: 800, canvasH: 500 },
      ImageCtor: fakeImage(),
      createCanvas: () => ({ width: 0, height: 0, getContext: () => ctx2d() }),
      getKeyboardTop: () => 420,
      prefersReducedMotion: () => true,
      now: () => 1000,
    });
    expect(scene.isReady()).toBe(false);
    scene.load();
    expect(scene.isReady()).toBe(true);
    scene.reset();
    scene.cheer();
    scene.draw(1, 10);
    // 6 scene layers plus flowers, props, wildlife and the fox.
    expect(context.drawImage.mock.calls.length).toBeGreaterThan(20);
  });

  it('skips broken art instead of throwing', () => {
    const Broken = class { constructor() { this.complete = true; this.naturalWidth = 0; this.naturalHeight = 0; } };
    const scene = createMeadowScene({ context: ctx2d(), state: { canvasW: 800, canvasH: 500 }, ImageCtor: Broken });
    scene.load();
    expect(scene.isReady()).toBe(false);
  });
});

describe('level-complete celebration', () => {
  it('celebrates until the next level resets the scene', () => {
    const ctx = { drawImage: vi.fn(), save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(), ellipse: vi.fn(), fill: vi.fn(), createRadialGradient: () => ({ addColorStop: vi.fn() }), globalAlpha: 1 };
    const Img = class { constructor() { this.complete = true; this.naturalWidth = 400; this.naturalHeight = 200; } };
    const scene = createMeadowScene({ context: ctx, state: { canvasW: 800, canvasH: 500 }, ImageCtor: Img, createCanvas: () => ({ getContext: () => ({ ...ctx }) }), now: () => 5000 });
    scene.load();
    expect(scene.isCelebrating()).toBe(false);
    scene.celebrate();
    expect(scene.isCelebrating()).toBe(true);
    scene.draw(1, 10);
    expect(ctx.ellipse).toHaveBeenCalled(); // petals
    scene.reset();
    expect(scene.isCelebrating()).toBe(false);
  });
});
