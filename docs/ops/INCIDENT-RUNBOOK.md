# Incident runbook

Use this page when something goes wrong with BloomType. Read the part you
need. Each step is short on purpose. Write down what you do and when, as you
go. You will need those notes later.

**Not legal advice.** The privacy sections are checklists to get you started.
For any real data incident, get advice from a privacy lawyer quickly.

## Contents

1. [How bad is it? (severity)](#1-how-bad-is-it-severity)
2. [Who to contact](#2-who-to-contact)
3. [The first 15 minutes](#3-the-first-15-minutes)
4. [Site down](#4-site-down)
5. [Bad deploy](#5-bad-deploy)
6. [Data incident or privacy breach](#6-data-incident-or-privacy-breach)
7. [Leaked secret](#7-leaked-secret)
8. [Restore from backup](#8-restore-from-backup)
9. [After the incident: review template](#9-after-the-incident-review-template)

## 1. How bad is it? (severity)

Pick the highest level that fits. You can change it later.

| Level | What it means | Examples | Respond |
|---|---|---|---|
| **SEV 1** | Student data may be exposed, or the site is down for everyone. | Data seen by the wrong person. Database lost. Site down during school hours. A secret leaked **and** used. | Now. Drop other work. |
| **SEV 2** | A big part is broken, or there is a real risk with no harm seen yet. | Teacher page broken. Site slow or down for some users. A secret leaked but no sign it was used. | Within 4 hours. |
| **SEV 3** | Small problem with a workaround. | One page looks wrong. A sound is missing. Uptime check failed once, then passed. | Next working day. |

Any incident that **might** involve personal information starts as SEV 1
until you know more.

## 2. Who to contact

Fill in the blanks before the first school uses cloud sync. Keep a copy
outside this repository, since GitHub may be the thing that is down.

| Role | Who | How |
|---|---|---|
| Incident lead (owner) | Cameron | cameron@ashbi.ca |
| Backup lead | _to assign_ | |
| Privacy lawyer | _to assign_ | |
| Hosting (Ashbi VPS) | Ashbi | `ssh root@vps.ashbi.ca` (see [PRODUCTION.md](../PRODUCTION.md)) |
| Supabase (cloud database, when on) | Supabase support | Dashboard > Support. Note the project ref. |
| Google Cloud (asset keys) | Project admin | See [GOOGLE-KEY-INCIDENT.md](../GOOGLE-KEY-INCIDENT.md) |
| Each school or board | _from the pilot or contract list_ | The privacy contact named in that school's agreement |
| Office of the Privacy Commissioner of Canada | | priv.gc.ca, breach report form |
| Information and Privacy Commissioner of Ontario | | ipc.on.ca (usually reported by the board, not us) |

## 3. The first 15 minutes

1. **Breathe. Start a log.** Open a private note. Write the time and what you
   saw. Add every step with its time.
2. **Pick a severity** (section 1). Write it in the log.
3. **Tell the backup lead** for SEV 1 or SEV 2, even if you plan to fix it alone.
4. **Stop the harm first, investigate second.** Examples: roll back a bad
   deploy, turn off a leaked key, block public routing. Do not delete logs or
   evidence.
5. **Do not post details in public.** No public GitHub issues, chats or social
   posts that name students, schools or secrets. Use a private channel.
6. **Check if personal information is involved.** If it might be, go to
   section 6 now. Legal clocks may already be running.
7. **Set the next check-in time** (for example, every 30 minutes for SEV 1).

## 4. Site down

The **Uptime** workflow (`.github/workflows/uptime.yml`) checks the game, the
teacher, parent and landing pages, `manifest.json`, and `/healthz` every 30
minutes. If a check fails, the run fails, and GitHub emails the person who
last changed the workflow's schedule. To get the emails, that person needs
**Settings > Notifications > Actions** set to email on failed workflows.
Scheduled workflows also stop after 60 days with no repository activity;
GitHub emails a warning first. Re-enable it under **Actions > Uptime**.

1. **Confirm it.** Open the site in a private window. Run the check yourself:

   ```sh
   node scripts/uptime-check.mjs
   HEALTH_URL=https://bloomtype.ashbi.ca/healthz node scripts/uptime-check.mjs
   ```

2. **Is it just one page?** If only one page fails, it is probably a bad
   deploy. Go to section 5.
3. **Is the server up?**

   ```sh
   curl -sS -o /dev/null -w '%{http_code}\n' https://bloomtype.ashbi.ca/healthz
   ssh root@vps.ashbi.ca 'cd /opt/bloomtype && docker compose ps'
   ```

4. **Container stopped or unhealthy?** Restart it:
   `ssh root@vps.ashbi.ca 'cd /opt/bloomtype && docker compose up -d'`.
   Look at `docker compose logs --tail=200` for the cause.
5. **Container fine but site down?** Check Traefik (the HTTPS router), the TLS
   certificate and DNS for `bloomtype.ashbi.ca`.
6. **Remember the offline app.** Students who visited before can still play
   offline. Their progress stays on their device. Tell teachers that.
7. **Tell schools** if it lasts more than 1 hour during school hours.
8. When it is back, run the uptime check again and close the incident with a
   short review (section 9).

## 5. Bad deploy

Signs: a page broke right after a release, tests pass but users see errors,
the uptime check fails on one page.

### Production (Ashbi VPS) — the real site

Every image is tagged with its 7-character commit SHA. Roll back to the last
good one (full steps in [PRODUCTION.md](../PRODUCTION.md#roll-back)):

1. Find the last good SHA (the release before the bad one, from the
   **Build and Push Image** runs or `git log`).
2. On the VPS, edit `/opt/bloomtype/docker-compose.yml` and change the image
   tag to that SHA.
3. Run `cd /opt/bloomtype && docker compose up -d --pull always`.
4. Check: `docker compose ps`, the uptime check, and a quick play test.
5. If it is badly broken and rollback fails, take it offline: move
   `/opt/traefik/dynamic/bloomtype.yml` out of that folder. Put it back later.

### GitHub Pages mirror

There is also an older copy on GitHub Pages
(`camster91.github.io/magic-type-quest/`), built from the `gh-pages` branch.
It is **not** the production site and was last updated on 2026-06-01. To roll
it back:

1. Find the bad commit: `git log origin/gh-pages`.
2. Revert it on that branch:

   ```sh
   git fetch origin gh-pages
   git switch -c fix/pages-rollback origin/gh-pages
   git revert <bad-commit-sha>
   git push origin HEAD:gh-pages
   ```

   GitHub Pages republishes in a few minutes.
3. To take it down instead: **Settings > Pages > Unpublish site** (or set the
   source to "None").

### Fix the code too

Roll back first. Then fix `main` with a normal pull request: use
`git revert <sha>` for the bad change, let CI pass, and release again.

### Devices that cached the bad version

The app uses a service worker. Devices pick up the fixed version on their
next online visit. If a device is stuck, close all BloomType tabs and open it
again. As a last resort, clear the site's data (this also deletes local
progress, so save a save code first).

## 6. Data incident or privacy breach

A **breach** is when personal information is lost, or seen, changed or taken
by someone who should not have it. In BloomType, personal information
includes a student's name or nickname, class, progress, typing history and
device IDs. Today the public site keeps that only in each browser. Cloud sync
(Supabase) is off. If it is on, the database is the main risk.

### Contain (right away)

- [ ] Stop the leak. Examples: turn off cloud sync (redeploy without the
      Supabase settings), pause the Supabase project, revoke the key, close
      the open RLS policy, take the site offline.
- [ ] Keep evidence: logs, database audit data, screenshots. Do not delete
      the affected data unless that is the only way to stop the leak.
- [ ] Write down: what data, how many students, which schools, which
      countries/provinces/states, when it started, when it stopped, who could
      see it, and whether it was actually seen or copied.
- [ ] Call the privacy lawyer. **Get legal advice on every notice below.**
- [ ] Do not guess in writing. Say "we are investigating" until facts are clear.

### Decide: is there a real risk of harm?

Think about how sensitive the data is (children's data counts as more
sensitive), how likely it is to be misused, and who got it. Write down your
reasoning and the date, even if you decide the risk is low.

### Canada — PIPEDA (we are a private company)

- [ ] If the breach creates a **real risk of significant harm**: report it to
      the **Office of the Privacy Commissioner of Canada** as soon as
      feasible.
- [ ] Notify the **affected people** as soon as feasible. For children, that
      means parents or guardians, usually through the school.
- [ ] Notify other organizations that can reduce the harm (for example, the
      school board, or Supabase).
- [ ] **Keep a record of every breach**, even small ones with no report, for
      at least **24 months**.
- [ ] If any users are in **Quebec**, Law 25 also requires notice to the
      Commission d'accès à l'information and the people affected when there is
      a risk of serious injury. Ask the lawyer.

### Ontario school boards — MFIPPA

Boards are covered by the Municipal Freedom of Information and Protection of
Privacy Act (MFIPPA). The **board** owns the student data and decides who to
tell. Our job is to help them do it fast.

- [ ] Tell the board's privacy contact **right away**. Check the contract or
      data agreement for a deadline (often 24 to 72 hours, sometimes "immediately").
- [ ] Give them the facts list above, in writing.
- [ ] Help the board notify families and, if it decides to, the
      **Information and Privacy Commissioner of Ontario**.
- [ ] Follow the board's instructions about the data (return, delete, keep).

### United States school customers

- [ ] **Contract first.** Many school data agreements set short notice
      deadlines. Find and follow them.
- [ ] **FERPA:** we act for the school as a "school official." Tell the school
      quickly so it can meet its own duties. The school decides whether to
      notify parents.
- [ ] **COPPA** (children under 13): requires reasonable security for
      children's data. A breach can lead to action by the Federal Trade
      Commission. Ask the lawyer whether to contact the FTC or parents.
- [ ] **State breach laws:** every state has one. Deadlines and who to tell
      (people, the state attorney general) depend on the student's state.
- [ ] **State student-privacy laws:** some are stricter. Example: New York
      Education Law 2-d requires a vendor to tell the school within
      **7 calendar days** of finding a breach. California, Illinois and
      others have their own rules.

### Write the notice (with the lawyer)

A good notice says, in plain words: what happened, when, what data, what we
did to stop it, what we are doing to prevent it, what families can do, and who
to contact. Send it through the school when the school asks.

### Close

- [ ] Fix the cause, then test the fix (for RLS, re-run the checks in
      [CLOUD-CLASS-LOGIN.md](../CLOUD-CLASS-LOGIN.md)).
- [ ] Record the breach in the breach log (kept 24 months or more).
- [ ] Do the review (section 9) within 5 working days.

## 7. Leaked secret

A secret is a password, private key or token. Examples: the Supabase
`service_role` key, a database password, the age backup private key, a
Google API key, a GitHub token. (The Supabase **anon** key is meant to be
public; RLS protects the data. Still rotate it if it leaked together with
other secrets.)

1. **Revoke or rotate first.** Removing a secret from Git does not make it
   safe. Copies stay in history, forks and logs.
2. **Check if it was used.** Look at the provider's logs for the time between
   the leak and the revoke.
3. **Update whatever used it** from a secret store, never from the repository.
4. **Clean up.** Remove it from the code. Ask GitHub Support to purge cached
   views if needed. Re-run the repository's secret scans and tests.
5. **Treat use as a data incident.** If the secret could reach student data
   and you cannot prove it was not used, go to section 6.

Specific cases:

- **Google API key:** follow [GOOGLE-KEY-INCIDENT.md](../GOOGLE-KEY-INCIDENT.md)
  step by step. It has the full checklist and evidence record.
- **Supabase `service_role` key or database password:** rotate it in the
  Supabase dashboard (API settings / database settings). Update the backup
  host's `BACKUP_DATABASE_URL`. Review database logs.
- **Backup private key (age):** make a new key pair. Set the new public key in
  `BACKUP_AGE_RECIPIENT`. Old backups were made with the leaked key, so if the
  backup files could also have been reached, treat it as a data incident and
  delete old backups once a new verified backup exists.
- **GitHub token:** revoke it under GitHub settings, then check the audit log.

## 8. Restore from backup

Use this when cloud data is lost or damaged. Backups and how they are made:
[BACKUPS.md](BACKUPS.md). A practice run that worked:
[RESTORE-DRILL.md](RESTORE-DRILL.md).

1. **Stop writes.** Turn off cloud sync or pause the project, so nothing
   new is lost or mixed in.
2. **Try Supabase's own restore first** (Dashboard > Database > Backups, or
   point-in-time recovery). It restores the whole project, including sign-ins.
3. If that is not possible, **pick the backup**: the newest one made before the
   problem started. Note its time. Data after that time will be lost; write
   that down for the review and any notices.
4. **Make a fresh target:** a new Supabase project, in the approved region.
5. **Restore:**

   ```sh
   export RESTORE_DATABASE_URL='postgresql://...new project...'
   export BACKUP_AGE_IDENTITY_FILE=~/secure/bloomtype-backup.key
   scripts/restore-db.sh bloomtype-YYYYMMDDTHHMMSSZ.tar.gz.age
   ```

6. **Check it says `restore verified`.** If it says `verification FAILED`, do
   not use that database. Try the next older backup.
7. **Re-run the RLS checks** from [CLOUD-CLASS-LOGIN.md](../CLOUD-CLASS-LOGIN.md).
8. **Point the pilot build at the new project** (new URL and anon key), test
   it, then turn cloud sync back on.
9. **Tell schools** what happened and any data that was lost.

## 9. After the incident: review template

Do this within 5 working days for SEV 1 and SEV 2. No blame: the goal is to
fix the system, not to find a person at fault. Save it privately (it may name
schools); put a redacted copy in `docs/evidence/` if useful.

```markdown
# Incident review: <short title>

- Severity: SEV 1 / 2 / 3
- Incident lead:
- Dates: started / found / contained / resolved (with times and time zone)
- Status: resolved / monitoring

## What happened
Two or three plain sentences.

## Who and what was affected
Users, schools, pages, data (type and number of students). "None" is a valid answer.

## Timeline
| Time | What happened or what we did |
|---|---|

## Why it happened
The root cause and the things that let it happen. Ask "why?" until you reach
something we can change.

## What went well
## What was hard

## Notices sent
| Who (regulator, school, families) | When | By whom | Reference |
|---|---|---|---|
Or: "No notice needed", with the reasoning and the lawyer's advice.

## Actions
| Action | Owner | Due | Issue |
|---|---|---|---|

## Runbook changes
What in this runbook was wrong or missing? Fix it in the same week.
```
