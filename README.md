# ✨ Bloom Typing ✨

A beautiful, immersive typing game for kids — built for the web with gorgeous Canvas animations, AI-generated character art, and PWA support.

![Hero](assets/hero-unicorn.png)

## 🚀 Play Now

Install the locked dependencies and start the Vite development server:
```bash
npm ci
npm run dev
```

## 🎮 Features

### Game Modes
- **Play Quest** — 10 progressive touch-typing levels
- **Practice Letters** — A-Z letter practice mode for building fundamentals
- **Daily Moment** — a low-stress 60-second return path
- **Weak-key drills** — focused practice derived from each learner's local history

### Visual System
- 🌟 Custom Canvas particle engine (sparkle bursts, explosions, floating stars)
- 🎨 Animated UI with CSS keyframe animations (bouncing title, floating island)
- 🖼️ Custom AI-assisted character and environment artwork
- 💜 Glassmorphism cards with glow effects throughout
- 📱 Fully responsive — works on phone, tablet, laptop

### Game Mechanics
- Falling word system with typed highlighting
- Combo streak system with fire bonuses
- Health system (💜 hearts) — recover hearts via combo streaks
- Star scoring — earn ⭐ based on accuracy each level
- Level progression (unlocks saved across sessions)
- Profile system with 10 selectable avatars
- Persistent stats (high score, total words, play time, days played)

### Audio
- 🎵 Web Audio API synthesized sound effects (no files needed!):
  - Correct letter chime
  - Wrong letter buzz
  - Word complete trill
  - Level complete fanfare
  - Game over sad tones
  - Combo fire whoosh
  - Heart recovery chime
- No pre-recorded audio — everything generated in browser!

### PWA Features
- Install as app on iPhone, Android, Windows, Mac
- Offline play with service worker caching
- Manifest with theme color, icons, standalone display
- Install banner prompt

## 📁 Files

| File | Description |
|------|-------------|
| `index.html` — Main game page |
| `parents.html` — Parent info page (curriculum + privacy) |
| `teacher.html` — Teacher dashboard (class analytics, optional Supabase) |
| `styles.css` — Full design system (Canvas-independent styles) |
| `src/` — Modular Vite source (28 ES modules, ~7,800 lines) |
| `supabase/schema.sql` — Cloud sync schema (profiles, sessions, class roster) |
| `docs/LAUNCH-READINESS.md` — Pilot gates, evidence, owners, and release record |
| `public/manifest.json` — PWA manifest |
| `public/sw.js` — Service worker for offline play |
| `public/assets/` — AI-generated art + icons |

## 🎨 AI Art Generation

The game uses custom AI-assisted character art generated during development:
- Hero flower garden scene
- Celebration/confetti victory screen
- Per-level backgrounds, badges, particles, pets, and UI assets

Generation credentials are operator-supplied and are never part of the browser
application or tracked source. The checked-in artwork is served as static files.

## 🛠️ Tech Stack

- **Vite + vanilla JS** — modular ES modules, no framework, fast dev/build
- **HTML5 Canvas** — custom 2D game engine with particle system
- **Web Audio API** — real-time synthesized sound effects
- **CSS3** — animations, glassmorphism, variables, custom scrollbar
- **Supabase (optional)** — cloud sync for profiles, sessions, class rosters
- **Web APIs** — localStorage (offline saves), Service Worker (offline), PWA install

## 📱 How to Install

### iPhone / iPad
1. Open game in Safari
2. Tap **Share** → **Add to Home Screen**
3. Play like a native app!

### Android
1. Open game in Chrome
2. Tap **⋮ Menu** → **Add to Home Screen**
3. Chrome may prompt automatically

### Windows / Mac
1. Click the install icon in Chrome/Edge address bar
2. Follow the browser's install prompt

## 🎵 Controls

- **Type letters** — match falling words and press each key
- **Space bar** — skip a tricky word and pick a new one
- **Escape** — pause/resume game

## 📝 Curriculum

Ten progressive levels cover home row, top row, bottom row, all letters,
capitals, numbers, speed, accuracy, combined mastery, and a final no-looking
challenge. The authoritative lesson names, keys, word lists, and completion
settings live in `src/lessonLevels.js`.

## 🏗️ Architecture

```
BloomType                  Purpose
├── index.html            — game entry (Vite)
├── parents.html          — parent info page
├── teacher.html          — local-first teacher dashboard (optional Supabase)
├── styles.css            — design system
├── src/                  — 28 ES modules (~7,700 lines)
│   ├── main.js           — bootstrap + screen routing
│   ├── state.js          — localStorage state + cloud sync
│   ├── gameEngine.js     — game orchestration + canvas loop
│   ├── gameCanvas.js     — backgrounds, pets, flowers + effects
│   ├── gameInput.js      — desktop/mobile input controller
│   ├── gameSession.js    — per-session state initialization
│   ├── gameWord.js       — canvas word model + renderer
│   ├── gamePresentation.js — keyboard feedback presentation
│   ├── drills.js         — practice mode (letters, words, quotes)
│   ├── quests.js         — story-mode quest progression
│   ├── classroom.js      — class-code join + roster sync
│   ├── teacher.js        — teacher analytics dashboard
│   ├── achievements.js   — badge unlocking
│   ├── spacedRep.js      — SR scheduling
│   ├── story.js          — narrative content
│   ├── lessons.js / lessonLevels.js — lesson definitions
│   ├── words.js / data.js — word lists + level config
│   ├── audio.js          — Web Audio synth
│   ├── assets.js         — asset manifest
│   ├── sync.js           — Supabase client (lazy)
│   └── utils.js          — escapeHTML + helpers
├── supabase/schema.sql   — Postgres schema (RLS-enabled)
├── public/sw.js          — service worker
├── public/manifest.json  — PWA manifest
└── public/assets/        — AI art + icons
```

## 🧪 QA Checks Passed

| Check | Result |
|-------|--------|
| Build | ✅ `vite build` succeeds (4 HTML pages) |
| Tests | ✅ 272 vitest tests pass across 34 files |
| Browser journeys | ✅ 15 Playwright tests cover classroom join/export/leave, responsive home actions, keyboard onboarding, isolated weak-key drill completion, ten-level progression, production-rendered WCAG A/AA scans, the production build, PWA scope, offline reload, and cache cleanup |
| Local-only release boundary | ✅ Built artifacts fail verification if Supabase configuration or client code is compiled in |
| Remote CI | ✅ Core checks and the local-only artifact gate run on the repository-scoped Ashbi VPS runner |
| npm audit | ✅ 0 vulnerabilities |
| ESLint | ✅ 0 errors via `npm run lint` |

## 🎯 Future Ideas

- Multiplayer racing mode (WebSocket)
- More AI-generated backgrounds per level theme
- Leaderboards
- Supervised classroom pilot and retention validation
- Complete fluent French and Spanish review across learner, parent, and teacher pages

---

**Built with ❤️** for kids who love flowers and learning to type!
