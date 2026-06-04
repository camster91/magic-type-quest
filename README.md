# ✨ Bloom Typing ✨

> A magical garden typing adventure for kids — type words, catch stars, and grow your garden!

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Web](https://img.shields.io/badge/Platform-Web-yellowgreen.svg)](#play-now)
[![PWA](https://img.shields.io/badge/PWA-Ready-brightgreen.svg)](#-how-to-install)
[![Age: 4+](https://img.shields.io/badge/Age-4%2B-pink.svg)](#-features)

**Bloom Typing** (formerly *Magic Type Quest*) is a web-based typing game for children ages 4–10. It features gorgeous Canvas animations, AI-generated character art, and a fully offline-capable PWA that installs on any device.

![Hero](assets/hero-unicorn.png)

---

## 🚀 Play Now

Open `index.html` in any modern browser. No server required!

Or serve locally:

```bash
python3 -m http.server 8080
# Visit http://localhost:8080
```

Or use the dev server:

```bash
npm install
npm run dev
```

---

## 🎮 Features

### Game Modes

| Mode | Description |
|------|-------------|
| **Play Quest** | 10+ levels of progressively harder words and faster falling stars |
| **Practice Letters** | A–Z letter practice with finger-placement hints |
| **Daily Challenges** | Speedster · Combo Master · Perfect Aim · Alphabet Ace |

### Visual System

- 🌟 Custom Canvas particle engine — sparkle bursts, explosions, floating stars on every correct word
- 🎨 Animated UI with CSS keyframe animations — bouncing title, floating island, glassmorphism cards with glow effects
- 🖼️ AI-generated character artwork (hero splash art, celebration scenes)
- 📱 Fully responsive — works on phone, tablet, and desktop
- 💜 Glassmorphism card design system with purple/pink palette

### Game Mechanics

- Falling word system with real-time letter highlighting as you type
- Combo streak system with fire bonus effects
- Health system (💜 hearts) — recover via combo streaks
- Star scoring — earn ⭐ based on accuracy each level
- Level progression with persistent unlocks
- Profile system with 8 unlockable avatars
- Persistent stats: high score, total words typed, play time, days played

### Audio

All sound synthesized live via **Web Audio API** — no audio files, no downloads:

- ✅ Correct letter chime
- ❌ Wrong letter buzz
- ✨ Word complete trill
- 🎉 Level complete fanfare
- 💔 Game over sad tones
- 🔥 Combo fire whoosh
- 💗 Heart recovery chime

---

## 📁 File Map

```
magic-type-quest/
├── index.html          — Main game page (all screens: menu, game, game over, profile)
├── styles.css          — Design system: glassmorphism, animations, responsive layout
├── src/
│   ├── main.js         — App entry point and screen routing
│   ├── gameEngine.js   — Core game loop, Canvas rendering, input handling (1628 lines)
│   ├── state.js        — Global game state, load/save profile
│   ├── story.js        — Pet evolution, dialogue, chapter system
│   ├── achievements.js — Achievement definitions and unlock logic
│   ├── quests.js       — Quest/level definitions
│   ├── lessons.js      — Lesson content
│   ├── lessonLevels.js — Per-level word sets, difficulty curves, finger hints
│   ├── words.js        — Word lists by difficulty tier
│   ├── audio.js        — Web Audio API sound synthesizer
│   ├── assets.js       — Asset loading utilities
│   ├── data.js         — Shared game data constants
│   ├── drills.js       — Practice drills
│   ├── classroom.js    — Classroom/multiplayer scaffolding
│   ├── teacher.js      — Teacher tools
│   ├── spacedRep.js    — Spaced repetition for weak keys
│   └── sync.js         — Cloud sync scaffolding
├── public/
│   ├── manifest.json   — PWA manifest (name, icons, theme, display mode)
│   └── sw.js           — Service worker for offline caching
├── assets/
│   ├── icon-192.png    — App icon (192px)
│   ├── icon-512.png    — App icon (512px)
│   ├── hero-unicorn.png       — AI hero splash art
│   └── celebration-bg.png     — AI celebration background
├── BLOOMTYPE-COMPLETE-PLAN.md
├── PRACTICE-MODE-PLAN.md
├── SCHOOL-READINESS-AUDIT.md
└── package.json
```

**Total: ~68 KB code + art (~300 KB total with images)**

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Vanilla JS (ES modules) — no build step required |
| Graphics | HTML5 Canvas — custom 2D engine with particle system |
| Audio | Web Audio API — synthesized sound effects |
| Styling | CSS3 — glassmorphism, keyframe animations, CSS variables |
| Storage | localStorage — profile & progress persistence |
| Offline | Service Worker API — asset caching + offline play |
| PWA | manifest.json + SW — installable on iOS/Android/Windows/Mac |
| Build | Vite 8 — fast dev server + optimized production builds |

---

## 📱 How to Install

### iPhone / iPad
1. Open the game in **Safari**
2. Tap the **Share** button → **Add to Home Screen**
3. The app installs like a native app — no App Store needed

### Android
1. Open in **Chrome**
2. Tap the menu (⋮) → **Add to Home Screen**
3. Chrome may prompt automatically

### Windows / Mac
1. Open in Chrome or Edge
2. Click the **install icon** in the address bar, or use the **Install** button in-game

---

## 🎵 Controls

| Input | Action |
|-------|--------|
| **Letter keys (A–Z)** | Type the highlighted letter |
| **Space bar** | Skip the current word and get a new one |
| **Escape** | Pause / resume game |

---

## 📚 Word Difficulty Tiers

| Level | Example Words | Length |
|-------|-------------|--------|
| 1 | cat, dog, sun, hat, cup | 3–4 letters |
| 2 | cake, fish, door, tree, unicorn | 4–8 letters |
| 3 | rainbow, flower, garden, magical, mermaid | 5–8 letters |
| 4 | fireworks, beautiful, chocolate, butterfly, friendship | 8–11 letters |
| 5 | fantastical, marvellous, marshmallow, jellybeans | 11–13 letters |

---

## 🏗️ Architecture

The game engine is organized as a set of ES modules:

```
game.js (main game engine — imported by index.html)
├── lessonLevels.js — level config + word lists
├── state.js        — game state management + localStorage
├── story.js        — pet story + evolution
├── achievements.js — achievement logic
├── quests.js       — quest definitions
├── audio.js        — Web Audio synthesis
└── [other modules]
```

Screen navigation is handled by `main.js`, which swaps visible sections (`#screen-menu`, `#screen-game`, `#screen-gameover`, `#screen-profile`).

---

## 🧪 QA Checks

| Check | Status |
|-------|--------|
| HTML tag balance | ✅ All tags closed |
| CSS brace balance | ✅ 189/189 balanced |
| JS paren balance | ✅ 85/85 balanced |
| JS brace balance | ✅ 8/8 balanced |
| JS bracket balance | ✅ 3/3 balanced |
| JS syntax | ✅ Valid Function parse |
| Game engine size | ✅ 1628 lines |

---

## 🌐 Browser Support

- Chrome 90+ ✅
- Safari 15+ ✅
- Firefox 90+ ✅
- Edge 90+ ✅

(iOS PWA install requires Safari; Android PWA install requires Chrome)

---

## 🤝 Contributing

Issues and pull requests welcome at:  
https://github.com/camster91/magic-type-quest

---

## 📄 License

ISC

---

**Built with ❤️ for kids who love flowers and learning to type!**