import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanTheme } from '../scripts/check-v2-theme.mjs';

function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'nature-quest-theme-'));
  try { run(root); } finally { rmSync(root, { recursive: true, force: true }); }
}

test('rejects prohibited child-facing terms in source and localised content, case-insensitively', () => fixture((root) => {
  mkdirSync(join(root, 'src/v2'), { recursive: true });
  mkdirSync(join(root, 'content/v2/fr'), { recursive: true });
  writeFileSync(join(root, 'src/v2/scene.ts'), 'const label = "Magic spell";\n');
  writeFileSync(join(root, 'content/v2/fr/mission.json'), '{"hint":"Mystical rune"}');
  assert.deepEqual(scanTheme(root).map((violation) => violation.split(': prohibited')[0]), [
    'src/v2/scene.ts:1', 'src/v2/scene.ts:1', 'content/v2/fr/mission.json:1', 'content/v2/fr/mission.json:1',
  ]);
}));

test('does not scan historical v1, decision documents, or unrelated tests', () => fixture((root) => {
  mkdirSync(join(root, 'src/v1'), { recursive: true });
  mkdirSync(join(root, 'docs/v2'), { recursive: true });
  writeFileSync(join(root, 'src/v1/legacy.js'), 'magic');
  writeFileSync(join(root, 'docs/v2/decision.md'), 'magic');
  assert.deepEqual(scanTheme(root), []);
}));

test('requires an exact path, term, and rationale for an exception', () => fixture((root) => {
  mkdirSync(join(root, 'public/v2'), { recursive: true });
  writeFileSync(join(root, 'public/v2/story.html'), 'A wizard and a fox');
  assert.equal(scanTheme(root, [{ path: 'public/v2/story.html', term: 'wizard', reason: 'Explicit review exception' }]).length, 0);
  assert.equal(scanTheme(root, [{ path: 'public/v2/other.html', term: 'wizard', reason: 'Wrong file' }]).length, 1);
  assert.throws(() => scanTheme(root, [{ path: 'public/v2/story.html', term: 'wizard', reason: '' }]));
  assert.throws(() => scanTheme(root, [{ path: '../src/v2/story.ts', term: 'wizard', reason: 'Outside scope' }]));
}));

test('covers every minimum prohibited root and common variations', () => fixture((root) => {
  mkdirSync(join(root, 'public/v2'), { recursive: true });
  const terms = ['spell', 'magic', 'witch', 'wizard', 'sorcery', 'potion', 'mana', 'rune', 'enchanted', 'arcane', 'mystical', 'witchcraft', 'enchantment'];
  writeFileSync(join(root, 'public/v2/labels.json'), JSON.stringify(terms));
  assert.equal(scanTheme(root).length, terms.length);
}));
