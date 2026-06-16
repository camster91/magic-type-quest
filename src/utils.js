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

/** Sanitizes a field for CSV export to prevent Formula Injection and ensure structural integrity. */
export function sanitizeCSVField(val) {
  let str = val === null || val === undefined ? '' : String(val);

  // 1. Mitigate Formula Injection (CSV Injection)
  // Trigger characters: =, +, -, @, \t, \r
  if (str.length > 0 && /^[=\+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }

  // 2. Escape double quotes (doubling them)
  let result = str.replace(/"/g, '""');

  // 3. Wrap in double quotes if it contains delimiters
  if (result.includes('"') || result.includes(',') || result.includes('\n') || result.includes('\r')) {
    result = `"${result}"`;
  }

  return result;
}
