## 2025-05-14 - [Accessibility Micro-UX in Games]
**Learning:** Highly visual or "playful" interfaces often neglect accessibility by using icon-only buttons (like emojis for avatars) or placeholder-only inputs. These can be easily addressed using a `.sr-only` utility class and `aria-label` attributes to maintain the visual aesthetic while providing a semantic layer for screen readers.
**Action:** Always scan for interactive elements that lack text alternatives and implement `.sr-only` labels or ARIA attributes as a standard part of the "polish" phase.
