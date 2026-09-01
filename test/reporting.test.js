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

  it.each(['=1+1', '+SUM(A1:A2)', '-2+3', '@SUM(A1:A2)', '  =1+1', '\t=1+1', '\r=1+1'])(
    'neutralizes spreadsheet formula input %j',
    (value) => {
      expect(csvCell(value)).toContain(`'${value}`);
    },
  );

  it('preserves ordinary text, numbers, emoji, and JSON export values', () => {
    expect(csvCell('🌸 Ada')).toBe('🌸 Ada');
    expect(csvCell('120')).toBe('120');
    expect(JSON.parse(createRosterExport('ABC123', [{ name: '=Ada' }])).students[0].name).toBe('=Ada');
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
