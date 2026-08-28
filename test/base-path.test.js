import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const deploymentFiles = [
  'index.html',
  'landing.html',
  'parents.html',
  'teacher.html',
  'src/assets.js',
  'src/gameEngine.js',
  'src/lessons.js',
  'src/main.js',
];

describe('deployment base paths', () => {
  it.each(deploymentFiles)('%s does not reference assets from the domain root', (file) => {
    const source = readFileSync(resolve(root, file), 'utf8');
    expect(source).not.toMatch(/["'=(]\/assets\//);
  });

  it('the landing page manifest is relative to the configured Vite base', () => {
    const source = readFileSync(resolve(root, 'landing.html'), 'utf8');
    expect(source).toContain('rel="manifest" href="manifest.json"');
    expect(source).not.toContain('href="/manifest.json"');
  });
});
