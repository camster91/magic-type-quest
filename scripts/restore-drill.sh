#!/usr/bin/env bash
# BloomType restore drill. Proves a backup can really be restored.
# Results go in docs/ops/RESTORE-DRILL.md.
#
# LOCAL mode (default): a throwaway PostgreSQL 15+ server, reached with the
# usual libpq variables (PGHOST, PGPORT, PGUSER; the user must be able to
# create and drop databases). The drill:
#   1. creates database $DRILL_DB, loads supabase/local-stub.sql and
#      supabase/schema.sql, and inserts sample rows;
#   2. records row counts, RLS policies, grants and what each test user can
#      see through RLS;
#   3. runs scripts/backup-db.sh (encrypted with a throwaway key);
#   4. DROPS $DRILL_DB;
#   5. creates $DRILL_RESTORE_DB, loads the stub, runs scripts/restore-db.sh;
#   6. checks counts, policies, grants and RLS behaviour match step 2;
#   7. checks retention pruning on dummy files.
#
# LIVE mode (--live): backs up the real project and restores into a scratch
# database. It never writes to the source.
#   BACKUP_DATABASE_URL    the real project (read only).
#   RESTORE_DATABASE_URL   a FRESH scratch database with Supabase base objects:
#                          a new Supabase project or `supabase start` locally.
#                          Never the real project.
#   BACKUP_AGE_RECIPIENT + BACKUP_AGE_IDENTITY_FILE, or BACKUP_PASSPHRASE.
#   BACKUP_DIR             optional; defaults to a temp dir that is deleted.
#
# Options (local mode): DRILL_DB (default bloomtype_drill),
# DRILL_RESTORE_DB (default bloomtype_drill_restored),
# DRILL_ENCRYPTION=age|openssl (default age), DRILL_KEEP=1 keeps the restored DB.
set -euo pipefail

here=$(cd "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
root=$(cd "$here/.." && pwd)
say() { printf '\n== %s\n' "$*"; }
die() { printf 'DRILL FAILED: %s\n' "$*" >&2; exit 1; }

if [[ ${1:-} == --live ]]; then
  : "${BACKUP_DATABASE_URL:?set BACKUP_DATABASE_URL}"
  : "${RESTORE_DATABASE_URL:?set RESTORE_DATABASE_URL (a fresh scratch database)}"
  [[ $BACKUP_DATABASE_URL != "$RESTORE_DATABASE_URL" ]] || die "source and target are the same database"
  tmp=$(mktemp -d); trap 'rm -rf -- "$tmp"' EXIT
  export BACKUP_DIR=${BACKUP_DIR:-$tmp/backups}
  say "Backing up the live project (read only)"
  file=$("$here/backup-db.sh")
  say "Restoring into the scratch database"
  "$here/restore-db.sh" "$file"
  say "LIVE DRILL PASSED $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  exit 0
fi
[[ $# -eq 0 ]] || die "unknown argument: $1"

DRILL_DB=${DRILL_DB:-bloomtype_drill}
DRILL_RESTORE_DB=${DRILL_RESTORE_DB:-bloomtype_drill_restored}
DRILL_ENCRYPTION=${DRILL_ENCRYPTION:-age}
for n in "$DRILL_DB" "$DRILL_RESTORE_DB"; do
  [[ $n =~ ^[a-z_][a-z0-9_]*drill[a-z0-9_]*$ ]] || die "drill database names must contain 'drill': $n"
done
case ${PGHOST:-} in *supabase*) die "local mode refuses a Supabase host; use --live" ;; esac

# Hide the NOTICE lines schema.sql prints for its "drop ... if exists" steps.
export PGOPTIONS="${PGOPTIONS:-} -c client_min_messages=warning"
psql_db() { local db=$1; shift; psql -X -q -v ON_ERROR_STOP=1 -d "$db" "$@"; }
admin() { psql_db postgres -A -t -c "$1"; }

tmp=$(mktemp -d)
cleanup() {
  rm -rf -- "$tmp"
  admin "drop database if exists $DRILL_DB" >/dev/null 2>&1 || true
  [[ ${DRILL_KEEP:-0} == 1 ]] || admin "drop database if exists $DRILL_RESTORE_DB" >/dev/null 2>&1 || true
}
trap cleanup EXIT

say "Server: $(admin 'select version()')"
admin "drop database if exists $DRILL_DB" >/dev/null
admin "drop database if exists $DRILL_RESTORE_DB" >/dev/null

say "1. Create $DRILL_DB, load stub + schema, insert sample rows"
admin "create database $DRILL_DB" >/dev/null
psql_db "$DRILL_DB" -f "$root/supabase/local-stub.sql"
psql_db "$DRILL_DB" -f "$root/supabase/schema.sql"
psql_db "$DRILL_DB" >/dev/null <<'SQL'
-- Teacher T, students A and B, and A2 = a second device linked to A.
\set T '''11111111-1111-1111-1111-111111111111'''
\set A '''22222222-2222-2222-2222-222222222222'''
\set B '''33333333-3333-3333-3333-333333333333'''
\set A2 '''44444444-4444-4444-4444-444444444444'''
insert into auth.users (id) values (:T), (:A), (:B), (:A2);
insert into teacher_codes (class_code, teacher_id) values ('MAPLE7', :T);
insert into profiles (id, name, avatar, high_score, total_words, garden)
  values (:A, 'Ava', '🌸', 120, 340, '[{"plant":"tulip"}]'),
         (:B, 'Ben', '🌻', 80, 150, '[]'),
         (:A2, 'Ava', '🌸', 30, 40, '[]');
insert into linked_devices (device_id, student_id) values (:A2, :A);
insert into student_link_codes (owner_id, code_hash, expires_at)
  values (:B, encode(extensions.digest('ABCDEFGHJKMN', 'sha256'), 'hex'), now() + interval '14 days');
select set_config('request.jwt.claim.sub', :A, false);
insert into class_roster (class_code, profile_id, name, total_words) values ('MAPLE7', :A, 'Ava', 340);
select set_config('request.jwt.claim.sub', :B, false);
insert into class_roster (class_code, profile_id, name, total_words) values ('MAPLE7', :B, 'Ben', 150);
select set_config('request.jwt.claim.sub', '', false);
insert into game_sessions (session_id, profile_id, level, score, wpm, accuracy, words_typed)
  values (gen_random_uuid(), :A, 1, 50, 12.5, 96.0, 30),
         (gen_random_uuid(), :A, 2, 70, 14.0, 97.5, 35),
         (gen_random_uuid(), :A2, 1, 30, 9.0, 90.0, 20),
         (gen_random_uuid(), :B, 1, 40, 10.0, 92.0, 25),
         (gen_random_uuid(), :B, 2, 40, 11.0, 93.0, 25);
SQL

# What the drill compares before and after: exact row counts, policies,
# RLS switches, grants to the API roles, and what RLS lets each user see.
snapshot() {
  local db=$1
  psql_db "$db" -A -t -F ' ' <<'SQL'
select 'rows', t, n from (
  select 'auth.users' t, count(*) n from auth.users union all
  select 'profiles', count(*) from profiles union all
  select 'game_sessions', count(*) from game_sessions union all
  select 'class_roster', count(*) from class_roster union all
  select 'teacher_codes', count(*) from teacher_codes union all
  select 'linked_devices', count(*) from linked_devices union all
  select 'student_link_codes', count(*) from student_link_codes) x order by 2;
select 'policy', tablename, replace(policyname, ' ', '_'), cmd from pg_policies where schemaname = 'public' order by 2, 3;
select 'rls_on', relname from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' and relrowsecurity order by 2;
select 'grant', table_name, grantee, string_agg(privilege_type, ',' order by privilege_type)
  from information_schema.role_table_grants
  where table_schema = 'public' and grantee in ('anon', 'authenticated') group by 2, 3 order by 2, 3;
select 'exec', p.proname, r.rolname from pg_proc p cross join pg_roles r
  where p.pronamespace = 'public'::regnamespace and r.rolname in ('anon', 'authenticated')
    and has_function_privilege(r.oid, p.oid, 'execute') order by 2, 3;
-- RLS behaviour: rows each user can see when acting as `authenticated`.
create temp table probe (who text, what text, n bigint);
grant insert on probe to authenticated;
do $$
declare u record; t text; n bigint;
begin
  for u in select * from (values ('teacherT', '11111111-1111-1111-1111-111111111111'),
    ('studentA', '22222222-2222-2222-2222-222222222222'),
    ('studentB', '33333333-3333-3333-3333-333333333333'),
    ('deviceA2', '44444444-4444-4444-4444-444444444444')) v(who, id) loop
    foreach t in array array['profiles', 'game_sessions', 'class_roster', 'teacher_codes', 'linked_devices', 'student_link_codes'] loop
      perform set_config('request.jwt.claim.sub', u.id, true);
      set local role authenticated;
      execute format('select count(*) from public.%I', t) into n;
      reset role;
      insert into probe values (u.who, t, n);
    end loop;
  end loop;
end $$;
select 'sees', who, what, n from probe order by 2, 3;
SQL
}
snapshot "$DRILL_DB" > "$tmp/before.txt"
echo "Recorded $(wc -l < "$tmp/before.txt") facts. Row counts:"
grep '^rows ' "$tmp/before.txt"

say "2. Back up ($DRILL_ENCRYPTION encryption, throwaway key)"
export BACKUP_DATABASE_URL="postgresql:///$DRILL_DB"
export BACKUP_DIR="$tmp/backups"
unset BACKUP_AGE_RECIPIENT BACKUP_PASSPHRASE
if [[ $DRILL_ENCRYPTION == age ]]; then
  age-keygen -o "$tmp/drill.key" 2>/dev/null
  export BACKUP_AGE_IDENTITY_FILE="$tmp/drill.key"
  BACKUP_AGE_RECIPIENT=$(age-keygen -y "$tmp/drill.key"); export BACKUP_AGE_RECIPIENT
else
  BACKUP_PASSPHRASE=$(openssl rand -base64 32); export BACKUP_PASSPHRASE
fi
file=$("$here/backup-db.sh")
echo "$(wc -c < "$file") bytes: $file"
if gzip -t < "$file" 2>/dev/null || grep -aq 'teacher_codes' "$file"; then
  die "backup file is readable without the key"
fi
echo "Backup is encrypted: no readable table names, not a gzip stream."

say "3. Drop $DRILL_DB (simulated loss)"
admin "drop database $DRILL_DB" >/dev/null
[[ $(admin "select count(*) from pg_database where datname = '$DRILL_DB'") == 0 ]] || die "database still exists"
echo "Dropped."

say "4. Restore into fresh $DRILL_RESTORE_DB"
admin "create database $DRILL_RESTORE_DB" >/dev/null
psql_db "$DRILL_RESTORE_DB" -f "$root/supabase/local-stub.sql"
RESTORE_DATABASE_URL="postgresql:///$DRILL_RESTORE_DB" "$here/restore-db.sh" "$file"

say "5. Compare everything with the facts recorded before the backup"
snapshot "$DRILL_RESTORE_DB" > "$tmp/after.txt"
if diff -u "$tmp/before.txt" "$tmp/after.txt"; then
  echo "All $(wc -l < "$tmp/after.txt") facts match: $(grep -c '^rows ' "$tmp/after.txt") row counts," \
    "$(grep -c '^policy ' "$tmp/after.txt") policies, $(grep -c '^rls_on ' "$tmp/after.txt") RLS tables," \
    "$(grep -c '^grant ' "$tmp/after.txt") table grants, $(grep -c '^exec ' "$tmp/after.txt") function grants," \
    "$(grep -c '^sees ' "$tmp/after.txt") RLS visibility checks."
else
  die "restored database differs from the original"
fi
echo "RLS visibility after restore:"
grep '^sees ' "$tmp/after.txt" | awk '$4 != 0'

say "6. Restore refuses a non-fresh target"
if RESTORE_DATABASE_URL="postgresql:///$DRILL_RESTORE_DB" "$here/restore-db.sh" "$file" 2> "$tmp/refuse.txt"; then
  die "restore ran over an existing database"
fi
cat "$tmp/refuse.txt"

say "7. Retention pruning (30 days, keep at least 3)"
for d in 40 35 31 10; do
  : > "$BACKUP_DIR/bloomtype-$(date -u -d "-$d days" +%Y%m%dT%H%M%SZ).tar.gz.age"
done
BACKUP_RETENTION_DAYS=30 BACKUP_MIN_KEEP=3 "$here/backup-db.sh" --prune-only
left=$(find "$BACKUP_DIR" -name 'bloomtype-*' | wc -l)
[[ $left == 3 ]] || die "expected 3 backups after pruning, found $left"
echo "3 backups left (40- and 35-day-old files pruned; 31-day file kept by the keep-3 minimum)."

say "DRILL PASSED $(date -u +%Y-%m-%dT%H:%M:%SZ)"
