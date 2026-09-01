import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const schema = readFileSync(resolve(root, 'supabase/schema.sql'), 'utf8');
const syncSource = readFileSync(resolve(root, 'src/sync.js'), 'utf8');

describe('Supabase privacy boundary', () => {
  it('enables RLS on every student-data table', () => {
    for (const table of ['profiles', 'game_sessions', 'class_roster', 'teacher_codes']) {
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
    expect(syncSource).toContain(".eq('profile_id', user.id)");
    expect(syncSource).not.toContain('st.id || st.name');
  });

  it('allows an authenticated student to delete only their own cascading profile', () => {
    expect(schema).toContain('create policy "Self delete" on profiles for delete');
    expect(schema).toContain('using (auth.uid() = id)');
    expect(schema).toContain('profile_id uuid references profiles(id) on delete cascade');
    expect(schema).toContain('profile_id uuid not null references profiles(id) on delete cascade');
    expect(syncSource).toContain(".eq('id', userId)");
    expect(syncSource).toContain("signOut({ scope: 'local' })");
  });

  it('scopes student cloud exports to the authenticated identity', () => {
    expect(syncSource).toContain("fetchAllOwnedRows(sb, 'profiles', 'id', userId");
    expect(syncSource).toContain("fetchAllOwnedRows(sb, 'game_sessions', 'profile_id', userId");
    expect(syncSource).toContain("fetchAllOwnedRows(sb, 'class_roster', 'profile_id', userId");
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

  it('deduplicates ambiguous session retries without rewriting legacy rows', () => {
    expect(schema).toContain('alter table game_sessions add column if not exists session_id uuid');
    expect(schema).toContain('create unique index if not exists idx_sessions_session_id');
    expect(schema).toContain('where session_id is not null');
    expect(syncSource).toContain("if (error?.code === '23505') return true");
  });
});
