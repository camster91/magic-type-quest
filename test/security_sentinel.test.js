import { describe, it, expect } from 'vitest';
import { escapeHTML } from '../src/utils.js';

describe('Security: Sanitization', () => {
    describe('escapeHTML', () => {
        it('escapes dangerous characters', () => {
            const input = '<img src=x onerror=alert(1)> & "quotes"';
            const output = escapeHTML(input);
            expect(output).not.toContain('<');
            expect(output).not.toContain('>');
            expect(output).toContain('&lt;');
            expect(output).toContain('&gt;');
            expect(output).toContain('&amp;');
            expect(output).toContain('&quot;');
        });

        it('correctly handles numeric 0', () => {
            expect(escapeHTML(0)).toBe('0');
        });

        it('handles null and undefined', () => {
            expect(escapeHTML(null)).toBe('');
            expect(escapeHTML(undefined)).toBe('');
        });

        it('handles empty string', () => {
            expect(escapeHTML('')).toBe('');
        });

        it('handles other falsy values', () => {
            expect(escapeHTML(false)).toBe('false');
            expect(escapeHTML(NaN)).toBe('NaN');
        });
    });
});
