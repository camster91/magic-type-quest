import { describe, it, expect } from 'vitest';
import { hexToRgba } from '../src/utils.js';

describe('hexToRgba', () => {
  it('converts hex to rgba string correctly', () => {
    expect(hexToRgba('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    expect(hexToRgba('#00ff00', 1)).toBe('rgba(0, 255, 0, 1)');
    expect(hexToRgba('#0000ff', 0)).toBe('rgba(0, 0, 255, 0)');
  });

  it('uses cache on subsequent calls', () => {
    // First call populates cache
    const first = hexToRgba('#ffffff', 0.8);
    expect(first).toBe('rgba(255, 255, 255, 0.8)');

    // Second call should use cached value
    const second = hexToRgba('#ffffff', 0.5);
    expect(second).toBe('rgba(255, 255, 255, 0.5)');
  });

  it('handles different casing if provided consistently', () => {
    expect(hexToRgba('#ABCDEF', 0.1)).toBe('rgba(171, 205, 239, 0.1)');
    expect(hexToRgba('#abcdef', 0.1)).toBe('rgba(171, 205, 239, 0.1)');
  });
});
