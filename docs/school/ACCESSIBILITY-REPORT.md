# Accessibility conformance report (VPAT®-style draft)

> **Draft.** Based on automated testing plus the checks recorded in the repository. A full manual pass with NVDA and VoiceOver is still needed before this is sent to a buyer (see `docs/DEVICE-ACCESSIBILITY-QA.md`). Product: BloomType web app. Standard: WCAG 2.1 Level A and AA. Date: 2026-10-13.

## How it was evaluated

- **Automated:** axe-core (WCAG 2.0/2.1 A and AA rules) runs in CI on the home screen, the profile controls, the game, the teacher dashboard and the parent page. All pass.
- **Lighthouse accessibility:** 100 on all four pages (local production build, mobile profile).
- **Layout:** browser tests check French and Spanish at 320 px with enlarged text.
- **Keyboard:** a browser test plays a whole first session with the keyboard only.
- **Motion:** "reduce motion" turns off animation, petals, bobbing and pops.

## Summary by WCAG principle

| Criteria | Level | Conformance | Notes |
|---|---|---|---|
| 1.1.1 Non-text content | A | Supports | Decorative art is hidden from screen readers; meaningful images have text alternatives |
| 1.3.1 Info and relationships | A | Supports | Headings, landmarks, labelled form fields, table headers |
| 1.4.3 Contrast (minimum) | AA | Supports | Text on the painted scenes sits on dark panels; automated contrast checks pass |
| 1.4.4 Resize text | AA | Supports | Tested at enlarged text sizes |
| 1.4.10 Reflow | AA | Supports | Works at 320 px wide with no sideways scrolling |
| 2.1.1 Keyboard | A | Supports | The whole game is keyboard-driven |
| 2.2.1 Timing adjustable | A | Partially supports | Words move slowly and adapt to the child; the 60-second Daily Moment is optional. A "no time pressure" setting is planned |
| 2.3.1 Three flashes | A | Supports | No flashing content |
| 2.4.3 Focus order | A | Supports | Dialogs trap and return focus |
| 2.4.7 Focus visible | AA | Supports | 3 px focus outline |
| 3.1.1 / 3.1.2 Language | A / AA | Supports | `lang` is set; EN, FR and ES |
| 4.1.2 Name, role, value | A | Supports | Buttons and toggles expose state (e.g. the sound switch uses `aria-pressed`) |
| Screen-reader gameplay | — | Not yet verified | Needs the manual NVDA/VoiceOver pass |

## Known gaps

- A dyslexia-friendly font option and a high-contrast mode are planned (`docs/TODO-100.md`, Phase 2).
- Typing practice needs a physical keyboard; there is no switch-access mode yet.
