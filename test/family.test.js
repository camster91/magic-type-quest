// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { childReport, masteredKeys, recordHTML } from '../src/parentReport.js';
import { activePlayerId, listPlayers, startNewPlayer, switchPlayer } from '../src/players.js';

beforeEach(() => localStorage.clear());

const ava = { uuid: 'a-1', name: 'Ava', avatar: '🦊', lastPlayed: '2026-10-12T10:00:00Z', completedLevels: [2, 1],
  keySR: { a: { correct: 9, wrong: 1 }, q: { correct: 1, wrong: 4 }, s: { correct: 2, wrong: 0 } },
  levelStats: { 1: { wpm: 14, accuracy: 92 } }, practiceLog: { '2026-10-12': 8, '2026-10-01': 5 }, minutesPractised: 13 };
const ben = { uuid: 'b-2', name: 'Ben', avatar: '🐶', lastPlayed: '2026-10-13T10:00:00Z' };

describe('players on one device', () => {
  it('lists every saved player once, newest first', () => {
    localStorage.setItem('bloomtype_profile_Ava', JSON.stringify(ava));
    localStorage.setItem('bloomtype_profile_Ben', JSON.stringify(ben));
    localStorage.setItem('bloomtype-profile', JSON.stringify(ben));
    expect(listPlayers().map((p) => p.name)).toEqual(['Ben', 'Ava']);
    expect(activePlayerId()).toBe('b-2');
  });

  it('switches to another player and can start a new one', () => {
    localStorage.setItem('bloomtype_profile_Ava', JSON.stringify(ava));
    localStorage.setItem('bloomtype-profile', JSON.stringify(ben));
    expect(switchPlayer('a-1')).toBe(true);
    expect(activePlayerId()).toBe('a-1');
    expect(switchPlayer('nobody')).toBe(false);
    startNewPlayer();
    expect(activePlayerId()).toBeNull();
    expect(listPlayers().map((p) => p.uuid)).toEqual(['a-1']);
  });
});

describe('family report', () => {
  it('finds keys a child has clearly learned', () => {
    expect(masteredKeys(ava.keySR)).toEqual(['a']);
  });

  it('builds a weekly summary and a homeschool record', () => {
    const report = childReport(ava, new Date('2026-10-13T12:00:00'));
    expect(report).toMatchObject({ name: 'Ava', weekMinutes: 8, weekDays: 1, totalMinutes: 13, bestWpm: 14, accuracy: 92, levels: [1, 2], mastered: ['a'], weakKeys: ['q'] });
    const html = recordHTML(report, new Date('2026-10-13T12:00:00'));
    expect(html).toContain('Ava');
    expect(html).toContain('2026-10-01');
    expect(html).toContain('0.2 (13 min)');
  });

  it('escapes names in the record', () => {
    const html = recordHTML(childReport({ ...ava, name: '<b>x</b>' }));
    expect(html).not.toContain('<b>x</b>');
  });
});
