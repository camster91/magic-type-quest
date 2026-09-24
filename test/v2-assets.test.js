import { describe, expect, it } from 'vitest';
import { ASSET_MANIFEST, getAsset, getLoadableAssets, validateAssetManifest } from '../src/v2/assets/manifest.ts';
import { STARTER_CONTENT } from '../src/v2/content/data.ts';
import { BIOME_PALETTES } from '../src/v2/assets/palettes.ts';
import { inspectDimensions } from '../scripts/validate-v2-assets.mjs';
import { resolve } from 'node:path';

const clone = () => JSON.parse(JSON.stringify(ASSET_MANIFEST));

describe('typed v2 art manifest (#163)', () => {
  it('provides every Meadow layer, metadata, stable content IDs and no premature downloads', () => {
    expect(validateAssetManifest()).toEqual([]);
    expect(new Set(ASSET_MANIFEST.map((asset) => asset.layer))).toEqual(new Set([
      'background', 'farScenery', 'midground', 'habitat', 'restoration', 'wildlife', 'foreground', 'effects', 'highlights', 'ui',
    ]));
    expect(STARTER_CONTENT.assets.map((slot) => slot.id)).toEqual(ASSET_MANIFEST.map((asset) => asset.id));
    expect(Object.keys(BIOME_PALETTES)).toHaveLength(6);
    for (const biome of STARTER_CONTENT.biomes) expect(BIOME_PALETTES[biome.id].token).toBe(biome.paletteToken);
    for (const asset of ASSET_MANIFEST) {
      expect(asset.sourcePath).toBeNull(); expect(asset.outputs).toEqual([]);
      expect(asset.provenance.referenceId).toMatch(/^(ENV|RESTORE|FOX|WILDLIFE|GUIDE|UI)-01$/);
    }
    expect(getAsset('biomes.meadow.background.sky').runtimeTargets.mobile.width).toBe(720);
    expect(getAsset('wildlife.monarch.idle').descriptionKey).toBe('species.monarch.description');
    expect(getLoadableAssets('currentBiome', 'biomes.meadow-base')).toEqual([]);
    expect(() => getAsset('unlisted')).toThrow(/Unknown v2 asset/);
  });

  it('rejects duplicate IDs, fake implemented art, missing provenance, oversized sources and unsafe paths', () => {
    const duplicates = clone(); duplicates[1].id = duplicates[0].id;
    expect(validateAssetManifest(duplicates).some((issue) => issue.includes('duplicate'))).toBe(true);
    const fake = clone(); fake[0].status = 'implemented';
    expect(validateAssetManifest(fake).some((issue) => issue.includes('approved source'))).toBe(true);
    const noSource = clone(); noSource[0].provenance.referenceId = '';
    expect(validateAssetManifest(noSource).some((issue) => issue.includes('provenance'))).toBe(true);
    const huge = clone(); huge[0].sourceDimensions.width = 8000;
    expect(validateAssetManifest(huge).some((issue) => issue.includes('oversized source'))).toBe(true);
    const unsafe = clone(); unsafe[0].outputs = [{ path: '../outside.webp', format: 'webp', width: 100, height: 100, maxViewportWidth: null }];
    expect(validateAssetManifest(unsafe).some((issue) => issue.includes('invalid or duplicate path'))).toBe(true);
  });

  it('reads actual PNG and WebP dimensions for build-budget reports', () => {
    expect(inspectDimensions(resolve('public/assets/icon-192.png'))).toEqual({ width: 192, height: 192 });
    expect(inspectDimensions(resolve('docs/v2/evidence/typing-practice-1366.webp'))).toEqual({ width: 1366, height: 1247 });
  });
});
