// Uptime check for the live BloomType site. Used by .github/workflows/uptime.yml.
//
//   SITE_URL=https://bloomtype.ashbi.ca/magic-type-quest/ node scripts/uptime-check.mjs
//
// Each page must answer HTTP 200 and contain its marker text, so an error page
// or an empty response that still says 200 is caught too. Optional:
// HEALTH_URL (a plain 200 check, e.g. the container's /healthz; "none" skips).
// Exit code 1 if anything fails. See docs/ops/INCIDENT-RUNBOOK.md.
import { pathToFileURL } from 'node:url';

export const DEFAULT_SITE_URL = 'https://bloomtype.ashbi.ca/magic-type-quest/';

export const PAGES = [
  { path: '', marker: 'id="menu-screen"', name: 'game (home)' },
  { path: 'teacher.html', marker: 'Teacher Dashboard', name: 'teacher' },
  { path: 'parents.html', marker: 'Help Your Child Learn to Type', name: 'parents' },
  { path: 'landing.html', marker: 'Typing That Grows With Your Class', name: 'landing' },
  { path: 'manifest.json', marker: '"start_url"', name: 'manifest', json: true },
];

export function normalizeBaseUrl(raw) {
  const url = new URL(String(raw || DEFAULT_SITE_URL).trim());
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`SITE_URL must be http(s): ${raw}`);
  }
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  url.search = '';
  url.hash = '';
  return url.href;
}

async function fetchText(fetchImpl, url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'cache-control': 'no-cache', 'user-agent': 'bloomtype-uptime-check' },
    });
    return { status: res.status, body: await res.text() };
  } finally {
    clearTimeout(timer);
  }
}

// Returns null when the response is healthy, or a short reason when not.
export function problemWith(page, status, body) {
  if (status !== 200) return `HTTP ${status}`;
  if (page.marker && !body.includes(page.marker)) return `missing marker ${JSON.stringify(page.marker)}`;
  if (page.json) {
    try {
      JSON.parse(body);
    } catch {
      return 'not valid JSON';
    }
  }
  return null;
}

export async function checkOne(fetchImpl, page, url, { timeoutMs = 15000, retries = 1, retryDelayMs = 10000 } = {}) {
  let problem = 'not checked';
  let ms = 0;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0 && retryDelayMs > 0) await new Promise((r) => setTimeout(r, retryDelayMs));
    const started = Date.now();
    try {
      const { status, body } = await fetchText(fetchImpl, url, timeoutMs);
      problem = problemWith(page, status, body);
    } catch (err) {
      problem = err && err.name === 'AbortError' ? `timed out after ${timeoutMs} ms` : `network error: ${err && err.message}`;
    }
    ms = Date.now() - started;
    if (!problem) break;
  }
  return { name: page.name, url, ok: !problem, problem, ms };
}

export async function runChecks({ siteUrl, healthUrl, fetchImpl = fetch, ...opts } = {}) {
  const base = normalizeBaseUrl(siteUrl);
  const jobs = PAGES.map((page) => checkOne(fetchImpl, page, new URL(page.path, base).href, opts));
  if (healthUrl && healthUrl !== 'none') {
    jobs.push(checkOne(fetchImpl, { name: 'health', marker: '' }, healthUrl, opts));
  }
  return Promise.all(jobs);
}

async function main() {
  const results = await runChecks({ siteUrl: process.env.SITE_URL, healthUrl: process.env.HEALTH_URL });
  for (const r of results) {
    console.log(`${r.ok ? 'OK  ' : 'FAIL'}  ${r.name.padEnd(12)} ${String(r.ms).padStart(5)} ms  ${r.url}${r.ok ? '' : `  -> ${r.problem}`}`);
  }
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.log(`\n${failed.length} check(s) failed. Follow docs/ops/INCIDENT-RUNBOOK.md ("Site down").`);
    process.exitCode = 1;
  } else {
    console.log(`\nAll ${results.length} checks passed.`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
