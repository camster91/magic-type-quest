import { describe, it, expect } from 'vitest';
import { getLevelConfig, getWordList, getWordEmoji } from '../src/data.js';

describe('Data Module', () => {
    describe('getLevelConfig', () => {
        it('returns correct config for level 1', () => {
            const cfg = getLevelConfig(1);
            expect(cfg.words).toBe(10);
            expect(cfg.health).toBe(5);
        });

        it('returns procedural config for high levels (> 10)', () => {
            const cfg = getLevelConfig(12);
            expect(cfg.words).toBe(34); // 30 + (2 * 2)
            expect(cfg.health).toBe(3);
        });
    });

    describe('getWordList', () => {
        it('caps at level 5 list', () => {
            const list10 = getWordList(10);
            const list5 = getWordList(5);
            expect(list10).toEqual(list5);
        });

        it('returns a valid array for level 1', () => {
            const list = getWordList(1);
            expect(Array.isArray(list)).toBe(true);
            expect(list.length).toBeGreaterThan(0);
        });
    });

    describe('getWordEmoji', () => {
        it('returns correct emoji for known word', () => {
            expect(getWordEmoji('cat')).toBe('🐱');
            expect(getWordEmoji('CAT')).toBe('🐱'); // case-insensitive
        });

        it('returns default emoji for unknown word', () => {
            expect(getWordEmoji('unknownword123')).toBe('⭐');
        });
    });
});