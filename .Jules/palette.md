# Palette's UX Journal

## 2026-05-30 - [Accessible Game UI Foundations]
**Learning:** Icon-only buttons and interactive game elements (like level cards) are often overlooked in accessibility. Using semantic <button> elements instead of <div>s and providing clear aria-labels ensures the game is navigable by keyboard and screen readers. Clear keyboard shortcut hints (like "Esc" for pause) reduce cognitive load for players.
**Action:** Always prefer semantic <button> elements for interactive UI components. Ensure all icon-only buttons have descriptive aria-labels and provide visible keyboard shortcut hints where applicable.

## 2026-05-31 - [Visual Focus & Accessible Progress]
**Learning:** Typing practice interfaces benefit greatly from a clear visual "cursor" highlighting the current character to type, reducing cognitive load. Additionally, purely visual progress indicators (like canvas-based or CSS-only bars) are invisible to screen readers unless augmented with proper ARIA roles and dynamic status updates.
**Action:** Implement `.current-char` visual highlights for typing tasks. Use `role="progressbar"` and synchronize `aria-valuenow` and `aria-valuetext` with UI logic to provide semantic progress updates.
