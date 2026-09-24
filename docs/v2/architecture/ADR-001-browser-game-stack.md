# ADR-001: browser game stack and ownership

Status: Accepted for the v2 integration branch under [#155](https://github.com/camster91/magic-type-quest/issues/155), 2026-09-24.

## Context

BloomType v1 is a local-first Vite/JavaScript application with a custom Canvas engine, DOM controls, optional cloud adapter, service worker, and an established test/release path. Nature Quest v2 needs a maintainable six-biome game world while preserving v1 as the default and recoverable product. The [product contract](../PRODUCT-CONTRACT.md) and [#153](https://github.com/camster91/magic-type-quest/issues/153) constrain the choice.

## Decision and exact installed versions

Use **Phaser 4.2.1**, **TypeScript 6.0.3**, and **Vite 8.3.1**, pinned exactly in `package.json` and `package-lock.json`. Phaser renders and manages the game world; TypeScript strict mode applies to `src/v2`; Vite builds a separate `v2/index.html` entry only in the explicit preview build mode defined by [#156](../MIGRATION-PLAN.md). HTML/CSS DOM owns semantic application UI. Vitest, Playwright, and axe retain their existing roles. No React, additional state library, physics engine, animation framework, or cloud SDK is introduced.

The development entry is `/magic-type-quest/v2/` under the existing Vite base path. It is intentionally navigable by URL and links back to the v1 root. This is a development preview, not a public default-route cutover. [#156](https://github.com/camster91/magic-type-quest/issues/156) governs availability and coexistence before promotion.

## Why Phaser and why no React shell

The custom v1 Canvas engine has useful learning and accessibility systems, but biome scenes, layering, camera transitions, animation lifecycles, and asset loading would demand more custom world infrastructure. Phaser supplies those game-world lifecycles. The existing DOM architecture already supports semantic navigation, forms, focus, and translated text; React would add another runtime and migration boundary without a requirement in this issue.

| Concern | Owner |
| --- | --- |
| Biome backgrounds/layers, wildlife, environmental changes, world-space interaction, particles, restoration animation, camera, game ambience | Phaser scenes and systems |
| Top-level navigation, settings, text size, sound/reduced-motion/language controls, parent/teacher views, semantic dialogs, status, screen-reader announcements, forms, exports, focus | DOM application shell and services |
| Curriculum, evidence, mastery, encounter state, next action | Framework-independent typed domain services (later issues) |
| Learner data and import | Versioned local-first persistence adapter (later #162); optional cloud adapter remains isolated |
| Typing input | Shared input service (later #161), never a scene-local random keyboard listener |

Canvas is decorative in this boot proof and marked hidden to assistive technology. The DOM exposes the preview title, status, and exit action. Every future encounter must also expose objective, target, guidance, progress, feedback, completion, and habitat result through DOM. A scene never owns canonical learner progress, and destroying/recreating the scene never writes learner data.

## Directory and integration contract

`src/v2/app` owns boot and shell, `game/config`, `game/scenes`, `game/systems`, and `game/entities` own Phaser-only concerns, while `curriculum`, `mastery`, `content/biomes`, `content/wildlife`, `content/missions`, `ui`, `persistence`, `audio`, `accessibility`, `localization`, `assets`, and `testing` are reserved typed boundaries. Empty directories have `.gitkeep` markers until their dependency issue provides real code. V1 modules stay in place. Reuse of v1 logic must go through a typed adapter rather than importing its UI or engine into scenes; curriculum extraction is owned by #157.

The shell creates a dedicated stage element, mounts one Phaser `Game`, and destroys it on exit/pagehide. `BootScene` renders only a quiet readiness background; it does not start a mission, collect input, preload art, or mutate storage. Scene resize subscriptions are removed on shutdown. The v2 entry has no service-worker install prompt or cloud configuration.

## Testing, performance, and security

- `npm run typecheck:v2` is a separate strict TypeScript gate; the existing v1 unit, lint, build, local-only artifact, and browser checks remain.
- The v2 Playwright smoke test opens `/v2/`, checks its semantic DOM root and canvas, closes the shell, returns to v1, checks console errors, and repeats under reduced motion.
- Measured local build on Node 24: v1 main JS 156.96 kB / 54.39 kB gzip versus 156.92 kB / 54.41 kB gzip before this issue. The new v2 JS is 1,376.39 kB / 358.29 kB gzip and its CSS is 0.81 kB / 0.46 kB gzip. Vite warns about the Phaser chunk; #165 sets the hard gameplay/asset budgets. The v1 HTML does not load the v2 bundle.
- No assets or future biomes preload here. The v2 HTML retains a self-only CSP for script/style/connect, with self/data images. Any Phaser feature needing a wider directive requires a separate reviewed change; no secret is compiled into v2.

## Migration risks and rollback

The main risk is introducing a second game lifecycle alongside v1 before the state and route boundaries in #156/#162 are complete. Keep the v1 default entry, localStorage keys, PWA files, and release artifact untouched. This issue creates no v2 progress schema and performs no import. Revert the feature commit or stop building/linking `v2/index.html` to remove the preview; v1 remains available without data conversion. Do not promote the preview to the public default route before #187's exact-artifact approval.

## Rejected alternatives

- **Continue custom Canvas:** would expand bespoke scene, animation, loader, and camera infrastructure across biomes.
- **Pixi-only:** provides rendering, but more lifecycle/world systems would still need custom ownership.
- **React + Phaser:** adds a second UI runtime and synchronization boundary to a shell already served by semantic DOM.

These alternatives are recorded for rationale, not reopened by later biome work without an explicit ADR/change issue.
