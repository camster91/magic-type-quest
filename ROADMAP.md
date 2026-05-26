# BloomType Production Roadmap

Goal: Ship a production-grade typing game that 1000+ kids use per month.

## Current State
Polished prototype. Clean code, PWA-ready, stable build. Lacks personality, depth, and retention mechanics.

## Phase 1: Personality & Depth (2-3 weeks)

| # | Task | Priority |
|---|------|----------|
| 1 | **Narrative wrapper** — Give the pet a name (Bloom). Each level = story chapter. Rewrite level intro/outro text | Must |
| 2 | **Rewrite all game copy** — Kid voice: excitement, urgency, character. Replace all placeholder text | Must |
| 3 | **Pet evolution system** — 3 stages across 10 levels. Unlock visual changes + new pet reactions at L3, L6, L10 | Must |
| 4 | **Expand content 10×** — 200 words/level → 2000+ total. Add sentence mode (short sentence targets) | Must |
| 5 | **15+ achievement system** — Track unlocks, show progress. Categories: speed, accuracy, combo, volume, streak | Must |
| 6 | **Daily quest system** — 3 quests/day: "Type 5 words with Q", "Complete a level without mistakes", "Reach 20 WPM" | Must |
| 7 | **Persistent garden view** — Full-screen garden walkaround. Kids can see all flowers they planted, click for details | Should |
| 8 | **Sound & music polish** — Add ambient garden music, pet reaction sounds. Replace all Web Audio placeholders | Should |

## Phase 2: Classroom-Ready (1 month)

| # | Task | Priority |
|---|------|----------|
| 9 | **Class code system** — Teacher enters code, localStorage exports JSON for upload to teacher dashboard | Must |
| 10 | **Adaptive difficulty** — Auto-slow if accuracy < 70%, auto-accelerate if WPM > 20. Per-level speed tuning | Must |
| 11 | **Error-focused drill mode** — "You missed Q 8 times. Practice just Q?" One-click mini-lessons | Should |
| 12 | **Spaced repetition for weak keys** — Resurface problem keys in practice mode using SM-2 algorithm | Should |

## Phase 3: Scale Infrastructure (2-3 months)

| # | Task | Priority |
|---|------|----------|
| 13 | **Supabase backend** — Free tier, OAuth (Google Classroom), synced accounts | Should |
| 14 | **Real teacher dashboard** — Class roster, WPM trends, red-flag alerts, export CSV | Should |
| 15 | **Multiplayer typing races** — Head-to-head via shared timer (P2P via WebRTC or server relay) | Nice |
| 16 | **Consistent asset pipeline** — Commission or generate art in one unified style. Replace mismatched assets | Nice |

## Technical Notes
- All Phase 1/2 features are doable without backend. localStorage + file export only.
- Phase 3 requires budget. Supabase free tier = 500MB, 500 users. Fine for pilot.
- Sentence mode: existing `Word` class accepts sentence strings. Need collision width update.
- Pet evolution: add `evolution` field to profile. 1=baby, 2=teen, 3=adult. Swap petImages per stage.
- Daily quests: store `lastQuestDate` and `todaysQuests` in profile. Reset on new calendar day.
