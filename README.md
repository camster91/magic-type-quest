# BloomType

A touch-typing game for kids, built as an offline-capable web app with a hand-built Canvas game engine, synthesized sound and a growing pet companion.

![BloomType hero artwork](assets/hero-unicorn.png)

## What it is

BloomType (repository name `magic-type-quest`) turns touch-typing practice into a short, friendly game. Words fall onto a garden scene, the child types them, and correct keystrokes build combos, earn stars and unlock the next level. Progress is saved in the browser, so the game works without an account. The public build is local-only: a build check fails if any cloud sync configuration or client code ends up in the bundle.

The repo also contains a parent information page and a teacher dashboard, plus optional Supabase-based class sync that is kept out of the public build.

## Features

**Game modes**
- **Play Quest:** ten progressive levels covering home row, top row, bottom row, all letters, capitals, numbers, speed, accuracy, combined mastery and a final no-looking challenge
- **Practice Letters:** A to Z letter practice for building fundamentals
- **Daily Moment:** a short, low-stress 60-second session
- **Weak-key drills:** focused practice built from the keys a learner misses most, using a simple spaced-repetition schedule stored locally

**Gameplay**
- Falling-word system with live typed-letter highlighting
- Combo streaks, hearts that recover through combos, and star ratings based on accuracy
- Pet companions that react to play and evolve over time, plus achievements and badges
- Profiles with selectable avatars and persistent stats (high score, words typed, play time, days played)

**Presentation**
- Custom HTML5 Canvas renderer with layered backgrounds and a particle system
- Sound effects synthesized in real time with the Web Audio API (no audio files)
- Responsive layout for phone, tablet and laptop, with on-screen keyboard and hand guides
- Interface available in English, French and Spanish

**App**
- Installable PWA with a service worker for offline play
- Separate parent page (`parents.html`) and teacher dashboard (`teacher.html`)
- Optional Supabase sync for profiles, sessions and class rosters (schema in `supabase/schema.sql`, row-level security enabled), excluded from the public local-only build

## Controls

- **Type letters** to match the falling words
- **Space** skips a tricky word
- **Escape** pauses and resumes

## Tech stack

- Vite with vanilla JavaScript ES modules (no UI framework)
- HTML5 Canvas, Web Audio API, Service Worker, localStorage
- Supabase JS client (optional dependency, loaded lazily)
- Vitest + jsdom for unit tests, Playwright + axe-core for end-to-end and accessibility checks
- ESLint
- Docker image (nginx) built in CI for deployment

## Getting started

Requires Node.js and npm.

```bash
npm ci
npm run dev
```

The app is served under the `/magic-type-quest/` base path. Optional cloud sync is configured through environment variables (see `.env.example`); the game runs fully without them.

Build and preview a production bundle:

```bash
npm run build
npm run preview
```

## Testing and checks

```bash
npm test                          # Vitest unit tests (watch mode; add -- --run for a single pass)
npm run test:e2e                  # build, verify local-only bundle, then run Playwright
npm run lint                      # ESLint
npm run verify:local-only-build   # fail if cloud sync code or config is in dist/
npm run check:v2-theme            # content rule check for the v2 work in progress
```

CI runs lint, unit tests, the build, the local-only bundle check, Playwright end-to-end tests (including automated WCAG A/AA scans) and `npm audit` on pushes and pull requests to `main`. CodeQL scanning runs on `main`.

## Project structure

```
index.html            game entry
landing.html          landing page
parents.html          parent information page
teacher.html          teacher dashboard
styles.css            design system styles
src/                  game engine, input, state, lessons, drills, audio, i18n, sync
public/               PWA manifest, service worker and game art
supabase/schema.sql   optional cloud sync schema
test/                 Vitest unit tests
e2e/                  Playwright end-to-end and accessibility tests
scripts/              build checks and asset generation tools
docs/                 QA protocols, launch readiness and v2 product docs
```

Lesson names, keys, word lists and completion settings live in `src/lessonLevels.js`.

## Artwork

Character, background and UI art was generated with AI image tools during development and is committed as static files. No AI service is called from the browser, and generation credentials are not part of the app.

## Status

Version 1 is the current playable game. A second version ("Nature Quest") is being designed; see the [v2 product contract](docs/v2/PRODUCT-CONTRACT.md) and [decision log](docs/v2/DECISION-LOG.md). School use, cloud sync and classroom features are not yet approved for production; see [docs/LAUNCH-READINESS.md](docs/LAUNCH-READINESS.md).

## License

MIT. See [LICENSE](LICENSE).
