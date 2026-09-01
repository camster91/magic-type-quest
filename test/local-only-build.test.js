import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { verifyLocalOnlyBuild } from '../scripts/verify-local-only-build.mjs';

const temporaryDirectories = [];

function fixture(files) {
  const root = mkdtempSync(resolve(tmpdir(), 'bloomtype-local-build-'));
  temporaryDirectories.push(root);
  for (const [path, contents] of Object.entries(files)) {
    const target = resolve(root, path);
    mkdirSync(resolve(target, '..'), { recursive: true });
    writeFileSync(target, contents);
  }
  return root;
}

afterEach(() => {
  temporaryDirectories.splice(0).forEach((path) => rmSync(path, { recursive: true, force: true }));
});

describe('local-only production artifact verification', () => {
  it('accepts static application artifacts with no cloud client configuration', () => {
    const root = fixture({ 'index.html': '<main>BloomType</main>', 'assets/main.js': 'localStorage.setItem("profile", "ok")' });
    expect(verifyLocalOnlyBuild(root).artifactCount).toBe(2);
  });

  it.each([
    ['project URL', 'https://example.supabase.co'],
    ['Vite variable', 'VITE_SUPABASE_ANON_KEY'],
    ['bundled client', 'new SupabaseClient(url, key)'],
  ])('rejects a compiled %s marker', (_label, marker) => {
    const root = fixture({ 'assets/main.js': marker });
    expect(() => verifyLocalOnlyBuild(root)).toThrow('Local-only build verification failed');
  });

  it('ignores binary assets while inspecting nested text artifacts', () => {
    const root = fixture({ 'assets/pet.png': 'https://example.supabase.co', 'manifest.json': '{"scope":"./"}' });
    expect(verifyLocalOnlyBuild(root).artifactCount).toBe(1);
  });
});
