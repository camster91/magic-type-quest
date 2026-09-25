import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { bindWorldVisibility } from '../src/v2/app/bindWorldVisibility.ts';
import { createWorldGame } from '../src/v2/game/systems/createWorldGame.ts';
import { destroyWorldGame } from '../src/v2/game/systems/destroyWorldGame.ts';

class Target extends globalThis.EventTarget {
  entries = new Map();
  addEventListener(type, handler, options) {
    super.addEventListener(type, handler, options);
    if (!this.entries.has(type)) this.entries.set(type, new Set());
    this.entries.get(type).add(handler);
  }
  removeEventListener(type, handler, options) {
    super.removeEventListener(type, handler, options);
    this.entries.get(type)?.delete(handler);
  }
  count(type) { return this.entries.get(type)?.size ?? 0; }
}
class Events {
  entries = [];
  on(type, handler, context) { this.entries.push({ type, handler, context }); return this; }
  once(type, handler, context) { this.entries.push({ type, handler, context, once: true }); return this; }
  off(type, handler, context) {
    this.entries = this.entries.filter((entry) => !(entry.type === type && entry.handler === handler && entry.context === context));
    return this;
  }
  emit(type, ...args) {
    for (const entry of [...this.entries].filter((item) => item.type === type)) {
      if (entry.once) this.off(type, entry.handler, entry.context);
      entry.handler.apply(entry.context, args);
    }
    return true;
  }
  count(type) { return this.entries.filter((entry) => entry.type === type).length; }
}
function environment() {
  return { document: Object.assign(new Target(), { hidden: false }), window: Object.assign(new Target(), { onblur: () => {}, onfocus: () => {} }) };
}
const counts = (env) => [env.document.count('visibilitychange'), env.window.count('blur'), env.window.count('focus')];
function engineFixture({ synchronousBoot = false, synchronousStep = false, headless = false, failStart = false } = {}) {
  const calls = [];
  class Game {
    constructor(config) {
      this.config = { ...config, postBoot: config.callbacks?.postBoot ?? (() => {}) };
      this.events = new Events(); this.isRunning = false; this.pending = false; this.destroyed = false;
      this.renderer = headless ? null : {};
      this.loop = {
        running: false, started: false,
        start: (step) => { calls.push('loop.start'); if (failStart) throw new Error('scheduler unavailable'); this.stepCallback = step; this.loop.started = true; this.loop.running = true; if (synchronousStep) this.tick(); },
        wake: () => { calls.push('loop.wake'); this.loop.running = true; this.tick(); },
      };
      if (synchronousBoot) this.start();
    }
    begin() { this.start(); }
    start() { throw new Error('Unbounded upstream start must not run'); }
    step() { calls.push(['step', this]); this.advance(); }
    headlessStep() { calls.push(['headless', this]); this.advance(); }
    advance() {
      if (this.pending) {
        this.destroyed = true; this.pending = false; this.loop.running = false;
        this.events.emit('destroy');
      }
    }
    tick() { this.stepCallback?.(); }
    onHidden() { calls.push(['hidden', this]); }
    onVisible() { calls.push(['visible', this]); }
    onBlur() { calls.push(['blur', this]); }
    onFocus() { calls.push(['focus', this]); }
    destroy(removeCanvas, noReturn) { calls.push(['destroy', removeCanvas, noReturn]); this.pending = true; }
  }
  return { Engine: { Game, Core: { Events: { HIDDEN: 'hidden', VISIBLE: 'visible', BLUR: 'blur', FOCUS: 'focus', DESTROY: 'destroy' } } }, calls };
}

describe('world-scoped browser visibility (#165)', () => {
  it('forwards visibility and focus changes without replacing host handler slots', () => {
    const env = environment(); const prior = [env.window.onblur, env.window.onfocus]; const emitted = [];
    const release = bindWorldVisibility({ emit: (type) => emitted.push(type) }, env);
    env.document.hidden = true; env.document.dispatchEvent(new globalThis.Event('visibilitychange'));
    env.document.hidden = false; env.document.dispatchEvent(new globalThis.Event('visibilitychange'));
    env.window.dispatchEvent(new globalThis.Event('blur')); env.window.dispatchEvent(new globalThis.Event('focus'));
    assert.deepEqual(emitted, ['hidden', 'visible', 'blur', 'focus']);
    assert.deepEqual([env.window.onblur, env.window.onfocus], prior);
    release();
  });
  it('does not invent an initial visibility event or use window.focus', () => {
    const env = environment(); env.document.hidden = true; env.window.focus = () => { throw new Error('focus stolen'); };
    const emitted = []; const release = bindWorldVisibility({ emit: (type) => emitted.push(type) }, env);
    assert.deepEqual(emitted, []); release();
  });
  it('releases only owned listeners, immediately and idempotently', () => {
    const env = environment(); let host = 0; const external = () => { host++; }; const emitted = [];
    env.document.addEventListener('visibilitychange', external);
    const release = bindWorldVisibility({ emit: (type) => emitted.push(type) }, env);
    assert.deepEqual(counts(env), [2, 1, 1]); release(); release();
    env.document.dispatchEvent(new globalThis.Event('visibilitychange')); env.window.dispatchEvent(new globalThis.Event('focus'));
    assert.deepEqual(counts(env), [1, 0, 0]); assert.equal(host, 1); assert.deepEqual(emitted, []);
  });
  it('keeps five bind/release cycles at baseline', () => {
    const env = environment();
    for (let cycle = 0; cycle < 5; cycle++) {
      const release = bindWorldVisibility({ emit: () => {} }, env);
      assert.deepEqual(counts(env), [1, 1, 1]); release(); assert.deepEqual(counts(env), [0, 0, 0]);
    }
  });
  it('keeps independent live owners separate', () => {
    const env = environment(); const a = []; const b = [];
    const releaseA = bindWorldVisibility({ emit: (type) => a.push(type) }, env);
    const releaseB = bindWorldVisibility({ emit: (type) => b.push(type) }, env);
    releaseA(); env.window.dispatchEvent(new globalThis.Event('focus'));
    assert.deepEqual(a, []); assert.deepEqual(b, ['focus']); assert.deepEqual(counts(env), [1, 1, 1]); releaseB();
  });
  it('rolls back registrations if a later listener cannot be registered', () => {
    const env = environment(); const add = env.window.addEventListener.bind(env.window);
    env.window.addEventListener = (type, listener, options) => { if (type === 'focus') throw new Error('registration denied'); add(type, listener, options); };
    assert.throws(() => bindWorldVisibility({ emit: () => {} }, env), /registration denied/);
    assert.deepEqual(counts(env), [0, 0, 0]);
  });
  it('does not emit from callbacks retained by another event dispatcher after cleanup', () => {
    const env = environment(); const emitted = [];
    const release = bindWorldVisibility({ emit: (type) => emitted.push(type) }, env);
    const saved = [...env.document.entries.get('visibilitychange')]; release(); saved[0]();
    assert.deepEqual(emitted, []);
  });
});

describe('shared Phaser startup ownership adapter (#165)', () => {
  it('preserves the engine prototype and config, using DOM-owned focus', () => {
    const { Engine } = engineFixture(); const baseStart = Engine.Game.prototype.start; const config = { width: 640, autoFocus: true };
    const game = createWorldGame(Engine, config, environment());
    assert.ok(game instanceof Engine.Game); assert.equal(Engine.Game.prototype.start, baseStart);
    assert.equal(config.autoFocus, true); assert.equal(game.config.autoFocus, false); assert.equal(game.config.width, 640);
    game.destroy(true);
  });
  it('runs postBoot once before a bound rendered step and forwards core event context', () => {
    const env = environment(); const { Engine, calls } = engineFixture();
    const game = createWorldGame(Engine, { callbacks: { postBoot: (instance) => { assert.equal(instance.isRunning, true); calls.push('postBoot'); } } }, env);
    game.begin(); game.begin(); game.tick(); env.document.hidden = true; env.document.dispatchEvent(new globalThis.Event('visibilitychange'));
    env.document.hidden = false; env.document.dispatchEvent(new globalThis.Event('visibilitychange'));
    env.window.dispatchEvent(new globalThis.Event('blur')); env.window.dispatchEvent(new globalThis.Event('focus'));
    assert.deepEqual(calls.slice(0, 2), ['postBoot', 'loop.start']);
    assert.deepEqual(calls.slice(2).map(([type, context]) => [type, context === game]), [['step', true], ['hidden', true], ['visible', true], ['blur', true], ['focus', true]]);
    game.destroy(true);
  });
  it('uses the inherited headless step when the engine has no renderer', () => {
    const { Engine, calls } = engineFixture({ headless: true }); const game = createWorldGame(Engine, {}, environment());
    game.begin(); game.tick(); assert.deepEqual(calls[1], ['headless', game]); game.destroy(true);
  });
  it('releases browser and core handlers at destroy request, before a delayed frame', () => {
    const env = environment(); const { Engine, calls } = engineFixture(); const game = createWorldGame(Engine, {}, env);
    let external = 0; game.events.on('focus', () => { external++; }); game.begin();
    assert.deepEqual(counts(env), [1, 1, 1]); game.destroy(true, false);
    assert.equal(game.destroyed, false); assert.deepEqual(counts(env), [0, 0, 0]);
    assert.equal(game.events.count('hidden'), 0); assert.equal(game.events.count('destroy'), 0);
    game.events.emit('focus'); assert.equal(external, 1);
    env.window.dispatchEvent(new globalThis.Event('focus')); assert.equal(calls.filter((entry) => Array.isArray(entry) && entry[0] === 'focus').length, 0);
    game.tick(); assert.equal(game.destroyed, true);
  });
  it('also releases on actual destroy events from the inherited engine', () => {
    const env = environment(); const { Engine } = engineFixture(); const game = createWorldGame(Engine, {}, env);
    game.begin(); game.events.emit('destroy'); game.events.emit('destroy'); assert.deepEqual(counts(env), [0, 0, 0]);
  });
  it('leaves other owners and window properties untouched during destruction', () => {
    const env = environment(); const original = [env.window.onblur, env.window.onfocus]; const outside = () => {};
    env.window.addEventListener('focus', outside); const { Engine } = engineFixture(); const game = createWorldGame(Engine, {}, env);
    game.begin(); game.destroy(true); assert.deepEqual(counts(env), [0, 0, 1]);
    assert.deepEqual([env.window.onblur, env.window.onfocus], original);
  });
  it('does not install browser handlers when cancelled before asynchronous startup', () => {
    const env = environment(); const { Engine, calls } = engineFixture(); const game = createWorldGame(Engine, {}, env);
    destroyWorldGame(game); assert.equal(game.isRunning, false); assert.ok(!calls.includes('loop.wake'));
    game.begin(); assert.deepEqual(counts(env), [0, 0, 0]); game.tick(); assert.equal(game.destroyed, true);
  });
  it('does not wake an unstarted loop when postBoot calls the disposal helper', () => {
    const env = environment(); const { Engine, calls } = engineFixture();
    const game = createWorldGame(Engine, { callbacks: { postBoot: destroyWorldGame } }, env);
    game.begin(); assert.ok(!calls.includes('loop.wake')); assert.deepEqual(counts(env), [0, 0, 0]);
    game.tick(); assert.equal(game.destroyed, true);
  });
  it('does not install browser handlers when postBoot requests cancellation', () => {
    const env = environment(); const { Engine } = engineFixture();
    const game = createWorldGame(Engine, { callbacks: { postBoot: (instance) => instance.destroy(true) } }, env);
    game.begin(); assert.deepEqual(counts(env), [0, 0, 0]); game.tick(); assert.equal(game.destroyed, true);
  });
  it('retains cleanup when base construction boots synchronously', () => {
    const env = environment(); const { Engine } = engineFixture({ synchronousBoot: true });
    const game = createWorldGame(Engine, {}, env); assert.deepEqual(counts(env), [1, 1, 1]);
    game.destroy(true); assert.deepEqual(counts(env), [0, 0, 0]);
  });
  it('does not reinstall handlers after destruction during a synchronous first step', () => {
    const env = environment(); const { Engine } = engineFixture({ synchronousBoot: true, synchronousStep: true });
    const game = createWorldGame(Engine, { callbacks: { postBoot: (instance) => instance.destroy(true) } }, env);
    assert.equal(game.destroyed, true); assert.deepEqual(counts(env), [0, 0, 0]);
  });
  it('rolls back all handlers if the frame scheduler cannot start', () => {
    const env = environment(); const { Engine } = engineFixture({ failStart: true }); const game = createWorldGame(Engine, {}, env);
    assert.throws(() => game.begin(), /scheduler unavailable/); assert.deepEqual(counts(env), [0, 0, 0]);
    assert.equal(game.events.count('hidden'), 0); assert.equal(game.events.count('destroy'), 0);
  });
  it('does not attach handlers before a failed postBoot callback', () => {
    const env = environment(); const { Engine } = engineFixture();
    const game = createWorldGame(Engine, { callbacks: { postBoot: () => { throw new Error('boot failed'); } } }, env);
    assert.throws(() => game.begin(), /boot failed/); assert.deepEqual(counts(env), [0, 0, 0]);
  });
  it('requests inherited destruction once with the caller arguments', () => {
    const { Engine, calls } = engineFixture(); const game = createWorldGame(Engine, {}, environment());
    game.begin(); game.destroy(false, true); game.destroy(true, false);
    assert.deepEqual(calls.filter((entry) => Array.isArray(entry) && entry[0] === 'destroy'), [['destroy', false, true]]);
  });
  it('works with the existing sleeping-game disposal helper', () => {
    const env = environment(); const { Engine, calls } = engineFixture(); const game = createWorldGame(Engine, {}, env);
    game.begin(); game.loop.running = false; destroyWorldGame(game); destroyWorldGame(game);
    assert.equal(game.destroyed, true); assert.deepEqual(counts(env), [0, 0, 0]);
    assert.equal(calls.filter((entry) => entry === 'loop.wake').length, 1);
  });
  it('keeps five complete Game lifetimes at the listener baseline', () => {
    const env = environment(); const { Engine } = engineFixture();
    for (let cycle = 0; cycle < 5; cycle++) {
      const game = createWorldGame(Engine, {}, env); game.begin(); assert.deepEqual(counts(env), [1, 1, 1]);
      game.loop.running = false; destroyWorldGame(game); assert.equal(game.destroyed, true);
      assert.deepEqual(counts(env), [0, 0, 0]); assert.equal(game.events.entries.length, 0);
    }
  });
});
