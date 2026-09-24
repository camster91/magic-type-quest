export type AudioCategory = 'ui' | 'correct' | 'incorrect' | 'sequence' | 'restoration' | 'discovery' | 'milestone' | 'ambient';
export interface AudioAsset {
  readonly id: string; readonly category: AudioCategory; readonly status: 'planned' | 'implemented';
  readonly sources: readonly { readonly path: string; readonly format: 'webm' | 'ogg' | 'mp3'; readonly bytes: number }[];
  readonly provenance: { readonly origin: string; readonly licence: 'pending' | 'owned' | 'licensed'; readonly referenceId: string };
  readonly durationMs: number | null; readonly loop: boolean; readonly preloadGroup: 'shell' | 'mission' | 'optional';
  readonly normalizedLufs: number; readonly fallback: 'visualAndDOM' | 'visualState';
}
const planned = (id: string, category: AudioCategory, loop = false): AudioAsset => ({
  id, category, status: 'planned', sources: [], provenance: { origin: 'planned', licence: 'pending', referenceId: 'AUDIO-CUES-v1' },
  durationMs: null, loop, preloadGroup: category === 'ambient' ? 'optional' : category === 'ui' ? 'shell' : 'mission',
  normalizedLufs: -22, fallback: ['sequence', 'restoration', 'discovery', 'milestone'].includes(category) ? 'visualAndDOM' : 'visualState',
});
export const AUDIO_MANIFEST: readonly AudioAsset[] = [
  planned('audio.ui.confirm', 'ui'), planned('audio.ui.back', 'ui'),
  planned('audio.key.correct', 'correct'), planned('audio.key.retry', 'incorrect'),
  planned('audio.sequence.complete', 'sequence'), planned('audio.restoration', 'restoration'),
  planned('audio.discovery', 'discovery'), planned('audio.biome.milestone', 'milestone'),
  planned('audio.ambient.meadow', 'ambient', true),
];
export const audioById = new Map(AUDIO_MANIFEST.map((asset) => [asset.id, asset]));
export function validateAudioManifest(entries: readonly AudioAsset[] = AUDIO_MANIFEST): readonly string[] {
  const errors: string[] = []; const ids = new Set<string>();
  for (const [index, asset] of entries.entries()) {
    const path = `audio[${index}]`;
    if (ids.has(asset.id)) errors.push(`${path}: duplicate ${asset.id}`); ids.add(asset.id);
    if (!asset.provenance?.referenceId || !asset.provenance.licence || !asset.fallback || !Number.isFinite(asset.normalizedLufs)) errors.push(`${path}: incomplete provenance/fallback`);
    if (asset.status === 'planned' && (asset.sources.length || asset.durationMs !== null)) errors.push(`${path}: planned audio has built media`);
    if (asset.status === 'implemented' && (!asset.sources.length || !asset.durationMs || asset.provenance.licence === 'pending')) errors.push(`${path}: implemented audio needs licensed sources/duration`);
    for (const source of asset.sources) if (!source.path.startsWith('public/assets/v2/audio/') || source.path.includes('..') || source.bytes < 1) errors.push(`${path}: invalid source`);
  }
  return errors;
}
