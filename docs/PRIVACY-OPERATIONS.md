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

The teacher dashboard's **Delete all local data** action removes BloomType
local-storage records from that browser. Browser/site-data controls provide a
second deletion path. Cloud deletion and backup expiry must be implemented and
tested before cloud sync is enabled.

