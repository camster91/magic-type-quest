import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Buffer } from 'node:buffer';
import { checkAssets, readWebpInfo } from '../scripts/check-v2-assets.mjs';

/** Smallest WebP header the checker reads: RIFF + VP8X with size and alpha flag. */
function webpHeader(width, height, alpha) {
  const buffer = Buffer.alloc(30);
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(22, 4);
  buffer.write('WEBP', 8, 'ascii');
  buffer.write('VP8X', 12, 'ascii');
  buffer.writeUInt32LE(10, 16);
  buffer[20] = alpha ? 0x10 : 0;
  buffer.writeUIntLE(width - 1, 24, 3);
  buffer.writeUIntLE(height - 1, 27, 3);
  return buffer;
}

function asset(overrides = {}) {
  return {
    id: 'wildlife.monarch',
    file: 'meadow/wildlife.monarch.webp',
    type: 'sprite',
    width: 600,
    height: 800,
    transparent: true,
    preloadGroup: 'biome-meadow',
    decorative: false,
    altKey: 'fieldGuide.monarch.alt',
    provenance: { tool: 'Higgsfield', model: 'gpt_image_2_5', promptId: 'wildlife.monarch.v1', sourceJob: 'job', generated: '2026-10-11' },
    licence: 'generated',
    approval: 'pending',
    ...overrides,
  };
}

function fixture(assets, files, run) {
  const root = mkdtempSync(join(tmpdir(), 'nature-quest-assets-'));
  try {
    mkdirSync(join(root, 'assets/v2/meadow'), { recursive: true });
    writeFileSync(join(root, 'assets/v2/manifest.json'), JSON.stringify({ version: 1, assets }));
    for (const [path, content] of Object.entries(files)) writeFileSync(join(root, 'assets/v2', path), content);
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('reads WebP size and alpha from the header', () => {
  assert.deepEqual(readWebpInfo(webpHeader(2688, 1520, false)), { width: 2688, height: 1520, alpha: false });
  assert.deepEqual(readWebpInfo(webpHeader(600, 800, true)), { width: 600, height: 800, alpha: true });
  assert.throws(() => readWebpInfo(Buffer.from('not an image at all, just some text')), /not a WebP/);
});

test('passes a manifest that matches its files', () => fixture(
  [asset()],
  { 'meadow/wildlife.monarch.webp': webpHeader(600, 800, true) },
  (root) => assert.deepEqual(checkAssets(root), []),
));

test('reports wrong size, wrong alpha, missing files and unlisted files', () => fixture(
  [asset(), asset({ id: 'wildlife.bluebird', file: 'meadow/wildlife.bluebird.webp' })],
  {
    'meadow/wildlife.monarch.webp': webpHeader(500, 800, false),
    'meadow/stray.webp': webpHeader(10, 10, true),
  },
  (root) => assert.deepEqual(checkAssets(root), [
    'wildlife.monarch: manifest says 600x800, file is 500x800',
    'wildlife.monarch: manifest transparent=true, file alpha=false',
    'wildlife.bluebird: missing file meadow/wildlife.bluebird.webp',
    'assets/v2/meadow/stray.webp: not listed in manifest.json',
  ]),
));

test('requires ids, provenance, alt text keys and safe paths', () => fixture(
  [
    asset({ id: 'Monarch', altKey: undefined, provenance: { tool: 'Higgsfield' } }),
    asset({ id: 'wildlife.escape', file: '../outside.webp' }),
  ],
  { 'meadow/wildlife.monarch.webp': webpHeader(600, 800, true) },
  (root) => {
    const errors = checkAssets(root);
    assert.ok(errors.includes('Monarch: id must be a dotted logical id'));
    assert.ok(errors.includes('Monarch: non-decorative asset needs an altKey'));
    assert.ok(errors.includes('Monarch: provenance.sourceJob is required'));
    assert.ok(errors.includes('wildlife.escape: file must be a relative path inside assets/v2'));
  },
));

test('accepts Field Guide cards with their own budget', () => fixture(
  [asset({ id: 'fieldguide.monarch', file: 'meadow/fieldguide.monarch.webp', type: 'card', width: 772, height: 1024, transparent: false })],
  { 'meadow/fieldguide.monarch.webp': webpHeader(772, 1024, false) },
  (root) => assert.deepEqual(checkAssets(root), []),
));

test('enforces sprite edge and size budgets', () => fixture(
  [asset({ width: 2048, height: 800 })],
  { 'meadow/wildlife.monarch.webp': Buffer.concat([webpHeader(2048, 800, true), Buffer.alloc(250_000)]) },
  (root) => assert.deepEqual(checkAssets(root), [
    'wildlife.monarch: longest edge 2048px is over 1024px',
    'wildlife.monarch: 250030 bytes is over the sprite budget of 200000',
  ]),
));
