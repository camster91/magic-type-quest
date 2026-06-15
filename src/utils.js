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

/** Converts hex color and alpha to RGBA string. */
export function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Sanitizes a string for CSV export to prevent Formula Injection and structural corruption. */
export function sanitizeCSVField(val) {
  if (val === null || val === undefined) return '';
  let str = String(val);

  // 1. Formula Injection mitigation: prepend ' if starts with =, +, -, @, or `
  if (/^[=+\-@\x60]/.test(str)) {
    str = "'" + str;
  }

  // 2. Structural integrity: escape double quotes by doubling them
  const needsQuotes = str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r');
  if (needsQuotes) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }

  return str;
}
