/**
 * BloomType — Shared Utilities
 */

/** Simple HTML escape to prevent XSS. */
export function escapeHTML(str) {
  if (str === 0) return '0';
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
