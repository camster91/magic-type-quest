# Palette's UX Journal

## 2026-05-30 - [Accessible Game UI Foundations]
**Learning:** Icon-only buttons and interactive game elements (like level cards) are often overlooked in accessibility. Using semantic <button> elements instead of <div>s and providing clear aria-labels ensures the game is navigable by keyboard and screen readers. Clear keyboard shortcut hints (like "Esc" for pause) reduce cognitive load for players.
**Action:** Always prefer semantic <button> elements for interactive UI components. Ensure all icon-only buttons have descriptive aria-labels and provide visible keyboard shortcut hints where applicable.

## 2026-05-30 - [ARIA Progress Indicators]
**Learning:** Progress bars in fast-paced games are often purely visual. Adding `role="progressbar"` with `aria-valuenow` and `aria-valuetext` updates allows screen reader users to understand their progress without interrupting gameplay flow. Synchronizing these attributes in the rendering loop (e.g., `updateProgressBar`) ensures accessibility keeps pace with visual updates.
**Action:** For any visual progress indicator, implement the `progressbar` role and synchronize ARIA attributes (`aria-valuenow`, `aria-valuetext`) whenever the visual state changes.
