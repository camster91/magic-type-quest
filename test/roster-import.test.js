import { describe, expect, it, vi } from 'vitest';
import {
  MAX_ROSTER_SIZE,
  RosterImportError,
  importRosterToClass,
  looksLikeEmail,
  minimizeDisplayName,
  nameKey,
  normalizeRosterImport,
  toImportRosterArgs,
} from '../src/roster/importer.js';

describe('minimizeDisplayName', () => {
  it('keeps a first name and last initial by default', () => {
    expect(minimizeDisplayName('Ava', 'Thompson')).toBe('Ava T.');
    expect(minimizeDisplayName('Ava Thompson')).toBe('Ava T.');
    expect(minimizeDisplayName('  José   María  ', 'Ñúñez')).toBe('José María Ñ.');
  });

  it('keeps a single name as it is, and full names when asked', () => {
    expect(minimizeDisplayName('Ava')).toBe('Ava');
    expect(minimizeDisplayName('', 'Thompson')).toBe('Thompson');
    expect(minimizeDisplayName('Ava', 'Thompson', { fullNames: true })).toBe('Ava Thompson');
  });

  it('strips control and invisible characters and caps the length', () => {
    expect(minimizeDisplayName('A​va\u0007', 'T')).toBe('Ava T.');
    expect([...minimizeDisplayName('x'.repeat(80), '', { fullNames: true })]).toHaveLength(40);
  });
});

describe('normalizeRosterImport', () => {
  it('turns any provider payload into names and opaque ids only', () => {
    const result = normalizeRosterImport({
      provider: 'Google',
      externalClassId: ' 123 ',
      students: [
        { externalId: 'u1', givenName: 'Ava', familyName: 'Thompson', emailAddress: 'ava@school.example', photoUrl: 'x' },
        { externalId: 'u2', displayName: 'Ben Ortiz' },
      ],
    });
    expect(result).toEqual({
      provider: 'google',
      externalClassId: '123',
      students: [
        { externalId: 'u1', displayName: 'Ava T.' },
        { externalId: 'u2', displayName: 'Ben O.' },
      ],
      skipped: [],
    });
    expect(JSON.stringify(result)).not.toContain('@');
  });

  it('leaves out emails, blanks and repeats, and says why', () => {
    const result = normalizeRosterImport({
      provider: 'csv',
      students: [
        { externalId: 'a', displayName: 'kid@school.example' },
        { externalId: 'kid@school.example', displayName: 'Kid' },
        { externalId: 'b', displayName: '   ' },
        { externalId: '', displayName: 'Noid' },
        { externalId: 'c', displayName: 'Cy' },
        { externalId: 'c', displayName: 'Cy again' },
      ],
    });
    expect(result.students).toEqual([{ externalId: 'c', displayName: 'Cy' }]);
    expect(result.skipped).toEqual([
      { index: 0, reason: 'email' },
      { index: 1, reason: 'email' },
      { index: 2, reason: 'missing-name' },
      { index: 3, reason: 'missing-id' },
      { index: 5, reason: 'duplicate' },
    ]);
  });

  it(`caps a roster at ${MAX_ROSTER_SIZE} students`, () => {
    const students = Array.from({ length: MAX_ROSTER_SIZE + 3 }, (_, i) => ({ externalId: `s${i}`, displayName: `Kid ${i}` }));
    const result = normalizeRosterImport({ provider: 'csv', students });
    expect(result.students).toHaveLength(MAX_ROSTER_SIZE);
    expect(result.skipped.filter((s) => s.reason === 'too-many')).toHaveLength(3);
  });

  it('refuses unknown providers', () => {
    expect(() => normalizeRosterImport({ provider: 'myspace', students: [] })).toThrow(RosterImportError);
  });
});

describe('saving an import', () => {
  const normalized = normalizeRosterImport({ provider: 'csv', externalClassId: null, students: [{ externalId: 'a', displayName: 'Ava' }] });

  it('sends only the class, provider and the two stored fields', () => {
    expect(toImportRosterArgs('class-1', normalized)).toEqual({
      p_class_id: 'class-1',
      p_provider: 'csv',
      p_external_class_id: null,
      p_students: [{ externalId: 'a', displayName: 'Ava' }],
    });
    expect(() => toImportRosterArgs(null, normalized)).toThrow('no-class');
  });

  it('calls the import_roster RPC and reports the saved count', async () => {
    const sb = { rpc: vi.fn().mockResolvedValue({ data: 1, error: null }) };
    await expect(importRosterToClass(sb, 'class-1', normalized)).resolves.toBe(1);
    expect(sb.rpc).toHaveBeenCalledWith('import_roster', expect.objectContaining({ p_class_id: 'class-1' }));
  });

  it('turns a server refusal into a save-failed error', async () => {
    const sb = { rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'check violation' } }) };
    await expect(importRosterToClass(sb, 'class-1', normalized)).rejects.toMatchObject({ code: 'save-failed' });
  });
});

describe('name helpers', () => {
  it('spots emails and compares names without case or accents', () => {
    expect(looksLikeEmail('a@b.c')).toBe(true);
    expect(looksLikeEmail('Ava')).toBe(false);
    expect(nameKey('  ÉLODIE  b. ')).toBe('elodie b.');
  });
});
