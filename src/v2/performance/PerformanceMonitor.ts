export interface PerformanceSnapshot { fps: number; frameMs: number; textures: number; scenes: readonly string[]; packs: readonly string[]; inputP95Ms: number | null; }
/** Development diagnostics remain local and stop on shell disposal. */
export class PerformanceMonitor {
  private readonly frames: number[] = [];
  private readonly latencies: number[] = [];
  private frameRequest = 0;
  private lastFrame = 0;
  private lastReport = 0;
  private disposed = false;
  constructor(private readonly snapshotWorld: () => { textures: number; scenes: readonly string[]; packs: readonly string[] },
    private readonly report: (snapshot: PerformanceSnapshot) => void,
    private readonly now: () => number = () => performance.now(),
    private readonly requestFrame: typeof requestAnimationFrame = requestAnimationFrame,
    private readonly cancelFrame: typeof cancelAnimationFrame = cancelAnimationFrame) {}
  start(): void { if (!this.disposed && !this.frameRequest) this.frameRequest = this.requestFrame(this.frame); }
  recordInputFeedback(ms: number): void {
    if (this.disposed || !Number.isFinite(ms) || ms < 0) return;
    this.latencies.push(ms); if (this.latencies.length > 100) this.latencies.shift();
  }
  private readonly frame = (): void => {
    if (this.disposed) return;
    const time = this.now();
    if (this.lastFrame) { this.frames.push(time - this.lastFrame); if (this.frames.length > 120) this.frames.shift(); }
    this.lastFrame = time;
    if (time - this.lastReport >= 1000) {
      this.lastReport = time;
      const mean = this.frames.length ? this.frames.reduce((sum, value) => sum + value, 0) / this.frames.length : 0;
      const sorted = [...this.latencies].sort((a, b) => a - b);
      this.report({ fps: mean ? Math.round(1000 / mean) : 0, frameMs: Math.round(mean * 10) / 10,
        ...this.snapshotWorld(), inputP95Ms: sorted.length ? sorted[Math.ceil(sorted.length * 0.95) - 1] ?? null : null });
    }
    this.frameRequest = this.requestFrame(this.frame);
  };
  dispose(): void { if (this.disposed) return; this.disposed = true; if (this.frameRequest) this.cancelFrame(this.frameRequest); this.frameRequest = 0; }
}
