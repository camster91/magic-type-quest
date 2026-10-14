#!/usr/bin/env bash
# BloomType database restore. The partner of scripts/backup-db.sh.
#
# Decrypts a backup, checks its checksums, restores it into a FRESH database,
# then proves the restore: every table's row count must match the count saved
# at backup time, and every RLS policy and RLS-enabled table must be back.
# Full guide: docs/ops/BACKUPS.md. Practice run: scripts/restore-drill.sh.
#
#   RESTORE_DATABASE_URL       required. Postgres URL of the TARGET database.
#                              It must be fresh: the script refuses to run if
#                              the BloomType tables already exist there.
#                              It must already have Supabase's base objects
#                              (auth schema, anon/authenticated roles, the
#                              extensions schema with pgcrypto). A new Supabase
#                              project has these; locally, load
#                              supabase/local-stub.sql first.
#   BACKUP_AGE_IDENTITY_FILE   age private key file, for .age backups.
#   BACKUP_PASSPHRASE          passphrase, for .enc (openssl) backups.
#
# Usage: scripts/restore-db.sh path/to/bloomtype-YYYYMMDDTHHMMSSZ.tar.gz.age
set -euo pipefail
umask 077

log() { printf '[restore] %s\n' "$*" >&2; }
die() { printf '[restore] ERROR: %s\n' "$*" >&2; exit 1; }

[[ $# -eq 1 ]] || die "usage: $0 <backup file>"
file=$1
[[ -f $file ]] || die "no such file: $file"
: "${RESTORE_DATABASE_URL:?set RESTORE_DATABASE_URL (see header of this script)}"
for tool in psql pg_restore tar gzip sha256sum; do
  command -v "$tool" >/dev/null || die "$tool is not installed"
done

work=$(mktemp -d)
trap 'rm -rf -- "$work"' EXIT

log "decrypting $(basename -- "$file")"
case $file in
  *.age)
    : "${BACKUP_AGE_IDENTITY_FILE:?set BACKUP_AGE_IDENTITY_FILE for an .age backup}"
    age -d -i "$BACKUP_AGE_IDENTITY_FILE" "$file" | gzip -dc | tar -C "$work" -xf -
    ;;
  *.enc)
    : "${BACKUP_PASSPHRASE:?set BACKUP_PASSPHRASE for an .enc backup}"
    openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE -in "$file" |
      gzip -dc | tar -C "$work" -xf -
    ;;
  *) die "unknown backup type (expected .age or .enc): $file" ;;
esac
( cd "$work" && sha256sum --quiet -c SHA256SUMS ) || die "checksum mismatch: the backup is damaged"
grep -qx 'format=bloomtype-backup-v1' "$work/manifest.txt" || die "not a BloomType backup"
log "backup made $(sed -n 's/^created_utc=//p' "$work/manifest.txt") from Postgres $(sed -n 's/^server_version=//p' "$work/manifest.txt")"

q() { psql -X -A -t -q -v ON_ERROR_STOP=1 -d "$RESTORE_DATABASE_URL" -c "$1"; }

# Safety: only restore into a database that does not have the tables yet.
existing=$(q "select count(*) from information_schema.tables where table_schema = 'public'
  and table_name in ('profiles','game_sessions','class_roster','teacher_codes','linked_devices','student_link_codes');")
[[ $existing == 0 ]] || die "target already has BloomType tables; restore only into a fresh database"
[[ $(q "select count(*) from pg_namespace where nspname = 'auth'") == 1 ]] ||
  die "target has no auth schema; use a Supabase project or load supabase/local-stub.sql"
[[ $(q "select count(*) from pg_roles where rolname in ('anon','authenticated')") == 2 ]] ||
  die "target is missing the anon/authenticated roles"

if [[ -f $work/auth_users.dump ]]; then
  log "restoring auth.users rows"
  pg_restore --dbname="$RESTORE_DATABASE_URL" --data-only --no-owner \
    --exit-on-error --single-transaction "$work/auth_users.dump"
fi

schemas=$(sed -n 's/^schemas=//p' "$work/manifest.txt")
schema_list=""
for s in $schemas; do
  [[ $s =~ ^[a-z_][a-z0-9_]*$ ]] || die "bad schema name in manifest: $s"
  schema_list+="${schema_list:+,}'$s'"
done

# Build one SQL script and run it in a single transaction:
#   1. everything except privileges (the target already has a public schema,
#      so its CREATE SCHEMA is left out);
#   2. wipe the privileges the TARGET's default privileges just handed out
#      (Supabase grants everything to anon/authenticated on every new table,
#      which would silently undo revokes such as "no insert on teacher_codes");
#   3. replay the exact privileges saved in the backup.
pg_restore --list "$work/schemas.dump" > "$work/toc.all"
grep -Ev '^[0-9]+; [0-9]+ [0-9]+ (ACL|(SCHEMA|COMMENT) - (SCHEMA )?public )' "$work/toc.all" > "$work/toc.main"
grep -E '^[0-9]+; [0-9]+ [0-9]+ ACL ' "$work/toc.all" | grep -Ev ' ACL - SCHEMA ' > "$work/toc.acl" || true
pg_restore --no-owner --use-list="$work/toc.main" --file="$work/main.sql" "$work/schemas.dump"
pg_restore --no-owner --use-list="$work/toc.acl" --file="$work/acl.sql" "$work/schemas.dump"
api_roles=$(q "select string_agg(quote_ident(rolname), ', ' order by rolname) from pg_roles
  where rolname in ('anon', 'authenticated', 'service_role')")
{
  cat "$work/main.sql"
  # Reset every object to PostgreSQL's built-in default (functions: anyone may
  # execute; tables and sequences: owner only). The backup's ACL statements
  # are written relative to exactly that default.
  for s in $schemas; do
    echo "REVOKE ALL ON ALL TABLES IN SCHEMA $s FROM PUBLIC, $api_roles;"
    echo "REVOKE ALL ON ALL SEQUENCES IN SCHEMA $s FROM PUBLIC, $api_roles;"
    echo "REVOKE ALL ON ALL FUNCTIONS IN SCHEMA $s FROM $api_roles;"
    echo "GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA $s TO PUBLIC;"
  done
  cat "$work/acl.sql"
} > "$work/restore.sql"
log "restoring tables, data, functions, policies and privileges"
psql -X -q -v ON_ERROR_STOP=1 --single-transaction -d "$RESTORE_DATABASE_URL" -f "$work/restore.sql" >/dev/null

log "verifying"
fail=0
while IFS=$'\t' read -r table want; do
  got=$(q "select count(*) from $table;")
  if [[ $got == "$want" ]]; then
    log "  ok    $table rows=$got"
  else
    log "  FAIL  $table rows=$got expected=$want"
    fail=1
  fi
done < "$work/counts.tsv"

q "select schemaname||'.'||tablename||'|'||policyname||'|'||cmd from pg_policies
   where schemaname in ($schema_list) order by 1;" | LC_ALL=C sort > "$work/policies.now"
q "select n.nspname||'.'||c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where c.relkind = 'r' and c.relrowsecurity and n.nspname in ($schema_list) order by 1;" | LC_ALL=C sort > "$work/rls.now"
if diff -u "$work/policies.txt" "$work/policies.now" >&2; then
  log "  ok    $(wc -l < "$work/policies.now") RLS policies match the backup"
else
  log "  FAIL  RLS policies differ from the backup"; fail=1
fi
if diff -u "$work/rls_tables.txt" "$work/rls.now" >&2; then
  log "  ok    RLS is on for the same $(wc -l < "$work/rls.now") tables"
else
  log "  FAIL  RLS-enabled tables differ from the backup"; fail=1
fi
q "select obj||'|'||coalesce(r.rolname, 'PUBLIC')||'|'||a.privilege_type
  from (
    select n.nspname||'.'||c.relname as obj, c.relowner as owner,
           coalesce(c.relacl, acldefault((case when c.relkind = 'S' then 's' else 'r' end)::\"char\", c.relowner)) as acl
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where c.relkind in ('r', 'p', 'v', 'm', 'S') and n.nspname in ($schema_list)
    union all
    select n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')', p.proowner,
           coalesce(p.proacl, acldefault('f'::\"char\", p.proowner))
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname in ($schema_list)
  ) o cross join lateral aclexplode(o.acl) a
  left join pg_roles r on r.oid = a.grantee
  where a.grantee <> o.owner;" | LC_ALL=C sort > "$work/grants.now"
if diff -u "$work/grants.txt" "$work/grants.now" >&2; then
  log "  ok    $(wc -l < "$work/grants.now") privileges (grants) match the backup"
else
  log "  FAIL  privileges differ from the backup"; fail=1
fi

[[ $fail == 0 ]] || die "restore finished but verification FAILED; do not use this database"
log "restore verified"
