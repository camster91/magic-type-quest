import { ASSET_MANIFEST, chooseAssetVariant, type AssetDefinition, type AssetFormat, type PreloadGroup } from './manifest';

export interface PackProgress { readonly phase: PreloadGroup; readonly completed: number; readonly total: number; readonly bytesLoaded: number; }
export interface PackResource { readonly id: string; readonly url: string; readonly bytes: number; readonly format: AssetFormat; }
export interface PackResult { readonly packId: string; readonly resources: ReadonlyMap<string, PackResource>; }
interface PendingAsset { readonly owner: string; readonly controller: AbortController; readonly promise: Promise<void>; }
const REQUIRED_GROUPS: readonly PreloadGroup[] = ['shell', 'currentBiome', 'mission'];

/** Owns Blob URLs for shared core and one active biome; scenes own their Phaser textures. */
export class PackLoader {
  private readonly resources = new Map<string, Map<string, PackResource>>();
  private readonly pending = new Map<string, PendingAsset>();
  private activePack: string | null = null;
  private generation = 0;
  private readyGeneration: number | null = null;
  private disposed = false;
  constructor(private readonly entries: readonly AssetDefinition[] = ASSET_MANIFEST,
    private readonly fetchResource: typeof fetch = fetch,
    private readonly createURL: (blob: Blob) => string = (blob) => URL.createObjectURL(blob),
    private readonly revokeURL: (url: string) => void = (url) => URL.revokeObjectURL(url)) {}

  async load(packId: string, viewportWidth: number, dpr: number, onProgress: (progress: PackProgress) => void,
    requiredDataReady: () => boolean): Promise<PackResult> {
    if (this.disposed) throw new Error('Pack loader is closed');
    if (!packId || packId === 'shell') throw new Error('Invalid biome pack id');
    // A bad target must not discard the currently usable pack or fetch any art.
    if (!requiredDataReady()) throw new Error('Required typing content is unavailable');
    if (this.activePack !== packId) {
      if (this.activePack !== null) this.release(this.activePack);
      this.activePack = packId;
      this.generation++;
      this.readyGeneration = null;
    }
    const generation = this.generation;
    try {
      for (const phase of REQUIRED_GROUPS) {
        this.assertCurrent(packId, generation);
        const owner = phase === 'shell' ? 'shell' : packId;
        const assets = this.entries.filter((entry) => entry.status === 'implemented' && entry.preloadGroup === phase && entry.biomePackId === (phase === 'shell' ? null : packId));
        let completed = 0; let bytesLoaded = 0;
        onProgress({ phase, completed, total: assets.length, bytesLoaded });
        for (const asset of assets) {
          this.assertCurrent(packId, generation);
          const variant = chooseAssetVariant(asset, viewportWidth, dpr);
          if (!variant) throw new Error(`No approved variant for ${asset.id}`);
          await this.fetchAsset(owner, asset.id, variant);
          this.assertCurrent(packId, generation);
          bytesLoaded += this.resources.get(owner)?.get(asset.id)?.bytes ?? 0;
          completed++; onProgress({ phase, completed, total: assets.length, bytesLoaded });
        }
      }
      // Also covers cancellation by the final progress callback or an empty pack.
      this.assertCurrent(packId, generation);
      this.readyGeneration = generation;
      return { packId, resources: new Map([...this.resources.get('shell') ?? [], ...this.resources.get(packId) ?? []]) };
    } catch (error) {
      // A late failure belongs to its original visit, never to a newer retry.
      if (this.isCurrent(packId, generation)) this.release(packId);
      throw error;
    }
  }

  /** Called only after gameplay is usable; optional art failure never blocks a target key. */
  async loadOptional(packId: string, viewportWidth: number, dpr: number): Promise<boolean> {
    const generation = this.generation;
    if (!this.isCurrent(packId, generation) || this.readyGeneration !== generation) return false;
    let complete = true;
    for (const asset of this.entries.filter((entry) => entry.status === 'implemented' && entry.preloadGroup === 'optional' && entry.biomePackId === packId)) {
      if (!this.isCurrent(packId, generation)) return false;
      const variant = chooseAssetVariant(asset, viewportWidth, dpr);
      if (!variant) { complete = false; continue; }
      try { await this.fetchAsset(packId, asset.id, variant); } catch { complete = false; }
      // Abort is cooperative: even a fetch implementation that ignores its signal
      // must not cause the next decorative request or repopulate an old pack.
      if (!this.isCurrent(packId, generation)) return false;
    }
    return complete;
  }

  private isCurrent(packId: string, generation: number): boolean {
    return !this.disposed && this.activePack === packId && this.generation === generation;
  }
  private assertCurrent(packId: string, generation: number): void {
    if (!this.isCurrent(packId, generation)) throw new Error('Pack load cancelled');
  }
  private fetchAsset(owner: string, id: string, variant: { path: string; format: AssetFormat }): Promise<void> {
    if (this.disposed) return Promise.reject(new Error('Pack loader is closed'));
    if (this.resources.get(owner)?.has(id)) return Promise.resolve();
    const key = `${owner}\u0000${id}`;
    const existing = this.pending.get(key);
    if (existing && !existing.controller.signal.aborted) return existing.promise;
    const controller = new AbortController();
    // Publish the in-flight promise before invoking fetch so overlapping requests
    // share one response and one owned Blob URL rather than overwriting it.
    const promise = Promise.resolve().then(async () => {
      if (this.disposed || controller.signal.aborted) throw new Error('Pack load cancelled');
      const response = await this.fetchResource(`${import.meta.env.BASE_URL}${variant.path.replace(/^public\//u, '')}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
      const blob = await response.blob();
      if (this.disposed || controller.signal.aborted) throw new Error('Pack load cancelled');
      if (!this.resources.has(owner)) this.resources.set(owner, new Map());
      this.resources.get(owner)?.set(id, { id, url: this.createURL(blob), bytes: blob.size, format: variant.format });
    }).finally(() => {
      // An aborted request may settle after a new request with the same key.
      if (this.pending.get(key)?.controller === controller) this.pending.delete(key);
    });
    this.pending.set(key, { owner, controller, promise });
    return promise;
  }

  release(packId: string): void {
    if (packId === 'shell') return;
    if (this.activePack === packId) {
      this.activePack = null;
      this.readyGeneration = null;
      this.generation++;
    }
    for (const [key, pending] of this.pending) {
      if (pending.owner === packId) { pending.controller.abort(); this.pending.delete(key); }
    }
    for (const resource of this.resources.get(packId)?.values() ?? []) this.revokeURL(resource.url);
    this.resources.delete(packId);
  }
  loadedPackIds(): readonly string[] { return [...this.resources.keys()]; }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; this.activePack = null; this.readyGeneration = null; this.generation++;
    for (const pending of this.pending.values()) pending.controller.abort();
    this.pending.clear();
    for (const group of this.resources.values()) for (const resource of group.values()) this.revokeURL(resource.url);
    this.resources.clear();
  }
}
