import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { ASSET_MANIFEST, chooseAssetVariant, getLoadableAssets, validateAssetManifest } from '../src/v2/assets/manifest.ts';
import { PackLoader } from '../src/v2/assets/PackLoader.ts';

const packId = 'biomes.meadow-base';
const approvedAsset = (id = 'fixture.required', preloadGroup = 'mission') => ({
  ...ASSET_MANIFEST[0], id, status: 'implemented', preloadGroup, sourcePath: 'assets-v2/master/fixture.png',
  provenance: { origin: 'manual', referenceId: 'test-fixture', licence: 'owned', editHistory: [], approval: 'approved' },
  outputs: [
    { path: `public/assets/v2/${id}-small.webp`, format: 'webp', width: 720, height: 400, maxViewportWidth: 720 },
    { path: `public/assets/v2/${id}-large.webp`, format: 'webp', width: 1920, height: 1080, maxViewportWidth: null },
  ],
});
const load = (loader) => loader.load(packId, 360, 2, () => {}, () => true);

describe('runtime asset approval boundary (#165)', () => {
  it('keeps every production slot planned with no downloadable assets', () => {
    assert.deepEqual(validateAssetManifest(), []);
    for (const asset of ASSET_MANIFEST) assert.equal(chooseAssetVariant(asset, 360, 2), null);
    for (const group of ['shell', 'currentBiome', 'mission', 'optional']) assert.deepEqual(getLoadableAssets(group, group === 'shell' ? null : packId), []);
  });
  it('preserves responsive selection and DPR cap for approved variants', () => {
    const asset = approvedAsset();
    assert.equal(chooseAssetVariant(asset, 360, 3)?.width, 720);
    assert.equal(chooseAssetVariant(asset, 1000, 1)?.width, 1920);
    assert.deepEqual(validateAssetManifest([asset]), []);
  });
  for (const [field, value] of [['approval', 'pending'], ['licence', 'pending'], ['origin', 'planned']]) {
    it(`refuses ${field}=${value} even when status is incorrectly implemented`, () => {
      const asset = approvedAsset(); asset.provenance[field] = value;
      assert.equal(chooseAssetVariant(asset, 360, 2), null);
    });
  }
  it('fails closed on missing provenance without choosing a large fallback', () => {
    const asset = approvedAsset(); delete asset.provenance;
    assert.equal(chooseAssetVariant(asset, 360, 2), null);
  });
  it('rejects unapproved required content without fetching or allocating a Blob URL', async () => {
    const asset = approvedAsset(); asset.provenance.approval = 'pending';
    let fetches = 0; let allocations = 0;
    const loader = new PackLoader([asset], async () => { fetches++; return new globalThis.Response('art'); },
      () => { allocations++; return 'blob:fixture'; }, () => {});
    try { await assert.rejects(load(loader), /No approved variant/u); }
    finally { loader.dispose(); }
    assert.equal(fetches, 0); assert.equal(allocations, 0);
  });
  it('skips unapproved optional decoration without discarding approved required work', async () => {
    const required = approvedAsset(); const optional = approvedAsset('fixture.optional', 'optional');
    optional.provenance.licence = 'pending';
    const fetched = []; const revoked = [];
    const loader = new PackLoader([required, optional], async (url) => { fetched.push(url); return new globalThis.Response('art'); },
      () => 'blob:fixture', (url) => revoked.push(url));
    try {
      const result = await load(loader);
      assert.equal(await loader.loadOptional(packId, 360, 2), false);
      assert.equal(result.resources.size, 1); assert.deepEqual(revoked, []);
    } finally { loader.dispose(); }
    assert.equal(fetched.length, 1); assert.deepEqual(revoked, ['blob:fixture']);
  });
  it('continues supporting approved generated and licensed provenance', () => {
    for (const [origin, licence] of [['generated', 'owned'], ['licensed', 'licensed'], ['manual', 'cc0']]) {
      const asset = approvedAsset(); asset.provenance.origin = origin; asset.provenance.licence = licence;
      assert.equal(chooseAssetVariant(asset, 360, 1)?.width, 720);
    }
  });
});
