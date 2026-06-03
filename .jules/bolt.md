## 2025-01-24 - [Canvas Rendering Optimizations]
**Learning:** `ctx.shadowBlur` is extremely expensive in high-frequency rendering loops (like stars or particles), causing significant frame-time spikes. Additionally, viewport culling for static elements like stars can save substantial draw calls when the game world is larger than the canvas.
**Action:** Always prefer `globalAlpha` over `shadowBlur` for glow effects in loops, and implement simple viewport culling for background elements.

## 2025-01-24 - [Unnecessary State Stack Operations]
**Learning:** Repeated `ctx.save()` and `ctx.restore()` calls, along with `translate`/`rotate`, have a measurable cost when hundreds of particles are rendered per frame, even if rotation is 0.
**Action:** Conditionally wrap transformation logic to skip state stack operations when rotation/translation is not required.

## 2025-01-24 - [Text Measurement & Context Hoisting]
**Learning:** `ctx.measureText` is a hidden bottleneck in typing games with many words. Hoisting context state assignments (like `font`, `textAlign`) outside of iteration loops and caching text width can significantly reduce per-frame overhead.
**Action:** Cache word widths in the word object and move context configuration outside of the `entities.forEach` loops.

## 2025-01-24 - [Stable Visual Variations]
**Learning:** Using `Math.random()` inside a render loop for visual variations (e.g., choosing which flower image to draw) causes high-frequency flickering and wastes CPU cycles.
**Action:** Use stable entity properties (like x/y coordinates) to derive a deterministic "random" index for visual variations.
