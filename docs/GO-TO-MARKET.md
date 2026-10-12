# Go-to-market and business model

Status: owner decision recorded 2026-10-12. The prices are proposals from market research done in October 2026, and they need checking before anything is published. The code does not implement any of this yet.

## Decision

**The learning game is free for everyone, with no ads, forever. Schools pay for the adult tools.**

- **Families and homeschoolers:** free, including all levels, practice, Daily Moment, weak-key drills, the companion, Field Guide, progress and the on-device parent page. The owner chose this over the research's suggested $24/year family plan. Revisit it only if cloud-sync costs grow.
- **One teacher with one class:** free, using the local teacher dashboard on one device.
- **Paid, for schools and districts:**
  - cloud class sync across devices;
  - a shared-device class login;
  - Google Classroom, ClassLink and Clever rostering;
  - multi-class and admin dashboards;
  - CSV/PDF reports;
  - signed data-privacy agreements;
  - priority support.
- **No ads, no data selling, no live AI with children.** Higgsfield art, voice and animation are made once and shipped as files, so no child data ever goes to an AI service.

## Proposed school prices (unverified)

| Tier | Proposed price | Includes |
|---|---|---|
| Classroom | $39 per teacher per year, up to 40 students | Cloud class dashboard, Google Classroom sync, reports |
| School | $299 per school per year, unlimited students | All teachers, admin view, ClassLink/Clever, signed DPA |
| District | $0.75 per student per year, $750 minimum | District admin, SSO, priority support, custom DPA |

The research compared these with Typing.com, TypingClub, Nitro Type, Typesy and Typing Agent. Several competitor prices came from third-party sites. Confirm current prices before publishing any comparison.

## Why this can win

- **No one else offers all of these at once:** free, ad-free, private by default, offline-capable and gentle for young children.
  - The big free tools show ads, and their Common Sense privacy ratings are "Warning".
  - The ad-free tools charge families $72–$150 a year.
- **The local-first design** (child data stays on the device) is the easiest product for a school board to approve, including under Ontario's Bill 194 and US student-privacy rules.

## What schools need before they buy

These are listed in priority order. The issue or pull request is shown where one exists.

1. **Trust paperwork:**
   - sign the SDPC National Data Privacy Agreement;
   - publish a plain-language privacy page;
   - request a Common Sense privacy evaluation;
   - revoke the leaked Google key (`docs/GOOGLE-KEY-INCIDENT.md`).
2. **Shared-device mode:** many schools wipe Chromebook storage between users, so progress needs a class-code login with safe class sync. The cloud-sync findings must be fixed first.
3. **Logins and rosters:** Google Classroom sync and Google SSO, ClassLink (free for vendors), then a Clever Library listing.
4. **Teacher reports:** speed, accuracy, weak keys and minutes practised, with CSV export.
5. **Security basics:** headers, CI isolation and a teacher PIN (#210); updates that reach installed apps (#211).

## Timing

US school budgets are built from January to April for a July 1 start. Free classroom use and pilots between now and February create results in time for 2027–28 budgets. Ontario boards also ask where data is stored, so local-first by default plus Canadian hosting for optional sync is a strong answer, and French is a priority language.
