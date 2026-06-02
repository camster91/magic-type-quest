## 2025-05-15 - Accessibility for Progress Indicators
**Learning:** Progress bars in interactive games often lack semantic meaning for screen readers if only implemented as visual div widths. Adding `role="progressbar"` and dynamic `aria-valuenow`/`aria-valuetext` ensures that non-visual users can perceive their progress toward game goals.
**Action:** Always include ARIA progress attributes when implementing or modifying visual progress bars.

## 2025-05-15 - Visual Feedback for Typing State
**Learning:** In typing applications, clearly highlighting the "active" character (the one the user needs to type next) reduces cognitive load and improves focus. Adding a distinct `.current-char` style provides a "cursor-like" experience within word displays.
**Action:** Ensure the next required interaction point has a unique visual treatment.
