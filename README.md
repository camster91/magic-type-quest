# ✨ Bloom Typing ✨

A beautiful, immersive typing game for kids — built for the web with gorgeous Canvas animations, AI-generated character art, and PWA support.

![Hero](assets/hero-unicorn.png)

## 🚀 Play Now

Open `index.html` in any modern browser. No server required!

Or serve locally:
```bash
python3 -m http.server 8080
# Visit http://localhost:8080
```

## 🎮 Features

### Game Modes
- **Play Quest** — 10+ levels with progressively harder words and faster falling stars
- **Practice Letters** — A-Z letter practice mode for building fundamentals
- **Daily Challenges** — Speedster, Combo Master, Perfect Aim, Alphabet Ace

### Visual System
- 🌟 Custom Canvas particle engine (sparkle bursts, explosions, floating stars)
- 🎨 Animated UI with CSS keyframe animations (bouncing title, floating island)
- 🖼️ AI-generated character artwork using Google Gemini Nano Banana 2
- 💜 Glassmorphism cards with glow effects throughout
- 📱 Fully responsive — works on phone, tablet, laptop

### Game Mechanics
- Falling word system with typed highlighting
- Combo streak system with fire bonuses
- Health system (💜 hearts) — recover hearts via combo streaks
- Star scoring — earn ⭐ based on accuracy each level
- Level progression (unlocks saved across sessions)
- Profile system with 8 unlockable avatars
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
| `src/` — Modular Vite source (18 ES modules, ~5,300 lines) |
| `supabase/schema.sql` — Cloud sync schema (profiles, sessions, class roster) |
| `public/manifest.json` — PWA manifest |
| `public/sw.js` — Service worker for offline play |
| `public/assets/` — AI-generated art + icons |

## 🎨 AI Art Generation

The game uses custom AI-generated character art created with Google Gemini Nano Banana 2:
- Hero flower garden scene
- Celebration/confetti victory screen
- Per-level backgrounds, badges, particles, pets, and UI assets

Generated using the nano-banana-2 skill at resolution 1K for crisp web display.

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
2. Or use the "Add" button in the game

## 🎵 Controls

- **Type letters** — match falling words and press each key
- **Space bar** — skip a tricky word and pick a new one
- **Escape** — pause/resume game

## 📝 Word Lists

Five difficulty tiers:
- **Level 1**: cat, dog, sun, hat, cup (3-4 letters)
- **Level 2**: cake, fish, door, tree, unicorn (4-8 letters)
- **Level 3**: rainbow, flower, garden, magical, mermaid (5-8 letters)
- **Level 4**: fireworks, beautiful, chocolate, butterfly, friendship (8-11 letters)
- **Level 5**: fantastical, marvellous, marshmallow, jellybeans (11-13 letters)

## 🏗️ Architecture

```
BloomType                  Purpose
├── index.html            — game entry (Vite)
├── parents.html          — parent info page
├── teacher.html          — teacher dashboard (Supabase-backed)
├── styles.css            — design system
├── src/                  — 18 ES modules (~5,300 lines)
│   ├── main.js           — bootstrap + screen routing
│   ├── state.js          — localStorage state + cloud sync
│   ├── gameEngine.js     — canvas render loop, particles, falling words
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
| Build | ✅ `vite build` succeeds (3 HTML pages) |
| Tests | ✅ 6/6 vitest pass (`data.js` module) |
| npm audit | ✅ 0 vulnerabilities |
| ESLint | ✅ 0 errors via `npm run lint` |

## 🎯 Future Ideas

- Multiplayer racing mode (WebSocket)
- Story campaign with chapters
- More AI-generated backgrounds per level theme
- Voice narration of words
- Leaderboards
- Internationalization (i18n) — see open issues #13 / #14 / #6

---

**Built with ❤️** for kids who love flowers and learning to type!
