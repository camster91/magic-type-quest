import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

function policy() {
  const html = readFileSync('v2/index.html', 'utf8');
  const match = /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"\s*\/>/u.exec(html);
  assert.ok(match, 'v2 document must retain its CSP');
  return new Map(match[1].split(';').map((part) => part.trim().split(/\s+/u)).filter(([name]) => name).map(([name, ...sources]) => [name, sources]));
}

describe('v2 local Blob policy (#165)', () => {
  it('allows owned Blob images without allowing remote image hosts', () => {
    assert.deepEqual(policy().get('img-src'), ["'self'", 'data:', 'blob:']);
  });
  it('allows Phaser to read owned Blob resources without opening external connections', () => {
    assert.deepEqual(policy().get('connect-src'), ["'self'", 'blob:']);
  });
  it('does not permit Blob scripts, inline scripts, eval, or remote scripts', () => {
    assert.deepEqual(policy().get('script-src'), ["'self'"]);
  });
  it('leaves default, style and font restrictions unchanged', () => {
    for (const name of ['default-src', 'style-src', 'font-src']) assert.deepEqual(policy().get(name), ["'self'"]);
    assert.equal(policy().size, 6);
  });
});
