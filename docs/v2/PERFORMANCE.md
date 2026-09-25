# Browser performance and staged loading (#165)

## Budgets and gates

Run `npm run validate:performance`. The build command traverses Vite's emitted import graph and measures level-9 gzip bytes for the v2 shell and its first-play dynamic imports. The asset validator measures approved files, checks duplicate IDs/paths and provenance, rejects orphaned oversized files, and conservatively counts every responsive variant in a biome pack. The first-play gate combines additional code and Meadow asset bytes.

| Target | Limit | Gate |
| --- | ---: | --- |
| Initial interactive v2 shell | 2,500,000 compressed bytes | Vite build graph |
| Additional first Meadow code and pack | 8,000,000 compressed bytes | Dynamic imports plus asset pack |
| Later biome pack | 12,000,000 bytes | Asset validator |
| Single optimized raster | 1,500,000 bytes | Asset validator |
| Capable device gameplay | 60 FPS target | Development display and browser QA |
| Modest Chromebook profile | At least 30 FPS | Throttled Chromium smoke |
| Input to visible feedback | p95 under 100 ms | Twenty-sample browser smoke |
| Scene lifecycle | No unbounded textures, listeners or timers over five exits | Scene-cycle smoke and ownership cleanup |

The build count excludes browser cache, HTTP headers and service-worker effects. Optimized raster file bytes are a conservative compressed-transfer proxy. Any budget change needs a documented issue; later art PRs rerun these gates.

## Load order and ownership

The semantic shell loads before Phaser. Starting Meadow dynamically imports Phaser and its scene, verifies the F/J curriculum and mission data, then fetches only implemented manifest entries in this order: shell/core, current biome minimum, current mission. Progress names the phase and counts actual completed files; it does not invent a percentage. Planned slots make no request. Optional decoration may load after the typing surface is usable and can fail without hiding pedagogy. Required fetch failure offers retry through a fresh page load because a failed dynamic import can be cached by the browser.

The loader selects the smallest approved viewport/DPR variant, capping DPR at 2. It owns Blob URLs for the shared core and current biome. BootScene owns its registered Phaser textures, cue graphics and resize listener, releasing them on shutdown. The current Phaser Game is suspended and its canvas detached while home is visible, then the scene restarts on reentry. Phaser 4.2.1 installs a document visibility listener without removing it in `Game.destroy`; retaining one Game per shell avoids listener growth across repeated scene visits. The Game and loader are disposed when the shell itself unmounts. Only one biome pack is retained; switching biomes must release the previous pack before loading the next.

The v1 service worker skips `/v2/` and v2 lazy chunks, so its broad legacy cache cannot retain future packs or substitute a v1 offline page. No future biome is currently implemented or prefetched. A later pack may prefetch only after current play is ready, on an appropriate connection with Save-Data off, and after asset approval. #176 owns versioned current/core offline caching, stale-pack purge and update timing. The current open session can use loaded code offline; offline return remains a #176/#167 gate.

## Baseline and verification limits

The pre-art build on 25 September 2026 measured v1 default shell at 81,913 gzip bytes, v2 shell at 26,704, and additional first-play code at 354,905. Meadow art/audio transfer was zero because all slots were planned. A prior headless Chromium run on the earlier #165 worktree with 4× CPU, 100 ms RTT, 1.6 Mbps down, 1366×768 and reduced motion measured first Meadow entry at 3.39 seconds, about 57 FPS and 23.7 ms p95 over ten typing samples. These are empty-art baselines, not field-device results; the rebuilt scene-lifecycle implementation requires a fresh browser run.

The environment reset on 25 September removed the Playwright browser. Its download endpoint returned a truncated archive, so the current branch's twenty-sample and listener-cycle smoke must run in CI or an environment with Chromium before #165 can be marked complete. Recheck on actual lower-end school hardware after #167 adds art. The development-only display reports FPS, average frame time, texture count, active scenes, loaded packs and rolling input p95; nothing is transmitted.
