# BloomType agent instructions

## Product and current direction

BloomType (repository `magic-type-quest`) is a child-facing typing game for web/PWA use, with local learner progress, a teacher/classroom surface, English/French/Spanish content, and optional cloud-sync code that is deliberately disabled in the approved public local-only release.

The current product goal is not unrestricted school-scale deployment. The public local-only release is technically verified, while school launch, real-student cloud collection, authenticated production classroom workflows, physical-device accessibility, fluent-language review, and supervised pilot evidence remain separate gates.

Do not turn future ideas such as multiplayer, leaderboards, broader social interaction, cloud analytics, AI features, monetization, or unattended school rollout into active scope without an explicit current roadmap/product decision and the required child-safety, privacy, school, accessibility, security, and release approvals.

## Authority and reading order

Use repository sources in this order:

1. `AGENTS.md` — durable coding-agent execution, child-safety, verification, and approval rules.
2. `ROADMAP.md` — authoritative current project roadmap. Older `*-PLAN.md` and `SCHOOL-READINESS-AUDIT.md` documents are historical inputs unless explicitly reactivated.
3. `docs/LAUNCH-READINESS.md` — launch evidence, owners, release status, pilot gates, and explicit approval boundaries.
4. `docs/PRIVACY-OPERATIONS.md` — student-data/cloud-sync activation and deletion/export boundaries.
5. `README.md` — current product overview, architecture, setup, and representative verified checks.
6. `docs/DEVICE-ACCESSIBILITY-QA.md`, `docs/LANGUAGE-QA.md`, `docs/PRODUCTION.md`, `docs/ASHBI-CI.md`, and relevant release records for the affected scope.
7. `.github/workflows/*`, package scripts, and test/e2e code — current mechanical verification behaviour.
8. Current GitHub issues and pull requests — live work and exact-head evidence.

Dated roadmap/evidence snapshots describe what was true when reconciled. Live GitHub state overrides statements such as “zero open pull requests” when new work has since been opened.

## Architecture

- Vite + vanilla JavaScript ES modules.
- HTML5 Canvas game/rendering layer.
- Web Audio API synthesized effects.
- localStorage-backed local learner progress.
- PWA/service worker and installable web shell.
- Optional Supabase client/schema for future approved authenticated cloud sync; public local-only production must not compile cloud configuration/client code into the artifact.
- Separate learner, parent, and teacher surfaces.
- Static AI-assisted artwork generated during development; generation credentials are operator-only and are not browser/runtime dependencies.

`src/lessonLevels.js` is authoritative for lesson names, key sets, word lists, and completion settings. Preserve local progress compatibility, PWA scope/cache behaviour, classroom isolation, language parity, and teacher/student boundaries when touching related code.

## Environment and setup

Use the committed npm lockfile:

```bash
npm ci
npm run dev
```

Representative source/release checks include:

```bash
npm run lint
npm test -- --run
npm run build
npm run verify:local-only-build
npm run test:e2e
npm audit --audit-level=high
```

Do not add or expose real Google/provider keys, Supabase credentials, school credentials, student identifiers, guardian/teacher contact data, production secrets, or private QA account details. Use synthetic/local fixtures by default.

## Verification

There is no single `verify` command on current `main`; use the actual layered gates.

The current `.github/workflows/ci.yml` runs on the repository-scoped Ashbi VPS runner and performs locked install, lint, Vitest, production build, local-only artifact verification, Playwright journeys for non-Dependabot PRs, and high-severity npm audit.

The local-only artifact gate is a release boundary: public production must fail verification if Supabase project configuration or bundled Supabase client code is present.

`npm run verify:cloud-boundary` is **not** a routine merge check. It is an authenticated destructive QA drill that requires an approved QA Supabase project, designated non-student accounts, explicit environment configuration, and the documented confirmation token. Never run it against real student accounts or an unapproved project.

Markdown/docs-only changes are currently ignored by core CI, so absence of a new source CI run for a documentation-only PR is expected. Do not falsely claim executable verification merely because no check failed.

A missing, queued, cancelled, superseded, or infrastructure-failed check is not a pass and is not automatically proof of a source defect. Preserve exact candidate SHA/image evidence for release-adjacent work.

Never weaken local-only artifact enforcement, RLS/account isolation, child-data restrictions, CI requirements, full-SHA workflow pinning, accessibility tests, language parity checks, export/deletion safety, PWA/offline tests, or security scans merely to obtain green status.

## Child safety and privacy

BloomType is intended for children and potential school use. Treat student identity, progress, classroom membership, teacher codes, exports, cloud sync, analytics, social features, pilot recruitment, and external communication as high-sensitivity surfaces.

Current public production is local-first and has no analytics or advertising SDKs. Production cloud variables remain unset. Do not enable real-student cloud collection until every applicable gate in `docs/PRIVACY-OPERATIONS.md` and `docs/LAUNCH-READINESS.md` has a named owner, approval, evidence, and approved result.

When cloud sync is eventually authorised:

- preserve RLS and authenticated ownership on every student-data operation;
- teacher-code ownership must remain trusted-administrator provisioned;
- do not store email, birth date, address, advertising identifiers, free-form student content, or precise location unless a future approved data model explicitly changes the boundary;
- keep export/delete/correction/retention procedures explicit and tested;
- never use real student accounts for destructive QA drills;
- do not print credentials, tokens, emails, or raw student data in logs/evidence.

Do not claim COPPA, FERPA, PIPEDA, school-policy, accessibility, or legal compliance from technical controls alone. Those require the documented human/legal/school evidence.

If a suspected credential or private student/school data appears in repository evidence, stop handling the value/content and report only the repository/path plus remediation need. The known removed Google credential remains subject to the provider-side closure process in `docs/GOOGLE-KEY-INCIDENT.md`; do not attempt credential administration without explicit authorisation.

## Web, accessibility, language, and device QA

For UI work, verify representative layouts when executable browser access exists:

- Mobile: approximately 390 px, plus the project's 320 px enlarged-layout boundary where relevant.
- Tablet: approximately 768 px.
- Desktop: approximately 1440 px.

Check the affected learner/parent/teacher journey plus keyboard-only operation, touch targets, focus visibility/order, onboarding, typing input, pause/recovery, weak-key drills, lesson progression, responsive Canvas/UI behaviour, PWA install/scope/offline/update/cache cleanup, loading/error/empty states, console errors, and WCAG automated checks.

French and Spanish automated dictionary/layout parity is not fluent-language approval. Follow `docs/LANGUAGE-QA.md` and require named fluent reviewers for launch claims.

Desktop/browser automation is not physical-device accessibility evidence. iOS Safari/Android Chrome touch keyboard, screen-reader, install, update, offline, and recovery require the human protocol in `docs/DEVICE-ACCESSIBILITY-QA.md`.

Do not use manipulative engagement, public competition, social pressure, or child-targeted monetization to improve retention metrics without an explicit current product decision and safety review.

## Environments and production boundary

Known environments include:

- local development/test;
- repository-scoped Ashbi CI;
- public local-only production at the path documented in `docs/PRODUCTION.md`;
- future/QA Supabase environments only when specifically provisioned and approved.

The current public release is not approval for production Supabase, real-student data, school-wide launch, or unattended classroom use.

Agents may inspect, implement, test, document, branch, commit, create issues, and open draft pull requests when authorised. Without Cameron explicitly approving the exact difficult-to-reverse action, agents must not:

- merge a pull request;
- deploy/promote a production image or alter VPS/Traefik state;
- publish/tag a release;
- provision/enable production Supabase or cloud credentials;
- create or use real student/school accounts/data;
- change provider credentials, secrets, permissions, access, DNS, network configuration, billing, monitoring, analytics, or data-retention policy;
- run the destructive cloud-boundary drill outside the approved synthetic QA contract;
- recruit/contact schools, teachers, parents, guardians, or pilot learners;
- enable public multiplayer/leaderboards/social interaction;
- make legal, privacy-compliance, accessibility-compliance, language-approval, school-readiness, or customer-validation claims without the required evidence.

A workflow, SSH access, registry artifact, available credential, or technically complete feature is not itself approval to execute or launch it.

## Deployment and rollback

Follow `docs/LAUNCH-READINESS.md` and `docs/PRODUCTION.md`. Production promotion requires an approved exact candidate commit/image, applicable privacy/security/accessibility evidence, rollback tag/operator, and post-release verification.

Production definitions use the checked-in Docker Compose and Traefik files. Verify the immutable candidate revision/image label before promotion, then verify health, TLS/security headers, PWA/update files, and the browser suite against the actual production URL.

Rollback uses the last known-good immutable image tag and current checked-in deployment definitions. Do not remove or overwrite the previous rollback artifact before the new release is verified.

If candidate identity, prior image, route backup, production health, privacy gate, or rollback path cannot be inspected, report it as unknown/blocked rather than inventing evidence.

## Definition of done and handoff

Use Cameron's status model:

1. Completed and verified
2. Completed but awaiting verification
3. In progress
4. Blocked
5. Awaiting client or teammate
6. Next action

Never report **Completed and verified** without the required exact-head source/browser/device/cloud/production evidence for the scope.

Every substantial coding handoff should include:

- branch;
- exact commit(s);
- pull request;
- files changed;
- implementation summary;
- checks actually executed and their pass/fail/queued/skipped state;
- exact-head CI/security/release evidence inspected;
- screenshots/URLs only when actually captured or verified;
- child-data/privacy/cloud impact;
- accessibility/language/device evidence;
- deployment/rollback impact;
- remaining risks/blockers;
- production/school-launch status;
- next action and any approval gate.
