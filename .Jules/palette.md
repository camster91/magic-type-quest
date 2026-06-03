# Palette's UX Journal

## 2026-05-30 - [Accessible Game UI Foundations]
**Learning:** Icon-only buttons and interactive game elements (like level cards) are often overlooked in accessibility. Using semantic <button> elements instead of <div>s and providing clear aria-labels ensures the game is navigable by keyboard and screen readers. Clear keyboard shortcut hints (like "Esc" for pause) reduce cognitive load for players.
**Action:** Always prefer semantic <button> elements for interactive UI components. Ensure all icon-only buttons have descriptive aria-labels and provide visible keyboard shortcut hints where applicable.

## 2026-05-31 - [Dynamic Progress Feedback]
**Learning:** Visual progress bars in games are great for sighted users but leave screen reader users in the dark. By using `role="progressbar"` with dynamic `aria-valuenow` and `aria-valuetext`, we provide immediate, spoken feedback (e.g., "Word 5 of 20") that keeps all users informed of their progress without disrupting gameplay flow.
**Action:** Always pair visual progress indicators with semantic ARIA roles and use `aria-valuetext` to provide human-readable context for numeric progress values.
