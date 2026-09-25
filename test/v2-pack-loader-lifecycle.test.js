import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { PackLoader } from '../src/v2/assets/PackLoader.ts';
import { ASSET_MANIFEST } from '../src/v2/assets/manifest.ts';

// Synthetic packs exercise the shared engine; these are not later-biome content.
const PACK_A = 'fixture.pack-a';
const PACK_B = 'fixture.pack-b';
const asset = (id, phase = 'mission', packId = PACK_A) => ({
  ...ASSET_MANIFEST[0], id, status: 'implemented', preloadGroup: phase,
  biomePackId: phase === 'shell' ? null : packId,
  sourcePath: `assets-v2/sources/${id}.png`,
  provenance: { origin: 'manual', referenceId: 'test-fixture', licence: 'owned', editHistory: [], approval: 'approved' },
  outputs: [{ path: `public/assets/v2/${id}.webp`, format: 'webp', width: 720, height: 400, maxViewportWidth: null }],
});
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}
function harness(entries, fetchResource = async () => new globalThis.Response('art')) {
  const calls = []; const created = []; const revoked = [];
  const loader = new PackLoader(entries, async (url, options) => {
    calls.push({ url, signal: options.signal });
    return fetchResource(url, options, calls.length);
  }, () => { const url = `blob:fixture-${created.length + 1}`; created.push(url); return url; }, (url) => revoked.push(url));
  return { loader, calls, created, revoked };
}
const load = (loader, pack = PACK_A, onProgress = () => {}, dataReady = () => true) => loader.load(pack, 360, 2, onProgress, dataReady);

describe('pack ownership and async cleanup (#165)', () => {
  it('coalesces simultaneous required fetches and revokes the single Blob URL', async () => {
    const gate = deferred(); const started = deferred();
    const state = harness([asset('required')], async () => { started.resolve(); await gate.promise; return new globalThis.Response('art'); });
    const first = load(state.loader); const second = load(state.loader);
    await started.promise; gate.resolve();
    const results = await Promise.all([first, second]);
    state.loader.dispose();
    assert.equal(state.calls.length, 1);
    assert.equal(state.created.length, 1);
    assert.equal(results[0].resources.get('required').url, results[1].resources.get('required').url);
    assert.deepEqual(state.revoked, state.created);
  });

  it('coalesces simultaneous optional fetches after required readiness', async () => {
    const gate = deferred(); const started = deferred();
    const state = harness([asset('decoration', 'optional')], async () => { started.resolve(); await gate.promise; return new globalThis.Response('art'); });
    await load(state.loader);
    const first = state.loader.loadOptional(PACK_A, 360, 2);
    const second = state.loader.loadOptional(PACK_A, 360, 2);
    await started.promise; gate.resolve();
    assert.deepEqual(await Promise.all([first, second]), [true, true]);
    state.loader.dispose();
    assert.equal(state.calls.length, 1);
    assert.equal(state.created.length, 1);
    assert.deepEqual(state.revoked, state.created);
  });

  it('does not start optional requests before required pack readiness', async () => {
    const state = harness([asset('decoration', 'optional')]);
    const result = await state.loader.loadOptional(PACK_A, 360, 2);
    state.loader.dispose();
    assert.equal(result, false);
    assert.equal(state.calls.length, 0);
  });

  it('stops the optional queue when the pack is released', async () => {
    const gate = deferred(); const started = deferred();
    const state = harness([asset('first', 'optional'), asset('second', 'optional')], async (_url, _options, count) => {
      if (count === 1) { started.resolve(); await gate.promise; }
      return new globalThis.Response('art');
    });
    await load(state.loader);
    const pending = state.loader.loadOptional(PACK_A, 360, 2);
    await started.promise; state.loader.release(PACK_A); gate.resolve();
    assert.equal(await pending, false);
    state.loader.dispose();
    assert.equal(state.calls[0].signal.aborted, true);
    assert.equal(state.calls.length, 1);
    assert.equal(state.created.length, 0);
  });

  it('stops the optional queue on disposal even when fetch ignores abort', async () => {
    const gate = deferred(); const started = deferred();
    const state = harness([asset('first', 'optional'), asset('second', 'optional')], async (_url, _options, count) => {
      if (count === 1) { started.resolve(); await gate.promise; }
      return new globalThis.Response('art');
    });
    await load(state.loader);
    const pending = state.loader.loadOptional(PACK_A, 360, 2);
    await started.promise; state.loader.dispose(); gate.resolve();
    assert.equal(await pending, false);
    assert.equal(state.calls.length, 1);
    assert.equal(state.created.length, 0);
    assert.deepEqual(state.loader.loadedPackIds(), []);
  });

  it('does not let a cancelled request release a successful newer retry', async () => {
    const gate = deferred(); const started = deferred();
    const state = harness([asset('required')], async (_url, _options, count) => {
      if (count === 1) { started.resolve(); await gate.promise; }
      return new globalThis.Response('art');
    });
    const oldOutcome = load(state.loader).then(() => 'resolved', () => 'rejected');
    await started.promise; state.loader.release(PACK_A);
    const retry = await load(state.loader);
    gate.resolve();
    assert.equal(await oldOutcome, 'rejected');
    const remaining = state.loader.loadedPackIds(); const revokedBeforeDispose = [...state.revoked];
    state.loader.dispose();
    assert.deepEqual(remaining, [PACK_A]);
    assert.equal(retry.resources.size, 1);
    assert.deepEqual(revokedBeforeDispose, []);
    assert.deepEqual(state.revoked, state.created);
  });

  it('automatically releases the previous biome while keeping shared core', async () => {
    const state = harness([asset('core', 'shell'), asset('a'), asset('b', 'mission', PACK_B)]);
    const first = await load(state.loader);
    const second = await load(state.loader, PACK_B);
    const remaining = state.loader.loadedPackIds(); const revokedBeforeDispose = [...state.revoked];
    state.loader.dispose();
    assert.deepEqual(remaining, ['shell', PACK_B]);
    assert.deepEqual(revokedBeforeDispose, [first.resources.get('a').url]);
    assert.equal(first.resources.get('core').url, second.resources.get('core').url);
    assert.equal(state.calls.length, 3);
    assert.equal(new Set(state.revoked).size, 3);
  });

  it('a late shared-core response cannot restart an abandoned biome', async () => {
    const gate = deferred(); const started = deferred();
    const state = harness([asset('core', 'shell'), asset('a'), asset('b', 'mission', PACK_B)], async (url) => {
      if (url.includes('/core.webp')) { started.resolve(); await gate.promise; }
      return new globalThis.Response('art');
    });
    const abandoned = load(state.loader).then(() => 'resolved', () => 'rejected');
    await started.promise;
    const active = load(state.loader, PACK_B);
    gate.resolve();
    const result = await active; const abandonedResult = await abandoned;
    state.loader.dispose();
    assert.equal(abandonedResult, 'rejected');
    assert.equal(result.resources.has('b'), true);
    assert.equal(result.resources.has('a'), false);
    assert.equal(state.calls.filter(({ url }) => url.includes('/core.webp')).length, 1);
    assert.equal(state.calls.some(({ url }) => url.includes('/a.webp')), false);
  });

  it('honours cancellation from progress callbacks even with zero assets', async () => {
    const state = harness([]);
    const outcome = load(state.loader, PACK_A, () => state.loader.release(PACK_A));
    await assert.rejects(outcome, /cancelled/u);
    state.loader.dispose();
  });

  it('required-data failure makes no request and preserves the current pack', async () => {
    const state = harness([asset('a'), asset('b', 'mission', PACK_B)]);
    await load(state.loader);
    await assert.rejects(load(state.loader, PACK_B, () => {}, () => false), /Required typing content/u);
    const remaining = state.loader.loadedPackIds();
    state.loader.dispose();
    assert.deepEqual(remaining, [PACK_A]);
    assert.equal(state.calls.length, 1);
  });

  it('required failure releases partial biome resources and permits retry with cached core', async () => {
    let fail = true;
    const state = harness([asset('core', 'shell'), asset('scenery', 'currentBiome'), asset('target')], async (url) =>
      new globalThis.Response('art', { status: url.includes('/target.webp') && fail ? 503 : 200 }));
    await assert.rejects(load(state.loader), /HTTP 503/u);
    assert.deepEqual(state.loader.loadedPackIds(), ['shell']);
    assert.deepEqual(state.revoked, [state.created[1]]);
    fail = false;
    const retry = await load(state.loader);
    state.loader.dispose();
    assert.equal(retry.resources.size, 3);
    assert.equal(state.calls.filter(({ url }) => url.includes('/core.webp')).length, 1);
    assert.deepEqual([...state.revoked].sort(), [...state.created].sort());
  });

  it('optional failure preserves required assets and allows safe decorative fallback', async () => {
    const state = harness([asset('target'), asset('unavailable', 'optional'), asset('available', 'optional')], async (url) =>
      new globalThis.Response('art', { status: url.includes('/unavailable.webp') ? 503 : 200 }));
    const required = await load(state.loader);
    assert.equal(await state.loader.loadOptional(PACK_A, 360, 2), false);
    assert.deepEqual(state.loader.loadedPackIds(), [PACK_A]);
    assert.deepEqual(state.revoked, []);
    assert.equal(required.resources.has('target'), true);
    state.loader.dispose();
    assert.equal(state.calls.length, 3);
    assert.equal(state.created.length, 2);
    assert.deepEqual(state.revoked, state.created);
  });

  it('does not create a Blob URL when disposed during response-body decoding', async () => {
    const gate = deferred(); const started = deferred();
    const state = harness([asset('target')], async () => {
      const response = new globalThis.Response('art');
      response.blob = () => { started.resolve(); return gate.promise; };
      return response;
    });
    const outcome = load(state.loader).then(() => 'resolved', () => 'rejected');
    await started.promise; state.loader.dispose(); gate.resolve(new Blob(['art']));
    assert.equal(await outcome, 'rejected');
    assert.equal(state.created.length, 0);
    assert.equal(state.calls[0].signal.aborted, true);
  });

  it('reports actual completed work and skips planned slots', async () => {
    const state = harness([asset('core', 'shell'), asset('scenery', 'currentBiome'), asset('target'), ASSET_MANIFEST[0]]);
    const progress = [];
    const result = await load(state.loader, PACK_A, (entry) => progress.push(entry));
    state.loader.dispose();
    assert.equal(result.resources.size, 3);
    assert.deepEqual(progress.map(({ phase, completed, total, bytesLoaded }) => [phase, completed, total, bytesLoaded]), [
      ['shell', 0, 1, 0], ['shell', 1, 1, 3], ['currentBiome', 0, 1, 0], ['currentBiome', 1, 1, 3], ['mission', 0, 1, 0], ['mission', 1, 1, 3],
    ]);
    assert.equal(state.calls.length, 3);
  });

  it('releasing an inactive pack does not cancel current work; disposal is idempotent', async () => {
    const state = harness([asset('target')]);
    const first = await load(state.loader);
    state.loader.release(PACK_B); state.loader.release('shell');
    const again = await load(state.loader);
    assert.equal(first.resources.get('target').url, again.resources.get('target').url);
    state.loader.dispose(); state.loader.dispose(); state.loader.release(PACK_A);
    await assert.rejects(load(state.loader), /closed/u);
    assert.equal(await state.loader.loadOptional(PACK_A, 360, 2), false);
    assert.equal(state.calls.length, 1);
    assert.deepEqual(state.revoked, state.created);
  });

  it('does not start optional art while required resources are still loading', async () => {
    const gate = deferred(); const started = deferred();
    const state = harness([asset('target'), asset('decoration', 'optional')], async (url) => {
      if (url.includes('/target.webp')) { started.resolve(); await gate.promise; }
      return new globalThis.Response('art');
    });
    const required = load(state.loader);
    await started.promise;
    const premature = await state.loader.loadOptional(PACK_A, 360, 2);
    gate.resolve(); await required;
    state.loader.dispose();
    assert.equal(premature, false);
    assert.equal(state.calls.length, 1);
  });

  it('an old finalizer cannot erase a newer in-flight request with the same id', async () => {
    const oldGate = deferred(); const newGate = deferred();
    const oldStarted = deferred(); const newStarted = deferred();
    const state = harness([asset('target')], async (_url, _options, count) => {
      if (count === 1) { oldStarted.resolve(); await oldGate.promise; }
      else { newStarted.resolve(); await newGate.promise; }
      return new globalThis.Response('art');
    });
    const old = load(state.loader).then(() => 'resolved', () => 'rejected');
    await oldStarted.promise; state.loader.release(PACK_A);
    const retry = load(state.loader);
    // Collect every result before assertions so failed implementations leave no unhandled promises.
    const retryOutcome = retry.then((value) => ({ value }), (error) => ({ error }));
    await newStarted.promise; oldGate.resolve(); await old;
    const joined = load(state.loader).then((value) => ({ value }), (error) => ({ error }));
    newGate.resolve();
    const results = await Promise.all([retryOutcome, joined]);
    state.loader.dispose();
    assert.equal(state.calls.length, 2);
    assert.equal(results.every((result) => result.value?.resources.has('target')), true);
    assert.equal(state.created.length, 1);
    assert.deepEqual(state.revoked, state.created);
  });

  it('keeps Blob ownership bounded across five load/release cycles', async () => {
    const state = harness([asset('core', 'shell'), asset('target'), asset('decoration', 'optional')]);
    const counts = [];
    for (let visit = 0; visit < 5; visit++) {
      await Promise.all([load(state.loader), load(state.loader)]);
      await Promise.all([state.loader.loadOptional(PACK_A, 360, 2), state.loader.loadOptional(PACK_A, 360, 2)]);
      state.loader.release(PACK_A);
      counts.push({ packs: state.loader.loadedPackIds(), liveURLs: state.created.length - state.revoked.length });
    }
    state.loader.dispose();
    assert.deepEqual(counts, Array.from({ length: 5 }, () => ({ packs: ['shell'], liveURLs: 1 })));
    assert.equal(state.calls.length, 11);
    assert.equal(state.created.length, 11);
    assert.equal(new Set(state.revoked).size, 11);
  });

  it('rejects the reserved shared-core id without changing the active biome', async () => {
    const state = harness([asset('target')]);
    await load(state.loader);
    const rejected = load(state.loader, 'shell').then(() => false, () => true);
    assert.equal(await rejected, true);
    assert.deepEqual(state.loader.loadedPackIds(), [PACK_A]);
    state.loader.dispose();
    assert.equal(state.calls.length, 1);
  });

});
