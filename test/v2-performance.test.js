// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { ASSET_MANIFEST, chooseAssetVariant } from '../src/v2/assets/manifest.ts';
import { PackLoader } from '../src/v2/assets/PackLoader.ts';
import { PerformanceMonitor } from '../src/v2/performance/PerformanceMonitor.ts';

const base = ASSET_MANIFEST[0];
const asset = (id, phase) => ({ ...base, id, status: 'implemented', preloadGroup: phase,
  biomePackId: phase === 'shell' ? null : 'biomes.meadow-base',
  outputs: [
    { path: `public/assets/v2/${id}-small.webp`, format: 'webp', width: 720, height: 400, maxViewportWidth: 720 },
    { path: `public/assets/v2/${id}-large.webp`, format: 'webp', width: 1920, height: 1080, maxViewportWidth: null },
  ] });

describe('staged v2 loading and local diagnostics (#165)', () => {
  it('selects a suitable small variant and ignores planned assets', () => {
    const entry = asset('scene', 'currentBiome');
    expect(chooseAssetVariant(entry, 360, 2)?.width).toBe(720);
    expect(chooseAssetVariant(entry, 1000, 1)?.width).toBe(1920);
    expect(chooseAssetVariant({ ...entry, status: 'planned' }, 360, 1)).toBeNull();
  });
  it('loads core, biome, mission in order, then optional assets after readiness and releases URLs', async () => {
    const calls = []; const revoked = []; let serial = 0; const progress = [];
    const loader = new PackLoader(['shell', 'currentBiome', 'mission', 'optional'].map((phase) => asset(phase, phase)),
      async (url) => { calls.push(url); return new globalThis.Response('art', { status: 200 }); },
      () => `blob:${++serial}`, (url) => revoked.push(url));
    const result = await loader.load('biomes.meadow-base', 360, 1, (state) => progress.push(state), () => true);
    expect(calls).toEqual(['shell', 'currentBiome', 'mission'].map((phase) => expect.stringContaining(`${phase}-small.webp`)));
    expect(progress.filter((state) => state.completed === 1).map((state) => state.phase)).toEqual(['shell', 'currentBiome', 'mission']);
    expect(result.resources.size).toBe(3);
    expect(await loader.loadOptional('biomes.meadow-base', 360, 1)).toBe(true);
    loader.release('biomes.meadow-base'); expect(revoked).toHaveLength(3);
    loader.dispose(); expect(revoked).toHaveLength(4);
  });
  it('blocks absent typing content, permits required retry, and tolerates optional failure', async () => {
    let fail = true;
    const loader = new PackLoader([asset('required', 'mission'), asset('decorative', 'optional')], async (url) => {
      if (url.includes('required') && fail) return new globalThis.Response('', { status: 503 });
      if (url.includes('decorative')) throw new Error('offline');
      return new globalThis.Response('art', { status: 200 });
    }, () => 'blob:one', vi.fn());
    await expect(loader.load('biomes.meadow-base', 360, 1, () => {}, () => false)).rejects.toThrow('Required typing content');
    await expect(loader.load('biomes.meadow-base', 360, 1, () => {}, () => true)).rejects.toThrow('HTTP 503');
    fail = false;
    expect((await loader.load('biomes.meadow-base', 360, 1, () => {}, () => true)).resources.size).toBe(1);
    expect(await loader.loadOptional('biomes.meadow-base', 360, 1)).toBe(false);
    loader.dispose();
  });
  it('reports bounded rolling samples and cancels its frame loop on disposal', () => {
    let frame; let time = 0; const reports = []; const cancel = vi.fn();
    const monitor = new PerformanceMonitor(() => ({ textures: 3, scenes: ['BootScene'], packs: ['shell'] }),
      (snapshot) => reports.push(snapshot), () => time, (callback) => { frame = callback; return 7; }, cancel);
    monitor.start();
    for (let index = 0; index < 120; index++) monitor.recordInputFeedback(index);
    for (time = 16; time < 1100; time += 16) frame();
    expect(reports.at(-1)).toMatchObject({ textures: 3, inputP95Ms: 114 });
    monitor.dispose(); expect(cancel).toHaveBeenCalledWith(7);
  });
});
