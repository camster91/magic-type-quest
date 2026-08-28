# BloomType Production Roadmap

This is the authoritative project roadmap. The older `*-PLAN.md` documents and
`SCHOOL-READINESS-AUDIT.md` are historical design/audit inputs, not current task
trackers.

## Current status — 2026-08-28

The core product is implemented and the repository is technically clean, but
school-scale launch readiness is not yet proven by real-world operations.

- Local gates: 156 tests pass, ESLint reports zero diagnostics, the Vite
  production build succeeds, and `npm audit` reports zero vulnerabilities.
- Repository backlog: zero open GitHub issues and zero open pull requests.
- Product: ten progressive levels, practice, adaptive difficulty, achievements,
  quests, garden progression, classroom codes, teacher reporting, optional
  Supabase sync, PWA support, and core English/French/Spanish localization.
- Deployment fixes: public assets work under the configured
  `/magic-type-quest/` base path and are regression-tested. Three Playwright
  smoke tests verify all production entry points, same-origin assets, manifest
  scope, service-worker registration, and persisted localization.
- Automation boundary: workflow files are active, but repository-level GitHub
  Actions permission currently reports `enabled: false`; no remote checks can
  run until an owner explicitly enables Actions. GitHub code scanning and
  secret scanning are also disabled. The local Docker daemon is unavailable,
  so the container build remains remotely unverified. Dependabot currently
  reports zero open alerts.
- Not yet proven: production Supabase configuration, authenticated teacher and
  student journeys, privacy/consent operations, offline install/update behavior
  on target devices, accessibility, classroom usability, and retention.

“Feature complete” therefore means the planned application features exist. It
does not mean the product is validated for unattended use by schools or 1,000+
children.

## Prioritized work

### P0 — launch gates

1. **Production deployment verification**
   - Decide whether to enable repository-level GitHub Actions. If enabled,
     verify CI and container workflows and confirm registry credentials/costs.
   - Decide whether to enable GitHub code scanning and secret scanning.
   - Validate the hosted base path, manifest, service-worker scope, offline
     reload, cache updates, and all four HTML entry points.
   - Record the production URL and rollback procedure.

2. **Production data and privacy readiness**
   - Provision the intended Supabase project and apply `supabase/schema.sql`.
   - Verify row-level security with separate teacher/student accounts and
     document data retention, deletion, consent, and incident ownership.
   - Do not collect real student data before this gate is signed off.

3. **Authenticated end-to-end QA**
   - Exercise class creation/join, student play, sync conflict recovery,
     teacher roster/alerts, exports, and account/session failure paths.
   - Add browser automation for the stable portions of those journeys.

4. **Small supervised pilot**
   - Run with a small, consented cohort before a school-wide rollout.
   - Measure completion, accuracy, WPM progression, confusion points,
     accessibility barriers, and support burden.

### P1 — product quality after launch gates

1. Translate lesson names, narrative content, achievements, quests, parent and
   teacher pages; have fluent reviewers check French and Spanish.
2. Complete keyboard-only, screen-reader, contrast, reduced-motion, touch
   keyboard, and small-screen QA.
3. Split the 2,000+ line `src/gameEngine.js` into input, rendering, session, and
   presentation modules with behavioral coverage.
4. Add privacy-conscious product analytics only after the privacy model is
   approved.

### P2 — validated growth

- Expand art/content based on pilot findings.
- Evaluate school licensing or consumer monetization only after retention and
  classroom value are measured.
- Reconsider multiplayer after operational readiness and sustained usage.

## Completed engineering work

- Personality, narrative, pet evolution, achievements, daily quests, garden,
  adaptive difficulty, weak-key drills, and spaced repetition.
- Classroom codes, teacher dashboard, optional Supabase sync, RLS schema, and
  CSV/JSON export implementation.
- Deployment-safe asset loading, avatar cache refresh, clean lint baseline,
  dependency/security updates, base-path regression coverage, and repeatable
  production-build browser smoke tests.
- Core localization infrastructure with persisted English, French, and Spanish
  selection plus locale-aware number/date formatting.

## Decision log

- Multiplayer remains intentionally deferred until after sustained usage.
- Local storage remains the offline-first source; cloud sync is optional.
- Historical plans remain in the repository for design context, with banners
  pointing back to this roadmap.
- School readiness is a launch-gate claim requiring operational evidence, not a
  checklist inferred solely from source files.
