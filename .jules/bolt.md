## 2025-01-24 - [Canvas Rendering Optimizations]
**Learning:** `ctx.shadowBlur` is extremely expensive in high-frequency rendering loops (like stars or particles), causing significant frame-time spikes. Additionally, viewport culling for static elements like stars can save substantial draw calls when the game world is larger than the canvas.
**Action:** Always prefer `globalAlpha` over `shadowBlur` for glow effects in loops, and implement simple viewport culling for background elements.

## 2025-01-24 - [Unnecessary State Stack Operations]
**Learning:** Repeated `ctx.save()` and `ctx.restore()` calls, along with `translate`/`rotate`, have a measurable cost when hundreds of particles are rendered per frame, even if rotation is 0.
**Action:** Conditionally wrap transformation logic to skip state stack operations when rotation/translation is not required.

## 2026-06-02 - [Render Loop Micro-Optimizations]
**Learning:** ctx.shadowBlur is a significant bottleneck for moving entities. Batching context state changes (like font and alignment) outside of iteration loops reduces JS-to-GPU overhead. Using stable entity properties for visual variations prevents frame-by-frame flickering and saves CPU cycles compared to Math.random().
**Action:** Replace shadowBlur with multi-layered fills. Move context state settings outside loops. Use stable property-based logic for sprite variations.
