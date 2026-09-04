## Purpose

Describe the bounded learner/teacher/product/release outcome this PR serves.

## Scope

- In scope:
- Out of scope:
- Related roadmap/gate/issue:
- Learner / parent / teacher / PWA / cloud / production area affected:

## Exact-head verification

Record only checks that actually ran on this head/artifact.

- [ ] `npm ci`
- [ ] `npm run lint`
- [ ] `npm test -- --run`
- [ ] `npm run build`
- [ ] `npm run verify:local-only-build`
- [ ] `npm run test:e2e` when browser/release behaviour is affected
- [ ] `npm audit --audit-level=high`
- [ ] Exact-head CI/image status inspected when applicable

Evidence/results:

> Documentation-only PRs are currently ignored by core CI. No new run is not the same as an executable pass.

## Child safety / privacy / cloud boundary

- [ ] Public local-only production remains free of compiled Supabase configuration/client code unless cloud activation has been separately approved.
- [ ] No real student/school accounts, identifiers, credentials, exports, or progress data were added to GitHub evidence.
- [ ] Teacher/student ownership and RLS boundaries remain fail-closed where affected.
- [ ] No analytics, advertising, social/multiplayer/leaderboard, monetization, or new student-data collection was introduced without an explicit current product decision and required approvals.
- [ ] Export/delete/retention/recovery behaviour was reviewed when data paths are affected.
- [ ] Required safety/privacy/security gates were not weakened merely to obtain green status.

## Responsive / accessibility / language / device QA

When UI or release behaviour is affected:

- [ ] Mobile (~390 px; include 320 px enlarged-layout boundary where relevant)
- [ ] Tablet (~768 px)
- [ ] Desktop (~1440 px)
- [ ] Keyboard/focus/touch-target/accessibility basics
- [ ] Learner/parent/teacher journeys as applicable
- [ ] PWA install/scope/offline/update/cache recovery
- [ ] French/Spanish automated parity/layout checks where affected

Human evidence actually obtained:

- Physical iOS/Android accessibility:
- Fluent French review:
- Fluent Spanish review:
- School/pilot evidence:

Do not convert automated parity or desktop browser checks into human language/device/school approval claims.

## Deployment / rollback boundary

Production, cloud, school, or external state changed: **No unless separately and explicitly approved.**

- Candidate commit/image:
- Deployment impact:
- Supabase/cloud impact:
- Data/migration impact:
- Previous known-good image/route evidence:
- Rollback evidence:
- Provider credential/access/billing impact:

## Handoff

Use the repository status model:

1. Completed and verified
2. Completed but awaiting verification
3. In progress
4. Blocked
5. Awaiting client or teammate
6. Next action

Remaining risks/blockers:

Next action / approval gate:
