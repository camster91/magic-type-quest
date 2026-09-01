import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { deleteLocalProfile, gameState, saveProfile } from '../src/state.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function memoryStorage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

describe('privacy operations', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
    gameState.score = 0;
    gameState.wordsTyped = 0;
    gameState.savedWordsTyped = 0;
    gameState.savedScoreStars = 0;
    gameState.levelWPM = 0;
    gameState.profile = {
      name: 'Ada', avatar: '🌸', uuid: 'student-1', classCode: 'ABC123',
      totalStars: 0, totalWords: 0, highScore: 0, completedLevels: [],
    };
  });

  it('removes stale teacher-readable copies when a student is renamed', () => {
    saveProfile();
    gameState.profile.name = 'Grace';
    saveProfile();
    const profileKeys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
      .filter((key) => key.startsWith('bloomtype_profile_'));
    expect(profileKeys).toEqual(['bloomtype_profile_Grace']);
  });

  it('counts session words and score stars once across repeated saves', () => {
    gameState.wordsTyped = 2;
    gameState.score = 29;
    saveProfile();
    saveProfile();
    expect(gameState.profile.totalWords).toBe(2);
    expect(gameState.profile.totalStars).toBe(2);

    gameState.wordsTyped = 3;
    gameState.score = 35;
    saveProfile();
    expect(gameState.profile.totalWords).toBe(3);
    expect(gameState.profile.totalStars).toBe(3);
  });

  it('deletes the current profile and class membership without clearing unrelated site data', () => {
    localStorage.setItem('unrelated-setting', 'keep');
    saveProfile();
    expect(localStorage.getItem('bloomtype-class-ABC123')).not.toBeNull();

    deleteLocalProfile();

    const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index));
    expect(keys).not.toContain('bloomtype-profile');
    expect(keys.some((key) => key.startsWith('bloomtype_profile_'))).toBe(false);
    expect(keys.some((key) => key.startsWith('bloomtype-class-'))).toBe(false);
    expect(localStorage.getItem('unrelated-setting')).toBe('keep');
    expect(gameState.profile.name).toBe('Player');
  });

  it('keeps the public deployment local-only and makes marketing collection claims truthful', () => {
    const compose = readFileSync(resolve(root, 'deploy/docker-compose.production.yml'), 'utf8');
    const landing = readFileSync(resolve(root, 'landing.html'), 'utf8');
    const parents = readFileSync(resolve(root, 'parents.html'), 'utf8');
    const index = readFileSync(resolve(root, 'index.html'), 'utf8');

    expect(compose).not.toMatch(/VITE_SUPABASE_(?:URL|ANON_KEY)/);
    expect(landing).not.toContain('id="signup-form"');
    expect(landing).not.toContain('[BloomType] signup email:');
    expect(landing).not.toMatch(/COPPA-safe|fonts\.googleapis\.com|fonts\.gstatic\.com/);
    expect(index).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
    expect(landing).toContain('The BloomType website does not collect or store your address.');
    expect(parents).toContain('Delete local progress');
    expect(index).toContain('id="btn-delete-profile"');
    expect(index).toContain('id="btn-delete-cloud-profile"');
    expect(index).toMatch(/id="btn-delete-cloud-profile"[^>]+hidden/);
  });
});
