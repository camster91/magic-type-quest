# #165 loader recovery evidence — 25 September 2026

Status: **partial implementation verified in isolation; PR #199 remains draft**.
This does not close #165, replace its browser gate, or authorize a release.

## Scope and source identity

Continues `codex/nature-quest-165-performance` from commit
`d858676868e136862a0eee6b8983af78ed825614`; the original implementation is retained.
Read #153, #165 and named dependencies #155/#159/#163, the accepted ADR, and #199's diff.

The reset workspace contained no checkout. Git transport failed with
`Could not resolve host: github.com`. The GitHub connector supplied the exact source.
Recovered source files were checked against their Git blob identities:

- Original `PackLoader.ts`: `54addf80ac4c9069c368adeb69d94f29c3b60d49`.
- Unchanged `manifest.ts`: `0b0145f162b8460999cc392de84e30d5e23c03b3`.

Only the loader, its new regression test, and this evidence record change in this continuation.
No framework, package, curriculum, learning rule, persistence schema, v1 source,
production route, workflow, cloud setting, or art pack changes.

## Acceptance-linked repairs

Concurrent requests for one owned asset now share a single in-flight promise and
Blob URL. Releasing a biome invalidates its visit generation, aborts its requests,
and revokes its URLs. A stale completion or finalizer cannot repopulate an old
pack, release a successful newer retry, or erase a newer in-flight request.

A new biome activation releases the previous biome while retaining shared core.
Optional requests require completed required loading and stop after cancellation
or disposal, including when a fetch implementation ignores abort. Required-data
failure still happens before any fetch or active-pack replacement. Real progress,
responsive variant selection, planned-slot exclusion, and safe optional fallback
remain in place. Synthetic pack IDs in tests are not later-biome production work.

## Executed evidence

`test/v2-pack-loader-lifecycle.test.js` contains 19 deterministic cases. In this
recovery workspace, the exact assertions ran through Node's native test runner,
with only the `vitest` runner import changed to `node:test` in a temporary copy.
The actual recovered TypeScript modules were transpiled using the available
TypeScript 5.8.3; only Vite's `BASE_URL` constant and local import extensions were
substituted in temporary JavaScript. No loader behaviour or assertion was mocked
away. Fetch/Blob-URL fixtures are explicit test dependencies.

| Check actually run | Result |
| --- | --- |
| Original loader against the 19 cases | 6 passed, 13 failed |
| Repaired loader against the same cases | 19 passed, 0 failed |
| Repeatability | 10 further runs, all 19 cases passing each time |
| Strict isolated TypeScript check of loader + unchanged manifest, including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` | Passed using TypeScript 5.8.3 and an ambient definition for `ImportMeta.env.BASE_URL` |
| JavaScript syntax check of new test | Passed (`node --check`) |
| New source/test trailing-whitespace and final-newline checks | Passed |

Coverage includes concurrent required/optional loading, readiness, cancellation,
disposal during response-body decoding, stale retry completion/finalization,
shared-core retention, automatic previous-pack release, missing pedagogy,
required failure/retry, optional fallback, real progress, reserved ownership IDs,
and five complete loader load/release cycles with bounded Blob ownership.

**These are isolated recovery checks, not the repository's locked Vitest,
TypeScript 6.0.3, Vite, Playwright, axe, or production-build gates.** There are no
new FPS, input-latency, real-device, Phaser texture/timer, v1, persistence, or child
validation measurements in this record. The earlier empty-art baseline in
`../PERFORMANCE.md` is historical and is not recertified here.

## Remaining blockers and exact next action

At inspection, GitHub reported zero Actions runs for the original PR head. The
workspace has system Chromium but no full repository checkout or locked npm
dependencies, so it cannot execute the complete app or its canonical commands.
No unrun check is marked passed. Do not mark #199 ready or merge it from this
isolated evidence.

On a complete checkout of the updated PR head, run:

```sh
npm ci --no-audit --no-fund
npm run typecheck:v2
npm run lint
npm test -- --run
npm run validate:curriculum
npm run validate:mastery
npm run validate:content
npm run validate:assets
npm run validate:cues
npm run validate:input
npm run test:v2-theme
npm run check:v2-theme
npm run validate:persistence
npm run test:e2e
npm run test:e2e:v2
npm run validate:performance
npm run build
npm run verify:local-only-build
npm run build:v2
npm run verify:local-only-build
```

`validate:performance` also runs the encoded budget command. Attach results to
the exact candidate commit. Verify actual Phaser textures/listeners/timers across
five enter/exit cycles and shell disposal, throttled frame/feedback measurements,
asset retry, reduced motion, DOM/axe, v1 coexistence, and learner-data reload.
The current browser smoke's listener count alone does not prove bounded textures
or timers. Resolve any failures before merge; retain the budgets unchanged.

## Impact and rollback

Architecture: same Phaser/TypeScript/Vite/DOM boundary and typed loader API.
Learner data/migration: no reads, writes, schema changes, imports, or cloud calls.
Accessibility/localisation: no child-facing copy or UI change; required-data
failure and optional fallback stay separate. Performance: fewer duplicate
requests and bounded asset ownership; production bundle delta remains unmeasured.
Visual evidence is not applicable to this non-visual loader repair.

Rollback only this continuation commit on the issue branch to return to the
original draft implementation. Do not modify `main`, deploy, or promote v2.
#178 still requires an explicit GO before #179–#183; #186 still requires real
authorized participants; #187 remains an exact-candidate release handoff.
