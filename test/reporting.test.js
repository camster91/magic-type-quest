import { describe, expect, it } from 'vitest';
import { createRosterCSV, createRosterExport, csvCell } from '../src/reporting.js';

describe('teacher roster exports', () => {
  const student = {
    name: 'Ada, "AJ"',
    level: 'Level 3',
    words: '120',
    score: '900',
    stars: '42 ⭐',
    status: 'Getting Started',
    source: '💾 Local',
  };

  it('quotes commas, quotes, and line breaks in CSV cells', () => {
    expect(csvCell('Ada, "AJ"')).toBe('"Ada, ""AJ"""');
    expect(csvCell('line one\nline two')).toBe('"line one\nline two"');
    expect(csvCell('plain')).toBe('plain');
  });

  it('creates a standards-safe roster CSV', () => {
    const csv = createRosterCSV([student]);
    expect(csv).toContain('Name,Level,Words,Score,Stars,Status,Source\r\n');
    expect(csv).toContain('"Ada, ""AJ""",Level 3,120,900,42 ⭐,Getting Started,💾 Local');
  });

  it('creates a structured JSON export with the normalized class context', () => {
    const payload = JSON.parse(createRosterExport('ABC123', [student], '2026-08-28T00:00:00.000Z'));
    expect(payload).toEqual({
      classCode: 'ABC123',
      exportedAt: '2026-08-28T00:00:00.000Z',
      students: [student],
    });
  });
});
