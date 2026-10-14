// BloomType service worker — offline play without trapping old releases.
//
// Pages and update metadata are network-first, so a deployed fix reaches
// installed apps on their next load, with the cached copy as the offline
// fallback. Vite's fingerprinted JS/CSS never change, so they are cache-first.
// Other same-origin files (art, icons) are served from cache and refreshed in
// the background.
const CACHE_NAME = "bloomtype-v21";
const MAX_CACHE_ENTRIES = 200;
const NETWORK_TIMEOUT_MS = 4000;
const PRECACHE_ASSETS = [
  "./",
  "index.html",
  "parents.html",
  "teacher.html",
  "printables/home-row-poster.html",
  "printables/certificate.html",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "manifest.json",
];
// French and Spanish load only when a player picks them (src/i18n.js), so
// the page never fetches them while online for an English player. Cache
// them here so an installed app can still switch language offline. The
// build fills this in with the fingerprinted chunk names
// (scripts/sw-locale-chunks.mjs); it stays empty in dev.
const LOCALE_CHUNKS = [];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // precache what we can; ignore missing files gracefully
      Promise.all([
        cache.addAll(PRECACHE_ASSETS).catch(() => {}),
        cache.addAll(LOCALE_CHUNKS).catch(() => {}),
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

function isCacheable(response) {
  return response && response.status === 200 && response.type === "basic";
}

async function store(request, response) {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
  // Keep the cache bounded: drop the oldest entries first.
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - MAX_CACHE_ENTRIES))) {
    await cache.delete(key);
  }
}

// The cache write is handed to event.waitUntil so the worker is not shut
// down before the response is saved for offline use.
function fetchAndStore(request, event) {
  return fetch(request).then((response) => {
    if (isCacheable(response)) {
      const saving = store(request, response.clone()).catch(() => {});
      event?.waitUntil?.(saving);
    }
    return response;
  });
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("network timeout")), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); }
    );
  });
}

async function networkFirst(request, event) {
  try {
    return await withTimeout(fetchAndStore(request, event), NETWORK_TIMEOUT_MS);
  } catch {
    const cached = await caches.match(request, { ignoreSearch: request.mode === "navigate" });
    if (cached) return cached;
    if (request.mode === "navigate") {
      const shell = await caches.match("index.html");
      if (shell) return shell;
    }
    return Response.error();
  }
}

// Fingerprinted files never change, so a cached copy fits any request for
// them. ignoreVary matters for the precached language chunks: they were
// stored by a plain request, while import() sends an Origin header, and a
// server that answers with "Vary: Origin" would otherwise never match.
async function cacheFirst(request, event) {
  const cached = await caches.match(request, { ignoreVary: true });
  return cached || fetchAndStore(request, event);
}

async function staleWhileRevalidate(request, event) {
  const cached = await caches.match(request);
  const refresh = fetchAndStore(request, event).catch(() => cached || Response.error());
  if (cached) {
    event.waitUntil(refresh);
    return cached;
  }
  return refresh;
}

function strategyFor(request) {
  const url = new URL(request.url);
  if (request.mode === "navigate" || /\.html$|\/manifest\.json$|\/$/.test(url.pathname)) {
    return networkFirst;
  }
  if (/\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(js|css)$/.test(url.pathname)) return cacheFirst;
  return staleWhileRevalidate;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(strategyFor(request)(request, event));
});
