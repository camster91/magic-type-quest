import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { describe, it } from 'vitest';

const require = createRequire(import.meta.url);

describe('reviewed Phaser startup contract (#165)', () => {
  it('requires explicit review when the pinned upstream startup changes', () => {
    const packagePath = require.resolve('phaser/package.json');
    const metadata = JSON.parse(readFileSync(packagePath, 'utf8'));
    assert.equal(metadata.version, '4.2.1', 'Review createWorldGame against the new Phaser version before changing this guard.');
    const source = readFileSync(resolve(dirname(packagePath), 'src/core/Game.js'), 'utf8');
    const start = source.match(/\n    start: function \(\)[\s\S]*?\n    },/u)?.[0];
    assert.ok(start, 'Expected reviewed Phaser protected start() method.');
    const digest = createHash('sha256').update(start.replace(/\s+/gu, '')).digest('hex');
    assert.equal(digest, '47db288e222eafbd8a14cb2febeb3c6de47e8e8bb043740f677fe0e6560c7768',
      'Upstream startup changed: review postBoot, loop and event ownership; do not blindly replace this digest.');
  });
});
