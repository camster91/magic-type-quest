import { describe, it, expect } from 'vitest';
import { getPetPath, getPetImage, PET_EMOJI_TO_NAME, PET_STATES, PET_NAME_LIST } from '../src/assets.js';

describe('Asset registry', () => {
  it('maps every emoji to a pet name', () => {
    for (const emoji of Object.keys(PET_EMOJI_TO_NAME)) {
      expect(PET_NAME_LIST).toContain(PET_EMOJI_TO_NAME[emoji]);
    }
  });

  it('returns 5 valid pet states', () => {
    expect(PET_STATES).toEqual(['idle', 'happy', 'hurt', 'celebrate', 'fire']);
  });

  it('returns a state-aware pet path', () => {
    const path = getPetPath('🌸', 'happy');
    expect(path).toBe('/assets/pets/flower-happy.png');
  });

  it('falls back to flower for unknown emoji', () => {
    const path = getPetPath('🦄', 'idle');
    expect(path).toBe('/assets/pets/flower-idle.png');
  });

  it('returns idle by default if state omitted', () => {
    const path = getPetPath('🐉');
    expect(path).toBe('/assets/pets/dragon-idle.png');
  });
});
