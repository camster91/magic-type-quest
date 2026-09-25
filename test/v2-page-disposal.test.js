import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { bindPageDisposal } from '../src/v2/app/bindPageDisposal.ts';

class Page extends globalThis.EventTarget {
  handlers = new Set();
  added = [];
  addEventListener(type, handler, options) {
    super.addEventListener(type, handler, options);
    this.added.push(type);
    if (type === 'pagehide') this.handlers.add(handler);
  }
  removeEventListener(type, handler, options) {
    super.removeEventListener(type, handler, options);
    if (type === 'pagehide') this.handlers.delete(handler);
  }
  transition(type, persisted) {
    const event = new globalThis.Event(type);
    if (persisted !== undefined) Object.defineProperty(event, 'persisted', { value: persisted });
    this.dispatchEvent(event);
  }
}

describe('history-cache-safe page disposal (#165)', () => {
  it('retains the same shell when the browser intends to cache the page', () => {
    const page = new Page(); let disposals = 0;
    const dispose = bindPageDisposal(() => { disposals++; }, page);
    page.transition('pagehide', true); page.transition('pageshow', true);
    assert.equal(disposals, 0); assert.equal(page.handlers.size, 1); dispose();
  });
  it('does not register unload, beforeunload or a duplicate-mount return handler', () => {
    const page = new Page(); const dispose = bindPageDisposal(() => {}, page);
    assert.deepEqual(page.added, ['pagehide']); dispose();
  });
  it('keeps five cached departures bounded and preserves the final-exit hook', () => {
    const page = new Page(); let disposals = 0;
    bindPageDisposal(() => { disposals++; }, page);
    for (let visit = 0; visit < 5; visit++) {
      page.transition('pagehide', true); page.transition('pageshow', true);
      assert.equal(disposals, 0); assert.equal(page.handlers.size, 1);
    }
    page.transition('pagehide', false);
    assert.equal(disposals, 1); assert.equal(page.handlers.size, 0);
  });
  it('disposes on a non-cached exit, detaching its listener first', () => {
    const page = new Page(); let remaining = -1;
    bindPageDisposal(() => { remaining = page.handlers.size; }, page);
    page.transition('pagehide', false); assert.equal(remaining, 0);
  });
  it('retains ordinary Event-based cleanup used by source-mode browser fixtures', () => {
    const page = new Page(); let disposals = 0;
    bindPageDisposal(() => { disposals++; }, page);
    page.transition('pagehide'); assert.equal(disposals, 1);
  });
  it('allows explicit disposal while cached and remains idempotent', () => {
    const page = new Page(); let disposals = 0;
    const dispose = bindPageDisposal(() => { disposals++; }, page);
    page.transition('pagehide', true); dispose(); dispose(); page.transition('pagehide', false);
    assert.equal(disposals, 1); assert.equal(page.handlers.size, 0);
  });
  it('does not replay cleanup through a previously queued callback', () => {
    const page = new Page(); let disposals = 0;
    const dispose = bindPageDisposal(() => { disposals++; }, page);
    const callback = [...page.handlers][0]; dispose(); callback(new globalThis.Event('pagehide'));
    assert.equal(disposals, 1);
  });
  it('preserves unrelated handlers and browser property slots', () => {
    const page = new Page(); let external = 0; const handler = () => { external++; };
    page.addEventListener('pagehide', handler); page.onpagehide = handler;
    const dispose = bindPageDisposal(() => {}, page); dispose();
    page.transition('pagehide', false);
    assert.equal(external, 1); assert.equal(page.handlers.size, 1); assert.equal(page.onpagehide, handler);
  });
  it('removes ownership even if the shell disposer throws', () => {
    const page = new Page(); let attempts = 0;
    const dispose = bindPageDisposal(() => { attempts++; throw new Error('cleanup failed'); }, page);
    assert.throws(dispose, /cleanup failed/); assert.doesNotThrow(dispose);
    assert.equal(page.handlers.size, 0); assert.equal(attempts, 1);
  });
  it('does not treat a malformed truthy value as a persisted cache decision', () => {
    const page = new Page(); let disposals = 0;
    bindPageDisposal(() => { disposals++; }, page);
    page.transition('pagehide', 'true'); assert.equal(disposals, 1);
  });
  it('keeps separate document owners independent', () => {
    const a = new Page(); const b = new Page(); const counts = [0, 0];
    bindPageDisposal(() => { counts[0]++; }, a); bindPageDisposal(() => { counts[1]++; }, b);
    a.transition('pagehide', false); b.transition('pagehide', true);
    assert.deepEqual(counts, [1, 0]); b.transition('pagehide', false); assert.deepEqual(counts, [1, 1]);
  });
  it('does not perform disposal for unrelated history or visibility events', () => {
    const page = new Page(); let disposals = 0;
    const dispose = bindPageDisposal(() => { disposals++; }, page);
    for (const type of ['pageshow', 'popstate', 'visibilitychange', 'hashchange']) page.transition(type, false);
    assert.equal(disposals, 0); dispose(); assert.equal(disposals, 1);
  });
});
