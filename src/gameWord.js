import { gameState } from './state.js';
import { hexToRgba } from './utils.js';

const WORD_COLORS = {
  primary: '#8B5CF6',
  success: '#34D399',
};

/** Canvas-backed word model: movement, focus scoring, bounds, and drawing. */
export class GameWord {
  constructor(text, speed) {
    this.text = text;
    this.speed = speed;
    this.x = 0;
    this.y = -50;
    this.isTarget = false;
    this.matched = 0;
    this.typedWidth = 0;
    this.glow = 0;
    this.shake = 0;
    this.width = 0;
    this.height = 36;
    this.focus = 100;
  }

  update(deltaTime) {
    if (typeof window !== 'undefined' && window.__bloomtypeT15Overlay) {
      this.y = -200;
      this.speed = 0;
      this.glow = Math.max(0, this.glow - deltaTime * 3);
      this.shake = Math.max(0, this.shake - deltaTime * 5);
      return;
    }
    this.y += this.speed * 60 * deltaTime;
    this.glow = Math.max(0, this.glow - deltaTime * 3);
    this.shake = Math.max(0, this.shake - deltaTime * 5);
    const groundY = gameState.canvasH - 220;
    if (groundY > 0) {
      this.focus = Math.max(0, Math.min(100, 100 * (1 - this.y / groundY)));
    }
  }

  getScoreMultiplier() {
    return 0.5 + (this.focus / 100) * 0.5;
  }

  draw(ctx) {
    if (typeof window !== 'undefined' && window.__bloomtypeT15Overlay) return;
    const shakeX = this.shake > 0 ? (Math.random() - 0.5) * 6 : 0;
    const x = this.x + shakeX;

    if (this.glow > 0 || this.isTarget) {
      const alphaBase = this.isTarget ? 0.8 : this.glow * 0.6;
      const glowColor = this.isTarget ? WORD_COLORS.success : WORD_COLORS.primary;
      ctx.fillStyle = hexToRgba(glowColor, alphaBase * 0.3);
      ctx.beginPath();
      ctx.roundRect(x - 16, this.y - this.height / 2 - 12, this.width + 32, this.height + 24, 20);
      ctx.fill();
      ctx.fillStyle = hexToRgba(glowColor, alphaBase * 0.5);
      ctx.beginPath();
      ctx.roundRect(x - 12, this.y - this.height / 2 - 8, this.width + 24, this.height + 16, 18);
      ctx.fill();
    }

    if (this.isTarget) {
      ctx.fillStyle = 'rgba(52, 211, 153, 0.35)';
      ctx.strokeStyle = WORD_COLORS.success;
    } else {
      const hue = Math.round((this.focus / 100) * 120);
      ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.30)`;
      ctx.strokeStyle = `hsla(${hue}, 70%, 70%, 0.8)`;
    }
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 8, this.y - this.height / 2 - 4, this.width + 16, this.height + 8, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 26px Nunito, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, x + 10, this.y);

    if (this.matched > 0) {
      ctx.fillStyle = WORD_COLORS.success;
      ctx.fillRect(x + 10, this.y + 12, this.typedWidth, 5);
    }
    if (this.isTarget) {
      ctx.fillStyle = WORD_COLORS.success;
      ctx.font = '14px Nunito';
      ctx.textAlign = 'center';
      ctx.fillText('▶', x + this.width / 2, this.y - this.height / 2 - 12);
    }
  }

  isAtBottom() {
    return this.y > gameState.canvasH - 220;
  }
}
