# BloomType Production Roadmap

Goal: Ship a production-grade typing game that 1000+ kids use per month.

## Status: ALL PHASES COMPLETE 🌸

**Last commit:** `312e2de` — Full production stack shipped.

---

## Phase 1: Personality & Depth ✅

| # | Task | Status |
|---|------|--------|
| 1 | **Narrative wrapper** — Bloom pet with 50+ dialogue lines, chapter intros/outros per level | ✅ `src/story.js` |
| 2 | **Kid voice copy** — All placeholder text replaced with excitement, urgency, character | ✅ All screens |
| 3 | **Pet evolution system** — 3 stages (sprout/bud/bloom) at L3, L6, L10 with visual unlocks | ✅ `gameEngine.js` |
| 4 | **Expand content 10×** — 2000+ words across 10 levels + sentence mode arrays | ✅ `src/words.js` |
| 5 | **18 achievements** — 5 categories (speed, accuracy, combo, volume, mastery) with progress bars | ✅ `src/achievements.js` |
| 6 | **Daily quest system** — 7 templates, 3 quests/day, streak tracking, deterministic generation | ✅ `src/quests.js` |
| 7 | **Persistent garden view** — Full-screen grid of all planted flowers with metadata | ✅ `src/main.js` garden screen |
| 8 | **Ambient music** — Generative sine drone (A3+E4 fifth), starts on game, stops on game over | ✅ `src/audio.js` |

## Phase 2: Classroom-Ready ✅

| # | Task | Status |
|---|------|--------|
| 9 | **Class code system** — Student enters code in profile, syncs to `bloomtype-class-*` localStorage key | ✅ `src/classroom.js` |
| 10 | **Adaptive difficulty** — Auto-slow to 0.5x if accuracy <70% & WPM <10, auto-accelerate to 1.5x if >85% & >20 WPM | ✅ `gameEngine.js` |
| 11 | **Error-focused drill mode** — Detects weak keys from `keyAccuracy`, generates targeted 25-word mini-lesson | ✅ `src/drills.js` |
| 12 | **Spaced repetition** — Simplified SM-2 intervals for weak keys, review pills in profile screen | ✅ `src/spacedRep.js` |

## Phase 3: Scale Infrastructure ✅

| # | Task | Status |
|---|------|--------|
| 13 | **Supabase backend** — Offline-first sync layer. Schema with profiles, game_sessions, class_roster tables. RLS policies. | ✅ `src/sync.js` + `supabase/schema.sql` |
| 14 | **Real teacher dashboard** — Local + cloud modes, class roster, red-flag alerts (7+ days inactive), CSV/JSON export | ✅ `src/teacher.js` + `teacher.html` |
| 15 | **Multiplayer typing races** | ❌ Skipped — WebRTC/server relay too complex for current priority. Revisit after 1000 users. |
| 16 | **Asset pipeline** — Removed 9 orphaned directories (23MB freed), verified all remaining refs active | ✅ `public/assets/` cleaned |

---

## File Architecture (19 source modules)

```
src/
  main.js          — Entry point, menu, profile, garden, quests, event bindings
  gameEngine.js    — Canvas engine, word spawning, typing logic, game loop
  state.js         — Game state + profile persistence, localStorage, cloud sync hooks
  lessonLevels.js  — Level definitions, finger hints, unlock logic
  story.js         — Narrative engine, Bloom personality, chapter data
  words.js         — 2000+ kid-friendly words + sentence arrays
  achievements.js  — 18 achievements, categories, progress tracking
  quests.js        — Daily quest generation, evaluation, streaks
  drills.js        — Weak key detection, targeted mini-lesson builder
  spacedRep.js     — SM-2 interval tracking for review recommendations
  classroom.js     — Class code system, localStorage roster sync
  sync.js          — Supabase client (lazy-load), fire-and-forget cloud sync
  teacher.js       — Dashboard controller (local + cloud roster)
  audio.js         — Generative ambient music, sound effects
  assets.js         — Asset manifest (used by engine)
  lessons.js        — Legacy lesson data (deprecated, kept for compat)
  data.js           — Legacy word banks (deprecated, kept for compat)
```

## Build Metrics

- **Main JS:** 79.46 kB (gzipped: 27.76 kB)
- **CSS:** 26.64 kB (gzipped: 5.97 kB)
- **Teacher JS:** 5.70 kB separate chunk
- **Sync JS:** 1.83 kB separate chunk
- **Index HTML:** 19.47 kB
- **Total assets:** 31MB (11 clean directories)
- **Build time:** ~360ms
- **Modules:** 19 JS modules

## Infrastructure

- **Hosting:** Static files (GitHub Pages, Netlify, or Coolify)
- **Backend:** Optional Supabase (free tier: 500MB, 500 users)
- **Auth:** Anonymous by default; OAuth via Supabase if configured
- **Data:** localStorage primary, cloud sync upgrade
- **PWA:** Service worker, manifest, offline-capable
- **Teacher:** `teacher.html` reads localStorage or Supabase

## What You Need to Deploy

1. `npm run build` → `dist/` folder
2. Host `dist/` on any static server
3. (Optional) Create Supabase project, run `supabase/schema.sql`
4. (Optional) Add `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
5. Share URL with kids. Zero backend required for offline mode.

## Next Steps (Post-Roadmap)

- [ ] User testing with actual kids (target: 10 classrooms)
- [ ] Analytics: track retention, session length, drop-off points
- [ ] A/B test: adaptive difficulty on/off
- [ ] Monetization: school license ($5/class/month?) or freemium
- [ ] i18n: French, Spanish for broader classrooms
- [ ] Generate consistent art style (pixel-art or flat vector) to replace mixed assets
- [ ] Mobile: optimize touch keyboard experience
