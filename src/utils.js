/**
 * BloomType — Shared Utilities
 */

/** Simple HTML escape to prevent XSS. */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const HEX_CACHE = new Map();

/**
 * Converts hex color and alpha to RGBA string.
 * ⚡ Bolt: Added a cache for parsed RGB components to avoid redundant parsing in high-frequency loops.
 */
export function hexToRgba(hex, alpha) {
  let rgb = HEX_CACHE.get(hex);
  if (!rgb) {
    rgb = {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16)
    };
    HEX_CACHE.set(hex, rgb);
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}
