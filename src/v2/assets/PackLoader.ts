import { ASSET_MANIFEST, chooseAssetVariant, type AssetDefinition, type AssetFormat, type PreloadGroup } from './manifest';

export interface PackProgress { readonly phase: PreloadGroup; readonly completed: number; readonly total: number; readonly bytesLoaded: number; }
export interface PackResource { readonly id: string; readonly url: string; readonly bytes: number; readonly format: AssetFormat; }
export interface PackResult { readonly packId: string; readonly resources: ReadonlyMap<string, PackResource>; }
const REQUIRED_GROUPS: readonly PreloadGroup[] = ['shell', 'currentBiome', 'mission'];

/** Owns Blob URLs for shared core and one active biome; scenes own their Phaser textures. */
export class PackLoader {
  private readonly resources = new Map<string, Map<string, PackResource>>();
  private readonly pending = new Map<AbortController, string>();
  private disposed = false;
  constructor(private readonly entries: readonly AssetDefinition[] = ASSET_MANIFEST,
    private readonly fetchResource: typeof fetch = fetch,
    private readonly createURL: (blob: Blob) => string = (blob) => URL.createObjectURL(blob),
    private readonly revokeURL: (url: string) => void = (url) => URL.revokeObjectURL(url)) {}

  async load(packId: string, viewportWidth: number, dpr: number, onProgress: (progress: PackProgress) => void,
    requiredDataReady: () => boolean): Promise<PackResult> {
    if (this.disposed) throw new Error('Pack loader is closed');
    if (!requiredDataReady()) throw new Error('Required typing content is unavailable');
    for (const phase of REQUIRED_GROUPS) {
      const owner = phase === 'shell' ? 'shell' : packId;
      const assets = this.entries.filter((entry) => entry.status === 'implemented' && entry.preloadGroup === phase && entry.biomePackId === (phase === 'shell' ? null : packId));
      let completed = 0; let bytesLoaded = 0;
      onProgress({ phase, completed, total: assets.length, bytesLoaded });
      for (const asset of assets) {
        try {
          const variant = chooseAssetVariant(asset, viewportWidth, dpr);
          if (!variant) throw new Error(`No approved variant for ${asset.id}`);
          if (!this.resources.get(owner)?.has(asset.id)) await this.fetchAsset(owner, asset.id, variant);
          bytesLoaded += this.resources.get(owner)?.get(asset.id)?.bytes ?? 0;
        } catch (error) { this.release(packId); throw error; }
        completed++; onProgress({ phase, completed, total: assets.length, bytesLoaded });
      }
    }
    return { packId, resources: new Map([...this.resources.get('shell') ?? [], ...this.resources.get(packId) ?? []]) };
  }
  /** Called only after gameplay is usable; optional art failure never blocks a target key. */
  async loadOptional(packId: string, viewportWidth: number, dpr: number): Promise<boolean> {
    if (this.disposed) return false;
    let complete = true;
    for (const asset of this.entries.filter((entry) => entry.status === 'implemented' && entry.preloadGroup === 'optional' && entry.biomePackId === packId)) {
      const variant = chooseAssetVariant(asset, viewportWidth, dpr);
      if (!variant) { complete = false; continue; }
      if (this.resources.get(packId)?.has(asset.id)) continue;
      try { await this.fetchAsset(packId, asset.id, variant); } catch { complete = false; }
    }
    return complete;
  }
  private async fetchAsset(owner: string, id: string, variant: { path: string; format: AssetFormat }): Promise<void> {
    const controller = new AbortController(); this.pending.set(controller, owner);
    try {
      const response = await this.fetchResource(`${import.meta.env.BASE_URL}${variant.path.replace(/^public\//u, '')}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
      const blob = await response.blob();
      if (this.disposed || controller.signal.aborted) throw new Error('Pack load cancelled');
      if (!this.resources.has(owner)) this.resources.set(owner, new Map());
      this.resources.get(owner)?.set(id, { id, url: this.createURL(blob), bytes: blob.size, format: variant.format });
    } finally { this.pending.delete(controller); }
  }
  release(packId: string): void {
    if (packId === 'shell') return;
    for (const [controller, owner] of this.pending) if (owner === packId) controller.abort();
    for (const resource of this.resources.get(packId)?.values() ?? []) this.revokeURL(resource.url);
    this.resources.delete(packId);
  }
  loadedPackIds(): readonly string[] { return [...this.resources.keys()]; }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const controller of this.pending.keys()) controller.abort(); this.pending.clear();
    for (const group of this.resources.values()) for (const resource of group.values()) this.revokeURL(resource.url);
    this.resources.clear();
  }
}
