# #165 world readiness and disposal continuation — 25 September 2026

Status: **IMPLEMENTED ON THE ISSUE BRANCH; FULL APPLICATION GATES PENDING**.
Continues PR #199, retaining `d858676`, `26c3550` and `e2d4efb`.
The runtime change is based on the separate CI commit
`3cb2bf9f91cadf4624fd43275039de1ff9ecd21a`. No integration merge or release is claimed.

## Acceptance-linked implementation

Epic #153, #165 and named dependencies #155/#159/#163 remain the specification.
The exact source and pinned Phaser 4.2.1 lifecycle implementation were reviewed.

- The scene no longer signals readiness when a required image is missing from
  the Texture Manager after loading. The existing DOM error/retry flow is used,
  typing stays disabled, and failed-world resources are released.
- Cleanup is registered during preload, so cancellation before create is covered.
  Borrowed textures survive; owned textures, graphics and cue tweens are released.
- The shell rejects stale load completions and duplicate opens. Ready/error
  handlers run after the engine callback and remain tied to the visit token.
  A load completing behind a modal does not restart typing or steal modal focus.
- Game disposal sets Phaser's deferred-destroy flag before waking a started,
  sleeping loop. It does not invoke a private destroy method or wake an unstarted
  loop; repeat requests are idempotent.
- Only the v2 document adds `blob:` to image/connect directives for its existing
  Blob loader. Script/style/font/default restrictions remain unchanged. See the
  [architecture addendum](../architecture/LOCAL-ASSET-LIFECYCLE.md).

No new package, engine fork, curriculum, input scoring, mastery, storage schema,
learner-data migration, asset pack, child-facing copy, cloud operation, public
route or production action is introduced. Existing English fixture copy remains
for #175; this is not a localisation completion. No new visuals were designed.

## Isolated checks actually executed

| Check | Result / exact scope |
| --- | --- |
| Original scene against the 15 new scene cases | 4 passed, 11 failed |
| Repaired scene against the same cases | 15 passed, 0 failed |
| New deferred Game disposal cases | 6 passed |
| New actual v2 HTML directive checks | 4 passed |
| Prior asset-policy / approval / loader lifecycle cases | All 70 passed again |
| Combined isolated suite | 95 passed, 0 failed |
| Repeatability | Five additional runs, each 95 passed / 0 failed |
| Strict isolated TypeScript | New helper and scene passed with explicit structural Phaser ports and exact domain interface fixtures |
| Shell transpile diagnostics | No syntax diagnostics; not a full semantic typecheck |
| Changed/new JavaScript syntax | Unit files, new browser test and configuration passed `node --check` |
| Scoped CI configuration | YAML parsed; only the exact issue branch was added to push triggers; other parsed fields unchanged |

Recovery toolchain: Node 22.16.0 and TypeScript 5.8.3, not the project's pinned
TypeScript 6.0.3. Temporary test copies substitute `node:test` for the Vitest
runner. The scene uses the same empty Phaser Scene base-class mock as the
committed Vitest test and explicit texture/event/graphics/tween ports. The actual
scene and helper method bodies execute; rendering, decoding and the actual engine
are not simulated as passing browser results. The prior loader recovery replaces
only local import extensions and Vite BASE_URL in temporary transpiled modules.

Strict checking uses `strict`, `noUncheckedIndexedAccess` and
`exactOptionalPropertyTypes` against explicitly supplied ports, not the full
Phaser declaration package. The shell check is syntax-only. These qualifications
are required: none of these results is the repository's full typecheck, lint,
canonical Vitest, Playwright, axe, persistence or production-build gate.

## Browser tests added, not run

`e2e/v2-world-lifecycle.e2e.js` is included in the existing source-mode
`playwright.persistence.config.js`, so `npm run validate:persistence` will execute
it alongside the existing tests. Six journeys use the real Phaser runtime and
synthetic test assets, not final artwork:

1. Blob SVG decoding under the actual v2 document CSP.
2. Undecodable required image: recovery shown, typing disabled, Game destruction observed.
3. Five scene exits: texture/listener/tween/timer queues bounded; final sleeping
   Game destruction observed; one Game instance reused.
4. Leaving during a delayed module load never mounts a stale world.
5. A late cancelled module load cannot replace a newer ready visit.
6. A load completing behind Pause preserves dialog focus and suspended gameplay.

**All six browser journeys are authored but unrun here.** No screenshot, FPS,
input-latency, texture-memory, actual Phaser resource, axe or physical-device pass
is claimed. The test fixtures do not approve artwork or introduce later biomes.

## CI and environment

Commit `3cb2bf9f91cadf4624fd43275039de1ff9ecd21a` adds only
`codex/nature-quest-165-performance` to the existing CI push-branch list. Existing
read-only permissions, repository-scoped self-hosted labels, immutable action and
container pins, job steps and gates remain unchanged. This requests the same
verification on an exact issue-branch push; it is not permission to merge.

GitHub reported zero Actions runs for that commit at inspection. The reason is
not established; no successful CI is claimed. The earlier e2d4efb head had a
successful GitGuardian secrets check, which is not an application gate.

The execution workspace remains a recovered source subset, not a complete Git
checkout with locked dependencies. Git/npm DNS failed. Installed Chromium's
managed policy rejects navigation; no policy was altered or bypassed. Connector
reads and focused issue-branch writes work. These are execution limitations,
not evidence that the app passes.

## Remaining acceptance and next action

Run the complete command matrix in the earlier
[loader recovery record](165-loader-recovery-2026-09-25.md) against the final exact
PR head. It includes canonical unit/type/lint/domain/theme/asset/budget checks,
`validate:persistence`, `test:e2e`, `test:e2e:v2`, `validate:performance` and both
builds with local-only verification. Fix any failure before marking ready or merging.

The pinned upstream VisibilityHandler retains a document listener/assigned window
handlers; this patch does not remove or certify that global retention. Verify
whole-shell disposal separately from the five ordinary scene cycles. Also verify
cancellation during actual initial engine boot, decode-error retry, reduced motion,
normal/low-end performance, DOM/axe, learner-data reload and v1 coexistence. These
are explicit pending items, not hidden passes or permission to weaken a gate.

#165 remains open and PR #199 remains draft. #166 is not advanced past the user's
verify-#165-first condition. #178 needs an explicit expansion GO, #186 needs actual
authorized participants, and #187 remains an exact-candidate handoff.
