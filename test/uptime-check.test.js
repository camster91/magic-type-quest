import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_SITE_URL,
  PAGES,
  normalizeBaseUrl,
  problemWith,
  runChecks,
} from '../scripts/uptime-check.mjs';

const SOURCE = {
  '': 'index.html',
  'teacher.html': 'teacher.html',
  'parents.html': 'parents.html',
  'landing.html': 'landing.html',
  'manifest.json': 'public/manifest.json',
};

function fakeFetch(routes) {
  return async (url) => {
    const hit = routes[url];
    if (hit instanceof Error) throw hit;
    const { status = 200, body = '' } = hit || { status: 404 };
    return { status, text: async () => body };
  };
}

describe('uptime check', () => {
  it('normalizes the base URL so relative pages resolve under it', () => {
    expect(normalizeBaseUrl('https://example.org/magic-type-quest')).toBe('https://example.org/magic-type-quest/');
    expect(normalizeBaseUrl('')).toBe(DEFAULT_SITE_URL);
    expect(() => normalizeBaseUrl('ftp://example.org/')).toThrow();
  });

  it('uses markers that really are in the shipped pages', () => {
    for (const page of PAGES) {
      const body = readFileSync(new URL(`../${SOURCE[page.path]}`, import.meta.url), 'utf8');
      expect(problemWith(page, 200, body), page.name).toBeNull();
    }
  });

  it('fails on a non-200, a missing marker, bad JSON or a network error', async () => {
    const base = 'https://example.org/app/';
    const ok = Object.fromEntries(
      PAGES.map((p) => [new URL(p.path, base).href, { body: p.json ? `{${p.marker}: "./"}` : `<p>${p.marker}</p>` }]),
    );
    const allGood = await runChecks({ siteUrl: base, fetchImpl: fakeFetch(ok), retries: 0 });
    expect(allGood.every((r) => r.ok)).toBe(true);

    const broken = {
      ...ok,
      [`${base}teacher.html`]: { status: 503, body: 'Teacher Dashboard' },
      [`${base}parents.html`]: { body: '<h1>Welcome to nginx</h1>' },
      [`${base}manifest.json`]: { body: '"start_url" <html>' },
      [`${base}landing.html`]: new Error('ECONNRESET'),
    };
    const results = await runChecks({
      siteUrl: base,
      healthUrl: 'https://example.org/healthz',
      fetchImpl: fakeFetch(broken),
      retries: 0,
    });
    const byName = Object.fromEntries(results.map((r) => [r.name, r]));
    expect(byName['game (home)'].ok).toBe(true);
    expect(byName.teacher.problem).toBe('HTTP 503');
    expect(byName.parents.problem).toMatch(/missing marker/);
    expect(byName.manifest.problem).toBe('not valid JSON');
    expect(byName.landing.problem).toMatch(/network error/);
    expect(byName.health.problem).toBe('HTTP 404');
  });
});
