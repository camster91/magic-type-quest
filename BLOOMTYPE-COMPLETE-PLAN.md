# BLOOMTYPE - Complete Development Plan

## 🎯 Vision
A magical garden typing adventure where children learn proper touch typing through play. As players type words correctly, flowers bloom, pets celebrate, and gardens flourish. The game teaches finger placement through visual hints, color-coded keys, and progressive lessons embedded in each game level.

---

## 📋 PHASE 1: Core Game Engine (2-3 hours)

### 1.1 Game Loop Architecture
```
Game Loop (60fps)
├── Update Phase
│   ├── Process input
│   ├── Update word positions
│   ├── Check collisions
│   ├── Update particles
│   └── Check game state
└── Render Phase
    ├── Draw background/garden
    ├── Draw flowers
    ├── Draw words
    ├── Draw pet
    ├── Draw particles
    └── Draw UI overlay
```

### 1.2 Word System
- **Word Object**: `{ text, x, y, speed, isTarget, matched, glow, shake }`
- **Spawn System**: Words spawn at top, drift down at level-defined speed
- **Target System**: One word is "target" (highlighted with glow)
- **Input Matching**: Match keystrokes against target word character-by-character
- **Word Completion**: When target word fully typed, trigger celebration, spawn particle burst

### 1.3 Scoring & Progression
- **Base Score**: `word.length * 10`
- **Combo Multiplier**: `1 + (combo * 0.1)` (caps at 3x)
- **Level Bonus**: `+level * 5`
- **Health**: Start with 5 hearts, lose one when word hits bottom
- **Level Completion**: Complete `wordsPerLevel` words to advance

### 1.4 Input Handling
```javascript
// Pseudocode
onKeyDown(key) {
  if (key === targetWord[currentIndex]) {
    // Correct!
    currentIndex++
    showCorrectFeedback(key)
    if (currentIndex === targetWord.length) {
      completeWord()
    }
  } else {
    // Wrong
    showWrongFeedback(key)
    resetCombo()
  }
}
```

---

## 📋 PHASE 2: Lesson-Game Integration (3-4 hours)

### 2.1 Unified System
Each GAME level IS a LESSON:
- Level 1 = Home Row Basics
- Level 2 = Top Row
- Level 3 = Bottom Row
- Level 4 = All Letters Combined
- Level 5 = Capital Letters
- Level 6 = Numbers
- Level 7-10 = Speed & Mastery

### 2.2 Lesson Data Structure
```javascript
{
  id: 1,
  name: "Home Row 🌸",
  keys: ["a", "s", "d", "f", "j", "k", "l", ";"],
  fingerColors: { a: "#EF4444", ... },
  fingerLabels: { a: "Left Pinky", ... },
  words: ["dad", "sad", "ask", ...],
  speed: 0.4,
  requiredAccuracy: 0.80,
  requiredWPM: 5
}
```

### 2.3 Keyboard Teaching Overlay
- **Virtual Keyboard** displayed at bottom
- **Key highlighting**: Target key glows purple with pulse animation
- **Finger hints**: Shows which finger to use (color-coded)
- **Bubble prompts**: "Press A with LEFT PINKY 💋"

### 2.4 Progress Tracking
- Per-lesson stats: accuracy, WPM, words completed
- Level unlocking: Complete level N to unlock N+1
- Badge rewards: Bronze → Silver → Gold → Platinum
- Save progress to localStorage

---

## 📋 PHASE 3: Garden Growth System (2-3 hours)

### 3.1 Visual Garden
- **Background**: Magical garden scene (sky gradient + grass)
- **Flowers**: Grow at bottom of screen as words completed
- **Flower types**: Different colors/species based on level
- **Growth animation**: Flower "plants" with particle burst

### 3.2 Garden State
```javascript
gameState.garden = [
  { type: "flower", x: 100, y: 500, scale: 1, blooming: 0.8 },
  { type: "sunflower", x: 200, y: 520, scale: 0.9, blooming: 1 },
  ...
]
```

### 3.3 Flower Planting Logic
```javascript
onWordComplete(word) {
  // Add flower to garden
  const flowerX = calculateGardenPosition(garden.length)
  gameState.garden.push({
    type: getFlowerType(word),
    x: flowerX,
    y: canvas.height - 50 - Math.random() * 30,
    scale: 0.5 + Math.random() * 0.5,
    blooming: 0 // Start not bloomed
  })
  
  // Animate bloom
  animateFlowerBloom(flowerX)
  
  // Save to localStorage
  saveGarden()
}
```

### 3.4 Flower Drawing
- Draw each flower with proper z-order (back flowers behind front)
- Apply growth animation (scale from 0 to full)
- Add subtle sway animation when idle
- Different flower sprites: flower, sunflower, daisy, tulip, rose

---

## 📋 PHASE 4: Pet System (2-3 hours)

### 4.1 Pet Selection
- 8 pets available: flower, sunflower, dragon, cat, robot, bunny, panda, fox
- Default pet: flower
- Pet unlocks: Earn through achievements

### 4.2 Pet Emotions
| Emotion | Trigger | Animation | Bubble Text |
|---------|---------|-----------|-------------|
| Idle | Waiting | Gentle bounce | "Type the word!" |
| Happy | Correct letter | Jump | "Nice!" |
| Celebrate | Word complete | Spin + sparkles | "Yay!" |
| Fire | Combo 5+ | Fire effect | "🔥 On fire!" |
| Sad | Wrong letter | Shake head | "Try again..." |
| Hurt | Word missed | Frown | "Oh no!" |
| Dance | Level complete | Happy dance | "We did it!" |
| Love | Accuracy 100% | Hearts | "Perfect!" |

### 4.3 Pet Reaction Code
```javascript
function showPetReaction(type, data) {
  const pet = gameState.pet
  
  // Remove previous animation classes
  pet.element.classList.remove("bounce", "spin", "shake", "celebrate")
  
  // Add new animation
  switch(type) {
    case "correct":
      pet.element.classList.add("bounce")
      pet.bubble.show(data.emoji, data.text)
      break
    case "word_complete":
      pet.element.classList.add("celebrate")
      spawnParticles("sparkle", 10)
      break
    case "combo":
      pet.element.classList.add("fire")
      pet.bubble.show("🔥", "On fire!")
      break
  }
  
  // Clear animation after duration
  setTimeout(() => {
    pet.element.classList.remove("bounce", "spin", "shake", "celebrate", "fire")
    pet.bubble.hide()
  }, 1500)
}
```

---

## 📋 PHASE 5: Asset Generation (3-4 hours)

### 5.1 Imagen API Integration
**Model**: `imagen-4.0-generate-001`
**Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict`

### 5.2 Asset List (47 total)

#### Backgrounds (5) - 1920x1080
| Asset | Prompt | File |
|-------|--------|------|
| Main | Pixar-style magical garden, purple-pink sky, bokeh lights, grass area | new-theme-bg.png |
| Gameplay | Pixar-style gameplay scene, floating words, sparkles | gameplay.png |
| Practice | Pixar-style practice mode, clean purple gradient | practice.png |
| Menu | Pixar-style menu background, castle, stars | menu.png |
| Garden | Pixar-style garden scene, flowers, butterflies | realistic-garden.png |

#### Pets (8) - 512x512, transparent
| Asset | Prompt | File |
|-------|--------|------|
| Flower | Pixar-style cute flower, pink petals, big smile | flower.png |
| Sunflower | Pixar-style sunflower, yellow petals, happy | sunflower.png |
| Dragon | Pixar-style friendly dragon, purple, small wings | dragon.png |
| Cat | Pixar-style orange tabby cat, big eyes | cat.png |
| Robot | Pixar-style cute robot, blue, boxy | robot.png |
| Bunny | Pixar-style white bunny, pink ears | bunny.png |
| Panda | Pixar-style panda, big eyes | panda.png |
| Fox | Pixar-style orange fox, bushy tail | fox.png |

#### Flow ers (5) - 256x256, transparent
| Asset | Prompt | File |
|-------|--------|------|
| Flower | Pink flower, simple cute style | flower-sprite.png |
| Sunflower | Yellow sunflower | sunflower-sprite.png |
| Daisy | White daisy | daisy-sprite.png |
| Tulip | Red tulip | tulip-sprite.png |
| Rose | Red rose | rose-sprite.png |

#### Level Icons (6) - 512x512, transparent
| Asset | Prompt | File |
|-------|--------|------|
| Home Row | Keyboard home row ASDF JKL; | home-row.png |
| Top Row | Keyboard top row QWERTYUIOP | top-row.png |
| Bottom Row | Keyboard bottom row ZXCVBNM | bottom-row.png |
| Capitals | Capital letters with shift | capitals.png |
| Numbers | Number row 1234567890 | numbers.png |
| Master | Golden trophy | master.png |

#### Badges (4) - 256x256, transparent
| Asset | Prompt | File |
|-------|--------|------|
| Bronze | Shiny bronze medal with ribbon | bronze.png |
| Silver | Shiny silver medal with ribbon | silver.png |
| Gold | Shiny gold medal with ribbon | gold.png |
| Platinum | Shiny platinum medal, diamond sparkle | platinum.png |

#### Achievements (5) - 512x512, transparent
| Asset | Prompt | File |
|-------|--------|------|
| Combo | Fire flames, stars | combo.png |
| Perfect | Star burst, sparkles | perfect.png |
| Speed 10 | Lightning bolt | speed-10.png |
| Speed 30 | Lightning bolt, faster | speed-30.png |
| Speed 50 | Lightning bolt, blazing | speed-50.png |

#### Particles (6) - 256x256, transparent
| Asset | Prompt | File |
|-------|--------|------|
| Cloud | Fluffy white cloud | cloud.png |
| Finger Glow | Purple glow effect | finger-glow.png |
| Gem | Purple gem, sparkly | gem.png |
| Grass | Green grass tuft | grass-tuft.png |
| Heart | Pink heart, glowing | heart.png |
| Sparkle | Four-point star sparkle | sparkle.png |

#### UI Elements (10) - 512x512, transparent
| Asset | Prompt | File |
|-------|--------|------|
| Pause | Purple pause button | pause.png |
| Completed | Green checkmark circle | completed.png |
| Locked | Purple padlock | locked.png |
| Bubble | Speech bubble | encouragement-bubble.png |
| Badge Gold | Star badge | badge-gold.png |
| Accuracy | Accuracy gauge | accuracy-meter.png |
| Banner | Celebration banner | celebration-banner.png |
| Speedometer | Speedometer gauge | speedometer.png |
| Streak | Flame streak icon | streak.png |
| Progress | Progress bar | progress-bar.png |

### 5.3 Generation Script
```bash
# Use skill's batch_generate.py
cd /home/camst/.pi/skills/bloomtype-game
python3 batch_generate.py backgrounds
python3 batch_generate.py pets
python3 batch_generate.py levels
python3 batch_generate.py badges
python3 batch_generate.py achievements
python3 batch_generate.py particles
python3 batch_generate.py ui
```

### 5.4 Post-Processing
After generation, run background removal on all non-background images:
```bash
python3 /home/camst/.pi/skills/bloomtype-game/remove_backgrounds.py
```

---

## 📋 PHASE 6: UI/UX Design (2-3 hours)

### 6.1 Screen Layout
```
┌─────────────────────────────────────────┐
│  [HUD: Score, Level, Combo, Accuracy]   │  <- Top bar, z-index: 5
├─────────────────────────────────────────┤
│                                         │
│         ┌─────────────┐                 │
│         │ TARGET WORD│  <- Fixed top   │  <- z-index: 6
│         │   "hello"  │                 │
│         └─────────────┘                 │
│                                         │
│    ┌────────────────────────┐           │
│    │    WORD FALLING       │           │  <- Canvas
│    │         "cat"         │           │
│    └────────────────────────┘           │
│                                         │
│              🐰 (pet)                   │  <- Pet area
│                                         │
├─────────────────────────────────────────┤
│  💜💜💜💜💜  [Progress Bar]  (hearts)   │  <- Bottom bar
├─────────────────────────────────────────┤
│       [VIRTUAL KEYBOARD]                 │  <- Fixed bottom
│     Q W E R T Y U I O P                 │  <- z-index: 10
│      A S D F G H J K L                  │
│       Z X C V B N M                     │
│         [SPACE]                         │
└─────────────────────────────────────────┘
```

### 6.2 Z-Index System
```css
:root {
  --z-bg: 0;        /* Background layer */
  --z-canvas: 1;    /* Game canvas */
  --z-hud: 5;       /* HUD elements */
  --z-target: 6;    /* Target word display */
  --z-pet: 7;       /* Pet companion */
  --z-keyboard: 10; /* Virtual keyboard */
  --z-popup: 15;    /* Word popup, achievements */
  --z-overlay: 20;  /* Pause, game over, level complete */
  --z-tutorial: 100;
}
```

### 6.3 Keyboard Hint Display
```html
<div id="keyboard-hints" class="keyboard-hints">
  <div class="finger-hint" id="hint-left-pinky">💋 Left Pinky</div>
  <div class="finger-hint" id="hint-left-ring">💍 Left Ring</div>
  ...
</div>
```

When target key is displayed:
1. Highlight key on virtual keyboard (purple glow)
2. Show finger hint bubble above keyboard
3. Color-code by finger

### 6.4 Word Popup (Centered, No Overlap)
```css
.word-popup {
  position: fixed;
  top: 35%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: var(--z-popup);
}
```

### 6.5 Transitions & Animations
- **Screen transitions**: Fade in/out with 300ms duration
- **Word spawn**: Scale from 0 to 1 with bounce
- **Word complete**: Scale up + fade out + particle burst
- **Combo activation**: Pulse + glow effect
- **Level complete**: Confetti + celebration banner

---

## 📋 PHASE 7: Audio System (1-2 hours)

### 7.1 Sound Effects (Web Audio API)
| Sound | Trigger | Description |
|-------|---------|-------------|
| Correct | Correct keystroke | Short pleasant "ding" (sine wave) |
| Wrong | Wrong keystroke | Low buzz (sawtooth) |
| Word Complete | Full word typed | Ascending chime (C-E-G) |
| Combo | Combo milestones | Rising pitch based on combo |
| Heart Lost | Word hit bottom | Descending sad tone |
| Level Up | Level completion | Victory fanfare |
| Achievement | Badge earned | Celebration jingle |

### 7.2 Audio Implementation
```javascript
const sounds = {
  correct: () => playTone(880, 0.1, 'sine'),
  wrong: () => playTone(200, 0.15, 'sawtooth'),
  word: () => playChord([659, 784, 1047], 0.2),
  combo: () => playTone(440 + combo * 65, 0.1, 'triangle'),
  level: () => playSequence([523, 659, 784, 1047, 1318], 0.12),
  heart: () => playTone(523, 0.25, 'sine'),
};
```

### 7.3 Voice Narration (Web Speech API)
- Speak target word when it becomes active
- Encourage on mistakes: "Try the A key with your left pinky"
- Celebrate achievements

---

## 📋 PHASE 8: Polish & Visual Juice (2-3 hours)

### 8.1 Particle System
```javascript
particles.push({
  x, y,                    // Position
  vx, vy,                   // Velocity
  life: 1,                  // Lifetime (0-1)
  decay: 0.02,              // Fade rate
  color, size, type,        // Appearance
});
```

**Particle Types**:
- **Sparkle**: On word complete, gold/white stars
- **Confetti**: Level complete, multicolored rectangles
- **Heart**: Health lost, floating hearts
- **Glow**: Correct keystroke, small purple circles
- **Flower**: Garden growth, petals

### 8.2 Screen Shake
```javascript
function screenShake(intensity, duration) {
  const gameScreen = document.getElementById('game-screen');
  gameScreen.classList.add('shake');
  setTimeout(() => gameScreen.classList.remove('shake'), duration);
}
```

### 8.3 Glow Effects
```css
.correct-key {
  box-shadow: 0 0 15px #34D399, 0 0 30px #34D39966;
}

.target-key {
  animation: keyPulse 1s infinite;
  box-shadow: 0 0 20px #8B5CF6, 0 0 40px #8B5CF666;
}

@keyframes keyPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

### 8.4 Word Styling
- Target word: Purple glow + drop shadow
- Typed portion: Green underline
- Wrong keystroke: Red flash + shake

---

## 📋 PHASE 9: Testing & QA (2 hours)

### 9.1 Manual Testing Checklist
- [ ] Start game → tutorial shows → game starts
- [ ] Type correct letter → key highlights green → word progresses
- [ ] Type wrong letter → key highlights red → word shakes
- [ ] Complete word → word blooms away → flowers plant → pet celebrates
- [ ] Miss word → heart lost → pet sad
- [ ] Complete level → celebration → badge earned → next level
- [ ] Lose all hearts → game over → retry option
- [ ] Pause game → overlay shows → resume works
- [ ] Progress to next lesson → keyboard hints update
- [ ] Virtual keyboard highlights correct finger

### 9.2 Browser Testing
- Chrome (primary)
- Firefox
- Edge
- Safari

### 9.3 Mobile Testing
- Touch not supported (display message)
- Keyboard required

### 9.4 Performance Testing
- 60fps on modern browsers
- No memory leaks after 30 min play
- Assets load without flash

---

## 📋 PHASE 10: Deployment (1 hour)

### 10.1 Build Process
```bash
cd magic-type-quest
npm run build
cp -r public/assets dist/
```

### 10.2 Deploy to Coolify
```bash
rsync -avz --delete \
  -e "ssh -i ~/.ssh/coolify_new" \
  dist/ root@187.77.26.99:/var/www/bloomtype/
ssh -i ~/.ssh/coolify_new root@187.77.26.99 'docker restart bloomtype'
```

### 10.3 Verify Deployment
- [ ] HTTPS working
- [ ] Assets loading (background, pets, UI)
- [ ] Game starts
- [ ] Typing works
- [ ] Lessons progress
- [ ] Pet reacts
- [ ] Garden grows

---

## 📋 IMPLEMENTATION SCHEDULE

| Phase | Task | Time |
|-------|------|------|
| 1 | Core Game Engine | 3 hrs |
| 2 | Lesson-Game Integration | 4 hrs |
| 3 | Garden Growth System | 3 hrs |
| 4 | Pet System | 3 hrs |
| 5 | Asset Generation | 4 hrs |
| 6 | UI/UX Design | 3 hrs |
| 7 | Audio System | 2 hrs |
| 8 | Polish & Visual Juice | 3 hrs |
| 9 | Testing & QA | 2 hrs |
| 10 | Deployment | 1 hr |
| **TOTAL** | | **28 hrs** |

---

## 📋 FILE STRUCTURE

```
magic-type-quest/
├── src/
│   ├── main.js              # Entry point, init, game loop
│   ├── state.js              # Game state management
│   ├── lessons.js            # Legacy lesson data
│   ├── lessonLevels.js      # NEW: Unified lesson-game levels
│   ├── data.js              # Word lists, level configs
│   ├── audio.js             # Sound effects
│   ├── assets.js            # Asset registry
│   └── engine/
│       ├── gameLoop.js      # Core game loop
│       ├── wordSystem.js    # Word spawning, matching
│       ├── garden.js        # Garden growth system
│       ├── pet.js           # Pet reactions
│       └── particles.js     # Particle system
├── public/
│   └── assets/
│       ├── backgrounds/      # 5 background images
│       ├── pets/            # 8 pet sprites
│       ├── flowers/          # 5 flower sprites
│       ├── levels/          # 6 level icons
│       ├── badges/          # 4 badges
│       ├── achievements/    # 5 achievements
│       ├── particles/       # 6 particles
│       └── ui/              # 10 UI elements
├── styles.css               # All styles
├── index.html               # HTML structure
└── package.json
```

---

## 🎯 SUCCESS CRITERIA

1. **Educational**: Child learns proper touch typing with correct finger placement
2. **Engaging**: Visual rewards (garden growth, pet reactions, celebrations)
3. **Progressive**: Each level teaches a new skill set
4. **Polished**: Smooth animations, no UI overlap, professional look
5. **Complete**: All assets generated, no broken images, full functionality
6. **Deployed**: Working at https://bloomtype.ashbi.ca

---

**Ready to Build?** Let's start with Phase 1: Core Game Engine.
