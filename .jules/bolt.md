## 2025-01-24 - [Canvas Rendering Optimizations]
**Learning:** `ctx.shadowBlur` is extremely expensive in high-frequency rendering loops (like stars or particles), causing significant frame-time spikes. Additionally, viewport culling for static elements like stars can save substantial draw calls when the game world is larger than the canvas.
**Action:** Always prefer `globalAlpha` over `shadowBlur` for glow effects in loops, and implement simple viewport culling for background elements.

## 2025-01-24 - [Unnecessary State Stack Operations]
**Learning:** Repeated `ctx.save()` and `ctx.restore()` calls, along with `translate`/`rotate`, have a measurable cost when hundreds of particles are rendered per frame, even if rotation is 0.
**Action:** Conditionally wrap transformation logic to skip state stack operations when rotation/translation is not required.

## 2025-01-24 - [Synchronized Time and Text Caching]
**Learning:** Multiple calls to `performance.now()` per frame and redundant `ctx.measureText()` calls for the same text strings add measurable overhead in the render loop. Synchronizing time via a single state property and caching text widths in entities significantly improves efficiency.
**Action:** Use `gameState.currentTime` for all time-based animations within the loop and cache results of expensive context operations like `measureText` in the entity's state.
