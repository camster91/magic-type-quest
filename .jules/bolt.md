## 2025-01-24 - [Canvas Rendering Optimizations]
**Learning:** `ctx.shadowBlur` is extremely expensive in high-frequency rendering loops (like stars or particles), causing significant frame-time spikes. Additionally, viewport culling for static elements like stars can save substantial draw calls when the game world is larger than the canvas.
**Action:** Always prefer `globalAlpha` over `shadowBlur` for glow effects in loops, and implement simple viewport culling for background elements.

## 2025-01-24 - [Unnecessary State Stack Operations]
**Learning:** Repeated `ctx.save()` and `ctx.restore()` calls, along with `translate`/`rotate`, have a measurable cost when hundreds of particles are rendered per frame, even if rotation is 0.
**Action:** Conditionally wrap transformation logic to skip state stack operations when rotation/translation is not required.

## 2025-05-22 - [Synchronized Timestamps and Stable Rendering]
**Learning:** Calling `performance.now()` multiple times per frame across different systems (engine, garden, animations) adds unnecessary overhead and can lead to slight desyncs in animations. Consolidating into a single `gameState.currentTime` updated once per frame via the `requestAnimationFrame` timestamp is more efficient. Additionally, using `Math.random()` in a draw loop for visual variations (like image selection) causes jarring flickering; stable properties like object coordinates should be used for deterministic selection.
**Action:** Always use a single synchronized timestamp for frame logic and prefer coordinate-based stable indexing over `Math.random()` for visual properties.

## 2025-05-22 - [MeasureText Caching]
**Learning:** `ctx.measureText` is a heavy operation that should be avoided in every frame of the rendering loop. Caching the width of text when the text or styling hasn't changed provides a significant performance boost for frequently rendered UI elements like word bubbles.
**Action:** Implement caching for text measurements in entity classes (e.g., `Word`) to minimize per-frame overhead.
