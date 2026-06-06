# Palette's UX Journal

## 2026-05-30 - [Accessible Game UI Foundations]
**Learning:** Icon-only buttons and interactive game elements (like level cards) are often overlooked in accessibility. Using semantic <button> elements instead of <div>s and providing clear aria-labels ensures the game is navigable by keyboard and screen readers. Clear keyboard shortcut hints (like "Esc" for pause) reduce cognitive load for players.
**Action:** Always prefer semantic <button> elements for interactive UI components. Ensure all icon-only buttons have descriptive aria-labels and provide visible keyboard shortcut hints where applicable.

## 2026-05-30 - [Semantic Progress Indicators]
**Learning:** Container elements for visual progress bars (e.g., `.level-progress-wrap`, `.practice-bar`) must use `role="progressbar"` and related ARIA attributes (`aria-valuenow`, `aria-valuetext`) to be perceivable by screen readers. Purely CSS-based progress fills are invisible to assistive technology.
**Action:** Synchronize `aria-valuenow` and `aria-valuetext` in the UI logic functions whenever the visual width of a progress bar is updated.
