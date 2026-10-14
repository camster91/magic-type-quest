import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Static checks of the teacher/school additions to supabase/schema.sql. The
// behaviour itself is proven on a real PostgreSQL by
// supabase/tests/teacher-dashboard-rls.sql (see docs/CLOUD-CLASS-LOGIN.md).
const root = resolve(import.meta.dirname, '..');
const schema = readFileSync(resolve(root, 'supabase/schema.sql'), 'utf8');
const additions = schema.slice(schema.indexOf('TEACHER ACCOUNTS, SCHOOLS AND CLASSES'));

describe('teacher, school and class schema', () => {
  it('is appended after every existing table and policy', () => {
    expect(schema.indexOf('TEACHER ACCOUNTS, SCHOOLS AND CLASSES')).toBeGreaterThan(schema.indexOf('function public.delete_my_account()'));
  });

  it('enables RLS on every new table and gives signed-out visitors nothing', () => {
    for (const table of ['schools', 'teachers', 'teacher_invites', 'classes', 'roster_students']) {
      expect(additions).toContain(`alter table ${table} enable row level security`);
      expect(additions).toContain(`revoke all on ${table} from anon`);
    }
  });

  it('never lets a browser write roles, schools, classes or imported rosters directly', () => {
    for (const table of ['schools', 'teachers', 'teacher_invites', 'classes']) {
      expect(additions).toContain(`revoke insert, update, delete on ${table} from authenticated`);
      expect(additions).not.toMatch(new RegExp(`create policy [^\\n]+ on ${table} for (insert|update|delete|all)`, 'i'));
    }
    expect(additions).toContain('revoke insert, update on roster_students from authenticated');
    expect(additions).not.toMatch(/(?:using|with check)\s*\(true\)/i);
  });

  it('scopes teacher reads to their own classes and admin reads to aggregates', () => {
    expect(additions).toContain('using (owner_id = auth.uid() and public.is_teacher())');
    expect(additions).toMatch(/function public\.school_class_summary\(\)[\s\S]*?school uuid := public\.my_admin_school_id\(\)/);
    expect(additions).toMatch(/returns table \(\s*class_id uuid,\s*class_name text,\s*teacher_name text,\s*archived boolean,\s*student_count integer,\s*imported_count integer,\s*active_students_7d integer,\s*weekly_minutes numeric\s*\)/);
  });

  it('keeps anonymous (student) accounts out of every teacher path', () => {
    expect(additions).toMatch(/function public\.is_teacher\(\)[\s\S]*?not public\.caller_is_anonymous\(\)/);
    expect(additions).toMatch(/function public\.claim_teacher_invite[\s\S]*?public\.caller_is_anonymous\(\)/);
  });

  it('stores no emails in imported rosters', () => {
    expect(additions).toContain("position('@' in external_id) = 0");
    expect(additions).toContain("position('@' in display_name) = 0");
    expect(additions).not.toMatch(/roster_students \([^;]*email/);
  });

  it('closes archived classes to new students but keeps legacy codes open', () => {
    expect(additions).toMatch(/function public\.class_code_exists[\s\S]*?not exists \(select 1 from classes where class_code = code and archived_at is not null\)/);
  });

  it('runs every new RPC for signed-in callers only', () => {
    for (const fn of [
      'claim_teacher_invite(text)', 'admin_invite_teacher(text, text)', 'create_class(text)',
      'rename_class(uuid, text)', 'set_class_archived(uuid, boolean)',
      'import_roster(uuid, text, text, jsonb)', 'school_class_summary()',
    ]) {
      expect(additions).toContain(`revoke all on function public.${fn} from public, anon;`);
      expect(additions).toContain(`grant execute on function public.${fn} to authenticated;`);
    }
  });

  it('ships the SQL scenario that proves the isolation rules', () => {
    const path = resolve(root, 'supabase/tests/teacher-dashboard-rls.sql');
    expect(existsSync(path)).toBe(true);
    const scenario = readFileSync(path, 'utf8');
    expect(scenario).toContain('teacher A sees only their own class');
    expect(scenario).toContain('the admin sees class counts and weekly minutes for their school, no student names');
    expect(scenario).toContain('a student cannot read classes');
  });
});
