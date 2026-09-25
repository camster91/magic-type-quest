# Browser performance and staged loading (#165)

## Budgets and gates

Run `npm run validate:performance`. The build command traverses Vite's emitted import graph and measures level-9 gzip bytes for the v2 shell and its first-play dynamic imports. The asset validator measures approved files, checks duplicate IDs/paths and provenance, rejects orphaned oversized files, and conservatively counts every responsive variant in a biome pack. The first-play gate combines additional code, shared core assets and Meadow asset bytes. Core art is requested after Start Meadow, not by the initial interactive shell, so it is counted once in the additional first-play budget. The JSON report exposes `coreAssetBytes` explicitly.

| Target | Limit | Gate |
| --- | ---: | --- |
| Initial interactive v2 shell | 2,500,000 compressed bytes | Vite build graph |
| Additional first Meadow code and pack | 8,000,000 compressed bytes | Dynamic imports plus shared core and Meadow assets |
| Later biome pack | 12,000,000 bytes | Asset validator |
| Single optimized raster | 1,500,000 bytes | Asset validator |
| Capable device gameplay | 60 FPS target | Development display and browser QA |
| Modest Chromebook profile | At least 30 FPS | Throttled Chromium smoke |
| Input to visible feedback | p95 under 100 ms | Twenty-sample browser smoke |
| Scene lifecycle | No unbounded textures, listeners or timers over five exits | Scene-cycle smoke and ownership cleanup |

The build count excludes browser cache, HTTP headers and service-worker effects. Optimized raster file bytes are a conservative compressed-transfer proxy. The shared limits live in `scripts/v2-asset-policy.mjs`. A source/output alias is counted once; duplicate manifest output paths still fail validation. Header inspection supports PNG, WebP and SVG root dimensions; it does not prove browser decode. AVIF remains blocked until the approved inspection pipeline supports it. Any budget change needs a documented issue; later art PRs rerun these gates.

## Load order and ownership

The semantic shell loads before Phaser. Starting Meadow dynamically imports Phaser and its scene, verifies the F/J curriculum and mission data, then fetches only implemented manifest entries in this order: shell/core, current biome minimum, current mission. Progress names the phase and counts actual completed files; it does not invent a percentage. Planned slots make no request. Optional decoration may load after the typing surface is usable and can fail without hiding pedagogy. Required fetch failure offers retry through a fresh page load because a failed dynamic import can be cached by the browser.

The loader selects the smallest approved viewport/DPR variant, capping DPR at 2. Runtime selection also requires approved provenance and a cleared licence: an accidental implemented flag cannot authorize pending art. Required unapproved art blocks loading; optional unapproved art is skipped without discarding usable required resources. It owns Blob URLs for the shared core and current biome. BootScene registers cleanup during preload, owns newly queued texture IDs, cue graphics and its resize listener, and releases them on shutdown/destroy. Already-present borrowed textures are preserved. A completed loader queue cannot enable typing until all required texture IDs exist. The current Phaser Game is suspended and its canvas detached while home is visible, then the scene restarts on reentry. Phaser 4.2.1 installs a document visibility listener without removing it in `Game.destroy`; retaining one Game per shell avoids listener growth across repeated scene visits. Shell unmount requests Game destruction before waking a started sleeping loop to consume Phaser's deferred-destroy flag; it does not claim synchronous teardown merely because the canvas was removed. Pack URLs are released on loader disposal. The pinned upstream global visibility/focus handlers remain a separate, unresolved whole-shell cleanup check. Only one biome pack is retained; switching biomes must release the previous pack before loading the next.

The v1 service worker skips `/v2/` and v2 lazy chunks, so its broad legacy cache cannot retain future packs or substitute a v1 offline page. No future biome is currently implemented or prefetched. A later pack may prefetch only after current play is ready, on an appropriate connection with Save-Data off, and after asset approval. #176 owns versioned current/core offline caching, stale-pack purge and update timing. The current open session can use loaded code offline; offline return remains a #176/#167 gate.

## Baseline and verification limits

The pre-art build on 25 September 2026 measured v1 default shell at 81,913 gzip bytes, v2 shell at 26,704, and additional first-play code at 354,905. Meadow art/audio transfer was zero because all slots were planned. A prior headless Chromium run on the earlier #165 worktree with 4× CPU, 100 ms RTT, 1.6 Mbps down, 1366×768 and reduced motion measured first Meadow entry at 3.39 seconds, about 57 FPS and 23.7 ms p95 over ten typing samples. These are empty-art baselines, not field-device results; the rebuilt scene-lifecycle implementation requires a fresh browser run.

The environment reset on 25 September removed the Playwright browser. Its download endpoint returned a truncated archive, so the current branch's twenty-sample and listener-cycle smoke must run in CI or an environment with Chromium before #165 can be marked complete. Recheck on actual lower-end school hardware after #167 adds art. The development-only display reports FPS, average frame time, texture count, active scenes, loaded packs and rolling input p95; nothing is transmitted.

## Asset-gate continuation evidence

The [25 September asset-gate record](evidence/165-asset-gates-2026-09-25.md) records 70 isolated checks, including prior loader lifecycle regressions, and controlled command-line negative fixtures. Those checks repair a missed shared-core transfer, SVG inspection and runtime approval gating; they are not production-build, browser, device or learner validation. The fresh workspace has Chromium, but its managed policy rejects page navigation; no browser gate is claimed and no policy was changed. Full pinned-toolchain checks and actual Phaser/browser measurements remain required before merging #165.

## World readiness continuation evidence

The [world readiness record](evidence/165-world-readiness-2026-09-25.md) documents 25 new isolated scene/disposal/document-policy cases plus all 70 prior cases passing. Six real-Phaser browser journeys are now included in `validate:persistence` but remain unrun in the restricted recovery environment. They inspect required image decoding, five scene texture/listener/tween/timer cycles, deferred Game destruction, cancelled loads and modal focus. See the [local asset lifecycle addendum](architecture/LOCAL-ASSET-LIFECYCLE.md) for the narrowly scoped v2 Blob CSP and the outstanding upstream global-handler limitation. No production-art or full browser acceptance is claimed.
