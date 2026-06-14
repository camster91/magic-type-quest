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

/** Cache for parsed RGB values to avoid redundant string parsing. */
const HEX_CACHE = new Map();

/** Converts hex color and alpha to RGBA string. */
export function hexToRgba(hex, alpha) {
  let rgb = HEX_CACHE.get(hex);
  if (!rgb) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    rgb = `${r}, ${g}, ${b}`;
    HEX_CACHE.set(hex, rgb);
  }
  return `rgba(${rgb}, ${alpha})`;
}
