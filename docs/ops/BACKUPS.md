# Database backups

BloomType's public site keeps student data only in the browser. These backups
are for the **optional cloud database** (Supabase), which stays off until the
privacy approvals (#132) and the Supabase project (#133) are done.

| Script | What it does |
|---|---|
| `scripts/backup-db.sh` | Dumps the BloomType tables (schema, data, RLS policies, grants) plus the `auth.users` rows, compresses and **encrypts** them into one dated file, then deletes old backups. |
| `scripts/restore-db.sh` | Decrypts a backup, checks its checksums, restores it into a **fresh** database, and proves the result: row counts, RLS policies, RLS switches and grants must all match what was saved. |
| `scripts/restore-drill.sh` | Practice run of the whole cycle. Results: [RESTORE-DRILL.md](RESTORE-DRILL.md). |
| `supabase/local-stub.sql` | Stand-in for Supabase's own objects so the drill runs on plain PostgreSQL. **Never run it on Supabase.** |

## Settings (environment variables only)

Nothing secret is stored in this repository. Put real values in a password
manager or the backup host's secret store, never in a committed file.

| Variable | Used by | Meaning |
|---|---|---|
| `BACKUP_DATABASE_URL` | backup | Postgres URL of the live database. On Supabase use the **direct** connection or the **session** pooler (port 5432), not the transaction pooler (port 6543). Use a role that is not subject to RLS (the `postgres` role), or `pg_dump` stops with an error instead of saving partial data. |
| `BACKUP_AGE_RECIPIENT` | backup | [age](https://age-encryption.org) **public** key (`age1...`). Preferred. Several keys can be listed, separated by spaces (for example the owner's and a backup owner's). |
| `BACKUP_AGE_IDENTITY_FILE` | restore | Path to the matching age **private** key file. Keep it offline (password manager), not on the backup host. |
| `BACKUP_PASSPHRASE` | both | Only if age is not used: openssl AES-256 with PBKDF2 (600,000 rounds). Integrity is still checked through SHA-256 sums inside the backup. |
| `BACKUP_DIR` | backup | Folder for backups. Default `./backups`. Use a folder **outside** the repository in production; `backups/` is in `.gitignore` as a safety net. |
| `BACKUP_RETENTION_DAYS` | backup | Delete backups older than this. Default **30**. No retention period is approved yet ([PRIVACY-OPERATIONS.md](../PRIVACY-OPERATIONS.md)); set this to the approved number when #132 decides it. |
| `BACKUP_MIN_KEEP` | backup | Always keep at least this many newest backups, however old. Default 3. |
| `BACKUP_SCHEMAS` | backup | Schemas saved with schema and data. Default `public`. |
| `BACKUP_INCLUDE_AUTH_USERS` | backup | `1` (default) also saves `auth.users` rows (data only). Needed because `teacher_codes` points at them. |
| `RESTORE_DATABASE_URL` | restore | The **target**. Must be a fresh database that already has Supabase's base objects (a new Supabase project has them). The script refuses a target that already has BloomType tables. |

The backup refuses to run without an encryption key. File names look like
`bloomtype-20261014T165509Z.tar.gz.age`. Pruning reads the date from the name,
so copying files does not reset their age.

Tools needed: `psql`, `pg_dump`, `pg_restore` (same major version as the
server or newer), `age` or `openssl`, `tar`, `gzip`, `sha256sum`, GNU `date`.

## Schedule (owner step, after #133)

1. **First line:** turn on Supabase's own daily backups (and point-in-time
   recovery if the plan allows). They cover the whole project, including
   `auth`, and need no scripts.
2. **Second line (this script):** run it daily from a trusted machine, such as
   the Ashbi VPS, with cron. Example (`/etc/cron.d/bloomtype-backup`):

   ```cron
   # 06:17 UTC daily. Secrets come from a root-only env file.
   17 6 * * * bloomtype set -a; . /etc/bloomtype/backup.env; set +a; /opt/bloomtype/scripts/backup-db.sh >> /var/log/bloomtype-backup.log 2>&1
   ```

3. Copy `BACKUP_DIR` to a second place (another provider or region in Canada
   for Ontario boards). The files are encrypted, so the copy target never sees
   student data.
4. **Do not** run backups in GitHub Actions. Artifacts and logs there are not
   an approved place for student data, even encrypted.
5. Run the restore drill against the live project after #133 (see below), then
   at least once each school term and after any schema change.

## Restore

Follow "Restore from backup" in [INCIDENT-RUNBOOK.md](INCIDENT-RUNBOOK.md).
In short:

```sh
export RESTORE_DATABASE_URL='postgresql://...fresh project...'
export BACKUP_AGE_IDENTITY_FILE=~/secure/bloomtype-backup.key
scripts/restore-db.sh bloomtype-YYYYMMDDTHHMMSSZ.tar.gz.age
```

It ends with `restore verified`, or stops with `verification FAILED`. Do not
point the app at a database that failed verification.

### Why the restore resets privileges

A new Supabase database grants `anon` and `authenticated` full table rights on
every new table (default privileges). A plain `pg_restore` keeps those extra
rights and silently undoes `schema.sql`'s revokes, such as "browsers may not
insert into `teacher_codes`". The first drill caught exactly this. The restore
script now resets privileges to PostgreSQL's defaults and replays the saved
ones in the same transaction, then checks every grant against the backup.
