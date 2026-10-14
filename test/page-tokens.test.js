import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { colourLiterals } from './helpers/cssColors.js';

// The teacher, parent and landing pages, the printables and the school billing
// templates carry their own <style> block. Like styles.css, every colour in it
// must come from that page's :root tokens.
const PAGES = [
  'teacher.html',
  'parents.html',
  'landing.html',
  'public/printables/certificate.html',
  'public/printables/home-row-poster.html',
  'public/billing/quote.html',
  'public/billing/invoice.html',
  'public/billing/vendor-info.html',
];

for (const page of PAGES) {
  describe(`${page} colour tokens`, () => {
    const style = readFileSync(page, 'utf8').match(/<style[^>]*>([\s\S]*?)<\/style>/)[1];
    const root = style.match(/:root\s*\{[^}]*\}/)[0];
    const rules = style.slice(style.indexOf(root) + root.length);

    it('uses no one-off colours outside :root', () => {
      expect(colourLiterals(rules)).toEqual([]);
    });

    it('defines every token it uses', () => {
      const used = new Set([...rules.matchAll(/var\(--([\w-]+)\)/g)].map((m) => m[1]));
      for (const name of used) expect(root, name).toContain(`--${name}:`);
    });
  });
}
