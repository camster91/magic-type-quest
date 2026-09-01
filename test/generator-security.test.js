import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { getGoogleApiKey } from '../scripts/google-api-key.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const googleScripts = [
  'generate-backgrounds.mjs',
  'generate-badges-achievements.mjs',
  'generate-guides-particles.mjs',
  'generate-ui-elements.mjs',
  'list-models.mjs',
];

describe('Google asset-tool credentials', () => {
  it('requires the operator-provided environment variable', () => {
    expect(() => getGoogleApiKey({})).toThrow('Set GOOGLE_IMAGEN_API_KEY');
    expect(getGoogleApiKey({ GOOGLE_IMAGEN_API_KEY: ' test-key ' })).toBe('test-key');
  });

  it('does not embed Google API keys in tracked generator scripts', () => {
    for (const filename of googleScripts) {
      const source = readFileSync(resolve(root, 'scripts', filename), 'utf8');
      expect(source).not.toMatch(/AIza[0-9A-Za-z_-]{20,}/);
      expect(source).toContain('getGoogleApiKey()');
    }
  });
});
