import { beforeAll, describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
let document;
let css;
let engineSource;
let canvasSource;

beforeAll(() => {
  const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8');
  document = new JSDOM(html).window.document;
  css = readFileSync(resolve(__dirname, '../styles.css'), 'utf8');
  engineSource = readFileSync(resolve(__dirname, '../src/gameEngine.js'), 'utf8');
  canvasSource = readFileSync(resolve(__dirname, '../src/gameCanvas.js'), 'utf8');
});

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((value) => parseInt(value, 16) / 255);
  const [r, g, b] = channels.map((value) => (
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  ));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe('game accessibility contracts', () => {
  const dialogs = [
    'pause-overlay',
    'chapter-intro',
    'evolution-overlay',
    'level-overlay',
    'gameover-overlay',
    'finger-guide',
    'tutorial-overlay',
  ];

  it('names every game dialog and keeps it hidden from assistive technology when closed', () => {
    for (const id of dialogs) {
      const dialog = document.getElementById(id);
      expect(dialog, id).not.toBeNull();
      expect(dialog.getAttribute('role'), id).toBe('dialog');
      expect(dialog.getAttribute('aria-modal'), id).toBe('true');
      expect(dialog.getAttribute('aria-hidden'), id).toBe('true');

      const labelId = dialog.getAttribute('aria-labelledby');
      expect(labelId, id).toBeTruthy();
      expect(document.getElementById(labelId), `${id} label`).not.toBeNull();
    }
  });

  it('gives the mobile keyboard sink an accessible name without adding it to tab order', () => {
    const input = document.getElementById('mobile-input');
    expect(input.getAttribute('aria-label')).toBe('Type the current word');
    expect(input.getAttribute('tabindex')).toBe('-1');
    expect(input.hasAttribute('aria-hidden')).toBe(false);
  });

  it('provides a programmatic focus target for active gameplay', () => {
    const game = document.getElementById('game-screen');
    expect(game.getAttribute('tabindex')).toBe('-1');
    expect(game.getAttribute('aria-label')).toBe('Typing game');
  });

  it('keeps core text and compact control palettes at WCAG AA contrast', () => {
    const normalTextPairs = [
      ['#F8FAFC', '#6D28D9'], // primary button
      ['#F8FAFC', '#DC2626'], // danger button
      ['#CBD5E1', '#4338CA'], // secondary text on the lightest app background
      ['#DDD6FE', '#4338CA'], // primary-light text
      ['#FBCFE8', '#4338CA'], // accent-light text
      ['#6EE7B7', '#4338CA'], // success text
      ['#FECACA', '#4338CA'], // danger text
      ['#F8FAFC', '#B91C1C'], // pinky key label
      ['#F8FAFC', '#C2410C'], // ring-finger key label
      ['#F8FAFC', '#15803D'], // index-finger key label
    ];

    for (const [foreground, background] of normalTextPairs) {
      expect(contrastRatio(foreground, background), `${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('defines 44px touch targets and top-aligned short-landscape scrolling', () => {
    expect(css).toMatch(/\.screen\s*\{[^}]*justify-content:\s*safe center;/s);
    expect(css).toMatch(/\.btn-icon-only\s*\{[^}]*width:\s*44px;\s*height:\s*44px;/s);
    expect(css).toMatch(/\.menu-link\s*\{[^}]*min-height:\s*44px;/s);
    expect(css).toMatch(/@media \(max-height:\s*500px\) and \(orientation:\s*landscape\)[\s\S]*#menu-screen\s*\{\s*justify-content:\s*flex-start;/);
  });

  it('removes decorative motion in CSS and canvas effects when reduced motion is requested', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*animation-duration:\s*0\.01ms\s*!important;/);
    expect(css).toMatch(/\.plus-one-floater,[\s\S]*\.level-flash\s*\{\s*display:\s*none\s*!important;/);
    expect(engineSource).toMatch(/function prefersReducedMotion\(\)/);
    expect(canvasSource).toMatch(/function spawnParticles[\s\S]*if \(prefersReducedMotion\(\)\) return;/);
    expect(canvasSource).toMatch(/function spawnConfetti[\s\S]*if \(prefersReducedMotion\(\)\) return;/);
  });
});
