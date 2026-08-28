# Privacy operations gate

Status: **not approved for collection of real student data**.

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
that teacher. The browser sync layer refuses cloud operations without an
authenticated session.

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

Local deletion does not delete school cloud records. Cloud deletion, auth-user
deletion, and backup expiry must be implemented and tested before cloud sync is
enabled.

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
