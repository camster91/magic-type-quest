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

## 2025-02-13 - [Hex Color Parsing Overhead]
**Learning:** Repeatedly parsing hex color strings (e.g., `#8B5CF6`) using `slice` and `parseInt(..., 16)` inside high-frequency canvas drawing loops (words, particles, glow effects) creates unnecessary CPU overhead. Since the game uses a fixed set of theme colors, these results are highly cacheable.
**Action:** Implement a `Map`-based cache for the intermediate RGB components in `hexToRgba` to replace parsing with a single O(1) lookup.
