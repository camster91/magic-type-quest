## 2025-01-24 - [Canvas Rendering Optimizations]
**Learning:** `ctx.shadowBlur` is extremely expensive in high-frequency rendering loops (like stars or particles), causing significant frame-time spikes. Additionally, viewport culling for static elements like stars can save substantial draw calls when the game world is larger than the canvas.
**Action:** Always prefer `globalAlpha` over `shadowBlur` for glow effects in loops, and implement simple viewport culling for background elements.

## 2025-01-24 - [Unnecessary State Stack Operations]
**Learning:** Repeated `ctx.save()` and `ctx.restore()` calls, along with `translate`/`rotate`, have a measurable cost when hundreds of particles are rendered per frame, even if rotation is 0.
**Action:** Conditionally wrap transformation logic to skip state stack operations when rotation/translation is not required.

## 2025-01-24 - [Timing Overhead and Synchronization]
**Learning:** Multiple calls to `performance.now()` within a single rendering frame add unnecessary overhead and can lead to slight synchronization drift between animated elements.
**Action:** Consolidate timing by updating a single `gameState.currentTime` once per frame in the main game loop and sharing it across all systems.

## 2025-01-24 - [Nondeterministic Rendering Anti-pattern]
**Learning:** Using `Math.random()` inside a high-frequency drawing loop (like `drawFlowerImage`) causes visual flickering and wastes CPU cycles on RNG.
**Action:** Use stable entity properties (like coordinates) to derive visual variations deterministically.
