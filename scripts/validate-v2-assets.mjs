import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { createServer } from 'vite';
import { LIMITS, assetPackLimit, assetFilePaths, inspectDimensions } from './v2-asset-policy.mjs';
export { inspectDimensions } from './v2-asset-policy.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const SOURCE_LOG = readFileSync(resolve(ROOT, 'assets-v2/ASSET-SOURCES.md'), 'utf8');

function filesUnder(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Asset symlink forbidden: ${path}`);
    return entry.isDirectory() ? filesUnder(path) : entry.isFile() ? [path] : [];
  });
}

export async function validateAssets() {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
  try {
    const { ASSET_MANIFEST, validateAssetManifest } = await server.ssrLoadModule('/src/v2/assets/manifest.ts');
    const { STARTER_CONTENT } = await server.ssrLoadModule('/src/v2/content/data.ts');
    const failures = [...validateAssetManifest()];
    const referenced = new Set([
      ...STARTER_CONTENT.stages.flatMap((stage) => [...stage.visibleLayers, ...stage.hiddenLayers, ...stage.propChanges]),
      ...STARTER_CONTENT.wildlife.flatMap((entry) => [entry.illustrationAssetId, ...entry.animationAssetIds]),
      ...STARTER_CONTENT.biomes.flatMap((biome) => biome.ambientAudioId ? [biome.ambientAudioId] : []),
    ]);
    const byId = new Map(ASSET_MANIFEST.map((asset) => [asset.id, asset]));
    for (const id of referenced) if (!byId.has(id)) failures.push(`Content references missing manifest asset ${id}`);
    const unreferenced = ASSET_MANIFEST.filter((asset) => !referenced.has(asset.id));
    const packSizes = new Map(); const usedPaths = new Set();
    for (const asset of ASSET_MANIFEST) {
      if (!SOURCE_LOG.includes(`\`${asset.id}\``)) failures.push(`${asset.id}: missing provenance log row`);
      if (asset.status === 'implemented' && !referenced.has(asset.id) && asset.preloadGroup !== 'shell') failures.push(`${asset.id}: implemented unreferenced asset`);
      if (asset.status !== 'implemented') {
        console.log(`Planned: ${asset.id} ${asset.sourceDimensions.width}x${asset.sourceDimensions.height}, ${asset.preloadGroup}`);
        continue;
      }
      const paths = assetFilePaths(asset);
      for (const path of paths) {
        if (!path || path.includes('..') || !(path.startsWith('assets-v2/master/') || path.startsWith('public/assets/v2/'))) { failures.push(`${asset.id}: unsafe source/output path ${path}`); continue; }
        const absolute = resolve(ROOT, path);
        if (!existsSync(absolute)) { failures.push(`${asset.id}: missing file ${path}`); continue; }
        if (path.startsWith('public/assets/v2/')) {
          const bytes = statSync(absolute).size;
          if (bytes > LIMITS.raster && extname(path).toLowerCase() !== '.svg') failures.push(`${asset.id}: ${bytes} bytes exceeds 1.5 MB raster budget`);
          packSizes.set(asset.biomePackId ?? 'shell', (packSizes.get(asset.biomePackId ?? 'shell') ?? 0) + bytes);
          const variant = asset.outputs.find((output) => output.path === path);
          try {
            const measured = inspectDimensions(absolute);
            if (variant && (measured.width !== variant.width || measured.height !== variant.height)) failures.push(`${asset.id}: declared ${variant.width}x${variant.height}, actual ${measured.width}x${measured.height}`);
            console.log(`${asset.id}: ${relative(ROOT, absolute)} ${measured.width}x${measured.height}, ${bytes} bytes`);
          } catch (error) { failures.push(String(error)); }
          usedPaths.add(absolute);
        }
      }
    }
    for (const [pack, bytes] of packSizes) {
      const limit = assetPackLimit(pack);
      if (bytes > limit) failures.push(`${pack}: ${bytes} bytes exceeds ${limit} byte pack budget`);
    }
    const orphanFiles = filesUnder(resolve(ROOT, 'public/assets/v2')).filter((path) => !usedPaths.has(path));
    for (const path of orphanFiles) {
      const bytes = statSync(path).size;
      console.log(`Unreferenced file: ${relative(ROOT, path)} ${bytes} bytes`);
      if (bytes > LIMITS.raster) failures.push(`${relative(ROOT, path)}: unreferenced oversized file`);
    }
    console.log(`V2 assets: ${ASSET_MANIFEST.length} planned/implemented slots; ${unreferenced.length} reserved slots not yet referenced; ${orphanFiles.length} unreferenced files.`);
    if (unreferenced.length) console.log(`Reserved/unreferenced IDs: ${unreferenced.map((asset) => asset.id).join(', ')}`);
    for (const [pack, bytes] of packSizes) console.log(`${pack}: ${bytes} compressed asset bytes`);
    if (failures.length) throw new Error(failures.join('\n'));
    return { slots: ASSET_MANIFEST.length, unreferenced: unreferenced.map((asset) => asset.id), packSizes };
  } finally { await server.close(); }
}

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  validateAssets().catch((error) => { console.error(error); process.exitCode = 1; });
}
