import type { LessonId } from './domain';
import { LESSON_ORDER } from './domain';

export type BiomeId = 'meadow-base' | 'forest-trail' | 'wetlands' | 'river-coast' | 'mountain-research-station' | 'wildlife-reserve';

export const BIOME_ORDER: readonly BiomeId[] = ['meadow-base', 'forest-trail', 'wetlands', 'river-coast', 'mountain-research-station', 'wildlife-reserve'];
export const LESSON_BIOMES: Readonly<Record<LessonId, BiomeId>> = {
  'meadow-fj': 'meadow-base',
  'meadow-growth': 'meadow-base',
  'meadow-review': 'meadow-base',
  'forest-upper': 'forest-trail',
  'wetlands-lower': 'wetlands',
  'river-shift': 'river-coast',
  'mountain-numbers': 'mountain-research-station',
  'mountain-punctuation': 'mountain-research-station',
  'reserve-fluency': 'wildlife-reserve',
};

export function getBiomeForLesson(id: LessonId): BiomeId {
  const biome = LESSON_BIOMES[id];
  if (!biome) throw new Error(`Missing biome for lesson ${id}`);
  return biome;
}

export function auditBiomeMapping(): readonly string[] {
  const assigned = Object.keys(LESSON_BIOMES);
  return [...LESSON_ORDER.filter((id) => !assigned.includes(id)), ...assigned.filter((id) => !LESSON_ORDER.includes(id as LessonId))];
}
