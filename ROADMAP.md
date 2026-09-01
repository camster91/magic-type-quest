# BloomType Production Roadmap

This is the authoritative project roadmap. The older `*-PLAN.md` documents and
`SCHOOL-READINESS-AUDIT.md` are historical design/audit inputs, not current task
trackers.

## Current status — 2026-09-01

The core product is implemented and the repository is technically clean, but
school-scale launch readiness is not yet proven by real-world operations.

- Local gates: 272 tests pass across 34 files, ESLint reports zero diagnostics, the Vite
  production build succeeds, and `npm audit` reports zero vulnerabilities.
- Repository backlog: zero open GitHub issues and zero open pull requests.
- Product: ten progressive levels, practice, adaptive difficulty, achievements,
  quests, garden progression, classroom codes, teacher reporting, optional
  Supabase sync, PWA support, and core English/French/Spanish localization.
- Deployment fixes: public assets work under the configured
  `/magic-type-quest/` base path and are regression-tested. Seventeen Playwright
  tests verify responsive home actions, a local student-to-teacher classroom
  journey with exports, the keyboard-only first-time student journey, all production
  entry points, same-origin assets, manifest scope, service-worker registration,
  persisted localization, isolated weak-key drill completion, offline app-shell
  reload, stale-cache cleanup, five rendered WCAG A/AA surfaces, and enlarged
  French/Spanish learner, parent, and teacher layouts at 320px.
- Production: `https://bloomtype.ashbi.ca/magic-type-quest/` serves immutable
  image tag `1091e0d` through Traefik with trusted HTTPS and security headers.
  The approved 2026-09-01 public local-only release passed all ten browser
  journeys against production. Deploy and rollback operations are documented
  in `docs/PRODUCTION.md`.
- Automation: repository Actions are enabled and core CI passes on the
  repository-scoped `ashbi-vps-magic-type-quest` self-hosted runner. The image
  publishing workflow also targets Ashbi. Repository housekeeping runs on
  GitHub-hosted infrastructure so third-party maintenance actions do not execute
  on the privileged VPS runner. The protected `main` branch strictly requires
  the GitHub Actions `ci` context before ordinary merges, and repository Actions
  reject workflow references that are not pinned to a full commit SHA.
  GitHub CodeQL is manually
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
   - Completed 2026-09-01: released exact revision `1091e0d` to the public
     local-only deployment and passed HTTPS, security-header, container-health,
     and all ten production browser checks. School/cloud launch gates remain.
   - Completed 2026-09-01: made image builds reproducible with locked lifecycle-
     script-free installs and digest-pinned supported Node 24 LTS/nginx 1.30
     bases; added an explicit
     container health endpoint; and separated no-cache PWA shell/update files
     from immutable fingerprinted bundles. The new candidate is configuration-
     tested but requires a separately approved production promotion.
   - Completed 2026-09-01: audited all tracked non-binary source and fixed four
     validated security boundaries: removed a committed Google AI credential
     from generator scripts, reserved teacher-code provisioning for trusted
     administrators, neutralized spreadsheet formulas in roster CSV exports,
     and stopped pull requests from publishing GHCR images or moving `latest`.
     The exposed provider credential still requires provider-side revocation or
     rotation; production remains on the separately approved `1091e0d` release.
   - Completed 2026-09-01: defined an exposed-Google-key closure playbook with
     provider deletion/rotation, exposure-window usage and billing review,
     replacement restrictions, non-restoration follow-up, redacted evidence,
     repository rescanning, and owner sign-off. Authorized provider execution
     remains required.
   - Completed 2026-09-01: added a fail-closed production-artifact check that
     rejects compiled Supabase project URLs, Vite cloud configuration names, or
     a bundled Supabase client. The local-only invariant now runs after every
     production build in Ashbi CI and before every Playwright journey.
   - Completed 2026-09-01: restricted documentation-only branch pushes from the
     privileged image publisher, moved issue and merge housekeeping off the
     Ashbi VPS, disabled pull-request mutation in the issue-staleness workflow,
     pinned every workflow action to an immutable commit, and enabled GitHub's
     repository-level SHA-pinning requirement so future mutable action tags are
     rejected.
   - Completed 2026-09-01: made the Ashbi-backed GitHub Actions `ci` context a
     strict required status check on protected `main`, while preserving the
     existing pull-request, force-push, deletion, and administrator settings.
   - Completed 2026-09-01: retired two unused Supabase analytics RPCs from both
     new and existing projects. The teacher dashboard already derives its
     summaries from the RLS-filtered roster, so removing the redundant functions
     narrows the future cloud API without changing product behavior.

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
     capture and unsupported trial-enrollment promises. Backup expiry, assigned
     operational owners, and legal/school approval remain open.
   - Completed 2026-09-01: implemented authenticated self-service cloud-progress
     deletion with owner-scoped RLS, cascading profile/session/roster removal,
     serialized save/delete ordering, post-delete recreation prevention, local
     sign-out, localized failure states, and automated race coverage. A live
     deletion drill, auth-user deletion, backup expiry, assigned operational
     owners, and legal/school approval remain open.
   - Completed 2026-09-01: added a downloadable local student-profile export
     and an authenticated, identity-scoped cloud export covering the student's
     profile, complete paginated session history, and roster membership. Query
     failures fail closed instead of producing a partial file; the cloud control
     remains unavailable in the public local-only build. A live access/export
     drill and approved delivery process remain open.

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
   - Completed 2026-09-01: added a fail-closed operator drill that uses three
     designated QA accounts to verify student and teacher isolation, complete
     self-export, and cascading learning-data deletion without logging
     credentials. The approved project, accounts, and human-run evidence remain
     external gates.

4. **Small supervised pilot**
   - Run with a small, consented cohort before a school-wide rollout.
   - Measure completion, accuracy, WPM progression, confusion points,
     accessibility barriers, and support burden.
   - Proposed cohort, manual metrics, go thresholds, stop conditions, access
     owners, and release-decision fields are defined in
     `docs/LAUNCH-READINESS.md`; they still require owner and school approval.

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
   - Completed 2026-08-28: localized numbered level-completion titles and Daily
     Moment result summaries, including singular/plural wording and localized
     speed/accuracy labels in French and Spanish.
   - Completed 2026-09-01: defined a fail-closed fluent-review protocol for the
     complete learner, curriculum, gameplay, reward, profile, parent/privacy,
     teacher, persistence, accessibility, layout, and fallback journeys, with
     locale selection, severity, correction/re-review, evidence, and separate
     French and Spanish sign-off.
   - Completed 2026-09-01: added rendered French and Spanish regression checks
     at 320px with 200% root text across learner profile, parent guidance, and
     teacher reporting. Fixed oversized parent headings and long localized
     words, clipped Spanish achievement copy, and the previously unreachable
     off-screen teacher table columns with a localized, keyboard-focusable
     horizontal region.
   - Still required: have fluent French and Spanish reviewers check the complete
     learner, parent, and teacher experience using that protocol.
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
   - Completed 2026-09-01: added axe-powered production-rendered WCAG A/AA
     scans for the learner home and profile, parent guidance, teacher dashboard,
     and school landing page. Fixed disabled browser zoom, an unfocusable
     achievements scroller, and confirmed contrast failures across parent,
     teacher, landing, and locked-achievement interfaces. Physical assistive-
     technology testing remains a human gate.
   - Completed 2026-09-01: defined a fail-closed physical-device protocol for
     VoiceOver on iOS/iPadOS and TalkBack on Android, covering screen-reader
     navigation, touch typing, text scaling, install, offline recovery, service-
     worker update, rollback, evidence, severity, and sign-off. Named devices
     and human execution remain required.
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
   - Completed 2026-08-28: extracted desktop, mobile, and dialog keyboard routing
     into `src/gameInput.js` with direct behavioral coverage. Fixed one-character
     lesson words that could not complete, accepted uppercase mobile input in
     Shift lessons, and stopped modifier-only keys from counting as mistakes.
   - Completed 2026-08-28: extracted quiet-gradient, word, particle, and confetti
     rendering into `src/gameCanvas.js` with deterministic drawing, lifecycle,
     fallback-texture, and reduced-motion coverage.
   - Completed 2026-08-28: moved background parallax, fallback scenery, stars,
     pet frames, and flowers behind the same renderer boundary. Flowers now
     remain visible when background assets fail and keep a stable image variant
     between frames. `src/gameEngine.js` is 1,587 lines, down from 2,386; the
     input, rendering, session, and presentation split is complete.
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
- Weak-key drills use finite mode-safe scoring, retry their own lesson, return
  through a localized completion path without mutating curriculum completion,
  and cannot double-count session words or score stars across repeated saves.
- Routine profile autosaves no longer create duplicate cloud analytics rows.
  Numbered curriculum attempts finalize once with an exact completed/failed
  result without erasing prior mastery, while Daily Moment and drill modes are
  excluded from the integer-only level-session schema.
- Cloud profile and roster autosaves are serialized and coalesced to the newest
  immutable snapshot, preventing slow older writes from overwriting newer
  progress and allowing the queue to recover after an offline/write failure.
- Curriculum attempts carry a stable client UUID and the cloud schema enforces
  compatible partial uniqueness, so ambiguous insert retries cannot duplicate
  teacher analytics; failed/offline inserts remain retryable until accepted.
- Desktop and mobile gameplay input share a directly tested controller, including
  Shift lessons, one-character words, skip/pause routing, and dialog focus wrap.
- Common canvas effects are isolated and directly tested, including reduced-motion
  suppression and the unloaded-texture fallback.
- The complete canvas scene renderer owns background, pet, flower, word, and
  particle drawing with deterministic fallback and asset-reload coverage.

## Decision log

- Multiplayer remains intentionally deferred until after sustained usage.
- Local storage remains the offline-first source; cloud sync is optional.
- Historical plans remain in the repository for design context, with banners
  pointing back to this roadmap.
- School readiness is a launch-gate claim requiring operational evidence, not a
  checklist inferred solely from source files.
- `docs/LAUNCH-READINESS.md` is the operating gate/evidence register; proposed
  pilot thresholds are not customer validation until approved and observed.
