import assert from 'node:assert/strict';
import { describe, it, vi } from 'vitest';
import { BootScene } from '../src/v2/game/scenes/BootScene.ts';
import { destroyWorldGame } from '../src/v2/game/systems/destroyWorldGame.ts';

// Exercise our actual scene methods against explicit lifecycle/texture ports.
// Rendering, decoding, and actual Phaser teardown remain browser tests.
vi.mock('phaser', () => ({ default: { Scene: class {} } }));

class Events {
  entries = [];
  on(type, callback, context) { this.entries.push({ type, callback, context, once: false }); return this; }
  once(type, callback, context) { this.entries.push({ type, callback, context, once: true }); return this; }
  off(type, callback, context) {
    this.entries = this.entries.filter((entry) => !(entry.type === type && entry.callback === callback && entry.context === context));
    return this;
  }
  emit(type, ...args) {
    for (const entry of [...this.entries].filter((value) => value.type === type)) {
      if (entry.once) this.off(type, entry.callback, entry.context);
      entry.callback.apply(entry.context, args);
    }
  }
  listenerCount(type) { return this.entries.filter((entry) => entry.type === type).length; }
}

function fixture(ids = ['required'], borrowed = []) {
  const resources = new Map(ids.map((id) => [id, { id, url: `blob:fixture-${id}`, bytes: 3, format: id.endsWith('svg') ? 'svg' : 'webp' }]));
  const calls = { queued: [], removed: [], ready: 0, errors: [], graphics: [], tweens: new Set() };
  const textures = new Set(['__DEFAULT', ...borrowed]);
  const scene = new BootScene(() => { calls.ready++; }, resources, (error) => calls.errors.push(error));
  scene.events = new Events();
  scene.scale = Object.assign(new Events(), { width: 640, height: 360 });
  scene.textures = { exists: (key) => textures.has(key), remove: (key) => { calls.removed.push(key); textures.delete(key); } };
  scene.load = {
    image: (id, url) => calls.queued.push({ type: 'image', id, url }),
    svg: (id, url) => calls.queued.push({ type: 'svg', id, url }),
  };
  scene.scene = { isActive: () => true };
  scene.add = { graphics: () => {
    const graphics = { destroyed: false, alpha: 1, destroy() { this.destroyed = true; } };
    for (const name of ['clear', 'fillStyle', 'fillRect', 'fillEllipse', 'lineStyle', 'strokeEllipse']) graphics[name] = () => graphics;
    calls.graphics.push(graphics);
    return graphics;
  } };
  scene.tweens = {
    add: (config) => calls.tweens.add(config),
    killTweensOf: (target) => { for (const tween of calls.tweens) if (tween.targets === target) calls.tweens.delete(tween); },
  };
  return { scene, textures, calls, resources };
}
const complete = (state) => { for (const { id } of state.calls.queued) state.textures.add(id); state.scene.create(); };

function gameFixture({ started = true, running = false } = {}) {
  const calls = []; let pending = false; let destroyed = false;
  const game = {
    isRunning: started,
    loop: { running, wake() { calls.push('wake'); this.running = true; step(); } },
    destroy(removeCanvas, noReturn) { calls.push(['destroy', removeCanvas, noReturn]); pending = true; },
  };
  const step = () => { if (pending) { destroyed = true; pending = false; game.loop.running = false; } };
  return { game, calls, step, destroyed: () => destroyed };
}

describe('scene asset readiness and ownership (#165)', () => {
  it('permits the empty-art rendering proof only after preload', () => {
    const state = fixture([]);
    state.scene.preload(); state.scene.create();
    assert.equal(state.calls.ready, 1);
    assert.deepEqual(state.calls.errors, []);
    state.scene.events.emit('shutdown');
  });

  it('does not announce ready when a required image failed to decode', () => {
    const state = fixture(); state.scene.preload(); state.scene.create();
    assert.equal(state.calls.ready, 0);
    assert.equal(state.calls.graphics.length, 0);
    assert.match(state.calls.errors[0]?.message ?? '', /Required scene textures unavailable: required/u);
    state.scene.events.emit('shutdown');
  });

  it('waits for every required image rather than accepting a partial pack', () => {
    const state = fixture(['first', 'second']); state.scene.preload(); state.textures.add('first'); state.scene.create();
    assert.equal(state.calls.ready, 0);
    assert.match(state.calls.errors[0]?.message ?? '', /second/u);
    state.scene.events.emit('shutdown');
    assert.deepEqual(state.calls.removed, ['first']);
  });

  it('loads SVG and raster resources through their existing Phaser methods', () => {
    const state = fixture(['required', 'required-svg']); state.scene.preload(); complete(state);
    assert.deepEqual(state.calls.queued.map(({ type, id }) => [type, id]), [['image', 'required'], ['svg', 'required-svg']]);
    assert.equal(state.calls.ready, 1);
    assert.equal(state.scene.scale.listenerCount('resize'), 1);
    state.scene.events.emit('shutdown');
  });

  it('does not queue or dispose a borrowed texture', () => {
    const state = fixture(['borrowed', 'owned'], ['borrowed']); state.scene.preload(); complete(state);
    state.scene.events.emit('shutdown');
    assert.deepEqual(state.calls.queued.map(({ id }) => id), ['owned']);
    assert.deepEqual(state.calls.removed, ['owned']);
    assert.deepEqual([...state.textures], ['__DEFAULT', 'borrowed']);
  });

  it('releases textures even when leaving during preload before create', () => {
    const state = fixture(); state.scene.preload(); state.textures.add('required'); state.scene.events.emit('shutdown');
    assert.deepEqual([...state.textures], ['__DEFAULT']);
    assert.equal(state.calls.ready, 0);
    assert.equal(state.scene.events.entries.length, 0);
  });

  it('ignores a late create callback after early shutdown', () => {
    const state = fixture([]); state.scene.preload(); state.scene.events.emit('shutdown'); state.scene.create();
    assert.equal(state.calls.ready, 0);
    assert.equal(state.calls.graphics.length, 0);
    assert.equal(state.scene.scale.listenerCount('resize'), 0);
  });

  it('cleans up on direct scene destruction without requiring shutdown first', () => {
    const state = fixture(); state.scene.preload(); complete(state); state.scene.events.emit('destroy');
    assert.deepEqual([...state.textures], ['__DEFAULT']);
    assert.equal(state.scene.events.entries.length, 0);
    assert.equal(state.scene.scale.listenerCount('resize'), 0);
    assert.equal(state.calls.graphics.every((graphic) => graphic.destroyed), true);
  });

  it('reports readiness only once per scene cycle', () => {
    const state = fixture(); state.scene.preload(); complete(state); state.scene.create();
    assert.equal(state.calls.ready, 1);
    assert.equal(state.calls.graphics.length, 1);
    assert.equal(state.scene.scale.listenerCount('resize'), 1);
    state.scene.events.emit('shutdown');
  });

  it('reports a decode failure only once per scene cycle', () => {
    const state = fixture(); state.scene.preload(); state.scene.create(); state.scene.create();
    assert.equal(state.calls.errors.length, 1);
    assert.equal(state.calls.ready, 0);
    state.scene.events.emit('shutdown');
  });

  it('can retry a failed pack on a fresh scene cycle', () => {
    const state = fixture(); state.scene.preload(); state.scene.create(); state.scene.events.emit('shutdown');
    state.scene.preload(); complete(state);
    assert.equal(state.calls.errors.length, 1);
    assert.equal(state.calls.ready, 1);
    state.scene.events.emit('shutdown');
    assert.deepEqual([...state.textures], ['__DEFAULT']);
  });

  it('bounds textures, lifecycle listeners, cue tweens and graphics across five cycles', () => {
    const state = fixture(['borrowed', 'owned'], ['borrowed']);
    for (let visit = 0; visit < 5; visit++) {
      state.scene.preload(); complete(state);
      state.scene.playWorldCue({ id: 'input.correct', tier: 'input', durationMs: 80, easing: 'Linear', reducedMotion: false, finalState: 'target-acknowledged' });
      assert.equal(state.calls.tweens.size, 1);
      assert.equal(state.scene.events.listenerCount('shutdown'), 1);
      assert.equal(state.scene.events.listenerCount('destroy'), 1);
      state.scene.events.emit('shutdown');
      assert.deepEqual([...state.textures], ['__DEFAULT', 'borrowed']);
      assert.equal(state.scene.events.entries.length, 0);
      assert.equal(state.scene.scale.listenerCount('resize'), 0);
      assert.equal(state.calls.tweens.size, 0);
      assert.equal(state.calls.graphics.every((graphic) => graphic.destroyed), true);
    }
    assert.equal(state.calls.ready, 5);
    assert.equal(state.calls.removed.length, 5);
  });

  it('skips zero-duration effects while still applying the restoration final state', () => {
    const state = fixture([]); state.scene.preload(); state.scene.create();
    const cue = { id: 'sequence.complete', durationMs: 0, tier: 'sequence', easing: 'Linear', reducedMotion: true, finalState: 'habitat-action-visible' };
    state.scene.playWorldCue(cue);
    state.scene.applyFinalState(cue);
    assert.equal(state.calls.tweens.size, 0);
    assert.equal(state.calls.graphics.length, 1);
    assert.equal(state.calls.errors.length, 0);
    state.scene.events.emit('shutdown');
  });

  it('never treats an undecodable SVG as a ready world', () => {
    const state = fixture(['required-svg']); state.scene.preload(); state.scene.create();
    assert.equal(state.calls.ready, 0);
    assert.match(state.calls.errors[0]?.message ?? '', /required-svg/u);
    state.scene.events.emit('shutdown');
  });

  it('does not revoke resource URLs owned by the pack loader', () => {
    const state = fixture(); state.scene.preload(); complete(state); state.scene.events.emit('shutdown');
    assert.equal(state.resources.get('required').url, 'blob:fixture-required');
    assert.equal(state.resources.size, 1);
  });
});

describe('deferred Phaser game disposal (#165)', () => {
  it('accepts an absent world', () => { assert.doesNotThrow(() => destroyWorldGame(null)); });

  it('requests destruction before waking a started sleeping loop', () => {
    const state = gameFixture(); destroyWorldGame(state.game);
    assert.deepEqual(state.calls, [['destroy', true, false], 'wake']);
    assert.equal(state.destroyed(), true);
  });

  it('lets an already running loop consume its next destruction step', () => {
    const state = gameFixture({ running: true }); destroyWorldGame(state.game);
    assert.deepEqual(state.calls, [['destroy', true, false]]);
    assert.equal(state.destroyed(), false);
    state.step(); assert.equal(state.destroyed(), true);
  });

  it('does not wake an unstarted game before its callback is installed', () => {
    const state = gameFixture({ started: false }); destroyWorldGame(state.game);
    assert.deepEqual(state.calls, [['destroy', true, false]]);
    assert.equal(state.destroyed(), false);
    state.game.isRunning = true; state.step(); assert.equal(state.destroyed(), true);
  });

  it('is idempotent even after the loop has been destroyed', () => {
    const state = gameFixture(); destroyWorldGame(state.game);
    state.game.loop.wake = () => { throw new Error('Cannot wake a destroyed loop'); };
    assert.doesNotThrow(() => destroyWorldGame(state.game));
    assert.deepEqual(state.calls, [['destroy', true, false], 'wake']);
  });

  it('keeps lifecycle ownership independent for separate shell instances', () => {
    const first = gameFixture(); const second = gameFixture();
    destroyWorldGame(first.game); destroyWorldGame(second.game);
    assert.equal(first.destroyed(), true); assert.equal(second.destroyed(), true);
    assert.deepEqual(first.calls, second.calls);
  });
});
