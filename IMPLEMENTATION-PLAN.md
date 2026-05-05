# BloomType Asset Implementation Plan

## Overview
Transform BloomType from a simple typing game into a professional, structured typing education platform with progressive lessons, finger guides, achievement tracking, and engaging visuals.

## Current State
- Basic typing game with falling words
- Practice mode (A-Z letter typing)
- Pet reactions using emojis (🌻, 🥺, 🌟)
- Adaptive difficulty (speed up/slow down)
- Score, combo, health system
- Stars and achievements

## Target State
- 6 progressive typing levels (home row → full keyboard mastery)
- Finger placement guides in practice mode
- Professional progress tracking (WPM, accuracy charts)
- Achievement system with badges and certificates
- Pet mascot with emotion states (5 characters)
- Background themes per mode
- Celebration animations for milestones

---

## Architecture

### Data Model Changes

```javascript
// New: Level System
const LESSON_STRUCTURE = {
  1: {
    name: "Home Row Basics",
    subtitle: "Where your fingers rest",
    keys: ["a","s","d","f","j","k","l",";"],
    fingerMap: {
      a: "leftPinky", s: "leftRing", d: "leftMiddle", f: "leftIndex",
      j: "rightIndex", k: "rightMiddle", l: "rightRing", ";": "rightPinky"
    },
    words: ["dad", "sad", "ask", "all", "lass", "fall", "gals", "halls"],
    requiredAccuracy: 0.85,
    requiredWPM: 8,
    badge: "bronze"
  },
  2: {
    name: "Top Row",
    subtitle: "Reaching up",
    keys: ["q","w","e","r","t","y","u","i","o","p"],
    fingerMap: { /* ... */ },
    words: ["quit", "were", "tree", "type", "your"],
    requiredAccuracy: 0.85,
    requiredWPM: 12,
    badge: "bronze"
  },
  // ... 3-6
};

// New: Achievement System
const ACHIEVEMENTS = {
  speed_10wpm: { title: "Speed Starter", icon: "speed-10wpm.png", condition: (s) => s.wpm >= 10 },
  speed_30wpm: { title: "Speed Runner", icon: "speed-30wpm.png", condition: (s) => s.wpm >= 30 },
  speed_50wpm: { title: "Speed Demon", icon: "speed-50wpm.png", condition: (s) => s.wpm >= 50 },
  perfect_accuracy: { title: "Perfect!", icon: "achievement-perfect.png", condition: (s) => s.accuracy === 1 },
  combo_10: { title: "Combo Master", icon: "icon-combo.png", condition: (s) => s.maxCombo >= 10 },
  streak_7days: { title: "Weekly Warrior", icon: "icon-streak.png", condition: (s) => s.daysStreak >= 7 }
};

// New: Profile Progress
const PROGRESS_TRACKING = {
  levelsCompleted: [],        // [1, 2, 3]
  currentLevel: 1,
  bestWPM: 0,
  bestAccuracy: 0,
  totalWordsTyped: 0,
  totalTime: 0,
  achievements: [],           // ['speed_10wpm', 'combo_10']
  petSelected: 'flower',      // 'flower' | 'sunflower' | 'dragon' | 'cat' | 'robot'
  petMood: 'happy'            // 'happy' | 'worried' | 'celebrating' | 'tired'
};
```

### Asset File Structure

```
magic-type-quest/
├── public/
│   └── assets/
│       ├── pets/
│       │   ├── flower.png
│       │   ├── sunflower.png
│       │   ├── dragon.png
│       │   ├── cat.png
│       │   └── robot.png
│       ├── badges/
│       │   ├── bronze.png
│       │   ├── silver.png
│       │   ├── gold.png
│       │   └── platinum.png
│       ├── levels/
│       │   ├── home-row.png
│       │   ├── top-row.png
│       │   ├── bottom-row.png
│       │   ├── capitals.png
│       │   ├── numbers.png
│       │   └── master.png
│       ├── guides/
│       │   ├── left-hand.png
│       │   ├── right-hand.png
│       │   └── keyboard-zones.png
│       ├── ui/
│       │   ├── progress-bar.png
│       │   ├── speedometer.png
│       │   ├── accuracy-meter.png
│       │   ├── celebration-banner.png
│       │   ├── encouragement-bubble.png
│       │   ├── locked.png
│       │   ├── completed.png
│       │   └── pause.png
│       ├── achievements/
│       │   ├── perfect.png
│       │   ├── speed-10.png
│       │   ├── speed-30.png
│       │   └── speed-50.png
│       ├── backgrounds/
│       │   ├── menu.png
│       │   ├── practice.png
│       │   └── gameplay.png
│       └── particles/
│           ├── sparkle.png
│           ├── heart.png
│           ├── gem.png
│           └── cloud.png
```

---

## Implementation Phases

### Phase 1: Asset Organization (1-2 hours)
**Goal**: Copy selected assets into project, set up asset loader

1. Create `public/assets/` directory structure
2. Copy best assets from generated set
3. Add asset preloading in `index.html`
4. Create `src/assets.js` - asset registry and loader

**Files to modify**:
- `index.html` - add asset preload links
- NEW: `src/assets.js` - asset registry
- NEW: `public/assets/` - all PNG files

**Risk**: Low - just adding files, no code changes to game logic

---

### Phase 2: Core Lesson System (4-6 hours)
**Goal**: Replace generic practice mode with 6 progressive levels

1. **Lesson Data Structure**
   - Define `LESSON_STRUCTURE` with keys, words, requirements
   - Map fingers to keys for guide display
   - Progression rules (complete level 1 to unlock 2)

2. **Lesson Selection Screen**
   - Grid of 6 level cards
   - Locked/completed/in-progress states
   - Level preview (keys taught, words, requirements)

3. **Practice Mode Enhancement**
   - Replace random letters with lesson-specific words
   - Add finger guide overlay (which finger for current key)
   - Show keyboard with active key highlighted
   - Track per-lesson accuracy and speed

4. **Level Completion Logic**
   - Detect when lesson requirements met
   - Award badge (bronze/silver/gold)
   - Unlock next level
   - Save progress to localStorage

**Files to modify**:
- `src/state.js` - add lesson state, progress tracking
- `src/main.js` - refactor practice mode, add lesson logic
- `styles.css` - lesson screen styles, finger guide overlay

**Risk**: Medium - touches core game logic, but existing modes stay intact

---

### Phase 3: Progress Tracking UI (3-4 hours)
**Goal**: Professional WPM/accuracy display with charts

1. **Speedometer Display**
   - Circular gauge showing current WPM
   - Color zones: slow (red), good (green), fast (purple)
   - Real-time update during gameplay

2. **Accuracy Meter**
   - Horizontal bar or circular gauge
   - Green zone for 90%+, yellow for 70-90%, red below 70%

3. **Session Stats Overlay**
   - Words typed, time elapsed, accuracy %
   - Best streak, current streak
   - Floating numbers on correct/wrong keystrokes

4. **Progress Bar**
   - Lesson completion percentage
   - Visual segments for each key learned

**Files to modify**:
- `src/main.js` - add stat tracking, display updates
- `styles.css` - gauge styles, overlay positions
- NEW: `src/stats.js` - WPM calculation, accuracy tracking

**Risk**: Low - additive feature, doesn't change core gameplay

---

### Phase 4: Achievement System (3-4 hours)
**Goal**: Motivational badges and certificates

1. **Achievement Registry**
   - Define all achievements with conditions
   - Icon paths, titles, descriptions

2. **Achievement Detection**
   - Check conditions after each word/lesson/session
   - Trigger unlock animation

3. **Badge Display**
   - Popup when achievement unlocked
   - Collection view (all badges, earned vs locked)

4. **Certificate Generation**
   - HTML template with player name, level, stats
   - Print-friendly layout
   - Optional: convert to PDF (html2canvas + jsPDF)

**Files to modify**:
- `src/state.js` - add achievements array
- `src/main.js` - add achievement checks
- `styles.css` - badge popup styles
- NEW: `src/achievements.js` - achievement engine

**Risk**: Low - mostly additive

---

### Phase 5: Visual Polish (4-6 hours)
**Goal**: Backgrounds, pet animations, celebrations

1. **Background Themes**
   - Menu: garden scene with floating islands
   - Practice: classroom with chalkboard
   - Gameplay: night sky with stars
   - CSS background-image with overlays

2. **Pet Mascot System**
   - Select from 5 pet options
   - Show pet image in corner (replacing emoji)
   - Pet reacts to game state (struggling, celebrating, etc.)
   - CSS animations: bounce, wobble, shake

3. **Celebration Effects**
   - Level complete: confetti particles (Canvas)
   - Achievement unlock: sparkle burst
   - Perfect word: floating "+10" text

4. **Encouragement System**
   - "You can do it!" bubble when struggling (3+ errors)
   - "Keep going!" at 50% progress
   - "Amazing!" for 5+ combo streak

**Files to modify**:
- `src/main.js` - add pet display, celebration triggers
- `styles.css` - background themes, pet animations
- `src/particles.js` - enhance particle system

**Risk**: Medium - visual changes but logic stays same

---

## Key Decisions

### Which Assets to Use?

**Pet Mascot**: Flower (original purple theme) or Dragon (unique, memorable)
- Recommendation: Start with flower, add dragon as unlockable

**Backgrounds**: Use generated scenes
- Menu: `bg-menu.png` (garden)
- Practice: `bg-practice.png` (classroom)  
- Gameplay: Keep current starry night (it's already working well)

**Finger Guide**: Generate SVG version for crisp scaling
- The PNG is good for now, but SVG would be sharper
- Consider: use CSS to create color-coded keyboard instead

### Technical Approach

**Lesson System**: 
- Option A: Inline all lesson data in JS (simple, no build changes)
- Option B: Load from JSON files (cleaner, but needs fetch)
- **Decision**: Option A - inline in `src/lessons.js`

**Progress Storage**:
- Use existing localStorage pattern (already in `src/state.js`)
- Extend profile object with lesson progress

**Asset Loading**:
- Put in `public/assets/` (Vite serves these statically)
- Reference as `/assets/pets/flower.png`
- Preload critical assets in `index.html`

### Performance Considerations

- Total asset size: ~15MB for all PNGs
- Optimize: compress PNGs with `oxipng` or `pngquant`
- Lazy load: non-critical assets (backgrounds, alternate pets)
- Preload: pet, UI elements, first lesson background

---

## Implementation Order

### Week 1: Foundation
1. **Day 1**: Phase 1 - Copy assets, set up registry
2. **Day 2-3**: Phase 2 - Lesson system (data + screen + logic)
3. **Day 4**: Phase 3 - Progress tracking (WPM/accuracy gauges)

### Week 2: Polish
4. **Day 5**: Phase 4 - Achievements (badges + certificates)
5. **Day 6-7**: Phase 5 - Visual polish (backgrounds, pet, celebrations)

### Testing Checklist
- [ ] All 6 levels load correctly
- [ ] Finger guide shows correct finger for each key
- [ ] Progress saves between sessions
- [ ] Badges unlock at correct thresholds
- [ ] Pet reacts to struggling/celebrating states
- [ ] Mobile responsive (all new screens)
- [ ] No console errors
- [ ] Performance: 60fps with particles

---

## Rollback Plan

If anything breaks:
1. Assets are in `public/assets/` - easy to remove
2. New code is additive (new files, new functions)
3. Original practice mode can be restored by switching function call
4. Game mode stays untouched (levels only affect practice)

## Success Metrics

- Kids complete at least 3 levels in first session
- 80%+ accuracy before level unlock
- Pet reactions trigger correctly (struggle detection works)
- Average session length increases to 10+ minutes
- Kids return for next lesson within 24 hours
