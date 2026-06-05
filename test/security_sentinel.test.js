
import { describe, it, expect } from 'vitest';
import { escapeHTML } from '../src/utils.js';

describe('escapeHTML', () => {
  it('should escape HTML characters', () => {
    expect(escapeHTML('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('should handle 0 correctly', () => {
    expect(escapeHTML(0)).toBe('0');
  });

  it('should handle empty string', () => {
    expect(escapeHTML('')).toBe('');
  });

  it('should handle null/undefined', () => {
    expect(escapeHTML(null)).toBe('');
    expect(escapeHTML(undefined)).toBe('');
  });
});
