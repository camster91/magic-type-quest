import { describe, expect, it, vi } from 'vitest';
import { csvAdapter, parseCSV, rosterFromCSV } from '../src/roster/csv.js';
import { CLASSROOM_SCOPES, RosterProviderError, createGoogleClassroomAdapter } from '../src/roster/googleClassroom.js';
import { createClassLinkAdapter, mapOneRosterClasses, mapOneRosterStudents } from '../src/roster/oneRosterClassLink.js';
import { createCleverAdapter, mapCleverSections, mapCleverStudents } from '../src/roster/clever.js';
import { PROVIDER_ORDER, createRosterProvider } from '../src/roster/providers.js';
import { normalizeRosterImport } from '../src/roster/importer.js';

describe('CSV roster adapter', () => {
  it('parses quotes, escaped quotes, CRLF and a byte-order mark', () => {
    expect(parseCSV('﻿name,id\r\n"Ortiz, Ben",7\r\n"Say ""hi""",8\r\n')).toEqual([
      ['name', 'id'], ['Ortiz, Ben', '7'], ['Say "hi"', '8'],
    ]);
  });

  it('reads first and last name columns and ignores email columns', () => {
    const raw = rosterFromCSV('First Name,Last Name,Email,Student ID\nAva,Thompson,ava@school.example,1001\nBen,Ortiz,ben@school.example,1002\n');
    const result = normalizeRosterImport(raw);
    expect(result.students).toEqual([
      { externalId: '1001', displayName: 'Ava T.' },
      { externalId: '1002', displayName: 'Ben O.' },
    ]);
    expect(JSON.stringify(result)).not.toContain('school.example');
  });

  it('reads French and Spanish headers with semicolons', () => {
    expect(rosterFromCSV('Prénom;Nom de famille;Matricule\nÉlodie;Roy;A1\n').students)
      .toEqual([{ givenName: 'Élodie', familyName: 'Roy', externalId: 'A1' }]);
    expect(rosterFromCSV('Nombre;Apellido\nLucía;Pérez\n').students[0])
      .toMatchObject({ givenName: 'Lucía', familyName: 'Pérez' });
  });

  it('makes stable ids from names when the file has none', () => {
    const first = rosterFromCSV('Ava Thompson\nBen\nBen\n');
    const again = rosterFromCSV('Ava Thompson\nBen\nBen\n');
    expect(first.students.map((s) => s.externalId)).toEqual(['csv-ava-thompson', 'csv-ben', 'csv-ben-2']);
    expect(again).toEqual(first);
  });

  it('drops a name cell that holds an email', () => {
    const result = normalizeRosterImport(rosterFromCSV('name\nkid@school.example\nAva\n'));
    expect(result.students.map((s) => s.displayName)).toEqual(['Ava']);
    expect(result.skipped).toEqual([{ index: 0, reason: 'email' }]);
  });

  it('refuses an empty file', () => {
    expect(() => rosterFromCSV('  \n')).toThrow('empty-file');
  });

  it('fits the provider interface', async () => {
    expect(csvAdapter.isConfigured()).toBe(true);
    await expect(csvAdapter.listClasses()).resolves.toEqual([]);
    await expect(csvAdapter.fetchRoster(null, { text: 'name\nAva' })).resolves.toMatchObject({ provider: 'csv' });
  });
});

function jsonResponse(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('Google Classroom adapter (mocked HTTP)', () => {
  it('asks only for read-only course and roster scopes, never emails or photos', () => {
    expect(CLASSROOM_SCOPES).toEqual([
      'https://www.googleapis.com/auth/classroom.courses.readonly',
      'https://www.googleapis.com/auth/classroom.rosters.readonly',
    ]);
    expect(CLASSROOM_SCOPES.join(' ')).not.toMatch(/emails|photos|profile/);
  });

  it('lists the teacher\'s active courses across pages with the bearer token', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ courses: [{ id: '1', name: 'Grade 3', section: 'A' }], nextPageToken: 'p2' }))
      .mockResolvedValueOnce(jsonResponse({ courses: [{ id: '2', name: 'Grade 4' }] }));
    const adapter = createGoogleClassroomAdapter({ accessToken: 'tok', fetchImpl });
    await expect(adapter.listClasses()).resolves.toEqual([
      { externalClassId: '1', name: 'Grade 3 · A' },
      { externalClassId: '2', name: 'Grade 4' },
    ]);
    const [firstUrl, init] = fetchImpl.mock.calls[0];
    const url = new URL(firstUrl);
    expect(url.origin + url.pathname).toBe('https://classroom.googleapis.com/v1/courses');
    expect(url.searchParams.get('teacherId')).toBe('me');
    expect(url.searchParams.get('courseStates')).toBe('ACTIVE');
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(init.credentials).toBe('omit');
    expect(new URL(fetchImpl.mock.calls[1][0]).searchParams.get('pageToken')).toBe('p2');
  });

  it('maps students to ids and names, leaving emails and photos behind', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({
      students: [
        { courseId: 'c1', userId: '111', profile: { id: '111', name: { givenName: 'Ava', familyName: 'Thompson', fullName: 'Ava Thompson' }, emailAddress: 'ava@school.example', photoUrl: 'https://x/p.png' } },
        { courseId: 'c1', userId: '222', profile: { name: { fullName: 'Ben Ortiz' } } },
      ],
    }));
    const adapter = createGoogleClassroomAdapter({ accessToken: 'tok', fetchImpl });
    const raw = await adapter.fetchRoster('c1');
    expect(new URL(fetchImpl.mock.calls[0][0]).pathname).toBe('/v1/courses/c1/students');
    expect(JSON.stringify(raw)).not.toMatch(/school\.example|p\.png/);
    expect(normalizeRosterImport(raw)).toEqual({
      provider: 'google',
      externalClassId: 'c1',
      students: [{ externalId: '111', displayName: 'Ava T.' }, { externalId: '222', displayName: 'Ben O.' }],
      skipped: [],
    });
  });

  it.each([
    [401, 'auth-expired'],
    [403, 'scope-missing'],
    [404, 'not-found'],
    [429, 'rate-limited'],
    [500, 'provider-error'],
  ])('turns HTTP %i into %s', async (status, code) => {
    const adapter = createGoogleClassroomAdapter({ accessToken: 'tok', fetchImpl: vi.fn().mockResolvedValue(jsonResponse({}, status)) });
    await expect(adapter.listClasses()).rejects.toMatchObject({ code });
  });

  it('needs a token and reports network failures', async () => {
    await expect(createGoogleClassroomAdapter({ fetchImpl: vi.fn() }).listClasses()).rejects.toMatchObject({ code: 'auth-required' });
    const offline = createGoogleClassroomAdapter({ accessToken: 't', fetchImpl: vi.fn().mockRejectedValue(new TypeError('offline')) });
    await expect(offline.fetchRoster('c1')).rejects.toBeInstanceOf(RosterProviderError);
  });
});

describe('ClassLink (OneRoster) and Clever stubs', () => {
  it('map OneRoster classes and students without emails', () => {
    expect(mapOneRosterClasses({ classes: [{ sourcedId: 'k1', title: 'Room 4' }, { sourcedId: 'k2', status: 'tobedeleted' }] }))
      .toEqual([{ externalClassId: 'k1', name: 'Room 4' }]);
    const raw = mapOneRosterStudents('k1', { users: [
      { sourcedId: 's1', givenName: 'Ava', familyName: 'Thompson', email: 'ava@school.example', role: 'student' },
      { sourcedId: 't1', givenName: 'Ms', familyName: 'Teacher', role: 'teacher' },
    ] });
    expect(normalizeRosterImport(raw).students).toEqual([{ externalId: 's1', displayName: 'Ava T.' }]);
    expect(JSON.stringify(raw)).not.toContain('@');
  });

  it('map Clever sections and students without emails', () => {
    expect(mapCleverSections({ data: [{ data: { id: 'sec1', name: 'Grade 2' } }] })).toEqual([{ externalClassId: 'sec1', name: 'Grade 2' }]);
    const raw = mapCleverStudents('sec1', { data: [{ data: { id: 'u1', name: { first: 'Ben', last: 'Ortiz' }, email: 'ben@school.example' } }] });
    expect(normalizeRosterImport(raw).students).toEqual([{ externalId: 'u1', displayName: 'Ben O.' }]);
    expect(JSON.stringify(raw)).not.toContain('@');
  });

  it.each([
    ['classlink', createClassLinkAdapter],
    ['clever', createCleverAdapter],
  ])('%s waits for a partner agreement', async (id, create) => {
    const adapter = create();
    expect(adapter.id).toBe(id);
    expect(adapter.requiresPartner).toBe(true);
    expect(adapter.isConfigured()).toBe(false);
    await expect(adapter.listClasses()).rejects.toMatchObject({ code: 'partner-required' });
    await expect(adapter.fetchRoster('x')).rejects.toMatchObject({ code: 'partner-required' });
  });
});

describe('provider registry', () => {
  it('builds every provider behind one interface, in rollout order', () => {
    expect(PROVIDER_ORDER).toEqual(['google', 'csv', 'classlink', 'clever']);
    for (const id of PROVIDER_ORDER) {
      const adapter = createRosterProvider(id);
      expect(adapter.id).toBe(id);
      expect(typeof adapter.listClasses).toBe('function');
      expect(typeof adapter.fetchRoster).toBe('function');
      expect(typeof adapter.isConfigured).toBe('function');
    }
    expect(() => createRosterProvider('nope')).toThrow();
  });
});
