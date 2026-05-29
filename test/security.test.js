import { describe, it, expect } from 'vitest';
import { escapeHTML } from '../src/teacher.js';

describe('Security - HTML Escaping', () => {
    it('escapes special characters', () => {
        const input = '<script>alert("XSS")</script> & "quoted" \'single\'';
        const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt; &amp; &quot;quoted&quot; &#39;single&#39;';
        expect(escapeHTML(input)).toBe(expected);
    });

    it('handles null or undefined', () => {
        expect(escapeHTML(null)).toBe('');
        expect(escapeHTML(undefined)).toBe('');
    });

    it('handles numeric inputs by converting to string', () => {
        expect(escapeHTML(123)).toBe('123');
    });

    it('does not escape safe characters', () => {
        const input = 'Hello World 123!';
        expect(escapeHTML(input)).toBe(input);
    });
});
