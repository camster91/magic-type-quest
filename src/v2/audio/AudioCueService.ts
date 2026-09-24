import { audioById } from './manifest';

export interface AudioPreferences { readonly muted: boolean; readonly effectsVolume: number; readonly ambienceVolume: number; }
export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = { muted: false, effectsVolume: 0.15, ambienceVolume: 0.08 };
const volume = (value: number): number => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
type Media = Pick<HTMLAudioElement, 'src' | 'volume' | 'loop' | 'play' | 'pause' | 'currentTime' | 'addEventListener' | 'removeEventListener'>;

/** A silent-by-default adapter until approved media exists. Browser gesture unlock is explicit. */
export class AudioCueService {
  private preferences: AudioPreferences = DEFAULT_AUDIO_PREFERENCES;
  private unlocked = false;
  private disposed = false;
  private ambient: Media | null = null;
  private readonly active = new Set<Media>();
  private readonly finished = new Map<Media, () => void>();
  constructor(private readonly createMedia: () => Media = () => new Audio(), private readonly canPlay: (format: string) => boolean = (format) => new Audio().canPlayType(`audio/${format}`) !== '') {}
  setPreferences(next: Partial<AudioPreferences>): AudioPreferences {
    this.preferences = { muted: next.muted ?? this.preferences.muted, effectsVolume: volume(next.effectsVolume ?? this.preferences.effectsVolume),
      ambienceVolume: volume(next.ambienceVolume ?? this.preferences.ambienceVolume) };
    if (this.preferences.muted) for (const media of this.active) media.pause();
    for (const media of this.active) media.volume = media === this.ambient ? this.preferences.ambienceVolume : this.preferences.effectsVolume;
    return this.preferences;
  }
  getPreferences(): AudioPreferences { return this.preferences; }
  /** Call only after a trusted browser gesture. No media play occurs here. */
  unlock(): void { if (!this.disposed) this.unlocked = true; }
  async play(id: string): Promise<boolean> {
    const asset = audioById.get(id);
    if (!asset) throw new Error(`Unknown audio cue ${id}`);
    if (this.disposed || !this.unlocked || this.preferences.muted || asset.status !== 'implemented') return false;
    const source = asset.sources.find((entry) => this.canPlay(entry.format));
    if (!source) return false;
    const media = this.createMedia(); media.src = `${import.meta.env.BASE_URL}${source.path.replace(/^public\//u, '')}`;
    media.loop = asset.loop; media.volume = asset.category === 'ambient' ? this.preferences.ambienceVolume : this.preferences.effectsVolume;
    if (!asset.loop && this.active.size >= 4) {
      const oldest = [...this.active].find((item) => item !== this.ambient);
      if (oldest) { oldest.pause(); this.release(oldest); }
    }
    this.active.add(media);
    if (asset.loop) { if (this.ambient) { this.ambient.pause(); this.release(this.ambient); } this.ambient = media; }
    const finished = (): void => this.release(media);
    this.finished.set(media, finished);
    media.addEventListener('ended', finished);
    try { await media.play(); return true; }
    catch { finished(); return false; }
  }
  private release(media: Media): void {
    const listener = this.finished.get(media);
    if (listener) media.removeEventListener('ended', listener);
    this.finished.delete(media); this.active.delete(media);
    if (this.ambient === media) this.ambient = null;
  }
  pauseAmbient(): void { this.ambient?.pause(); }
  resumeAmbient(): void { if (this.unlocked && !this.preferences.muted && this.ambient) void this.ambient.play().catch(() => {}); }
  dispose(): void { if (this.disposed) return; this.disposed = true; for (const media of this.active) { media.pause(); media.currentTime = 0; this.release(media); } }
}
