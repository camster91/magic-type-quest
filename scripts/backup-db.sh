#!/usr/bin/env bash
# BloomType database backup.
#
# Makes one dated, compressed, encrypted backup of the BloomType tables
# (schema + data, including RLS policies and grants) and prunes old backups.
# Restore with scripts/restore-db.sh. Full guide: docs/ops/BACKUPS.md.
#
# Everything comes from environment variables. Nothing secret lives in the repo.
#
#   BACKUP_DATABASE_URL        required. Postgres URL of the source database.
#                              On Supabase use the DIRECT connection or the
#                              session pooler (port 5432), not the transaction
#                              pooler (6543): the backup holds one snapshot open.
#   BACKUP_AGE_RECIPIENT       age public key (age1...). Preferred. Several keys
#                              may be given, separated by spaces.
#   BACKUP_PASSPHRASE          used only when BACKUP_AGE_RECIPIENT is unset:
#                              encrypts with openssl AES-256 + PBKDF2.
#                              One of these two is required; the script never
#                              writes an unencrypted backup.
#   BACKUP_DIR                 where backups go. Default: ./backups
#   BACKUP_RETENTION_DAYS      delete backups older than this. Default: 30
#                              (no retention period is approved yet, see
#                              docs/PRIVACY-OPERATIONS.md; change it when #132
#                              sets one).
#   BACKUP_MIN_KEEP            always keep at least this many newest backups,
#                              whatever their age. Default: 3
#   BACKUP_SCHEMAS             schemas dumped with schema + data.
#                              Default: public
#   BACKUP_INCLUDE_AUTH_USERS  1 (default) also saves the rows of auth.users
#                              (data only), so teacher_codes can be restored.
#                              Set 0 to skip.
#
# Usage: scripts/backup-db.sh            make a backup, then prune
#        scripts/backup-db.sh --prune-only
set -euo pipefail
umask 077

BACKUP_DIR=${BACKUP_DIR:-./backups}
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
BACKUP_MIN_KEEP=${BACKUP_MIN_KEEP:-3}
BACKUP_SCHEMAS=${BACKUP_SCHEMAS:-public}
BACKUP_INCLUDE_AUTH_USERS=${BACKUP_INCLUDE_AUTH_USERS:-1}
NAME_RE='^bloomtype-[0-9]{8}T[0-9]{6}Z\.tar\.gz\.(age|enc)$'

log() { printf '[backup] %s\n' "$*" >&2; }
die() { printf '[backup] ERROR: %s\n' "$*" >&2; exit 1; }

is_uint() { [[ $1 =~ ^[0-9]+$ ]]; }
is_uint "$BACKUP_RETENTION_DAYS" || die "BACKUP_RETENTION_DAYS must be a whole number"
is_uint "$BACKUP_MIN_KEEP" || die "BACKUP_MIN_KEEP must be a whole number"

# Delete backups whose name-date is older than the retention window, but
# never the newest BACKUP_MIN_KEEP. The date comes from the file name, so
# copying files (which resets mtime) does not change what is kept.
prune() {
  local cutoff names=() name stamp i keep_from
  cutoff=$(date -u -d "-${BACKUP_RETENTION_DAYS} days" +%Y%m%dT%H%M%SZ)
  [[ -d $BACKUP_DIR ]] || return 0
  while IFS= read -r name; do
    [[ $name =~ $NAME_RE ]] && names+=("$name")
  done < <(find "$BACKUP_DIR" -maxdepth 1 -type f -printf '%f\n' | LC_ALL=C sort)
  keep_from=$(( ${#names[@]} - BACKUP_MIN_KEEP ))
  for (( i = 0; i < ${#names[@]}; i++ )); do
    name=${names[$i]}
    stamp=${name#bloomtype-}; stamp=${stamp%%.*}
    if (( i < keep_from )) && [[ $stamp < $cutoff ]]; then
      rm -f -- "$BACKUP_DIR/$name"
      log "pruned $name (older than ${BACKUP_RETENTION_DAYS} days)"
    fi
  done
}

if [[ ${1:-} == --prune-only ]]; then
  prune
  exit 0
fi
[[ $# -eq 0 ]] || die "unknown argument: $1"

: "${BACKUP_DATABASE_URL:?set BACKUP_DATABASE_URL (see header of this script)}"
if [[ -n ${BACKUP_AGE_RECIPIENT:-} ]]; then
  command -v age >/dev/null || die "age is not installed"
  ext=age
elif [[ -n ${BACKUP_PASSPHRASE:-} ]]; then
  command -v openssl >/dev/null || die "openssl is not installed"
  ext=enc
else
  die "set BACKUP_AGE_RECIPIENT (preferred) or BACKUP_PASSPHRASE; refusing to write an unencrypted backup"
fi
for tool in psql pg_dump tar gzip sha256sum; do
  command -v "$tool" >/dev/null || die "$tool is not installed"
done

mkdir -p "$BACKUP_DIR"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
out="$BACKUP_DIR/bloomtype-$stamp.tar.gz.$ext"
work=$(mktemp -d)
snap_in=""
cleanup() {
  [[ -n $snap_in ]] && { exec {snap_in}>&- || true; }
  rm -rf -- "$work" "$out.partial"
}
trap cleanup EXIT

# Hold one read-only snapshot open so the table dump, the auth.users dump and
# the row counts all describe exactly the same moment.
coproc SNAP { psql -X -A -t -q -v ON_ERROR_STOP=1 -d "$BACKUP_DATABASE_URL"; }
snap_in=${SNAP[1]}
snap_out=${SNAP[0]}
# shellcheck disable=SC2153 # SNAP_PID is set by coproc
snap_pid=$SNAP_PID
# Send one query on the snapshot connection; its one-line answer lands in
# $answer. (No $(...) here: a subshell cannot use the coprocess pipes.)
answer=""
snap_ask() {
  printf '%s\n' "$1" >&"$snap_in"
  IFS= read -r -t 60 answer <&"$snap_out" || die "lost the snapshot connection"
}
snap_ask "begin isolation level repeatable read read only; select pg_export_snapshot();"
snapshot=$answer
[[ -n $snapshot ]] || die "could not export a snapshot"

schema_args=()
schema_list=""
for s in $BACKUP_SCHEMAS; do
  [[ $s =~ ^[a-z_][a-z0-9_]*$ ]] || die "bad schema name: $s"
  schema_args+=("--schema=$s")
  schema_list+="${schema_list:+,}'$s'"
done

log "dumping schemas: $BACKUP_SCHEMAS"
pg_dump --dbname="$BACKUP_DATABASE_URL" --snapshot="$snapshot" \
  --format=custom --no-owner "${schema_args[@]}" --file="$work/schemas.dump"

if [[ $BACKUP_INCLUDE_AUTH_USERS == 1 ]]; then
  log "dumping auth.users rows (data only)"
  pg_dump --dbname="$BACKUP_DATABASE_URL" --snapshot="$snapshot" \
    --format=custom --no-owner --data-only --table=auth.users \
    --file="$work/auth_users.dump"
fi

# Row counts and RLS facts from the same snapshot, so a restore can prove it
# brought back everything.
tables_sql="select quote_ident(table_schema)||'.'||quote_ident(table_name)
  from information_schema.tables
  where table_type = 'BASE TABLE' and table_schema in ($schema_list)
  order by 1"
snap_ask "select coalesce(string_agg(t, ' '), '') from ($tables_sql) x(t);"
read -r -a tables <<< "$answer"
: > "$work/counts.tsv"
for t in "${tables[@]}"; do
  snap_ask "select count(*) from $t;"
  printf '%s\t%s\n' "$t" "$answer" >> "$work/counts.tsv"
done
if [[ $BACKUP_INCLUDE_AUTH_USERS == 1 ]]; then
  snap_ask "select count(*) from auth.users;"
  printf '%s\t%s\n' "auth.users" "$answer" >> "$work/counts.tsv"
fi
snap_ask "select coalesce(string_agg(schemaname||'.'||tablename||'|'||policyname||'|'||cmd, ';'), '')
  from pg_policies where schemaname in ($schema_list);"
printf '%s' "$answer" | tr ';' '\n' | sed '/^$/d' | LC_ALL=C sort > "$work/policies.txt"
snap_ask "select coalesce(string_agg(n.nspname||'.'||c.relname, ';'), '')
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where c.relkind = 'r' and c.relrowsecurity and n.nspname in ($schema_list);"
printf '%s' "$answer" | tr ';' '\n' | sed '/^$/d' | LC_ALL=C sort > "$work/rls_tables.txt"
# Who may do what to each table, sequence and function (owner excluded,
# because the restoring user becomes the owner).
snap_ask "select coalesce(string_agg(obj||'|'||coalesce(r.rolname, 'PUBLIC')||'|'||a.privilege_type, ';'), '')
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
  where a.grantee <> o.owner;"
printf '%s' "$answer" | tr ';' '\n' | sed '/^$/d' | LC_ALL=C sort > "$work/grants.txt"
snap_ask "show server_version;"
server_version=$answer
printf '%s\n' "commit;" >&"$snap_in"
exec {snap_in}>&-
snap_in=""
wait "$snap_pid" 2>/dev/null || true

{
  echo "format=bloomtype-backup-v1"
  echo "created_utc=$stamp"
  echo "schemas=$BACKUP_SCHEMAS"
  echo "auth_users=$BACKUP_INCLUDE_AUTH_USERS"
  echo "server_version=$server_version"
  echo "pg_dump=$(pg_dump --version)"
} > "$work/manifest.txt"
( cd "$work" && sha256sum -- *.dump counts.tsv policies.txt rls_tables.txt grants.txt manifest.txt > SHA256SUMS )

log "encrypting ($ext)"
if [[ $ext == age ]]; then
  recipients=()
  for r in $BACKUP_AGE_RECIPIENT; do recipients+=(-r "$r"); done
  tar -C "$work" -cf - . | gzip -9 | age "${recipients[@]}" -o "$out.partial"
else
  tar -C "$work" -cf - . | gzip -9 |
    openssl enc -aes-256-cbc -salt -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE -out "$out.partial"
fi
mv -- "$out.partial" "$out"
log "wrote $out ($(wc -c < "$out") bytes, ${#tables[@]} tables, $(wc -l < "$work/policies.txt") policies)"

prune
printf '%s\n' "$out"
