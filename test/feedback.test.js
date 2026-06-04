import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const enginePath = resolve(__dirname, '../src/gameEngine.js');
const engineSrc = readFileSync(enginePath, 'utf-8');
const stylesPath = resolve(__dirname, '../styles.css');
const stylesSrc = readFileSync(stylesPath, 'utf-8');

describe('T26 - Audio + visual feedback on every keypress', () => {
  describe('per-keystroke glow on the keyboard', () => {
    it('declares a pulsePressedKey helper that touches ALL .key elements (not just target)', () => {
      expect(engineSrc).toMatch(/function\s+pulsePressedKey[\s\S]*?querySelectorAll\(`\.key\[data-key="\$\{key\.toLowerCase\(\)\}"\]`\)/);
    });

    it('removes + re-adds .pressed to re-fire the animation (reflow trick)', () => {
      expect(engineSrc).toMatch(/el\.classList\.remove\('pressed'\)[\s\S]*?void\s+el\.offsetWidth[\s\S]*?el\.classList\.add\('pressed'\)/);
    });

    it('auto-removes .pressed after exactly 200ms', () => {
      expect(engineSrc).toMatch(/setTimeout\(\(\)\s*=>\s*el\.classList\.remove\('pressed'\),\s*200\)/);
    });

    it('CSS .key.pressed animates over 0.2s', () => {
      expect(stylesSrc).toMatch(/\.key\.pressed\s*\{[\s\S]*?animation:\s*keyPress\s+0\.2s\s+ease-out/);
    });

    it('CSS @keyframes keyPress scales to 1.1+ at midpoint', () => {
      // 1.18 used so the pulse is visible above the 1.0 resting scale.
      expect(stylesSrc).toMatch(/@keyframes\s+keyPress[\s\S]*?50%\s*\{\s*transform:\s*scale\(1\.18\)/);
    });
  });

  describe('on correct key', () => {
    it('onCorrectKeystroke calls pulsePressedKey with the pressed key', () => {
      expect(engineSrc).toMatch(/function\s+onCorrectKeystroke[\s\S]*?pulsePressedKey\(key\)/);
    });

    it('onCorrectKeystroke pulses the target word (brighten glow)', () => {
      expect(engineSrc).toMatch(/function\s+onCorrectKeystroke[\s\S]*?pulseTargetWord\(\)/);
    });

    it('onCorrectKeystroke fires a +1 floater above the score', () => {
      expect(engineSrc).toMatch(/function\s+onCorrectKeystroke[\s\S]*?showPlusOneFloater\(\)/);
    });

    it('CSS .plus-one-floater animates over 0.8s', () => {
      expect(stylesSrc).toMatch(/\.plus-one-floater\s*\{[\s\S]*?animation:\s*plusOneFloat\s+0\.8s\s+ease-out\s+forwards/);
    });

    it('@keyframes plusOneFloat translates up and fades in 800ms', () => {
      // 0%: opacity 0, transform: translate(-50%, 0)
      // 100%: opacity 0, transform: translate(-50%, -32px) — the upward float
      expect(stylesSrc).toMatch(/@keyframes\s+plusOneFloat[\s\S]*?100%\s*\{\s*opacity:\s*0;\s*transform:\s*translate\(-50%,\s*-32px\)/);
    });
  });

  describe('on wrong key', () => {
    it('onWrongKeystroke calls flashWrongKey for the 200ms red flash', () => {
      expect(engineSrc).toMatch(/function\s+onWrongKeystroke[\s\S]*?flashWrongKey\(key\)/);
    });

    it('onWrongKeystroke also calls pulsePressedKey for tactile press', () => {
      expect(engineSrc).toMatch(/function\s+onWrongKeystroke[\s\S]*?pulsePressedKey\(key\)/);
    });

    it('CSS .key.flash-wrong animates over 0.2s', () => {
      expect(stylesSrc).toMatch(/\.key\.flash-wrong\s*\{[\s\S]*?animation:\s*wrongFlash\s+0\.2s\s+ease-out/);
    });

    it('CSS @keyframes wrongFlash starts with high red opacity then fades', () => {
      expect(stylesSrc).toMatch(/@keyframes\s+wrongFlash[\s\S]*?0%\s*\{\s*background:\s*rgba\(239,\s*68,\s*68,\s*0\.85\)/);
    });
  });

  describe('on word complete (particle burst + score floater)', () => {
    it('completeWord still calls spawnParticles (existing behavior, kept)', () => {
      expect(engineSrc).toMatch(/function\s+completeWord[\s\S]*?spawnParticles\(word\.x\s*\+\s*word\.width\s*\/\s*2,\s*word\.y,\s*15\)/);
    });

    it('completeWord still calls showScorePopup with totalPoints (existing behavior, kept)', () => {
      expect(engineSrc).toMatch(/function\s+completeWord[\s\S]*?showScorePopup\(totalPoints,\s*word\.x\s*\+\s*word\.width\s*\/\s*2,\s*word\.y\)/);
    });
  });

  describe('on combo milestone (5, 10, 15)', () => {
    it('declares COMBO_MILESTONES as exactly {5, 10, 15}', () => {
      expect(engineSrc).toMatch(/const\s+COMBO_MILESTONES\s*=\s*new\s+Set\(\[5,\s*10,\s*15\]\)/);
    });

    it('showComboFloater is called from completeWord after the combo increments', () => {
      // Look for the pattern: gameState.combo++ ... showComboFloater(gameState.combo)
      expect(engineSrc).toMatch(/gameState\.combo\+\+;[\s\S]{0,200}showComboFloater\(gameState\.combo\)/);
    });

    it('showComboFloater renders "COMBO x{N}!" text with the milestone number', () => {
      // The actual text is `COMBO x${combo}! 🔥`. The 🔥 emoji is fine in
      // source code but breaks string-equality in the test runner's regex
      // parser, so we anchor on the templated portion only.
      expect(engineSrc).toMatch(/el\.textContent\s*=\s*`COMBO x\$\{combo\}!/);
    });

    it('CSS .combo-floater animates over 0.8s', () => {
      expect(stylesSrc).toMatch(/\.combo-floater\s*\{[\s\S]*?animation:\s*comboFloaterPop\s+0\.8s\s+ease-out\s+forwards/);
    });
  });

  describe('on level complete (soft pink 300ms flash, not white 800ms)', () => {
    it('levelComplete no longer uses inline white 800ms screenFlash', () => {
      // The brief says: replace the harsh white 800ms flash with a soft pink
      // 300ms one. We must NOT find the old inline-style string.
      expect(engineSrc).not.toMatch(/background:white;z-index:25;pointer-events:none;animation:screenFlash\s+0\.8s/);
    });

    it('levelComplete calls showLevelFlash (the new pink helper)', () => {
      expect(engineSrc).toMatch(/function\s+levelComplete[\s\S]*?showLevelFlash\(\)/);
    });

    it('CSS .level-flash animates over 0.3s with the accent (pink) background', () => {
      expect(stylesSrc).toMatch(/\.level-flash\s*\{[\s\S]*?animation:\s*levelFlash\s+0\.3s\s+ease-out\s+forwards/);
      expect(stylesSrc).toMatch(/\.level-flash\s*\{[\s\S]*?background:\s*var\(--accent/);
    });
  });
});
