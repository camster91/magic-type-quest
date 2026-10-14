# Restore drill record

A backup only counts once it has been restored. This page records each drill.
How backups work: [BACKUPS.md](BACKUPS.md). What to do in a real incident:
[INCIDENT-RUNBOOK.md](INCIDENT-RUNBOOK.md).

## Drill 1 — 2026-10-14 — local PostgreSQL — PASSED

**Scope:** a throwaway local PostgreSQL 16.15 server with
`supabase/local-stub.sql` standing in for Supabase. **Not** the live project:
there is no live project yet (#133). Repeat this drill against the live
project with `--live` once it exists (see "Next drill").

**Tools:** PostgreSQL 16.15 (`pg_dump`, `pg_restore`, `psql` 16.15), age 1.1.1,
OpenSSL 3, GNU coreutils, Ubuntu 24.04.

### What the drill does

`scripts/restore-drill.sh`:

1. creates database `bloomtype_drill`, loads `supabase/local-stub.sql` and
   `supabase/schema.sql`, and inserts sample rows: a teacher, two students, a
   second device linked to one student, a class code, a link code, roster rows
   and five game sessions;
2. records 75 facts: exact row counts, every RLS policy, which tables have RLS
   on, every grant to `anon`/`authenticated`, and **what each test user can
   actually see** through RLS (24 checks, acting as the `authenticated` role);
3. runs `scripts/backup-db.sh` with a throwaway age key, and checks the file
   cannot be read without the key;
4. **drops** `bloomtype_drill`;
5. creates a fresh `bloomtype_drill_restored`, loads the stub, and runs
   `scripts/restore-db.sh`, which checks checksums, row counts, policies, RLS
   switches and grants against the backup;
6. compares all 75 facts with step 2;
7. checks the restore refuses a database that already has the tables;
8. checks retention pruning on dummy files dated 40, 35, 31 and 10 days ago.

### Commands

A local server was started for the drill (port 5510; the shared server on
5499 was not running):

```sh
D=/tmp/pgdrill-5510
mkdir -p $D && chown postgres:postgres $D
setpriv --reuid=postgres --regid=postgres --init-groups \
  /usr/lib/postgresql/16/bin/initdb -D $D/data -U postgres --auth=trust -E UTF8
setpriv --reuid=postgres --regid=postgres --init-groups \
  /usr/lib/postgresql/16/bin/pg_ctl -D $D/data \
  -o "-p 5510 -k $D -c listen_addresses=" -l $D/server.log -w start
```

Then the drill, once with age (default) and once with openssl:

```sh
PGHOST=/tmp/pgdrill-5510 PGPORT=5510 PGUSER=postgres scripts/restore-drill.sh
PGHOST=/tmp/pgdrill-5510 PGPORT=5510 PGUSER=postgres DRILL_ENCRYPTION=openssl scripts/restore-drill.sh
```

### Output (age run, complete)

```text
== Server: PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 13.3.0-6ubuntu2~24.04.1) 13.3.0, 64-bit

== 1. Create bloomtype_drill, load stub + schema, insert sample rows
Recorded 75 facts. Row counts:
rows auth.users 4
rows class_roster 2
rows game_sessions 5
rows linked_devices 1
rows profiles 3
rows student_link_codes 1
rows teacher_codes 1

== 2. Back up (age encryption, throwaway key)
[backup] dumping schemas: public
[backup] dumping auth.users rows (data only)
[backup] encrypting (age)
[backup] wrote /tmp/tmp.VlSuK9C1E4/backups/bloomtype-20261014T165509Z.tar.gz.age (9167 bytes, 6 tables, 18 policies)
9167 bytes: /tmp/tmp.VlSuK9C1E4/backups/bloomtype-20261014T165509Z.tar.gz.age
Backup is encrypted: no readable table names, not a gzip stream.

== 3. Drop bloomtype_drill (simulated loss)
Dropped.

== 4. Restore into fresh bloomtype_drill_restored
[restore] decrypting bloomtype-20261014T165509Z.tar.gz.age
[restore] backup made 20261014T165509Z from Postgres 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
[restore] restoring auth.users rows
[restore] restoring tables, data, functions, policies and privileges
[restore] verifying
[restore]   ok    public.class_roster rows=2
[restore]   ok    public.game_sessions rows=5
[restore]   ok    public.linked_devices rows=1
[restore]   ok    public.profiles rows=3
[restore]   ok    public.student_link_codes rows=1
[restore]   ok    public.teacher_codes rows=1
[restore]   ok    auth.users rows=4
[restore]   ok    18 RLS policies match the backup
[restore]   ok    RLS is on for the same 6 tables
[restore]   ok    60 privileges (grants) match the backup
[restore] restore verified

== 5. Compare everything with the facts recorded before the backup
All 75 facts match: 7 row counts, 18 policies, 6 RLS tables, 12 table grants, 8 function grants, 24 RLS visibility checks.
RLS visibility after restore:
sees deviceA2 class_roster 1
sees deviceA2 game_sessions 3
sees deviceA2 linked_devices 1
sees deviceA2 profiles 2
sees studentA class_roster 1
sees studentA game_sessions 3
sees studentA linked_devices 1
sees studentA profiles 2
sees studentB class_roster 1
sees studentB game_sessions 2
sees studentB profiles 1
sees teacherT class_roster 2
sees teacherT game_sessions 4
sees teacherT teacher_codes 1

== 6. Restore refuses a non-fresh target
[restore] decrypting bloomtype-20261014T165509Z.tar.gz.age
[restore] backup made 20261014T165509Z from Postgres 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
[restore] ERROR: target already has BloomType tables; restore only into a fresh database

== 7. Retention pruning (30 days, keep at least 3)
[backup] pruned bloomtype-20260904T165511Z.tar.gz.age (older than 30 days)
[backup] pruned bloomtype-20260909T165511Z.tar.gz.age (older than 30 days)
3 backups left (40- and 35-day-old files pruned; 31-day file kept by the keep-3 minimum).

== DRILL PASSED 2026-10-14T16:55:11Z
```

Reading the RLS lines: each student sees only their own rows (student A and
their linked device see each other's, by design); the teacher sees the two
roster rows and the sessions of the students on that roster, and **no**
profiles; nobody sees `student_link_codes`. Zero-row results are left out of
the printout but are part of the 24 compared checks.

### Output (openssl run, summary)

```text
== 2. Back up (openssl encryption, throwaway key)
[backup] wrote /tmp/tmp.EBhPgUasIG/backups/bloomtype-20261014T165810Z.tar.gz.enc (8992 bytes, 6 tables, 18 policies)
[restore] restore verified
All 75 facts match: 7 row counts, 18 policies, 6 RLS tables, 12 table grants, 8 function grants, 24 RLS visibility checks.
== DRILL PASSED 2026-10-14T16:58:15Z
```

### Problems the drill found (and fixes)

1. **Privileges came back wider than they were.** The first run failed step 5:
   after a plain `pg_restore`, `authenticated` had `INSERT, UPDATE` again on
   `teacher_codes` and `linked_devices`, which `schema.sql` revokes. Cause: the
   target database's default privileges (Supabase has the same ones) grant
   everything on each new table, and a dump only stores the difference from
   PostgreSQL's built-in defaults. RLS still blocked those writes (no insert
   policy), but one layer of protection was gone. **Fix:** `restore-db.sh`
   now resets privileges and replays the saved ones in the same transaction,
   and the backup stores every grant so the restore checks them (60 matched).
2. A fresh database already has a `public` schema, so `CREATE SCHEMA public`
   from the dump failed. **Fix:** the restore leaves that one statement out.

Other checks run the same day: the backup refuses to run with no encryption
key; a restore with a wrong or empty file stops with an error.

### Result

**PASSED** (both encryption methods). Time from backup to verified restore:
about 2 seconds for this tiny data set. Real timing must come from the live
drill.

## Next drill: live project (after #133)

Run once the Supabase project exists, before any student uses cloud sync,
then each school term and after any schema change.

1. Create a **scratch** Supabase project (or run `supabase start` locally) as
   the restore target. Never restore into the live project during a drill.
2. Set the variables from [BACKUPS.md](BACKUPS.md) and run:

   ```sh
   export BACKUP_DATABASE_URL='...live, direct or session pooler...'
   export RESTORE_DATABASE_URL='...scratch project...'
   export BACKUP_AGE_RECIPIENT='age1...' BACKUP_AGE_IDENTITY_FILE=~/secure/bloomtype-backup.key
   scripts/restore-drill.sh --live
   ```

3. Re-run the RLS checks from [CLOUD-CLASS-LOGIN.md](../CLOUD-CLASS-LOGIN.md)
   against the scratch project.
4. Add a "Drill 2" section here: date, who ran it, project references (not
   keys), the output, the time the restore took, and any problems.
5. Delete the scratch project afterwards. It holds a copy of real data.
