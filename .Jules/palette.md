# Palette's UX Journal

## 2026-05-30 - [Accessible Game UI Foundations]
**Learning:** Icon-only buttons and interactive game elements (like level cards) are often overlooked in accessibility. Using semantic <button> elements instead of <div>s and providing clear aria-labels ensures the game is navigable by keyboard and screen readers. Clear keyboard shortcut hints (like "Esc" for pause) reduce cognitive load for players.
**Action:** Always prefer semantic <button> elements for interactive UI components. Ensure all icon-only buttons have descriptive aria-labels and provide visible keyboard shortcut hints where applicable.

## 2026-05-31 - [Visual Focus for Sequential Input]
**Learning:** In sequential input tasks like typing practice, users benefit significantly from a distinct "active state" marker (like a color-highlighted underline) on the current character. It reduces "visual search" time and keeps the user's focus locked on the target without cognitive strain.
**Action:** Implement a `.current-char` or equivalent high-contrast visual marker for any sequential input/gameplay elements to provide immediate feedback on the user's progress.
