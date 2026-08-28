# BloomType Production Roadmap

This is the authoritative project roadmap. The older `*-PLAN.md` documents and
`SCHOOL-READINESS-AUDIT.md` are historical design/audit inputs, not current task
trackers.

## Current status — 2026-08-28

The core product is implemented and the repository is technically clean, but
school-scale launch readiness is not yet proven by real-world operations.

- Local gates: 202 tests pass across 26 files, ESLint reports zero diagnostics, the Vite
  production build succeeds, and `npm audit` reports zero vulnerabilities.
- Repository backlog: zero open GitHub issues and zero open pull requests.
- Product: ten progressive levels, practice, adaptive difficulty, achievements,
  quests, garden progression, classroom codes, teacher reporting, optional
  Supabase sync, PWA support, and core English/French/Spanish localization.
- Deployment fixes: public assets work under the configured
  `/magic-type-quest/` base path and are regression-tested. Nine Playwright
  tests verify responsive home actions, a local student-to-teacher classroom
  journey with exports, the keyboard-only first-time student journey, all production
  entry points, same-origin assets, manifest scope, service-worker registration,
  persisted localization, offline app-shell reload, and stale-cache cleanup.
- Production: `https://bloomtype.ashbi.ca/magic-type-quest/` serves the prior
  approved GHCR image through Traefik with trusted HTTPS and security headers.
  The current nine-journey candidate image is published but intentionally not
  deployed without explicit release approval. Deploy and rollback operations
  are documented in `docs/PRODUCTION.md`.
- Automation: repository Actions are enabled and core CI passes on the
  repository-scoped `ashbi-vps-magic-type-quest` self-hosted runner. The image
  publishing workflow also targets Ashbi Docker. GitHub CodeQL is manually
  disabled because code scanning is unavailable, and secret scanning remains
  disabled. Dependabot currently reports zero open alerts.
- Not yet proven: production Supabase configuration, authenticated teacher and
  student journeys, privacy/consent operations, offline install/update behavior
  on target physical devices, accessibility, classroom usability, and
  retention.

“Feature complete” therefore means the planned application features exist. It
does not mean the product is validated for unattended use by schools or 1,000+
children.

## Prioritized work

### P0 — launch gates

1. **Production deployment verification**
   - Decision recorded 2026-08-28: CodeQL and secret scanning remain disabled
     because GitHub reports both features unavailable for this private
     repository. Revisit if the repository becomes public or receives GitHub
     Advanced Security.
   - Maintain the Ashbi runner and verify its container publishing/registry
     credentials after workflow or host changes.
   - Completed 2026-08-28: validated trusted HTTPS, hosted base path, manifest,
     service-worker scope, offline reload, cache updates, and all four HTML
     entry points.
   - Completed 2026-08-28: recorded the production URL, checked-in deployment
     definitions, and rollback procedure in `docs/PRODUCTION.md`.

2. **Production data and privacy readiness**
   - Provision the intended Supabase project and apply `supabase/schema.sql`.
   - Verify row-level security with separate teacher/student accounts and
     document data retention, deletion, consent, and incident ownership.
   - Do not collect real student data before this gate is signed off.
   - Completed 2026-08-28: removed public/unrestricted Supabase policies,
     required authenticated cloud sessions, and added regression coverage for
     the RLS boundary. Production cloud credentials remain intentionally unset.
   - Completed 2026-08-28: added per-student local deletion, stale profile-copy
     cleanup, class-membership cleanup, a public plain-language data inventory,
     and an explicit cloud activation record. Removed the nonfunctional email
     capture and unsupported trial-enrollment promises. Cloud deletion, backup
     expiry, assigned operational owners, and legal/school approval remain open.

3. **Authenticated end-to-end QA**
   - Exercise class creation/join, student play, sync conflict recovery,
     teacher roster/alerts, exports, and account/session failure paths.
   - Add browser automation for the stable portions of those journeys.
   - Completed 2026-08-28: browser automation covers joining and leaving a
     normalized local class, teacher roster/stats visibility, CSV/JSON download,
     and stale-membership cleanup. Authenticated sync now writes each roster row
     with the current Supabase user ID and removes obsolete self-owned class
     memberships under an explicit RLS delete policy.
   - Still required: provision production credentials and separate teacher and
     student test accounts, claim a teacher-owned class code, and exercise the
     real hosted auth/session, conflict, roster, alert, and export paths.

4. **Small supervised pilot**
   - Run with a small, consented cohort before a school-wide rollout.
   - Measure completion, accuracy, WPM progression, confusion points,
     accessibility barriers, and support burden.

### P1 — product quality after launch gates

1. Complete French and Spanish localization.
   - Completed 2026-08-28: enforced exact core-dictionary parity; translated
     lesson, chapter, quest, achievement, tutorial, practice, garden, profile,
     game-result, core accessibility content, parent guidance/privacy content,
     and the static and dynamic teacher dashboard; and added unit coverage for
     every dynamic content ID and exact page-dictionary parity plus browser
     coverage for immediate and persisted language changes across all three
     product surfaces.
   - Completed 2026-08-28: translated every pet-personality category with
     line-count parity, finger and opposite-hand Shift guidance, streak/pet
     bubbles, lesson locks, evolution copy, and keyboard accessibility states.
     Removed the obsolete rotating-tagline generator left behind by the focused
     home redesign because it had no rendered target.
   - Still required: have fluent French and Spanish reviewers check the complete
     learner, parent, and teacher experience.
2. Complete keyboard-only, screen-reader, contrast, reduced-motion, touch
   keyboard, and small-screen QA.
   - Completed 2026-08-28: keyboard-only first-time start, tutorial, finger
     guide, pause/resume, focus containment, and quit-to-menu are covered by a
     production-build browser test. Game result, chapter, and evolution dialogs
     expose stable accessible names; the mobile typing input is named and kept
     out of desktop tab order.
   - Completed 2026-08-28: automated contrast contracts cover the core text and
     compact-control palette; decorative CSS and canvas motion respect reduced
     motion; core controls meet a 44px target; and 375x667 portrait plus 667x375
     landscape home layouts are regression-tested for overflow and reachable
     actions. Physical-device touch keyboard and screen-reader QA still need
     dedicated testing.
3. Split the 2,000+ line `src/gameEngine.js` into input, rendering, session, and
   presentation modules with behavioral coverage.
   - Completed 2026-08-28: extracted the shared keyboard presentation API into
     `src/gamePresentation.js`, added DOM-level behavioral tests, fixed key
     feedback so both rendered keyboards update consistently, and consolidated
     duplicate game-engine tones onto the existing `src/audio.js` API.
   - Completed 2026-08-28: extracted the canvas word model and renderer into
     `src/gameWord.js` with direct coverage for movement, focus scoring,
     boundaries, overlay mode, and drawing behavior.
   - Completed 2026-08-28: centralized normal, Daily Moment, and weak-key drill
     session initialization in `src/gameSession.js`; made drill ownership
     explicit; reset focus bonuses between sessions; and added direct coverage
     for mode configuration, preserved profile state, and fresh collections.
   - Remaining: extract the input controller and broader canvas renderer;
     `src/gameEngine.js` is now 2,105 lines, down from 2,386.
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
  selection, locale-aware number/date formatting, exact dictionary parity, and
  translated curriculum, chapter, quest, achievement, tutorial, game UI, parent
  guidance/privacy content, and dynamic teacher reporting UI.
- Home progression derives from the full ten-level curriculum, normalizes
  malformed legacy completion data, and is regression-tested beyond level six.
- Game dialogs expose names and modal semantics, keep focus inside the active
  dialog, pause gameplay while instructions are open, and restore a useful
  focus target when the student resumes or exits.
- Keyboard presentation is isolated from session logic and behaviorally tested
  across both practice and gameplay keyboards; sound effects use one audio API.
- Session initialization is isolated and directly tested across normal, Daily
  Moment, and weak-key drill modes.

## Decision log

- Multiplayer remains intentionally deferred until after sustained usage.
- Local storage remains the offline-first source; cloud sync is optional.
- Historical plans remain in the repository for design context, with banners
  pointing back to this roadmap.
- School readiness is a launch-gate claim requiring operational evidence, not a
  checklist inferred solely from source files.
