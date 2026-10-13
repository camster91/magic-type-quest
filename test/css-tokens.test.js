import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { colourLiterals } from './helpers/cssColors.js';

// Every colour in the game stylesheet comes from the tokens in :root
// (docs/DESIGN-SYSTEM.md). Add a token instead of a one-off colour.
const css = readFileSync('styles.css', 'utf8');
const rootEnd = css.indexOf('}', css.indexOf(':root'));
const tokens = css.slice(0, rootEnd);
const rules = css.slice(rootEnd + 1);

describe('colour tokens', () => {
  it('uses no one-off colours outside :root', () => {
    expect(colourLiterals(rules)).toEqual([]);
  });

  it('catches every way of writing a colour', () => {
    const sample = `a { color: red; background: hsl(120 50% 50%); border-color: rgb(1 2 3 / 50%); fill: #abc;
      outline-color: oklch(70% 0.1 200); white-space: nowrap; box-shadow: 0 0 2px rgba(var(--rgb-ink), 0.4);
      background-image: url("red.png"); font-family: 'Gold Rush'; transition: color 1s; }`;
    expect(colourLiterals(sample).sort()).toEqual(['#abc', 'hsl(120 50% 50%)', 'oklch(70% 0.1 200)', 'red', 'rgb(1 2 3 / 50%)']);
  });

  it('defines every palette colour it uses', () => {
    const used = new Set([...rules.matchAll(/var\(--(rgb-[\w-]+)\)/g)].map((m) => m[1]));
    for (const name of used) expect(tokens, name).toContain(`--${name}:`);
  });
});
