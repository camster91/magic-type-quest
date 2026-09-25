import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LIMITS, assetPackLimit, assetFilePaths, createTransferBudgetReport, assertTransferBudgets, inspectDimensions } from '../scripts/v2-asset-policy.mjs';

const report = (overrides = {}) => createTransferBudgetReport({
  v1DefaultShellGzipBytes: 80_000, v2ShellGzipBytes: 30_000, v2FirstPlayableCodeGzipBytes: 380_000,
  packSizes: new Map(), ...overrides,
});
function inspectFixture(extension, content) {
  const directory = mkdtempSync(join(tmpdir(), 'nq2-asset-'));
  try {
    const path = join(directory, `fixture.${extension}`); writeFileSync(path, content); return inspectDimensions(path);
  } finally { rmSync(directory, { recursive: true, force: true }); }
}

describe('first-play and individual asset budget contracts (#165)', () => {
  it('keeps the approved hard limits in one immutable policy', () => {
    assert.deepEqual(LIMITS, { shell: 2_500_000, meadowPack: 8_000_000, laterPack: 12_000_000, raster: 1_500_000 });
    assert.equal(Object.isFrozen(LIMITS), true);
    assert.equal(assetPackLimit('shell'), 2_500_000);
    assert.equal(assetPackLimit('biomes.meadow-base'), 8_000_000);
    assert.equal(assetPackLimit('fixture.later'), 12_000_000);
  });
  it('retains an honest empty-art baseline', () => {
    const value = report();
    assert.equal(value.coreAssetBytes, 0); assert.equal(value.meadowAssetBytes, 0);
    assert.equal(value.additionalMeadowCodeGzipBytes, 350_000);
    assert.equal(value.additionalMeadowTotalBytes, 350_000);
    assert.doesNotThrow(() => assertTransferBudgets(value));
  });
  it('counts shared core exactly once in post-Start transfer, not initial-shell code', () => {
    const value = report({ packSizes: new Map([['shell', 250_000], ['biomes.meadow-base', 500_000]]) });
    assert.equal(value.v2ShellGzipBytes, 30_000);
    assert.equal(value.coreAssetBytes, 250_000); assert.equal(value.additionalMeadowTotalBytes, 1_100_000);
  });
  it('rejects the old false pass when separately valid core and Meadow exceed first play', () => {
    const value = report({ packSizes: new Map([['shell', 2_400_000], ['biomes.meadow-base', 7_500_000]]) });
    assert.equal(value.additionalMeadowTotalBytes, 10_250_000);
    assert.throws(() => assertTransferBudgets(value), /shared core.*10250000.*8000000/u);
  });
  it('accepts exactly the first-pack limit and rejects one extra byte', () => {
    const sizes = new Map([['shell', 1_000_000], ['biomes.meadow-base', 6_650_000]]);
    assert.doesNotThrow(() => assertTransferBudgets(report({ packSizes: sizes })));
    sizes.set('biomes.meadow-base', 6_650_001);
    assert.throws(() => assertTransferBudgets(report({ packSizes: sizes })), /8000001/u);
  });
  it('accepts exactly the shell limit and rejects one extra byte', () => {
    assert.doesNotThrow(() => assertTransferBudgets(report({ v2ShellGzipBytes: 2_500_000, v2FirstPlayableCodeGzipBytes: 2_500_000 })));
    assert.throws(() => assertTransferBudgets(report({ v2ShellGzipBytes: 2_500_001, v2FirstPlayableCodeGzipBytes: 2_500_001 })), /v2 shell 2500001/u);
  });
  it('does not count unrelated later-pack assets as current Meadow downloads', () => {
    const value = report({ packSizes: new Map([['fixture.later', 10_000_000]]) });
    assert.equal(value.additionalMeadowTotalBytes, 350_000);
  });
  for (const [label, value] of [['negative', -1], ['fractional', 0.5], ['NaN', NaN], ['infinite', Infinity], ['unsafe', Number.MAX_SAFE_INTEGER + 1]]) {
    it(`rejects ${label} measurements instead of silently passing a gate`, () => {
      assert.throws(() => report({ v2ShellGzipBytes: value }), /safe integer byte count/u);
      assert.throws(() => report({ packSizes: new Map([['shell', value]]) }), /safe integer byte count/u);
    });
  }
  it('rejects impossible build-graph totals', () => {
    assert.throws(() => report({ v2FirstPlayableCodeGzipBytes: 29_999 }), /smaller than its initial shell/u);
  });
  it('rejects overflow when otherwise valid integer measurements are added', () => {
    assert.throws(() => report({ packSizes: new Map([['shell', Number.MAX_SAFE_INTEGER]]) }), /Additional first-play transfer/u);
  });
  it('inspects an asset source/output path once when both point to the same file', () => {
    const path = 'public/assets/v2/fixture.svg';
    assert.deepEqual(assetFilePaths({ sourcePath: path, outputs: [{ path }] }), [path]);
  });
  it('retains distinct master and optimized-variant paths for existence checks', () => {
    assert.deepEqual(assetFilePaths({ sourcePath: 'assets-v2/master/a.png', outputs: [{ path: 'public/assets/v2/a.webp' }, { path: 'public/assets/v2/a-small.webp' }] }),
      ['assets-v2/master/a.png', 'public/assets/v2/a.webp', 'public/assets/v2/a-small.webp']);
  });
});

describe('asset dimension inspection independent of Vite startup (#165)', () => {
  // Tiny test-only images generated with Pillow; not production art or source approvals.
  const rasterFixtures = [
    ['png', 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAYAAAC56t6BAAAAFklEQVR4nGNUDeY+wcDAwMDEAAVwBgAfSQFRPzF3FQAAAABJRU5ErkJggg=='],
    ['webp', 'UklGRh4AAABXRUJQVlA4TBEAAAAvAYAAEAfQqZZ0ociBiOh/AAA='],
    ['webp', 'UklGRlYAAABXRUJQVlA4WAoAAAAQAAAAAQAAAgAAQUxQSAcAAAAAyMjIyMjIAFZQOCAoAAAAsAEAnQEqAgADAAFAJiWYAnS6AAQwAAD+91kv/Abr4tpl832PZjgAAA=='],
    ['webp', 'UklGRjQAAABXRUJQVlA4ICgAAACwAQCdASoCAAMAAUAmJZgCdLoABDAAAP73WS/8Buvi2mXzfY9mOAAA'],
  ];
  for (const [index, [extension, encoded]] of rasterFixtures.entries()) {
    it(`reads real 2x3 raster header fixture ${index + 1}`, () => {
      assert.deepEqual(inspectFixture(extension, Buffer.from(encoded, 'base64')), { width: 2, height: 3 });
    });
  }
  const svgCases = [
    ['ordinary viewBox', '<svg viewBox="0 0 64 64"></svg>', { width: 64, height: 64 }],
    ['negative origin and comma separators', "<svg viewBox='-10,-20,128,96'></svg>", { width: 128, height: 96 }],
    ['attribute whitespace', '<svg viewBox = "0\n0\t64 32"></svg>', { width: 64, height: 32 }],
    ['decimal and scientific notation', '<svg viewBox="0 0 1e2 25.5"></svg>', { width: 100, height: 25.5 }],
    ['intrinsic pixel dimensions', '<svg width="64px" height="32" viewBox="0 0 128 64"></svg>', { width: 64, height: 32 }],
    ['width with aspect ratio', '<svg width="64" viewBox="0 0 128 64"></svg>', { width: 64, height: 32 }],
    ['height with aspect ratio', '<svg height="32" viewBox="0 0 128 64"></svg>', { width: 64, height: 32 }],
    ['explicit size without viewBox', '<svg width="64" height="32"></svg>', { width: 64, height: 32 }],
    ['commented decoy', '<!-- <svg viewBox="0 0 999 999"> --><svg viewBox="0 0 64 64"></svg>', { width: 64, height: 64 }],
  ];
  for (const [name, content, expected] of svgCases) {
    it(`reads SVG ${name}`, () => assert.deepEqual(inspectFixture('svg', content), expected));
  }
  for (const [name, content] of [
    ['missing root', 'viewBox="0 0 64 64"'], ['nested-only dimensions', '<svg><svg viewBox="0 0 64 64"></svg></svg>'],
    ['zero extent', '<svg viewBox="0 0 0 64"></svg>'], ['negative extent', '<svg viewBox="0 0 -64 64"></svg>'],
    ['non-numeric extent', '<svg viewBox="0 0 NaN 64"></svg>'], ['infinite extent', '<svg viewBox="0 0 1e999 64"></svg>'],
    ['missing coordinate', '<svg viewBox="0 64 64"></svg>'], ['ambiguous percentage', '<svg width="100%" height="64" viewBox="0 0 64 64"></svg>'],
    ['duplicate viewBox', '<svg viewBox="0 0 64 64" viewBox="0 0 32 32"></svg>'],
  ]) {
    it(`rejects SVG ${name} with an actionable error`, () => {
      assert.throws(() => inspectFixture('svg', content), /Cannot inspect|Duplicate SVG/u);
    });
  }
  for (const extension of ['png', 'webp', 'avif']) {
    it(`rejects empty/truncated ${extension} without a range exception`, () => {
      assert.throws(() => inspectFixture(extension, Buffer.from('x')), /Cannot inspect/u);
    });
  }
  it('rejects a corrupt PNG signature rather than trusting the filename', () => {
    const data = Buffer.from(rasterFixtures[0][1], 'base64'); data[0] = 0;
    assert.throws(() => inspectFixture('png', data), /Cannot inspect/u);
  });
});
