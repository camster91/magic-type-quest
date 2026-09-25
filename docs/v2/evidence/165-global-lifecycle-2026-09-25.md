# #165 whole-shell ownership — 25 September 2026

Status: **IMPLEMENTED; FULL APPLICATION AND BROWSER VERIFICATION PENDING**.
Continues exact PR #199 head `7962e8cb04eb78151694ef05e11a4b70b57d0a0d`.

## Acceptance-linked scope

The shared startup factory preserves the Phaser/TypeScript/Vite/DOM boundary,
postBoot callback, rendered/headless loop selection and inherited core handlers.
It replaces only unbounded browser-event ownership with removable instance-owned
listeners. External focus/blur properties and listeners are not overwritten.
Destroy requests detach the bridge immediately, including before a hidden page
can delay the next frame. Initial cancellation cannot install a stale bridge.

The existing destruction helper now checks loop.started, not Game.isRunning.
Phaser sets the latter before postBoot and before loop.start; a postBoot disposal
must not wake a loop whose callback has not been installed. A new regression
exercises this exact ordering through the helper.

No dependency files, installed Phaser, browser policies/prototypes, learner stores,
curriculum, scoring, settings, cloud or production route are changed. No later
biome is implemented. Only the shell's Game construction call changes.

## Executed checks

| Check | Result / limitation |
| --- | --- |
| New listener/startup tests | 23 passed using explicit browser/engine ports |
| Earlier asset/scene/loader/document-policy tests | 95 passed again |
| Repeatability | Five additional runs of each suite, all 118 cases passing per pair |
| Strict isolated TypeScript | Bridge, factory and teardown helper passed with strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes and noImplicitOverride using structural Phaser declarations |
| Shell syntax | Transpilation produced no syntax diagnostics; not a full semantic project check |
| JavaScript | New/modified tests pass node --check |
| Upstream method digest | Independently calculated from the exact v4.2.1 start method read from upstream |

Toolchain: Node 22.16.0 and available TypeScript 5.8.3. Temporary test copies change
only the runner import to node:test and local TypeScript module paths. Existing
scene mocks and BASE_URL substitutions remain explicitly documented in earlier
recovery records. These results are not a pinned Vitest/TypeScript/Vite run.

The new installed-package startup contract test is authored but unrun: the full
Phaser npm package is unavailable here. It must compare the installed version and
method digest in the complete checkout. Do not substitute a fixture for that gate.

## Browser journeys authored, not run

The existing source-mode world suite now additionally verifies five full shell/
Game lifetimes against the captured global-listener baseline and checks native
preBoot cancellation through actual Phaser destruction. It preserves independent
window focus/blur handlers. Existing six journeys remain, with their assertions
retained. All eight still require execution under validate:persistence.

No FPS, input-latency, actual rendering/texture/timer/browser-cache result, full
build, v1 regression, axe, persistence, curriculum/content/theme/asset inventory,
local-only/cloud-boundary or production acceptance pass is claimed here.

## Remaining blocker and next action

Fresh Git and npm requests still fail DNS. The recovery workspace contains a
source subset and globally available tooling, not the full locked checkout.
GitHub's query for the prior exact head returned no Actions runs. No managed
browser or environment restriction was changed or bypassed.

Execute the complete matrix in the earlier #165 evidence record on the exact
updated head. Include the installed-package startup guard, all new canonical
unit tests, the real-engine whole-shell/initial-boot tests, production-preview
performance/axe, v1 coexistence, persistence and both builds. Fix failures before
marking #199 ready or merging. Browser back/forward-cache restoration is a separate
entry-lifecycle check; this record does not claim it is fixed.

## Rollback

Revert this ownership continuation to return to its parent, keeping earlier
loader, budget and texture-readiness repairs. No learner-data rollback or reset
is needed. #165 stays open; #166 remains behind its verification condition.
