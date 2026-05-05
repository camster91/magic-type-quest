# BloomType: Kid-Friendly Difficulty Adaptation

## Problem
The adaptive difficulty exists but:
1. Changes are invisible to the player
2. No emotional feedback from the pet
3. No audio cues for struggling/recovery
4. Changes are too gradual to notice

## Solution: "Pet's Encouragement System"

### 1. Struggle Detection (state.js)
Add to gameState:
```js
strugglingMode: false,
recentErrors: [],        // track last N keystrokes
confidenceLevel: 1,      // 0=struggling, 1=confident
```

### 2. Struggle Detection Logic (main.js)
```js
function updateConfidence() {
  // Count errors in last 10 keystrokes
  const recentErrors = gameState.recentErrors.slice(-10);
  const errorRate = recentErrors.length > 0 
    ? recentErrors.filter(e => e === 'error').length / recentErrors.length 
    : 0;
  
  // 3 consecutive errors = struggling
  if (errorRate > 0.5 && recentErrors.slice(-3).every(e => e === 'error')) {
    enterStrugglingMode();
  }
  // 3 consecutive correct = recovery
  else if (errorRate < 0.3 && recentErrors.slice(-3).every(e => e === 'correct')) {
    enterConfidentMode();
  }
}

function enterStrugglingMode() {
  if (gameState.strugglingMode) return;
  gameState.strugglingMode = true;
  gameState.confidenceLevel = 0;
  
  // Pet reaction
  showPetReaction("struggling");
  
  // Slow down words
  gameState.difficultyMod = Math.max(gameState.difficultyMod - 2, -3);
  
  // Visual cue - subtle purple glow around game area
  showEncouragementOverlay("You can do it! 💜");
}

function enterConfidentMode() {
  if (!gameState.strugglingMode) return;
  gameState.strugglingMode = false;
  gameState.confidenceLevel = 1;
  
  // Pet reaction
  showPetReaction("confident");
  
  // Restore speed
  gameState.difficultyMod = 0;
}
```

### 3. Pet Reactions (main.js)
```js
const petMoods = {
  struggling: { emoji: "🥺", msg: "You're doing great!", class: "worried" },
  confident: { emoji: "🌟", msg: "You're on fire!", class: "happy" },
  // ... existing reactions
};
```

### 4. Visual Feedback (CSS)
```css
.struggling-mode .game-area {
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.3);
  transition: box-shadow 0.5s ease;
}

.encouragement-overlay {
  position: fixed;
  bottom: 150px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #8B5CF6, #A78BFA);
  padding: 0.8rem 2rem;
  border-radius: 20px;
  color: white;
  font-weight: 700;
  animation: fadeInUp 0.5s ease;
}
```

### 5. Audio Integration (audio.js)
```js
export function playStruggleMode() {
  // Play gentle encouraging sound
  playSound('encourage');
}

export function playRecoveryMode() {
  // Play cheerful recovery sound
  playSound('yay');
}
```

## Implementation Order

1. [ ] Add struggling detection state
2. [ ] Implement struggle/recovery detection
3. [ ] Add pet mood changes
4. [ ] Add visual encouragement overlay
5. [ ] Add audio cues (optional)
6. [ ] Test with kids! 👶

## Files to Modify
- `src/state.js` - Add strugglingMode, confidenceLevel
- `src/main.js` - Add detection logic, pet reactions
- `styles.css` - Add encouragement overlay styles
- `src/audio.js` - (optional) Add encouragement sounds
