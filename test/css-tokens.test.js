import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

// Every colour in the game stylesheet comes from the tokens in :root
// (docs/DESIGN-SYSTEM.md). Add a token instead of a one-off colour.
const css = readFileSync('styles.css', 'utf8');
const rootEnd = css.indexOf('}', css.indexOf(':root'));
const tokens = css.slice(0, rootEnd);
const rules = css.slice(rootEnd).replace(/\/\*[\s\S]*?\*\//g, '');

describe('colour tokens', () => {
  it('uses no one-off colours outside :root', () => {
    const literals = rules.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d+\s*,|(?<![-\w#.])(?:white|black)(?![-\w])/g) || [];
    expect(literals).toEqual([]);
  });

  it('defines every palette colour it uses', () => {
    const used = new Set([...rules.matchAll(/var\(--(rgb-[\w-]+)\)/g)].map((m) => m[1]));
    for (const name of used) expect(tokens, name).toContain(`--${name}:`);
  });
});
