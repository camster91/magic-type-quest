import { createClient } from '@supabase/supabase-js';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { buildCloudProgressExport, deleteCloudProfileRows } from '../src/sync.js';

const REQUIRED_ENV = [
  'BLOOMTYPE_QA_SUPABASE_URL',
  'BLOOMTYPE_QA_SUPABASE_ANON_KEY',
  'BLOOMTYPE_QA_STUDENT_A_EMAIL',
  'BLOOMTYPE_QA_STUDENT_A_PASSWORD',
  'BLOOMTYPE_QA_STUDENT_B_EMAIL',
  'BLOOMTYPE_QA_STUDENT_B_PASSWORD',
  'BLOOMTYPE_QA_TEACHER_EMAIL',
  'BLOOMTYPE_QA_TEACHER_PASSWORD',
  'BLOOMTYPE_QA_TEACHER_CLASS_CODE',
  'BLOOMTYPE_QA_OTHER_CLASS_CODE',
];

const CONFIRMATION = 'DELETE_QA_DATA';

export function readCloudDrillConfig(env = process.env) {
  const missing = REQUIRED_ENV.filter((name) => !env[name]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing cloud drill configuration: ${missing.join(', ')}`);
  }
  if (env.BLOOMTYPE_CLOUD_DRILL_CONFIRM !== CONFIRMATION) {
    throw new Error(`Set BLOOMTYPE_CLOUD_DRILL_CONFIRM=${CONFIRMATION} to acknowledge that designated QA learning rows will be created and deleted.`);
  }

  const url = new URL(env.BLOOMTYPE_QA_SUPABASE_URL.trim());
  if (url.protocol !== 'https:' && url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
    throw new Error('The QA Supabase URL must use HTTPS unless it targets localhost.');
  }
  const teacherClassCode = env.BLOOMTYPE_QA_TEACHER_CLASS_CODE.trim().toUpperCase();
  const otherClassCode = env.BLOOMTYPE_QA_OTHER_CLASS_CODE.trim().toUpperCase();
  if (teacherClassCode === otherClassCode) throw new Error('The teacher and isolation class codes must differ.');

  return {
    url: url.href.replace(/\/$/u, ''),
    anonKey: env.BLOOMTYPE_QA_SUPABASE_ANON_KEY.trim(),
    teacherClassCode,
    otherClassCode,
    accounts: {
      studentA: { email: env.BLOOMTYPE_QA_STUDENT_A_EMAIL.trim(), password: env.BLOOMTYPE_QA_STUDENT_A_PASSWORD },
      studentB: { email: env.BLOOMTYPE_QA_STUDENT_B_EMAIL.trim(), password: env.BLOOMTYPE_QA_STUDENT_B_PASSWORD },
      teacher: { email: env.BLOOMTYPE_QA_TEACHER_EMAIL.trim(), password: env.BLOOMTYPE_QA_TEACHER_PASSWORD },
    },
  };
}

function client(config) {
  return createClient(config.url, config.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

async function signIn(sb, credentials, role) {
  const { data, error } = await sb.auth.signInWithPassword(credentials);
  if (error || !data.user) throw new Error(`${role} QA sign-in failed: ${error?.message || 'no user returned'}`);
  return data.user;
}

async function expectRows(query, label) {
  const { data, error } = await query;
  if (error) throw new Error(`${label} failed: ${error.message}`);
  return data || [];
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function seedStudent(sb, user, classCode, label) {
  const timestamp = new Date().toISOString();
  const profile = {
    id: user.id, name: label, avatar: '🌸', class_code: classCode,
    high_score: 10, total_words: 3, total_stars: 1, updated_at: timestamp,
  };
  const { error: profileError } = await sb.from('profiles').upsert(profile, { onConflict: 'id' });
  if (profileError) throw new Error(`QA profile seed failed: ${profileError.message}`);
  const { error: rosterError } = await sb.from('class_roster').upsert({
    class_code: classCode, profile_id: user.id, name: label, avatar: '🌸',
    total_words: 3, total_stars: 1, high_score: 10, updated_at: timestamp,
  }, { onConflict: 'class_code,profile_id' });
  if (rosterError) throw new Error(`QA roster seed failed: ${rosterError.message}`);
  const { error: sessionError } = await sb.from('game_sessions').insert({
    session_id: crypto.randomUUID(), profile_id: user.id, level: 1, score: 10,
    wpm: 5, accuracy: 100, words_typed: 3, words_completed: 3,
  });
  if (sessionError) throw new Error(`QA session seed failed: ${sessionError.message}`);
}

async function safeOwnCleanup(sb, userId) {
  if (!sb || !userId) return;
  try { await deleteCloudProfileRows(sb, userId); } catch { /* preserve primary drill failure */ }
  try { await sb.auth.signOut({ scope: 'local' }); } catch { /* no secrets or sessions are persisted */ }
}

export async function runCloudBoundaryDrill(config, log = console.log) {
  const studentAClient = client(config);
  const studentBClient = client(config);
  const teacherClient = client(config);
  let studentA;
  let studentB;

  try {
    [studentA, studentB] = await Promise.all([
      signIn(studentAClient, config.accounts.studentA, 'student A'),
      signIn(studentBClient, config.accounts.studentB, 'student B'),
      signIn(teacherClient, config.accounts.teacher, 'teacher'),
    ]).then(([a, b]) => [a, b]);
    assert(studentA.id !== studentB.id, 'The two student QA accounts must be distinct.');

    await Promise.all([
      seedStudent(studentAClient, studentA, config.teacherClassCode, 'QA Student A'),
      seedStudent(studentBClient, studentB, config.otherClassCode, 'QA Student B'),
    ]);

    const [foreignProfile, foreignSessions, foreignRoster] = await Promise.all([
      expectRows(studentAClient.from('profiles').select('id').eq('id', studentB.id), 'student cross-profile read'),
      expectRows(studentAClient.from('game_sessions').select('id').eq('profile_id', studentB.id), 'student cross-session read'),
      expectRows(studentAClient.from('class_roster').select('id').eq('profile_id', studentB.id), 'student cross-roster read'),
    ]);
    assert(foreignProfile.length === 0 && foreignSessions.length === 0 && foreignRoster.length === 0,
      'Student A could read Student B learning rows.');

    const [ownedRoster, otherRoster] = await Promise.all([
      expectRows(teacherClient.from('class_roster').select('profile_id').eq('class_code', config.teacherClassCode), 'teacher owned-class read'),
      expectRows(teacherClient.from('class_roster').select('profile_id').eq('class_code', config.otherClassCode), 'teacher foreign-class read'),
    ]);
    assert(ownedRoster.some((row) => row.profile_id === studentA.id),
      'Teacher could not read the provisioned owned class. Verify teacher_codes provisioning.');
    assert(otherRoster.length === 0, 'Teacher could read the unowned isolation class.');

    const exported = await buildCloudProgressExport(studentAClient, studentA.id, new Date().toISOString(), 2);
    assert(exported.profile?.id === studentA.id, 'Student export did not contain the signed-in profile.');
    assert(exported.sessions.length > 0 && exported.sessions.every((row) => row.profile_id === studentA.id),
      'Student export contained missing or foreign session rows.');
    assert(exported.rosterMemberships.length > 0
      && exported.rosterMemberships.every((row) => row.profile_id === studentA.id),
    'Student export contained missing or foreign roster rows.');
    assert(!JSON.stringify(exported).match(/access_token|refresh_token/iu), 'Student export contained an authentication token field.');

    await deleteCloudProfileRows(studentAClient, studentA.id);
    const [deletedProfile, deletedSessions, deletedRoster] = await Promise.all([
      expectRows(studentAClient.from('profiles').select('id').eq('id', studentA.id), 'deleted profile check'),
      expectRows(studentAClient.from('game_sessions').select('id').eq('profile_id', studentA.id), 'deleted session check'),
      expectRows(studentAClient.from('class_roster').select('id').eq('profile_id', studentA.id), 'deleted roster check'),
    ]);
    assert(deletedProfile.length === 0 && deletedSessions.length === 0 && deletedRoster.length === 0,
      'Cascading learning-data deletion left rows behind.');

    const result = {
      status: 'passed',
      checks: ['student isolation', 'teacher class isolation', 'complete self export', 'cascading learning-data deletion'],
      projectOrigin: new URL(config.url).origin,
    };
    log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    await Promise.all([
      safeOwnCleanup(studentAClient, studentA?.id),
      safeOwnCleanup(studentBClient, studentB?.id),
      teacherClient.auth.signOut({ scope: 'local' }).catch(() => undefined),
    ]);
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  runCloudBoundaryDrill(readCloudDrillConfig()).catch((error) => {
    console.error(`Cloud boundary drill failed: ${error.message}`);
    process.exitCode = 1;
  });
}
