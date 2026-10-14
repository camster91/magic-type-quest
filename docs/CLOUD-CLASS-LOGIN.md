# Cloud class login — ready, but switched off

**Status:** prepared code and database rules. **Not active.** Do not turn on
until the privacy approvals in #132 are done and Supabase is provisioned (#133).

Core play never needs this (#184). Families and pilots can already move
progress between devices with the account-free **save code** on the profile
screen.

## What it does (when switched on)

- A student types their teacher's class code and taps **Join class online**.
- The browser signs in **anonymously**: no email, no password, no name sent
  to an auth provider.
- The class must already exist (a teacher owns it in `teacher_codes`).
- Their progress then syncs, so it follows them to other devices.

## How it stays off

It needs **both** of these. Production builds set neither:

| Setting | Meaning |
|---|---|
| `VITE_CLOUD_CLASS_LOGIN=true` | Shows the **Join class online** button |
| `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | Lets the app reach Supabase |

`npm run verify:local-only-build` still fails any build that contains
Supabase markers. The CI checks for this stay unchanged.

## Database rules fixed in `supabase/schema.sql`

| Finding | Fix |
|---|---|
| Students could add themselves to any class code, even made-up ones | Roster insert/update now require `class_code_exists(code)`, a narrow `security definer` check |
| Profile update had no explicit `WITH CHECK` | Added `with check (auth.uid() = id)` |
| Teachers could read whole student profiles (garden, key history) just because the student typed their code | Removed `"Teacher class read"`. Teachers see only roster summaries. Session reads now join through `class_roster` |
| Deleting cloud data left the sign-in account behind | New `delete_my_account()` RPC deletes the profile (cascades) **and** the `auth.users` row, only for `auth.uid()` |
| Roster sync was delete-then-insert in two calls (could leave a student in no class) | New `sync_class_membership(...)` RPC does it in one transaction, running as the caller so RLS still applies |
| RPCs open to anonymous callers | `revoke all ... from public, anon`; granted to `authenticated` only |

These rules were tested against real Postgres 16 with a stub `auth` schema:
a fake class is rejected, profile ID swaps are rejected, teachers see 0
profiles and 1 roster row, other students see nothing, and account deletion
removes the user, profile and roster rows.

## Teacher accounts, multi-class dashboard and school admin (pilot builds only)

Built and tested, **not live**. Like everything on this page it is in the
pilot build only: `src/teacher.js` loads `src/teacherCloudUI.js` behind the
static `import.meta.env.VITE_CLOUD_CLASS_LOGIN === 'true'` check, so the
public build contains none of it (`npm run verify:local-only-build`).

### What teachers get

- **Sign in with Google** on the teacher page (Supabase Auth,
  `signInWithOAuth({ provider: 'google' })`). The **PIN stays** as the
  fallback. A Google sign-in opens only the online classes: progress saved on
  this device still needs the PIN, because a shared classroom device can hold
  other children's data. **Lock** also signs the Google session out of the
  device.
- **Teacher and student sessions never mix.** A classroom browser can hold a
  student's anonymous session and a teacher's Google session at once, so the
  teacher page uses its own Supabase client (`src/teacherAuth.js`) with its
  own auth storage key, `bloomtype-teacher-auth`. Signing a teacher in or
  out, or **Lock**, never replaces or removes the student's session (which
  stays under Supabase's default key), so a child never loses their cloud
  identity or rejoins as a duplicate. Only the teacher client reads the
  Google redirect (`detectSessionInUrl`); the student client has it off.
- **Multi-class dashboard:** a class switcher; create, rename and archive
  (archived classes keep their report but accept no new students). Each
  class report uses the existing table, stats, alerts and CSV/JSON exports,
  with this week's minutes from `game_sessions.duration_seconds`, summed per
  student in the database by `class_weekly_minutes` (so a busy class never
  hits the API's 1,000-row response limit and loses minutes).
- **Roster import** into a class, through one provider-neutral importer
  (`src/roster/importer.js`):
  `{ provider, externalClassId, students: [{ externalId, displayName }] }`.
  It keeps a **first name and last initial** plus the provider's opaque id,
  and drops anything that looks like an email. The database refuses `@` in
  both columns a second time.
  - **Google Classroom** (`src/roster/googleClassroom.js`): `courses.list`
    (`teacherId=me`, active) and `courses.students.list`, with the teacher's
    own token. Read-only, and asked for only when the teacher clicks import.
  - **CSV** (`src/roster/csv.js`), the fallback every school can use: `name`,
    or `first name` + `last name`, and an optional student number. English,
    French and Spanish headers; comma, semicolon or tab.
  - **ClassLink** (OneRoster 1.1) and **Clever** (API v3.0): the mapping is
    written and tested; the network part is a stub with `TODO(partner: …)`
    notes, because both need a signed partner agreement and a server-side
    token exchange (client secrets must never ship to the browser).
  - Children who join with the class code are matched to imported names;
    imported students who have not joined yet show as **Not joined yet**.
- **School admin view:** one row per class in the admin's school: class,
  teacher, student count, students active this week and minutes this week.
  **Aggregates only, never student names.** Admins invite teachers by school
  email.

### New tables (all additive; nothing existing changes meaning)

| Table | Holds | RLS |
|---|---|---|
| `schools` | id, name | members read their own school; no browser writes |
| `teachers` | `auth.users.id` → school, role `teacher` or `admin`, display name | self read; an admin reads their school's staff; no browser writes (roles are never self-assigned) |
| `teacher_invites` | staff email (adult), school, role | the school's admin reads; written only by `admin_invite_teacher` |
| `classes` | owner, school, name, class code (FK to `teacher_codes`), archived, roster provider | the owner reads; written only by the RPCs below |
| `roster_students` | class, provider, external id, display name (no `@` allowed) | the class owner reads and deletes; written only by `import_roster` |

`game_sessions` gains `duration_seconds` (0–1800, nullable for old rows).
Signed-out (`anon`) callers have no privileges on the new tables at all.

A class owns one code in `teacher_codes`, so the existing roster and session
policies give a teacher their joined students with no change.
`class_code_exists` now also refuses archived classes; codes made before
`classes` existed keep working. Archiving closes a class to **new** students
only: a child already in the class keeps saving their progress.
`sync_class_membership` updates an existing roster row in place, and
"Roster self update" accepts the caller's own existing membership
(`is_class_roster_member`), so a member's row never goes stale. A new join,
or moving a row from another class into an archived one, is still refused.

### New RPCs (signed-in callers only; `revoke all … from public, anon`)

| RPC | Who | Does |
|---|---|---|
| `claim_teacher_invite(name)` | a Google account with an invite | creates the `teachers` row; returns the role, or null. Anonymous (student) accounts are refused |
| `admin_invite_teacher(email, role)` | school admin | invites staff to **their** school; never overwrites another school's invite |
| `create_class(name)` | teacher | makes a server-generated 8-character code (no guessing or claiming codes); max 50 classes |
| `rename_class(id, name)`, `set_class_archived(id, bool)` | the class owner | |
| `import_roster(class, provider, external class, students)` | the class owner | replaces that provider's list in one transaction; max 200 |
| `school_class_summary()` | school admin | aggregates per class: counts and minutes only |
| `class_weekly_minutes(class)` | the class owner | minutes this week per joined device (profile id + minutes; capped at 30 per sitting). Runs as the caller, so session RLS still applies |

`caller_is_anonymous()` treats a token with `is_anonymous` or without an
email as a student, so no child account can ever become a teacher.

### Tested on PostgreSQL 16

`supabase/tests/teacher-dashboard-rls.sql` runs on a scratch database with a
Supabase auth stub (roles `anon`/`authenticated`, `auth.users`, `auth.uid()`
from `request.jwt.claim.sub`, claims in `request.jwt.claims`):

```sh
psql -d scratch -f stub.sql
psql -d scratch -f supabase/schema.sql
psql -d scratch -v ON_ERROR_STOP=1 -f supabase/tests/teacher-dashboard-rls.sql
```

It proves, among 30 checks: teacher A cannot see, rename, archive or import
into teacher B's class, roster, imported names or sessions; an admin sees
only aggregates for their own school (and no rows of other teachers'
classes); a student cannot read `classes`, `teachers`, `schools`,
`roster_students` or invites; uninvited and anonymous accounts cannot open a
class; archived classes refuse new students, but a student already in one
keeps syncing; weekly minutes per student are correct for the owner only,
also past 1,500 sessions; emails are refused. The schema
also re-runs cleanly on an existing database, and the earlier link-code and
roster scenarios still pass.

### OAuth scopes

| When | Scopes |
|---|---|
| Teacher sign-in | Supabase's default Google scopes: `openid`, `email`, `profile` (the teacher's own name and email) |
| Only when the teacher clicks **Google Classroom** | `https://www.googleapis.com/auth/classroom.courses.readonly`, `https://www.googleapis.com/auth/classroom.rosters.readonly` |

We never ask for `classroom.profile.emails` or `classroom.profile.photos`.
`courses.list` needs the courses scope; the roster scope alone is not
enough.

### Where the teacher's tokens live

The session that comes back from the Classroom consent carries Google's
`provider_token` (and possibly `provider_refresh_token`), which can read the
teacher's rosters. Supabase's default `persistSession: true` would write it
to `localStorage`. The teacher client therefore uses the simplest safe
option: **`persistSession: false` with in-memory storage** (implicit flow, so
the tokens go from the redirect's URL hash straight into memory). Nothing
about the teacher session, and never a provider token, is written to
`localStorage` or `sessionStorage`; `test/teacher-auth.test.js` checks this
with the real supabase-js client.

The trade-off: reloading or closing the teacher page signs the teacher out,
and they click **Sign in with Google** again (Google remembers the account,
so it is one click). On a shared classroom device that is also the safer
default. If a pilot needs a session that survives a reload, the alternative
is a custom storage adapter that strips `provider_token` and
`provider_refresh_token` before writing; we chose not to, because it keeps a
refresh token in `localStorage` and needs the provider token caught from the
sign-in event.

### Pilot build and Content Security Policy

`vite.config.js` adds the pilot's Supabase origin (and `wss://`) and
`https://classroom.googleapis.com` to `connect-src` **only** when
`VITE_CLOUD_CLASS_LOGIN=true` and `VITE_SUPABASE_URL` are both set
(`scripts/pilot-csp.mjs`). The public build keeps `connect-src 'self'`. A
pilot server that sends its own CSP header (see `deploy/nginx.conf`) needs
the same origins there.

## Before switching on (owner checklist)

1. Finish the privacy approvals in #132 (DPA, parental consent wording, retention).
2. Provision Supabase (#133). Turn on **Anonymous sign-ins**, and add CAPTCHA
   or rate limits for them.
3. Run `supabase/schema.sql`. Create teacher class codes with the service role
   only. Use codes with 6 or more characters so they are hard to guess.
4. Build a pilot-only version with the three settings above. Do not deploy it
   to the public site.
5. Re-run the RLS checks above against the real project before any student uses it.

### Owner steps for teacher sign-in and Google Classroom

1. **Google Cloud OAuth client.** In Google Cloud Console (the project that
   will own BloomType's Google sign-in):
   - set up the OAuth consent screen (app name, support email, privacy policy
     URL, authorised domain); user type **External**;
   - add the scopes `openid`, `email`, `profile`,
     `.../auth/classroom.courses.readonly` and
     `.../auth/classroom.rosters.readonly`. The Classroom scopes are
     sensitive, so Google must **verify the app** before teachers outside the
     test-user list can use import;
   - create an **OAuth client ID** of type *Web application* with the
     authorised redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`.
2. **Supabase Google provider.** In Supabase → Authentication → Providers →
   Google: turn it on and paste the client ID and secret. In Authentication →
   URL Configuration, add the pilot teacher page (for example
   `https://pilot.example/magic-type-quest/teacher.html`) to the redirect
   allow-list.
3. **Enable the Classroom API.** In the same Google Cloud project: APIs &
   Services → Library → **Google Classroom API** → Enable.
4. **Provision the first school and admin** with the service role (SQL
   editor). Emails must be lower-case:
   ```sql
   insert into schools (name) values ('Example Public School') returning id;
   insert into teacher_invites (email, school_id, role)
     values ('principal@school.example', '<school id>', 'admin');
   ```
   The admin becomes an admin on their first Google sign-in, then invites
   teachers from the teacher page. For a one-teacher pilot, invite the
   teacher the same way with role `teacher`.
5. **ClassLink and Clever** stay off until their partner agreements are
   signed; see the `TODO(partner: …)` notes in `src/roster/`.
