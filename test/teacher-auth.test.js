// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  TEACHER_AUTH_STORAGE_KEY,
  createMemoryStorage,
  getTeacherSupabase,
  resetTeacherSupabaseForTests,
  teacherClientOptions,
} from '../src/teacherAuth.js';
import { studentClientOptions } from '../src/sync.js';
import { getTeacherSession, signInWithGoogle, signOutTeacher } from '../src/teacherCloud.js';

const URL_ = 'https://example.supabase.co';
const ENV = { VITE_SUPABASE_URL: URL_, VITE_SUPABASE_ANON_KEY: 'anon-key' };
// Supabase's default key for this project: the student session lives here.
const STUDENT_KEY = 'sb-example-auth-token';
const PROVIDER_TOKEN = 'ya29.google-classroom-secret';
const PROVIDER_REFRESH = '1//google-refresh-secret';

const nowSeconds = () => Math.round(Date.now() / 1000);
const studentSession = () => ({
  access_token: 'student-access',
  refresh_token: 'student-refresh',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: nowSeconds() + 3600,
  user: { id: 'kid-1', aud: 'authenticated', role: 'authenticated', is_anonymous: true, app_metadata: {}, user_metadata: {} },
});
const teacherUser = {
  id: 'teacher-1',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'ms.a@school.example',
  is_anonymous: false,
  app_metadata: { provider: 'google' },
  user_metadata: { full_name: 'Ms A' },
};

// Supabase Auth over the network, mocked: the user lookup after the Google
// redirect, and sign-out.
function mockAuthServer() {
  return vi.fn(async (input, init = {}) => {
    const url = String(input?.url || input);
    const method = (init.method || input?.method || 'GET').toUpperCase();
    if (url.endsWith('/auth/v1/user') && method === 'GET') {
      return new globalThis.Response(JSON.stringify(teacherUser), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (url.includes('/auth/v1/logout')) return new globalThis.Response(null, { status: 204 });
    return new globalThis.Response(JSON.stringify({ message: `unexpected ${method} ${url}` }), { status: 500 });
  });
}

// Every value the browser would keep after a reload.
function persistedValues() {
  const values = [];
  for (const storage of [window.localStorage, window.sessionStorage]) {
    for (let i = 0; i < storage.length; i += 1) values.push(`${storage.key(i)}=${storage.getItem(storage.key(i))}`);
  }
  return values;
}

function googleCallbackHash() {
  const params = new URLSearchParams({
    access_token: 'teacher-access',
    refresh_token: 'teacher-refresh',
    expires_in: '3600',
    expires_at: String(nowSeconds() + 3600),
    token_type: 'bearer',
    provider_token: PROVIDER_TOKEN,
    provider_refresh_token: PROVIDER_REFRESH,
  });
  return `#${params}`;
}

describe('teacher Supabase client options', () => {
  it('uses its own storage key, reads the OAuth callback, and persists nothing', () => {
    const { auth } = teacherClientOptions();
    expect(auth.storageKey).toBe(TEACHER_AUTH_STORAGE_KEY);
    expect(auth.storageKey).not.toBe(STUDENT_KEY);
    expect(auth.persistSession).toBe(false);
    expect(auth.detectSessionInUrl).toBe(true);
    expect(auth.flowType).toBe('implicit');
    // A fresh memory store per client, never window.localStorage.
    expect(auth.storage).not.toBe(window.localStorage);
    expect(teacherClientOptions().auth.storage).not.toBe(auth.storage);
  });

  it('keeps the student client off the OAuth callback and on the default key', () => {
    const { auth } = studentClientOptions();
    expect(auth.detectSessionInUrl).toBe(false);
    expect(auth.storageKey).toBeUndefined();
  });

  it('memory storage behaves like Storage and lives only in the page', () => {
    const storage = createMemoryStorage();
    expect(storage.getItem('k')).toBeNull();
    storage.setItem('k', 1);
    expect(storage.getItem('k')).toBe('1');
    storage.removeItem('k');
    expect(storage.getItem('k')).toBeNull();
  });

  it('creates one teacher client with those options, or none without settings', async () => {
    resetTeacherSupabaseForTests();
    const fake = vi.fn(() => ({ auth: {} }));
    await expect(getTeacherSupabase({ env: {}, createClient: fake })).resolves.toBeNull();
    const client = await getTeacherSupabase({ env: ENV, createClient: fake });
    expect(await getTeacherSupabase({ env: ENV, createClient: fake })).toBe(client);
    expect(fake).toHaveBeenCalledTimes(1);
    const [url, key, options] = fake.mock.calls[0];
    expect([url, key]).toEqual([URL_, 'anon-key']);
    expect(options.auth).toMatchObject({ storageKey: TEACHER_AUTH_STORAGE_KEY, persistSession: false, detectSessionInUrl: true });
    resetTeacherSupabaseForTests();
  });
});

describe('teacher and student sessions on one browser (supabase-js, mocked network)', () => {
  let clients = [];

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState(null, '', '/magic-type-quest/teacher.html');
    vi.stubGlobal('fetch', mockAuthServer());
    resetTeacherSupabaseForTests();
  });

  afterEach(() => {
    for (const client of clients) client.auth.stopAutoRefresh?.();
    clients = [];
    resetTeacherSupabaseForTests();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function setUp() {
    // A student already joined a class on this browser.
    window.localStorage.setItem(STUDENT_KEY, JSON.stringify(studentSession()));
    // The page comes back from Google with the teacher's tokens in the hash.
    window.history.replaceState(null, '', `/magic-type-quest/teacher.html${googleCallbackHash()}`);
    // Worst case: the student client starts first, while the hash is there.
    const student = createClient(URL_, 'anon-key', studentClientOptions());
    clients.push(student);
    const { data: before } = await student.auth.getSession();
    expect(before.session.user.id).toBe('kid-1');
    const studentStored = window.localStorage.getItem(STUDENT_KEY);

    const writes = [];
    const realSet = window.Storage.prototype.setItem;
    const realRemove = window.Storage.prototype.removeItem;
    vi.spyOn(window.Storage.prototype, 'setItem').mockImplementation(function setItem(key, value) {
      writes.push(['set', key, String(value)]);
      return realSet.call(this, key, value);
    });
    vi.spyOn(window.Storage.prototype, 'removeItem').mockImplementation(function removeItem(key) {
      writes.push(['remove', key]);
      return realRemove.call(this, key);
    });

    const teacher = await getTeacherSupabase({ env: ENV, createClient });
    clients.push(teacher);
    return { student, teacher, studentStored, writes };
  }

  it('signs the teacher in from the callback without touching the student session', async () => {
    const { student, teacher, studentStored, writes } = await setUp();

    const session = await getTeacherSession(teacher);
    expect(session).toMatchObject({ userId: 'teacher-1', email: 'ms.a@school.example', providerToken: PROVIDER_TOKEN });
    expect(window.location.hash).toBe('');

    // Starting another Google sign-in (the Classroom import) changes nothing
    // either. jsdom cannot navigate, so silence its notice.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await signInWithGoogle(teacher, { redirectTo: 'https://pilot.example/teacher.html?import=google', classroom: true });

    expect(window.localStorage.getItem(STUDENT_KEY)).toBe(studentStored);
    expect(writes.filter(([, key]) => key === STUDENT_KEY)).toEqual([]);
    const { data } = await student.auth.getSession();
    expect(data.session.user.id).toBe('kid-1');
    expect(data.session.user.is_anonymous).toBe(true);
  });

  it('signs the teacher out (and Lock) without removing the student session', async () => {
    const { student, teacher, studentStored, writes } = await setUp();
    expect(await getTeacherSession(teacher)).not.toBeNull();

    await signOutTeacher(teacher);

    expect(await getTeacherSession(teacher)).toBeNull();
    expect(window.localStorage.getItem(STUDENT_KEY)).toBe(studentStored);
    expect(writes.filter(([, key]) => key === STUDENT_KEY)).toEqual([]);
    const { data } = await student.auth.getSession();
    expect(data.session.user.id).toBe('kid-1');
  });

  it('never persists the Google provider token, or the teacher session at all', async () => {
    const { teacher, writes } = await setUp();
    const session = await getTeacherSession(teacher);
    expect(session.providerToken).toBe(PROVIDER_TOKEN);

    const leaks = (text) => text.includes(PROVIDER_TOKEN) || text.includes(PROVIDER_REFRESH) || text.includes('teacher-access');
    expect(writes.filter(([, , value = '']) => leaks(value))).toEqual([]);
    expect(writes.filter(([, key]) => key.startsWith(TEACHER_AUTH_STORAGE_KEY))).toEqual([]);
    expect(persistedValues().filter(leaks)).toEqual([]);
    expect(persistedValues().join('\n')).not.toContain('provider_token');

    await signOutTeacher(teacher);
    expect(persistedValues().filter(leaks)).toEqual([]);
  });
});
