import type { BiomeId } from '../curriculum/biomeMapping';

export interface BiomePalette { readonly token: string; readonly sky: string; readonly habitat: string; readonly ink: string; readonly accent: string; }
export const BIOME_PALETTES: Readonly<Record<BiomeId, BiomePalette>> = {
  'meadow-base': { token: 'palette.meadow-base', sky: '#EAF4E7', habitat: '#8CAC76', ink: '#284C3E', accent: '#D9A65F' },
  'forest-trail': { token: 'palette.forest-trail', sky: '#DDE8DC', habitat: '#638464', ink: '#24453A', accent: '#C69A5F' },
  wetlands: { token: 'palette.wetlands', sky: '#DDEAE7', habitat: '#6F9B8E', ink: '#284B4D', accent: '#C7A868' },
  'river-coast': { token: 'palette.river-coast', sky: '#DCEBF0', habitat: '#6F9FB0', ink: '#25495B', accent: '#D7B47E' },
  'mountain-research-station': { token: 'palette.mountain-research-station', sky: '#E7ECED', habitat: '#829596', ink: '#344C50', accent: '#C69662' },
  'wildlife-reserve': { token: 'palette.wildlife-reserve', sky: '#E5EDDF', habitat: '#6D8E6A', ink: '#2D493A', accent: '#D5AA69' },
};

export function getBiomePalette(id: BiomeId): BiomePalette { return BIOME_PALETTES[id]; }
