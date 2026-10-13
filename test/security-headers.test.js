import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const nginx = readFileSync(resolve(root, 'deploy/nginx.conf'), 'utf8');
const pages = ['index.html', 'landing.html', 'parents.html', 'teacher.html'];

function headerCsp() {
  return nginx.match(/add_header Content-Security-Policy "([^"]+)" always;/)?.[1];
}

function metaCsp(page) {
  const html = readFileSync(resolve(root, page), 'utf8');
  return html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)?.[1];
}

describe('security headers', () => {
  it('sends the security headers on every nginx response', () => {
    expect(nginx).toContain('add_header_inherit merge;');
    for (const header of ['X-Frame-Options "DENY"', 'X-Content-Type-Options "nosniff"', 'Referrer-Policy', 'Permissions-Policy', 'Strict-Transport-Security']) {
      expect(nginx).toMatch(new RegExp(`add_header ${header}[^;]* always;`));
    }
    expect(headerCsp()).toMatch(/frame-ancestors 'none'$/);
    expect(headerCsp()).toContain("object-src 'none'");
  });

  it('gives every page the same CSP as the header, minus header-only directives', () => {
    const expected = headerCsp().replace(/; frame-ancestors 'none'$/, '');
    for (const page of pages) expect(metaCsp(page), page).toBe(expected);
  });

  it('keeps the CSP local-only', () => {
    expect(headerCsp()).not.toMatch(/https?:|\*/);
  });
});
