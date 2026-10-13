import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const schema = readFileSync(resolve(root, 'supabase/schema.sql'), 'utf8');
const syncSource = readFileSync(resolve(root, 'src/sync.js'), 'utf8');

describe('Supabase privacy boundary', () => {
  it('enables RLS on every student-data table', () => {
    for (const table of ['profiles', 'game_sessions', 'class_roster', 'teacher_codes', 'student_link_codes', 'linked_devices']) {
      expect(schema).toContain(`alter table ${table} enable row level security`);
    }
  });

  it('does not grant public reads or unrestricted writes', () => {
    expect(schema).not.toMatch(/create policy "Public read"/);
    expect(schema).not.toMatch(/create policy "Open insert"/);
    expect(schema).not.toMatch(/(?:using|with check)\s*\(true\)/i);
  });

  it('binds player writes and teacher reads to authenticated identities', () => {
    expect(schema).toContain('with check (auth.uid() = profile_id)');
    expect(schema).toContain('create policy "Roster self delete" on class_roster for delete');
    expect(schema).toContain('using (auth.uid() = profile_id)');
    expect(schema).toContain('tc.teacher_id = auth.uid()');
    expect(syncSource).toContain('sb.auth.getSession()');
    expect(syncSource).toContain('if (!data.session?.user) return null');
    expect(syncSource).toContain("sb.rpc(\n      'sync_class_membership'");
    expect(syncSource).not.toContain('st.id || st.name');
  });

  it('allows an authenticated student to delete only their own cascading profile', () => {
    expect(schema).toContain('create policy "Self delete" on profiles for delete');
    expect(schema).toContain('using (auth.uid() = id)');
    expect(schema).toContain('profile_id uuid references profiles(id) on delete cascade');
    expect(schema).toContain('profile_id uuid not null references profiles(id) on delete cascade');
    expect(syncSource).toContain("sb.rpc('delete_my_account')");
    expect(syncSource).toContain("signOut({ scope: 'local' })");
  });

  it('scopes student cloud exports to the authenticated identity', () => {
    // Only the caller's own student: its account plus devices linked to it.
    expect(syncSource).toContain("all('profiles', 'id')");
    expect(syncSource).toContain("all('game_sessions', 'profile_id')");
    expect(syncSource).toContain("all('class_roster', 'profile_id')");
    expect(syncSource).toContain("sb.rpc('my_student_device_ids')");
    expect(syncSource).toContain(".eq(ownerColumn, userId)");
    expect(syncSource).not.toMatch(/access_token|refresh_token/);
  });

  it('reserves teacher-code provisioning for a trusted administrative path', () => {
    expect(schema).not.toMatch(/create policy "Teacher own codes"[\s\S]*?for all/i);
    expect(schema).not.toMatch(/create policy [^\n]+ on teacher_codes for insert/i);
    expect(schema).toContain('create policy "Teacher read own codes" on teacher_codes for select');
    expect(schema).toContain('create policy "Teacher delete own codes" on teacher_codes for delete');
    expect(schema).toContain('revoke insert, update on teacher_codes from authenticated');
  });

  it('removes unused analytics RPCs instead of exposing redundant query paths', () => {
    expect(schema).toContain('drop function if exists class_wpm_trends(text)');
    expect(schema).toContain('drop function if exists red_flag_students(text)');
    expect(schema).not.toMatch(/create or replace function\s+(?:class_wpm_trends|red_flag_students)/i);
    expect(syncSource).not.toMatch(/\.rpc\(['"](?:class_wpm_trends|red_flag_students)/);
  });

  it('requires explicit WITH CHECK on profile updates', () => {
    expect(schema).toMatch(/create policy "Self update" on profiles for update\s+using \(auth\.uid\(\) = id\)\s+with check \(auth\.uid\(\) = id\)/);
  });

  it('lets students join only classes a teacher actually owns', () => {
    expect(schema).toContain('with check (auth.uid() = profile_id and public.class_code_exists(class_code))');
    expect(schema).toMatch(/function public\.class_code_exists[\s\S]*?security definer[\s\S]*?set search_path = public/);
    expect(schema.indexOf('create or replace function public.class_code_exists'))
      .toBeLessThan(schema.indexOf('create policy "Roster self insert"'));
  });

  it('never lets teachers read whole student profiles', () => {
    expect(schema).not.toContain('create policy "Teacher class read"');
    expect(schema).toContain('drop policy if exists "Teacher class read" on profiles');
    expect(schema).toMatch(/"Teacher session read"[\s\S]*?from class_roster cr[\s\S]*?tc\.teacher_id = auth\.uid\(\)/);
  });

  it('syncs class membership in one transaction under RLS', () => {
    expect(schema).toMatch(/function public\.sync_class_membership[\s\S]*?security invoker/);
    expect(syncSource).not.toMatch(/from\('class_roster'\)\s*\.delete\(\)/);
  });

  it('deletes the sign-in accounts themselves, scoped to the caller\'s own student', () => {
    expect(schema).toMatch(/function public\.delete_my_account\(\)[\s\S]*?uid uuid := auth\.uid\(\)[\s\S]*?ids := array_append\(coalesce\(ids, '\{\}'\), uid\)[\s\S]*?delete from auth\.users where id = any\(ids\)/);
  });

  it('never lets anonymous callers run student RPCs', () => {
    for (const fn of ['class_code_exists(text)', 'delete_my_account()']) {
      expect(schema).toContain(`revoke all on function public.${fn} from public, anon`);
    }
    expect(schema).toMatch(/revoke all on function public\.sync_class_membership\([^)]*\) from public, anon/);
  });

  it('deduplicates ambiguous session retries without rewriting legacy rows', () => {
    expect(schema).toContain('alter table game_sessions add column if not exists session_id uuid');
    expect(schema).toContain('create unique index if not exists idx_sessions_session_id');
    expect(schema).toContain('where session_id is not null');
    expect(syncSource).toContain("if (error?.code === '23505') return true");
  });

  it('links a child\'s devices only through hashed, expiring codes', () => {
    // Link codes are stored as SHA-256 hashes and no policy exposes them.
    expect(schema).toContain("encode(digest(code, 'sha256'), 'hex')");
    expect(schema).toContain("now() + interval '14 days'");
    expect(schema).not.toMatch(/create policy [^\n]+ on student_link_codes/);
    expect(schema).toContain('revoke insert, update on linked_devices from authenticated');
    for (const fn of ['create_link_code()', 'link_device(text)', 'student_profiles()', 'my_student_id()']) {
      expect(schema).toContain(`revoke all on function public.${fn} from public, anon;`);
      expect(schema).toContain(`grant execute on function public.${fn} to authenticated;`);
    }
  });

  it('never lets a device pose as another child in the roster', () => {
    expect(schema).toMatch(/function public\.set_roster_student_id\(\)[\s\S]*?new\.student_id := public\.my_student_id\(\);/);
    expect(schema).toMatch(/create trigger roster_student_id\s+before insert or update on class_roster/);
  });

  it('lets linked devices read, and deletion remove, the whole student only', () => {
    for (const table of ['profiles', 'game_sessions', 'class_roster']) {
      expect(schema).toContain(`create policy "Student group read" on ${table} for select`);
    }
    expect(schema).toMatch(/function public\.delete_my_account\(\)[\s\S]*?from public\.my_student_device_ids\(\)[\s\S]*?delete from public\.profiles where id = any\(ids\)/);
    expect(schema).toMatch(/function public\.link_device[\s\S]*?target := coalesce\(\(select student_id from linked_devices where device_id = target\), target\)/);
  });
});
