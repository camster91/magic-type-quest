## 2025-01-24 - [Canvas Rendering Optimizations]
**Learning:** `ctx.shadowBlur` is extremely expensive in high-frequency rendering loops (like stars or particles), causing significant frame-time spikes. Additionally, viewport culling for static elements like stars can save substantial draw calls when the game world is larger than the canvas.
**Action:** Always prefer `globalAlpha` over `shadowBlur` for glow effects in loops, and implement simple viewport culling for background elements.

## 2025-01-24 - [Unnecessary State Stack Operations]
**Learning:** Repeated `ctx.save()` and `ctx.restore()` calls, along with `translate`/`rotate`, have a measurable cost when hundreds of particles are rendered per frame, even if rotation is 0.
**Action:** Conditionally wrap transformation logic to skip state stack operations when rotation/translation is not required.

## 2025-02-12 - [Animation Loop Layout Overhead]
**Learning:** Calling `ctx.measureText` in the animation loop for every word on screen adds significant layout overhead. While it seems fast, it's redundant if the text hasn't changed.
**Action:** Cache text measurements (like `typedWidth`) and only update them when the content changes (e.g., in `processKeystroke`).

## 2025-02-12 - [Synchronized Timing]
**Learning:** Multiple calls to `performance.now()` per frame across different systems (HUD, garden, pet) create redundant system calls and slight timing drifts between elements.
**Action:** Consolidate to a single `gameState.currentTime` updated once per frame using the `requestAnimationFrame` timestamp.

## 2026-06-13 - [Memoization of Color Conversion]
**Learning:** In canvas-heavy applications, utility functions like `hexToRgba` are often called thousands of times per frame (e.g., for particles and glow effects). Parsing hex strings repeatedly using `slice` and `parseInt` adds significant CPU overhead.
**Action:** Use a `Map` to cache the parsed RGB components of hex strings in shared utility functions to eliminate redundant string manipulation in high-frequency loops.
