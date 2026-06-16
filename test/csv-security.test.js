/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { sanitizeCSVField } from '../src/utils.js';

describe('CSV Security - sanitizeCSVField', () => {
  it('should neutralize formula injection triggers', () => {
    // Note: =SUM(1,2) contains a comma, so it will be wrapped in double quotes
    expect(sanitizeCSVField('=SUM(1,2)')).toBe('"\'=SUM(1,2)"');
    expect(sanitizeCSVField('+10-5')).toBe("'+10-5");
    expect(sanitizeCSVField('-123')).toBe("'-123");
    expect(sanitizeCSVField('@internal')).toBe("'@internal");
  });

  it('should escape double quotes by doubling them', () => {
    expect(sanitizeCSVField('John "The Gun" Doe')).toBe('"John ""The Gun"" Doe"');
  });

  it('should wrap fields in double quotes if they contain commas', () => {
    expect(sanitizeCSVField('Doe, John')).toBe('"Doe, John"');
  });

  it('should wrap fields in double quotes if they contain newlines', () => {
    expect(sanitizeCSVField("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
  });

  it('should handle null and undefined gracefully', () => {
    expect(sanitizeCSVField(null)).toBe("");
    expect(sanitizeCSVField(undefined)).toBe("");
  });

  it('should handle numeric values correctly', () => {
    expect(sanitizeCSVField(123)).toBe("123");
    expect(sanitizeCSVField(0)).toBe("0");
  });

  it('should handle special characters and formula triggers together', () => {
    // Formula trigger + comma means it should be prepended with ' AND wrapped in "
    expect(sanitizeCSVField('=Data, with comma')).toBe('"\'=Data, with comma"');
  });
});
