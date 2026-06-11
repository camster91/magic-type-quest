# Palette's UX Journal

## 2026-05-30 - [Accessible Game UI Foundations]
**Learning:** Icon-only buttons and interactive game elements (like level cards) are often overlooked in accessibility. Using semantic <button> elements instead of <div>s and providing clear aria-labels ensures the game is navigable by keyboard and screen readers. Clear keyboard shortcut hints (like "Esc" for pause) reduce cognitive load for players.
**Action:** Always prefer semantic <button> elements for interactive UI components. Ensure all icon-only buttons have descriptive aria-labels and provide visible keyboard shortcut hints where applicable.

## 2026-05-31 - [Visual Guidance and Semantic Progress]
**Learning:** In typing games, a clear visual "cursor" (e.g., a blinking underline on the current character) significantly improves user orientation and reduces typing errors in Practice Mode. Additionally, progress bars implemented as simple divs are invisible to screen readers; they require `role="progressbar"` and dynamic ARIA attributes (`aria-valuenow`, `aria-valuetext`) to be inclusive.
**Action:** Always include a visual focus indicator for the current typing target. Ensure all custom progress indicators use semantic ARIA roles and maintain synchronized `aria-valuenow` values in the UI update logic.
