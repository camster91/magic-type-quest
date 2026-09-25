export type AssetStatus = 'planned' | 'implemented';
export type AssetLayer = 'background' | 'farScenery' | 'midground' | 'habitat' | 'restoration' | 'wildlife' | 'foreground' | 'effects' | 'highlights' | 'ui';
export type PreloadGroup = 'shell' | 'currentBiome' | 'mission' | 'optional';
export type AssetFormat = 'webp' | 'avif' | 'png' | 'svg';
export interface Dimensions { readonly width: number; readonly height: number; }
export interface AssetVariant { readonly path: string; readonly format: AssetFormat; readonly width: number; readonly height: number; readonly maxViewportWidth: number | null; }
export interface AssetDefinition {
  readonly id: string;
  readonly status: AssetStatus;
  readonly sourcePath: string | null;
  readonly type: AssetFormat;
  readonly sourceDimensions: Dimensions;
  readonly runtimeTargets: { readonly desktop: Dimensions; readonly tablet: Dimensions; readonly mobile: Dimensions; readonly safeArea: string };
  readonly pixelDensity: 1 | 2;
  readonly transparency: 'transparent' | 'opaque';
  readonly layer: AssetLayer;
  readonly preloadGroup: PreloadGroup;
  readonly biomePackId: string | null;
  readonly animation: { readonly states: readonly string[]; readonly frames: number; readonly frameRate: number } | null;
  readonly descriptionKey: string | null;
  readonly provenance: { readonly origin: 'planned' | 'manual' | 'generated' | 'licensed'; readonly referenceId: string; readonly licence: 'pending' | 'owned' | 'cc0' | 'licensed'; readonly editHistory: readonly string[]; readonly approval: 'pending' | 'approved' };
  readonly generationVersion: number;
  readonly outputs: readonly AssetVariant[];
}

const ENVIRONMENT = { desktop: { width: 1920, height: 1080 }, tablet: { width: 1280, height: 960 }, mobile: { width: 720, height: 1280 }, safeArea: 'central 60% width; critical wildlife and objective cues above lower 20%' };
const CHARACTER = { desktop: { width: 480, height: 480 }, tablet: { width: 360, height: 360 }, mobile: { width: 240, height: 240 }, safeArea: 'full silhouette with 8% transparent padding' };
const CARD = { desktop: { width: 800, height: 960 }, tablet: { width: 600, height: 720 }, mobile: { width: 400, height: 480 }, safeArea: 'subject within central 80% width' };
const ICON = { desktop: { width: 128, height: 128 }, tablet: { width: 96, height: 96 }, mobile: { width: 64, height: 64 }, safeArea: '24px legible silhouette' };
type Targets = AssetDefinition['runtimeTargets'];
function slot(id: string, layer: AssetLayer, group: PreloadGroup, targets: Targets = ENVIRONMENT,
  options: { transparent?: boolean; descriptionKey?: string; states?: readonly string[]; biomePackId?: string | null; type?: AssetFormat } = {}): AssetDefinition {
  const referenceId = id.startsWith('companion.') ? 'FOX-01' : id.startsWith('wildlife.') ? 'WILDLIFE-01' : id.startsWith('plants.') ? 'GUIDE-01' : id.includes('.restoration.') ? 'RESTORE-01' : id.startsWith('ui.') || layer === 'highlights' ? 'UI-01' : 'ENV-01';
  return {
    id, status: 'planned', sourcePath: null, type: options.type ?? 'webp', sourceDimensions: targets.desktop,
    runtimeTargets: targets, pixelDensity: 1, transparency: options.transparent ? 'transparent' : 'opaque',
    layer, preloadGroup: group, biomePackId: options.biomePackId === undefined ? 'biomes.meadow-base' : options.biomePackId,
    animation: options.states ? { states: options.states, frames: 0, frameRate: 0 } : null,
    descriptionKey: options.descriptionKey ?? null,
    provenance: { origin: 'planned', referenceId, licence: 'pending', editHistory: [], approval: 'pending' },
    generationVersion: 1, outputs: [],
  };
}

/** Planned slots carry metadata but no path; the loader refuses to request an unfinished asset. */
export const ASSET_MANIFEST: readonly AssetDefinition[] = [
  slot('biomes.meadow.background.sky', 'background', 'currentBiome'),
  slot('biomes.meadow.far.ridgeline', 'farScenery', 'currentBiome', ENVIRONMENT, { transparent: true }),
  slot('biomes.meadow.mid.grasses', 'midground', 'currentBiome', ENVIRONMENT, { transparent: true }),
  slot('biomes.meadow.habitat.sparse', 'habitat', 'currentBiome'),
  slot('biomes.meadow.restoration.plantingSpots', 'restoration', 'mission', ENVIRONMENT, { transparent: true }),
  slot('biomes.meadow.restoration.flowers', 'restoration', 'mission', ENVIRONMENT, { transparent: true }),
  slot('biomes.meadow.restoration.restored', 'restoration', 'mission', ENVIRONMENT, { transparent: true }),
  slot('biomes.meadow.foreground.stems', 'foreground', 'optional', ENVIRONMENT, { transparent: true }),
  slot('biomes.meadow.effects.pollen', 'effects', 'optional', ICON, { transparent: true }),
  slot('biomes.meadow.highlights.planting', 'highlights', 'mission', ICON, { transparent: true }),
  slot('wildlife.monarch.idle', 'wildlife', 'mission', CHARACTER, { transparent: true, descriptionKey: 'species.monarch.description', states: ['idle', 'notice', 'move', 'arrival'] }),
  slot('plants.yarrow.card', 'ui', 'mission', CARD, { transparent: true, descriptionKey: 'species.yarrow.description' }),
  slot('companion.fox.guide', 'ui', 'shell', CHARACTER, { transparent: true, descriptionKey: 'companion.fox.description', states: ['idle', 'notice', 'positive', 'rest'], biomePackId: null }),
  slot('ui.map.meadow.badge', 'ui', 'shell', ICON, { transparent: true, biomePackId: null, type: 'svg' }),
  slot('ui.mastery.keycap', 'ui', 'shell', ICON, { transparent: true, biomePackId: null, type: 'svg' }),
];

const byId = new Map(ASSET_MANIFEST.map((asset) => [asset.id, asset]));
export function getAsset(id: string): AssetDefinition {
  const asset = byId.get(id);
  if (!asset) throw new Error(`Unknown v2 asset ${id}`);
  return asset;
}
function hasApprovedProvenance(asset: AssetDefinition): boolean {
  return asset.status === 'implemented' && asset.provenance?.approval === 'approved'
    && ['manual', 'generated', 'licensed'].includes(asset.provenance.origin)
    && ['owned', 'cc0', 'licensed'].includes(asset.provenance.licence);
}
export function getLoadableAssets(group: PreloadGroup, packId: string | null): readonly AssetDefinition[] {
  return ASSET_MANIFEST.filter((asset) => hasApprovedProvenance(asset) && asset.preloadGroup === group && asset.biomePackId === packId);
}

/** Prefer the smallest approved variant that covers the display at a capped pixel density. */
export function chooseAssetVariant(asset: AssetDefinition, viewportWidth: number, devicePixelRatio: number): AssetVariant | null {
  if (!hasApprovedProvenance(asset)) return null;
  const variants = [...asset.outputs].sort((a, b) => a.width - b.width);
  const target = Math.max(1, viewportWidth) * Math.min(2, Math.max(1, devicePixelRatio));
  const eligible = variants.filter((variant) => variant.maxViewportWidth === null || viewportWidth <= variant.maxViewportWidth);
  return eligible.find((variant) => variant.width >= target) ?? eligible.at(-1) ?? null;
}

export function validateAssetManifest(entries: readonly AssetDefinition[] = ASSET_MANIFEST): readonly string[] {
  const failures: string[] = []; const seen = new Set<string>(); const paths = new Set<string>();
  for (const [index, asset] of entries.entries()) {
    const path = `assets[${index}]`;
    if (!asset || typeof asset !== 'object') { failures.push(`${path}: expected asset`); continue; }
    if (!/^[a-z][a-zA-Z0-9.-]+$/u.test(asset.id)) failures.push(`${path}.id: invalid stable id`);
    if (seen.has(asset.id)) failures.push(`${path}.id: duplicate ${asset.id}`); seen.add(asset.id);
    if (!['planned', 'implemented'].includes(asset.status)) failures.push(`${path}.status: invalid`);
    if (!['background', 'farScenery', 'midground', 'habitat', 'restoration', 'wildlife', 'foreground', 'effects', 'highlights', 'ui'].includes(asset.layer)) failures.push(`${path}.layer: invalid`);
    if (!['shell', 'currentBiome', 'mission', 'optional'].includes(asset.preloadGroup)) failures.push(`${path}.preloadGroup: invalid`);
    if (asset.preloadGroup !== 'shell' && !asset.biomePackId) failures.push(`${path}.biomePackId: missing`);
    if (!asset.runtimeTargets || !asset.sourceDimensions || ![asset.sourceDimensions, asset.runtimeTargets.desktop, asset.runtimeTargets.tablet, asset.runtimeTargets.mobile].every((d) => Number.isInteger(d?.width) && d.width > 0 && d.width <= 4096 && Number.isInteger(d?.height) && d.height > 0 && d.height <= 4096)) failures.push(`${path}.dimensions: invalid or oversized source`);
    if (![1, 2].includes(asset.pixelDensity) || !['transparent', 'opaque'].includes(asset.transparency)) failures.push(`${path}: invalid density or transparency`);
    if (asset.descriptionKey !== null && !asset.descriptionKey) failures.push(`${path}.descriptionKey: invalid`);
    if (asset.animation && (!Array.isArray(asset.animation.states) || !asset.animation.states.length || (asset.status === 'implemented' && (asset.animation.frames < 1 || asset.animation.frameRate < 1)))) failures.push(`${path}.animation: invalid`);
    if (!asset.provenance?.referenceId || !['planned', 'manual', 'generated', 'licensed'].includes(asset.provenance.origin) || !['pending', 'owned', 'cc0', 'licensed'].includes(asset.provenance.licence) || !['pending', 'approved'].includes(asset.provenance.approval) || !Array.isArray(asset.provenance.editHistory)) failures.push(`${path}.provenance: incomplete`);
    if (!Number.isInteger(asset.generationVersion) || asset.generationVersion < 1) failures.push(`${path}.generationVersion: invalid`);
    if (!Array.isArray(asset.outputs)) { failures.push(`${path}.outputs: expected variants`); continue; }
    if (asset.status === 'planned' && (asset.sourcePath || asset.outputs.length || asset.provenance.approval === 'approved')) failures.push(`${path}: planned slot cannot masquerade as built art`);
    if (asset.status === 'implemented' && (!asset.sourcePath || !asset.outputs.length || asset.provenance.approval !== 'approved' || asset.provenance.licence === 'pending')) failures.push(`${path}: implemented asset needs approved source, licence and outputs`);
    for (const output of asset.outputs) {
      if (!output.path.startsWith('public/assets/v2/') || output.path.includes('..') || paths.has(output.path)) failures.push(`${path}.outputs: invalid or duplicate path ${output.path}`);
      paths.add(output.path);
      if (!Number.isInteger(output.width) || output.width < 1 || !Number.isInteger(output.height) || output.height < 1 || !['webp', 'avif', 'png', 'svg'].includes(output.format)) failures.push(`${path}.outputs: invalid dimensions or format`);
    }
  }
  return failures;
}
