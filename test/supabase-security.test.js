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
});
