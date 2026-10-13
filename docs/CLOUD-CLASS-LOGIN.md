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

## Before switching on (owner checklist)

1. Finish the privacy approvals in #132 (DPA, parental consent wording, retention).
2. Provision Supabase (#133). Turn on **Anonymous sign-ins**, and add CAPTCHA
   or rate limits for them.
3. Run `supabase/schema.sql`. Create teacher class codes with the service role
   only. Use codes with 6 or more characters so they are hard to guess.
4. Build a pilot-only version with the three settings above. Do not deploy it
   to the public site.
5. Re-run the RLS checks above against the real project before any student uses it.
