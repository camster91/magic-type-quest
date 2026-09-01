# Privacy operations gate

Status: **not approved for collection of real student data**.

The consolidated owner, access, pilot, and release gate register is
`docs/LAUNCH-READINESS.md`.

BloomType currently runs local-first. The production deployment does not set
Supabase credentials, so profiles and play history remain in each browser's
local storage. There are no analytics or advertising SDKs.

## Data inventory

If authenticated cloud sync is later enabled, the schema can store a display
name, avatar, scores, lesson progress, achievements, garden state, weak-key
practice state, class code, and session performance. It must not store email,
birth date, address, advertising identifiers, free-form student content, or
precise location.

## Required approvals before cloud sync

The product owner and participating school must record:

1. the lawful basis and consent process for the intended age group and region;
2. who acts as data controller/processor and who owns incident response;
3. a retention period for profiles, sessions, rosters, exports, and backups;
4. verified access, correction, export, and deletion procedures;
5. the approved Supabase region, administrators, MFA policy, and recovery plan;
6. an incident contact and notification timeline; and
7. a signed test proving separate teacher and student accounts cannot access
   another class or profile.

## Technical boundary

`supabase/schema.sql` enables RLS on every student-data table. Player writes
are bound to `auth.uid()`. Teacher reads require a `teacher_codes` row owned by
that teacher, and authenticated browser clients cannot create or transfer
teacher-code ownership. A trusted administrator or service role must provision
those rows. The browser sync layer refuses cloud operations without an
authenticated session. Ashbi CI also scans the built production artifact and
fails if Supabase configuration or client code is compiled into the public
local-only bundle.

These controls reduce technical risk; they are not a claim of COPPA, FERPA,
PIPEDA, or other legal compliance. Keep production Supabase variables unset
until all approvals and account-isolation tests above are complete.

## Local deletion

The game profile's **Delete local progress** action removes the current
student's profile, progress, and class memberships from that browser. The
teacher dashboard's **Clear All** action removes all BloomType profiles and
class records from that browser. Browser/site-data controls provide a second
deletion path. Automated tests cover individual deletion, stale profile-copy
cleanup, class removal, and preservation of unrelated local-storage keys.

Local deletion does not delete school cloud records. In an authenticated cloud
deployment, the profile screen exposes a separate confirmed deletion action.
That action is serialized after earlier saves, blocks later saves from
recreating the profile, deletes the authenticated user's `profiles` row (which
cascades to `game_sessions` and `class_roster`), and signs the current browser
out. RLS permits deletion only where `auth.uid()` matches the profile ID.

The source path and race behavior are automated-test verified, but no live
Supabase deletion drill has run. Auth-user deletion, backup expiry, retention
evidence, and the responsible operator remain required before cloud sync is
enabled.

## Access and export

The profile screen always offers a JSON download of the current browser's
student profile. In an authenticated cloud deployment it also offers a separate
cloud export containing only the signed-in user's profile, complete paginated
session history, and roster membership. Every cloud query includes the
authenticated user ID in addition to RLS, uses deterministic pagination, and
fails without downloading a partial file if any query fails. Authentication
tokens and credentials are not part of either export format.

The local-only browser journey verifies that local export is visible and cloud
export remains hidden. The query scope, pagination, payload, and failure
behavior are automated-test verified. A live authenticated access/export drill,
approved recipient verification, secure delivery procedure, and retention of
downloaded files remain required operational evidence.

## Public communication boundary

The parent page lists the local data inventory and deletion path in plain
language. The marketing page does not accept or log email addresses; its pilot
link opens the visitor's email application. Pricing and enrollment are labeled
as proposed and unavailable for general production use.

## Activation record

Cloud sync may be enabled only after every row below has an owner, approval
date, evidence link or ticket, and an explicit approved result. A blank row is
a failed gate.

| Gate | Owner | Approval date | Evidence | Result |
|---|---|---|---|---|
| Lawful basis and age/region consent | Unassigned | — | — | Not approved |
| Controller/processor roles and agreements | Unassigned | — | — | Not approved |
| Profile/session/roster/export retention | Unassigned | — | — | Not approved |
| Access, correction, export, and deletion drill | Unassigned | — | — | Not approved |
| Supabase region, administrators, MFA, recovery | Unassigned | — | — | Not approved |
| Incident owner, contact, and notification timeline | Unassigned | — | — | Not approved |
| Teacher/student cross-account isolation test | Unassigned | — | — | Not approved |

When all rows are approved, record the Supabase project reference and schema
migration revision without committing secrets. After activation, run the
authenticated browser suite and deletion drill before admitting real student
data. Any failed gate requires cloud credentials to remain unset or be removed.

### Authenticated QA drill

After an approved QA project, two student accounts, one teacher account, and a
teacher-owned class code exist, run `npm run verify:cloud-boundary` from a
trusted operator workstation. The script requires `BLOOMTYPE_QA_*` environment
variables and the explicit acknowledgement
`BLOOMTYPE_CLOUD_DRILL_CONFIRM=DELETE_QA_DATA`; `.env` is ignored by Git.

Required configuration names are `BLOOMTYPE_QA_SUPABASE_URL`,
`BLOOMTYPE_QA_SUPABASE_ANON_KEY`, email and password pairs for
`BLOOMTYPE_QA_STUDENT_A`, `BLOOMTYPE_QA_STUDENT_B`, and
`BLOOMTYPE_QA_TEACHER`, plus `BLOOMTYPE_QA_TEACHER_CLASS_CODE` and
`BLOOMTYPE_QA_OTHER_CLASS_CODE`. Store their values only in an approved secret
manager or ignored local environment file; `.env` and `.env.*` are excluded
from version control.

The drill creates disposable learning rows only for the designated QA students,
then proves student-to-student denial, teacher owned-class access and
foreign-class denial, complete self-export without token fields, and cascading
profile/session/roster deletion. It deletes those QA learning rows in cleanup,
does not delete Auth identities, does not print account credentials or emails,
and must never be run with real student accounts. Record the command timestamp,
project reference, schema revision, operator, and pass/fail output in the
approved evidence system; do not commit its environment or raw account details.
