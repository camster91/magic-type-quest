// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { accessibilitySettings, applyAccessibility, isRelaxed } from '../src/accessibility.js';

describe('reading and play settings', () => {
  it('defaults safely for older profiles', () => {
    expect(accessibilitySettings({}, false)).toEqual({ font: 'default', highContrast: false, relaxed: false });
    expect(accessibilitySettings({ font: 'comic' }, false).font).toBe('default');
  });

  it('follows the device contrast setting until the child chooses', () => {
    expect(accessibilitySettings({}, true).highContrast).toBe(true);
    expect(accessibilitySettings({ highContrast: false }, true).highContrast).toBe(false);
  });

  it('puts the settings on the page root', () => {
    const root = document.createElement('html');
    applyAccessibility({ font: 'dyslexic', highContrast: true, relaxed: true }, root);
    expect(root.getAttribute('data-font')).toBe('dyslexic');
    expect(root.classList.contains('high-contrast')).toBe(true);
    expect(root.classList.contains('relaxed')).toBe(true);
    applyAccessibility({ highContrast: false }, root);
    expect(root.hasAttribute('data-font')).toBe(false);
    expect(root.classList.contains('high-contrast')).toBe(false);
  });

  it('relaxed mode stops words falling and the Daily Moment clock', () => {
    expect(isRelaxed({ relaxed: true })).toBe(true);
    const engine = readFileSync('src/gameEngine.js', 'utf8');
    expect(engine).toContain('const speed = isRelaxed(gameState.profile) ? 0 :');
    expect(engine).toContain("new GameWord(text, isRelaxed(gameState.profile) ? 0 : drillLesson.speed)");
    expect(engine).toMatch(/if \(isRelaxed\(gameState\.profile\)\) \{[\s\S]*?return;\s*\}\s*const remaining/);
  });

  it('ships the open-licensed fonts it offers', () => {
    for (const file of ['atkinson-hyperlegible-latin-400-normal.woff2', 'opendyslexic-latin-400-normal.woff2', 'LICENSE-atkinson-hyperlegible.txt', 'LICENSE-opendyslexic.txt']) {
      expect(() => readFileSync(`public/fonts/${file}`)).not.toThrow();
    }
  });
});
