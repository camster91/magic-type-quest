## 2024-05-24 - Semantic Progress Indicators and Visual Feedback

**Learning:** Interactive progress elements (like level progress or practice bars) are often invisible to screen readers if they only use CSS widths. Using `role="progressbar"` with `aria-valuenow` synchronized in JS provides the necessary semantic context. Additionally, visual feedback for the "current" character in typing games is critical for orientation; missing CSS for expected classes (like `.current-char`) can break the intended UX flow.

**Action:** Always ensure progress-related UI components have appropriate ARIA roles and attributes that are updated alongside visual changes. For typing interfaces, explicitly style the active character to guide user focus.
