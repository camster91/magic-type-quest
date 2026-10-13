# BloomType design system

The rules every screen follows: the game, the teacher page, the parent page and the landing page. Tokens live at the top of `styles.css` (`:root`). The other pages repeat the few they need in their own `<style>` blocks.

## Look and feel

- **A painted meadow at dusk.** Child screens sit on the Meadow art (`assets/v2/meadow`), with a dusk-purple tint so text stays readable. Art direction is in `docs/v2/art/ART-BIBLE.md`.
- **Calm, never punishing.** Mistakes get a soft tone and a gentle nudge. There are no red screens, buzzers or losing (v2 product contract).
- **One focus at a time.** The word card is the brightest thing on the play screen. Everything else is quieter.

## Colour tokens

| Token | Value | Use |
|---|---|---|
| `--bg-1` / `--bg-2` / `--bg-3` | `#1E1B4B` / `#312E81` / `#4338CA` | Page backgrounds, dusk tints |
| `--primary` / `--primary-dark` / `--primary-light` | `#8B5CF6` / `#6D28D9` / `#DDD6FE` | Main buttons, progress, focus accents |
| `--accent` / `--accent-light` | `#EC4899` / `#FBCFE8` | Highlights, words-done counters |
| `--success` | `#6EE7B7` | Typed letters, done badges |
| `--warning` | `#FBBF24` | Streaks, stars, "past due" |
| `--danger` / `--danger-text` | `#DC2626` / `#FECACA` | Destructive buttons only (delete), never for child mistakes |
| `--text` / `--text-dim` | `#F8FAFC` / `#CBD5E1` | Body text / secondary text |
| `--card` / `--card-border` | white at 6% / 12% | Glass panels on dark backgrounds |
| Meadow gold | `#FDE68A` | Field Guide, class banner, "new card" highlights |
| Panel on art | `rgba(24, 20, 66, 0.62–0.82)` | Any panel that sits on the painted meadow |

**Rule:** text that sits on the painted art always gets a dark panel behind it (0.62–0.82 opacity). Never put light text straight on the sky.

## Type

| Role | Font | Size |
|---|---|---|
| Titles, the word to type, big buttons | **Fredoka One** (bundled) | 1.3–4.4 rem; the target word uses `clamp(2.4rem, 8vw, 4.4rem)` |
| Everything else | **Nunito** 400/700/800 (bundled) | At least **12 px** (0.75 rem) on child screens |
| Easy-read option | Atkinson Hyperlegible or OpenDyslexic | Chosen by the child; adds letter and word spacing |

Fonts are self-hosted in `public/fonts` (SIL OFL). The security policy blocks web fonts, so never link Google Fonts.

## Spacing, shape and touch

- Radius: `--radius` 16 px for cards and `--radius-sm` 10 px for chips and small panels; pill buttons use 999 px.
- Touch targets: at least **44 × 44 px** for anything a child taps.
- Layout must work at **320 px** wide with enlarged text, with no sideways scrolling (checked by `e2e/localization-layout.e2e.js`).

## Components

| Component | Where | Notes |
|---|---|---|
| Primary call to action (`.btn-cta-primary`) | Home | One per screen: "Type to plant" |
| Glass panel (`.progress-card`, `.menu-dock`, `.class-banner`) | Menus | Dark tint plus `backdrop-filter: blur(6px)` on art |
| Word card (`.target-word`) | Play | Typed letters `--success`, next letter coloured by hand (left blue, right green) |
| Finish card (`#level-overlay`) | Play | Sits low so the restored meadow shows; 1–3 stars for accuracy |
| Field Guide card (`.fg-card`) | Garden | Picture, gold name, one short fact; locked cards show "?" |
| Chips (`.player-chip`, `.class-chip`) | Profile, teacher | Pill, 44 px tall |

## Motion

- Gentle and short: 200–900 ms with ease-out curves. No flashing.
- **Reduced motion** turns off bobbing, petals, pops, star animations and count-ups. Every new animation must check `prefersReducedMotion()` or sit inside `@media (prefers-reduced-motion: reduce)`.

## Accessibility settings

High contrast (`html.high-contrast`) swaps every panel to solid black with a white 2 px border, white text and a yellow `#FFE14D` focus ring and next-letter underline. New components must be listed in that rule in `styles.css`.

## Known gaps

`styles.css` still has about 190 one-off colours from older screens. When you touch a screen, replace its one-off colours with the tokens above.
