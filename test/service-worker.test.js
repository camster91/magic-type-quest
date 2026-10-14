import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { injectLocaleChunks, localeChunkFiles } from '../scripts/sw-locale-chunks.mjs';

const source = readFileSync(resolve(import.meta.dirname, '../public/sw.js'), 'utf8');
const ORIGIN = 'https://bloomtype.test';
const BASE = `${ORIGIN}/magic-type-quest/`;

class FakeResponse {
  constructor(body, { status = 200, type = 'basic' } = {}) {
    this.body = body;
    this.status = status;
    this.type = type;
  }
  clone() { return new FakeResponse(this.body, { status: this.status, type: this.type }); }
  static error() { return new FakeResponse(null, { status: 0, type: 'error' }); }
}

/** Load sw.js into a fake worker scope with an in-memory cache and network. */
function loadWorker({ network, fetchLog = [], swSource = source }) {
  const store = new Map();
  const precached = [];
  const cache = {
    put: async (request, response) => { store.set(request.url ?? new URL(request, BASE).href, response); },
    keys: async () => [...store.keys()].map((url) => ({ url })),
    delete: async (request) => store.delete(request.url),
    addAll: async (urls) => { precached.push(...urls); },
  };
  const caches = {
    open: async () => cache,
    keys: async () => [],
    delete: async () => true,
    match: async (request, options = {}) => {
      let url = typeof request === 'string' ? new URL(request, BASE).href : request.url;
      if (options.ignoreSearch) url = url.split('?')[0];
      return store.get(url);
    },
  };
  const listeners = {};
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type, handler) => { listeners[type] = handler; },
    skipWaiting() {},
    clients: { claim() {} },
  };
  const fetch = async (request, init) => {
    fetchLog.push({ url: request.url, mode: request.mode, cache: init?.cache });
    return network(request.url);
  };
  new Function('self', 'caches', 'fetch', 'Response', swSource)(self, caches, fetch, FakeResponse);

  const waitLog = [];
  async function request(url, { mode = 'no-cors' } = {}) {
    let responded;
    const waits = [];
    waitLog.push(waits);
    listeners.fetch({
      request: { url, mode, method: 'GET' },
      respondWith: (promise) => { responded = promise; },
      waitUntil: (promise) => waits.push(promise),
    });
    if (!responded) return 'not handled';
    const response = await responded;
    await Promise.all(waits);
    await new Promise((done) => setTimeout(done, 0));
    return response;
  }
  async function install() {
    const waits = [];
    listeners.install({ waitUntil: (promise) => waits.push(promise) });
    await Promise.all(waits);
  }
  return { store, request, waitLog, install, precached };
}

describe('service worker caching', () => {
  let served;
  let online;
  const network = async (url) => {
    if (!online) throw new TypeError('offline');
    return new FakeResponse(served[url] ?? 'missing', { status: served[url] ? 200 : 404 });
  };

  beforeEach(() => {
    online = true;
    served = {
      [`${BASE}`]: 'release 1',
      [`${BASE}index.html`]: 'release 1',
      [`${BASE}assets/main-AbCdEf12.js`]: 'bundle 1',
      [`${BASE}assets/pets/fox.png`]: 'art 1',
    };
  });

  it('serves a new release of the page instead of the cached old one', async () => {
    const worker = loadWorker({ network });
    expect((await worker.request(BASE, { mode: 'navigate' })).body).toBe('release 1');
    served[BASE] = 'release 2';
    expect((await worker.request(BASE, { mode: 'navigate' })).body).toBe('release 2');
  });

  it('keeps the worker alive until a fetched page is saved for offline use', async () => {
    const worker = loadWorker({ network });
    await worker.request(BASE, { mode: 'navigate' });
    // The cache write is handed to waitUntil, so the browser cannot stop the
    // worker before the page is stored.
    expect(worker.waitLog.at(-1).length).toBeGreaterThanOrEqual(1);
  });

  it('falls back to the cached page and app shell when offline', async () => {
    const worker = loadWorker({ network });
    await worker.request(BASE, { mode: 'navigate' });
    await worker.request(`${BASE}index.html`);
    online = false;
    expect((await worker.request(BASE, { mode: 'navigate' })).body).toBe('release 1');
    expect((await worker.request(`${BASE}garden?x=1`, { mode: 'navigate' })).body).toBe('release 1');
  });

  it('asks the server about art instead of trusting the browser HTTP cache', async () => {
    // After a release the HTTP cache can still hold old pictures for an hour;
    // copying those into the new cache would keep the old art.
    const fetchLog = [];
    const worker = loadWorker({ network, fetchLog });
    await worker.request(`${BASE}assets/pets/fox.png`);
    await worker.request(BASE, { mode: 'navigate' });
    expect(fetchLog.find((f) => f.url.endsWith('fox.png')).cache).toBe('no-cache');
    // Navigations can't take request options; they are network-first anyway.
    expect(fetchLog.find((f) => f.mode === 'navigate').cache).toBeUndefined();
  });

  it('keeps fingerprinted bundles cache-first', async () => {
    const worker = loadWorker({ network });
    await worker.request(`${BASE}assets/main-AbCdEf12.js`);
    served[`${BASE}assets/main-AbCdEf12.js`] = 'changed';
    expect((await worker.request(`${BASE}assets/main-AbCdEf12.js`)).body).toBe('bundle 1');
  });

  it('serves art from cache and refreshes it in the background', async () => {
    const worker = loadWorker({ network });
    await worker.request(`${BASE}assets/pets/fox.png`);
    served[`${BASE}assets/pets/fox.png`] = 'art 2';
    expect((await worker.request(`${BASE}assets/pets/fox.png`)).body).toBe('art 1');
    expect((await worker.request(`${BASE}assets/pets/fox.png`)).body).toBe('art 2');
  });

  it('does not cache failed responses and leaves other origins alone', async () => {
    const worker = loadWorker({ network });
    await worker.request(`${BASE}assets/nope.png`);
    expect(worker.store.has(`${BASE}assets/nope.png`)).toBe(false);
    expect(await worker.request('https://example.com/x.js')).toBe('not handled');
  });

  it('leaves the landing-page videos to the network, never precached or cached', async () => {
    const worker = loadWorker({ network });
    served[`${BASE}media/meadow-trailer.mp4`] = 'video';
    expect(await worker.request(`${BASE}media/meadow-trailer.mp4`)).toBe('not handled');
    expect(worker.store.has(`${BASE}media/meadow-trailer.mp4`)).toBe(false);
    expect(source.match(/PRECACHE_ASSETS = \[[\s\S]*?\]/)[0]).not.toContain('media/');
  });
});

describe('offline language switching', () => {
  const bundle = {
    'assets/main-AbCdEf12.js': { type: 'chunk', fileName: 'assets/main-AbCdEf12.js', facadeModuleId: '/app/src/main.js', imports: [] },
    'assets/fr-Fr123456.js': { type: 'chunk', fileName: 'assets/fr-Fr123456.js', facadeModuleId: '/app/src/lang/fr.js', imports: [] },
    'assets/es-Es123456.js': { type: 'chunk', fileName: 'assets/es-Es123456.js', facadeModuleId: '/app/src/lang/es.js', imports: ['assets/shared-Sh123456.js'] },
    'assets/shared-Sh123456.js': { type: 'chunk', fileName: 'assets/shared-Sh123456.js', facadeModuleId: null, imports: [] },
    'assets/main-AbCdEf12.css': { type: 'asset', fileName: 'assets/main-AbCdEf12.css' },
  };

  it('finds the French and Spanish chunks (and what they import) in the build', () => {
    expect(localeChunkFiles(bundle)).toEqual(['assets/es-Es123456.js', 'assets/fr-Fr123456.js', 'assets/shared-Sh123456.js']);
  });

  it('precaches the language chunks when the worker installs', async () => {
    const built = injectLocaleChunks(source, localeChunkFiles(bundle));
    const worker = loadWorker({ network: async () => new FakeResponse('x'), swSource: built });
    await worker.install();
    expect(worker.precached).toEqual(expect.arrayContaining(['index.html', 'assets/fr-Fr123456.js', 'assets/es-Es123456.js']));
  });

  it('refuses a build without the list to fill or without language chunks', () => {
    expect(() => injectLocaleChunks('const X = 1;', ['assets/fr-Fr123456.js'])).toThrow(/not found/);
    expect(() => injectLocaleChunks(source, [])).toThrow(/no locale chunks/);
  });
});
