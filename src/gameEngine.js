/**
 * BloomType - Core Game Engine
 * A magical garden typing adventure for kids
 */
import { LESSON_LEVELS, getLessonByLevel, getFingerHint } from './lessonLevels.js';
import { gameState, loadProfile, saveProfile } from './state.js';
import { say, getChapter, getEvolutionStage, PET_NAME_DEFAULT } from './story.js';
import { checkAchievements as checkAchievementsNew } from './achievements.js';
import { evaluateQuests, bumpStreakIfToday } from './quests.js';
import { playAmbient, stopAmbient, audioCtx, initAudio } from './audio.js';
import { getWeakKeys } from './drills.js';
import { recordKeyPractice } from './spacedRep.js';
import { hexToRgba } from './utils.js';

// ===== CONSTANTS =====
const COLORS = {
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  accent: '#EC4899',
  success: '#34D399',
  danger: '#EF4444',
  warning: '#FBBF24',
};

// ===== TOUCH DETECTION =====
function isTouchDevice() {
  return (
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    (navigator.msMaxTouchPoints > 0)
  );
}

// ===== LESSON RESOLVER =====
function currentLesson() {
  if (gameState.drillLesson) return gameState.drillLesson;
  return getLessonByLevel(gameState.level);
}

// ===== AUDIO SYSTEM =====
// NOTE: initAudio is imported from audio.js — do NOT duplicate here

function playTone(frequency, duration, type = 'sine') {
  if (!audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

const sounds = {
  correct: () => playTone(880, 0.1, 'sine'),
  wrong: () => playTone(200, 0.15, 'sawtooth'),
  word: () => {
    [659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'sine'), i * 100);
    });
  },
  combo: () => playTone(440 + Math.min(gameState.combo, 8) * 65, 0.1, 'triangle'),
  level: () => {
    [523, 659, 784, 1047, 1318].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.25, 'sine'), i * 120);
    });
  },
  heart: () => playTone(523, 0.25, 'sine'),
};

// ===== WORD CLASS =====
class Word {
  constructor(text, speed) {
    this.text = text;
    this.speed = speed;
    this.x = 0;
    this.y = -50;
    this.isTarget = false;
    this.matched = 0;
    this.typedWidth = 0; // ⚡ Bolt: Cache measurement to avoid redundant ctx.measureText
    this.glow = 0;
    this.shake = 0;
    this.width = 0;
    this.height = 36;
    // Focus mechanic: 100 at spawn, decays to 0 as the word falls.
    // Higher focus at completion = higher score multiplier.
    this.focus = 100;
  }

  update(deltaTime) {
    // T15: in overlay mode, the word doesn't fall — it sits centered
    // while the kid types. No timer pressure, no missed-word penalty.
    if (typeof window !== 'undefined' && window.__bloomtypeT15Overlay) {
      // Park the word above the canvas so its isAtBottom() never fires
      this.y = -200;
      this.speed = 0;
      if (this.glow > 0) this.glow -= deltaTime * 3;
      if (this.shake > 0) this.shake -= deltaTime * 5;
      return;
    }
    this.y += this.speed * 60 * deltaTime;
    if (this.glow > 0) this.glow -= deltaTime * 3;
    if (this.shake > 0) this.shake -= deltaTime * 5;
    // Focus decays as the word falls. The groundY is ~220px from bottom;
    // once y crosses that, the word is "missed" and focus is 0.
    const groundY = gameState.canvasH - 220;
    if (groundY > 0) {
      this.focus = Math.max(0, Math.min(100, 100 * (1 - this.y / groundY)));
    }
  }

  /** Multiplier applied to base score on completion. 1.0 at full focus, 0.5 at half. */
  getScoreMultiplier() {
    return 0.5 + (this.focus / 100) * 0.5; // 0.5x to 1.0x
  }

  draw(ctx) {
    // T15: in overlay mode, the HTML .target-word shows the current word.
    // The canvas still tracks the word for game logic (completion, focus,
    // pet reactions) but we don't paint it on the canvas.
    if (typeof window !== 'undefined' && window.__bloomtypeT15Overlay) {
      return;
    }
    const shakeX = this.shake > 0 ? (Math.random() - 0.5) * 6 : 0;
    const x = this.x + shakeX;
    
    // ⚡ Optimization: Replaced expensive shadowBlur with layered rects for glow effect
    if (this.glow > 0 || this.isTarget) {
      const alphaBase = this.isTarget ? 0.8 : this.glow * 0.6;
      const glowColor = this.isTarget ? COLORS.success : COLORS.primary;

      // Outer glow layer
      ctx.fillStyle = hexToRgba(glowColor, alphaBase * 0.3);
      ctx.beginPath();
      ctx.roundRect(x - 16, this.y - this.height / 2 - 12, this.width + 32, this.height + 24, 20);
      ctx.fill();

      // Inner glow layer
      ctx.fillStyle = hexToRgba(glowColor, alphaBase * 0.5);
      ctx.beginPath();
      ctx.roundRect(x - 12, this.y - this.height / 2 - 8, this.width + 24, this.height + 16, 18);
      ctx.fill();
    }

    // Background pill — color reflects focus (green = high, orange = mid, red = low)
    // isTarget always wins (green) so the active word stays readable.
    let pillFill, pillStroke;
    if (this.isTarget) {
      pillFill = 'rgba(52, 211, 153, 0.35)';
      pillStroke = COLORS.success;
    } else {
      // Hue shifts: focus 100 -> green (120), focus 50 -> yellow (60), focus 0 -> red (0)
      const hue = Math.round((this.focus / 100) * 120);
      pillFill = `hsla(${hue}, 70%, 50%, 0.30)`;
      pillStroke = `hsla(${hue}, 70%, 70%, 0.8)`;
    }
    ctx.fillStyle = pillFill;
    ctx.strokeStyle = pillStroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 8, this.y - this.height/2 - 4, this.width + 16, this.height + 8, 16);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 26px Nunito, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, x + 10, this.y);

    // Typed progress underline
    if (this.matched > 0) {
      // ⚡ Bolt: Use cached typedWidth to save on ctx.measureText calls in the animation loop
      ctx.fillStyle = COLORS.success;
      ctx.fillRect(x + 10, this.y + 12, this.typedWidth, 5);
    }

    // Target indicator arrow
    if (this.isTarget) {
      ctx.fillStyle = COLORS.success;
      ctx.font = '14px Nunito';
      ctx.textAlign = 'center';
      ctx.fillText('▶', x + this.width / 2, this.y - this.height/2 - 12);
    }
  }

  isAtBottom() {
    return this.y > gameState.canvasH - 220;
  }
}

// ===== GAME STATE =====
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let animationId = null;
let lastFrameTime = 0;

function resizeCanvas() {
  if (!canvas.parentElement) return;
  const rect = canvas.parentElement.getBoundingClientRect();
  // Use visual viewport height on mobile (accounts for virtual keyboard)
  const vh = window.visualViewport ? window.visualViewport.height : rect.height;
  const vw = window.visualViewport ? window.visualViewport.width : rect.width;
  
  canvas.width = vw * window.devicePixelRatio;
  canvas.height = vh * window.devicePixelRatio;
  canvas.style.width = vw + 'px';
  canvas.style.height = vh + 'px';
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  gameState.canvasW = vw;
  gameState.canvasH = vh;
}

// ===== GAME LOOP =====
function gameLoop(timestamp) {
  if (gameState.screen !== 'game' || gameState.gameOver) {
    animationId = requestAnimationFrame(gameLoop);
    return;
  }

  if (gameState.paused) {
    animationId = requestAnimationFrame(gameLoop);
    return;
  }

  const deltaTime = lastFrameTime ? Math.min((timestamp - lastFrameTime) / 1000, 0.05) : 0.016;
  lastFrameTime = timestamp;
  gameState.currentTime = timestamp;

  // Clear canvas
  ctx.clearRect(0, 0, gameState.canvasW, gameState.canvasH);

  // T22: detect "target idle" — kid has an active target word but hasn't
  // pressed a key in 3.5s. Their combo is about to break and they're
  // disengaged. Switch the pet to the 'hurt' state (wilted/sad) with a
  // "Don't forget me!" bubble to nudge them back. The state reverts to
  // idle on next correct keystroke (handled in onCorrectKeystroke via
  // clearPetWorried).
  checkPetIdleWarning();

  // T19: in T15 overlay mode, the canvas is a quiet gradient backdrop.
  // No mushrooms, no forest, no vines, no falling particles. The word
  // (HTML overlay) and the pet (HTML overlay) are the only focal points.
  // The canvas still exists for animation continuity but draws nothing
  // that competes with them.
  if (typeof window !== 'undefined' && window.__bloomtypeT15Overlay) {
    drawQuietGradient();
    updateWords(deltaTime);
    // No drawWords (overlay), no drawPet (HTML pet), no particles.
    checkLevelComplete();
    animationId = requestAnimationFrame(gameLoop);
    return;
  }

  // Draw garden (parallax background + flowers)
  drawGarden();

  // Draw animated pet
  drawPet();

  // Update & draw words
  updateWords(deltaTime);
  drawWords();

  // Update & draw textured particles
  updateParticles(deltaTime);
  drawTexturedParticles();

  // Check level completion
  checkLevelComplete();

  animationId = requestAnimationFrame(gameLoop);
}

/** T19: flat dark gradient as the gameplay backdrop. The word (HTML) and
 *  pet (HTML) sit on top; nothing on the canvas competes with them. */
function drawQuietGradient() {
  const w = gameState.canvasW;
  const h = gameState.canvasH;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#1e1b4b');     // --bg-1
  grad.addColorStop(0.55, '#312e81');  // mid: indigo
  grad.addColorStop(1, '#0f0a3d');     // deep bottom
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function updateWords(deltaTime) {
  // Spawn new words — T15: cap at 1 active word for the "one word at a time" pedagogy.
  const lesson = currentLesson();
  const now = gameState.currentTime;
  const adaptiveSpawnRate = lesson.spawnRate / gameState.adaptiveSpeed;

  if (gameState.activeWords.length < 1 &&
      gameState.wordsSpawned < lesson.wordsPerLevel &&
      now - gameState.lastSpawn > adaptiveSpawnRate) {
    spawnWord();
    gameState.lastSpawn = now;
  }

  // Adaptive difficulty check every 5 seconds
  if (now - gameState.lastAdaptiveCheck > 5000) {
    gameState.lastAdaptiveCheck = now;
    const total = gameState.totalKeystrokes;
    const accuracy = total > 0 ? (gameState.correctKeystrokes / total) * 100 : 100;
    const wpm = gameState.levelWPM;
    
    if (accuracy < 70 && wpm < 10) {
      gameState.adaptiveSpeed = Math.max(0.5, gameState.adaptiveSpeed - 0.15);
    } else if (accuracy > 85 && wpm > 20) {
      gameState.adaptiveSpeed = Math.min(1.5, gameState.adaptiveSpeed + 0.1);
    }
  }

  // Update existing words
  for (let i = gameState.activeWords.length - 1; i >= 0; i--) {
    const word = gameState.activeWords[i];
    word.update(deltaTime);

    // Check if word hit bottom
    if (word.isAtBottom()) {
      if (word.isTarget) {
        loseHealth();
        gameState.targetWord = null;
        gameState.targetIndex = 0;
        updateTargetDisplay();
      }
      gameState.activeWords.splice(i, 1);
    }
  }

  // Set next word as target if no active target
  if (!gameState.targetWord && gameState.activeWords.length > 0) {
    const nextWord = gameState.activeWords.find(w => !w.isTarget) || gameState.activeWords[0];
    if (nextWord && !nextWord.isTarget) {
      nextWord.isTarget = true;
      gameState.targetWord = nextWord;
      gameState.targetIndex = 0;
      updateTargetDisplay();
      updateKeyboardHighlight();
      speakWord(nextWord.text);
    }
  }
}

function drawWords() {
  for (const word of gameState.activeWords) {
    word.draw(ctx);
  }
}

function spawnWord() {
  const lesson = currentLesson();
  const words = lesson.words;
  const text = words[Math.floor(Math.random() * words.length)];
  
  const word = new Word(text, lesson.speed * gameState.adaptiveSpeed);
  // Set font BEFORE measuring so pills fit words
  ctx.font = '700 26px Nunito, sans-serif';
  word.width = ctx.measureText(text).width + 40;
  
  // Find non-overlapping x position (try up to 20 times)
  const minGap = word.width + 30;
  let bestX = 80 + Math.random() * (gameState.canvasW - 200);
  for (let attempt = 0; attempt < 20; attempt++) {
    let ok = true;
    for (const w of gameState.activeWords) {
      if (Math.abs(bestX - w.x) < minGap) { ok = false; break; }
    }
    if (ok) break;
    bestX = 80 + Math.random() * (gameState.canvasW - 200);
  }
  word.x = bestX;
  
  // Varied y position so words don't stack vertically
  word.y = 100 + Math.random() * 100;
  
  gameState.activeWords.push(word);
  gameState.wordsSpawned++;
}

// ===== INPUT HANDLING =====
function handleKey(e) {
  if (gameState.screen !== 'game' || gameState.paused || gameState.gameOver) return;
  if (e.repeat) return;
  
  // Bail only on real text fields — #mobile-input is a hidden virtual-keyboard
  // sink on touch devices and must NOT block desktop keyboard input.
  const active = document.activeElement;
  const activeId = active?.id;
  if (activeId !== 'mobile-input' && (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA')) return;

  // Pause with Escape
  if (e.key === 'Escape') {
    togglePause();
    return;
  }

  // Space to skip word
  if (e.key === ' ') {
    e.preventDefault();
    skipWord();
    return;
  }

  processKeystroke(e.key, e.shiftKey);
}

/** Mobile virtual keyboard input handler. */
function handleMobileInput(e) {
  if (gameState.screen !== 'game' || gameState.paused || gameState.gameOver) return;
  
  const input = e.target;
  const data = e.data;
  
  if (e.inputType === 'deleteContentBackward') {
    // On mobile, backspace = skip word (no undo in this game)
    skipWord();
    input.value = '';
    return;
  }
  
  if (!data || data.length !== 1) {
    input.value = '';
    return;
  }
  
  // Process the character
  processKeystroke(data, false);
  
  // Clear so next char is fresh
  input.value = '';
}

/** Core keystroke processing — shared by desktop and mobile. */
function processKeystroke(rawKey, isShift) {
  const lesson = currentLesson();
  const requiresShift = lesson.requiresShift || false;
  
  let pressedKey = rawKey;
  
  // For shift-required levels (capitals), require shift + letter
  if (requiresShift) {
    if (rawKey.length === 1 && /[a-zA-Z]/.test(rawKey)) {
      if (!isShift) {
        onWrongKeystroke(pressedKey.toLowerCase());
        showShiftHint();
        return;
      }
      pressedKey = rawKey.toUpperCase();
    }
  } else {
    // Normal levels — lowercase only
    if (rawKey.length !== 1 || !/[a-z0-9]/.test(rawKey)) return;
    pressedKey = rawKey.toLowerCase();
  }

  gameState.totalKeystrokes++;

  // No target? Try to catch a word
  if (!gameState.targetWord) {
    const caught = gameState.activeWords.find(w => {
      const firstChar = requiresShift ? w.text[0] : w.text[0].toLowerCase();
      return firstChar === pressedKey && !w.isTarget;
    });
    if (caught) {
      caught.isTarget = true;
      caught.matched = 1;
      // ⚡ Bolt: Update cached typedWidth when matched changes
      ctx.font = '700 26px Nunito, sans-serif';
      caught.typedWidth = ctx.measureText(caught.text.slice(0, 1)).width;
      gameState.targetWord = caught;
      gameState.targetIndex = 1;
      gameState.correctKeystrokes++;
      caught.glow = 1;
      onCorrectKeystroke(pressedKey);
    } else {
      onWrongKeystroke(pressedKey);
    }
    return;
  }

  // Match against target
  const expected = gameState.targetWord.text[gameState.targetIndex];
  if (pressedKey === expected) {
    // Correct!
    gameState.targetIndex++;
    gameState.targetWord.matched = gameState.targetIndex;
    // ⚡ Bolt: Update cached typedWidth when matched changes
    ctx.font = '700 26px Nunito, sans-serif';
    gameState.targetWord.typedWidth = ctx.measureText(gameState.targetWord.text.slice(0, gameState.targetIndex)).width;
    gameState.correctKeystrokes++;
    gameState.targetWord.glow = 1;
    onCorrectKeystroke(pressedKey);

    // Word complete?
    if (gameState.targetIndex >= gameState.targetWord.text.length) {
      completeWord();
    } else {
      updateTargetDisplay();
      updateKeyboardHighlight();
    }
  } else {
    // Wrong!
    onWrongKeystroke(pressedKey);
  }
}

function showShiftHint() {
  const hint = document.getElementById('shift-hint');
  if (hint) {
    hint.classList.remove('hidden');
    hint.textContent = 'Hold SHIFT for capital letters!';
    setTimeout(() => hint.classList.add('hidden'), 1500);
  }
}

function onCorrectKeystroke(key) {
  // Track per-key accuracy
  const k = key.toLowerCase();
  if (!gameState.keyAccuracy[k]) gameState.keyAccuracy[k] = { correct: 0, wrong: 0 };
  gameState.keyAccuracy[k].correct++;

  // Spaced repetition tracking
  recordKeyPractice(gameState.profile, k, true);

  sounds.correct();
  showKeyFeedback(key, true);
  // T26: tactile feedback on every keystroke — pressed key glows + scales
  // for 200ms (covers ALL keys, not just the target), target word pulses
  // green, +1 floater rises above the score.
  pulsePressedKey(key);
  pulseTargetWord();
  showPlusOneFloater();
  highlightTargetKey(gameState.targetWord?.text?.[gameState.targetIndex]);
  updateWPM();

  // T22: per-keystroke pet pulse. The .correct class triggers a 350ms
  // brightness+scale flash on the pet face. We don't swap pet state on
  // every keystroke (would be too chaotic) — the state swaps still happen
  // on word_complete / loseHealth via showPetReaction. The pulse is
  // removed/restarted by toggling the class off then on.
  pulsePetFace('correct');
  // T22: cancel any active "worried" reaction and reset the idle timer —
  // the kid is back on track.
  lastCorrectKeystrokeAt = performance.now();
  clearPetWorried();
}

function onWrongKeystroke(key) {
  // Track per-key accuracy
  const k = key.toLowerCase();
  if (!gameState.keyAccuracy[k]) gameState.keyAccuracy[k] = { correct: 0, wrong: 0 };
  gameState.keyAccuracy[k].wrong++;

  // Spaced repetition tracking
  recordKeyPractice(gameState.profile, k, false);

  sounds.wrong();
  showKeyFeedback(key, false);
  // T26: pressed-pulse on the wrong key + a sharper 200ms red flash so the
  // kid feels a "nope" without it reading as punishment.
  pulsePressedKey(key);
  flashWrongKey(key);
  gameState.combo = 0;
  updateCombo();
  if (gameState.targetWord) {
    gameState.targetWord.shake = 1;
  }
  updateHearts();
  updateWPM();

  // Screen shake on wrong answer
  document.body.classList.add('screen-shake');
  setTimeout(() => document.body.classList.remove('screen-shake'), 400);

  // T22: pet shake + short "Try again!" bubble. Held briefly so the kid
  // sees the pet react, then the bubble clears itself after 900ms (shorter
  // than showPetReaction's 2200ms default — wrong-key feedback should be
  // quick so it doesn't pile up if the kid is mistyping).
  pulsePetFace('wrong');
  showPetBubble('Try again!', 900);
  // T22: a wrong key still proves the kid is present. Reset the idle
  // timer so the "Don't forget me!" bubble doesn't fire immediately after.
  lastCorrectKeystrokeAt = performance.now();
  clearPetWorried();
}

/** T22: toggle a one-shot animation class on the gameplay pet face.
 *  We re-trigger the animation by removing the class, forcing a reflow,
 *  and re-adding it — the standard CSS animation-restart pattern. */
function pulsePetFace(cls) {
  const petFace = document.getElementById('pet-img');
  if (!petFace) return;
  petFace.classList.remove('correct', 'wrong', 'celebrate');
  // Force reflow so the next add re-fires the animation
  // eslint-disable-next-line no-unused-expressions
  void petFace.offsetWidth;
  petFace.classList.add(cls);
  setTimeout(() => petFace.classList.remove(cls), 500);
}

/** T22: show a short speech bubble above the pet without swapping the
 *  pet state. Used for per-keystroke feedback (Try again!, Great!) where
 *  the bubble text changes faster than the 2200ms timer in showPetReaction. */
function showPetBubble(text, duration = 2200) {
  const bubbleEl = document.getElementById('pet-bubble');
  if (!bubbleEl) return;
  bubbleEl.textContent = text;
  bubbleEl.classList.add('visible');
  // Reuse the same fade timer shape as showPetReaction so the bubble
  // doesn't stack if multiple pulses fire close together.
  if (bubbleEl._hideTimer) clearTimeout(bubbleEl._hideTimer);
  bubbleEl._hideTimer = setTimeout(() => bubbleEl.classList.remove('visible'), duration);
}

function updateWPM() {
  if (!gameState.levelStartTime) return;
  const elapsedMin = (gameState.currentTime - gameState.levelStartTime) / 60000;
  if (elapsedMin < 0.01) return;
  
  // WPM = (characters / 5) / minutes
  const chars = gameState.correctKeystrokes;
  gameState.levelWPM = Math.round((chars / 5) / elapsedMin);
  
  // Accuracy
  const total = gameState.totalKeystrokes;
  gameState.levelAccuracy = total > 0 ? Math.round((gameState.correctKeystrokes / total) * 100) : 100;
  
  const wpmEl = document.getElementById('wpm');
  if (wpmEl) wpmEl.textContent = gameState.levelWPM;
}

function completeWord() {
  const word = gameState.targetWord;
  if (!word) return;
  
  // Effects
  sounds.word();
  spawnParticles(word.x + word.width/2, word.y, 15);
  
  // Score — base × focus multiplier (0.5x to 1.0x) × (1 + combo/10)
  const focusMultiplier = word.getScoreMultiplier();
  const baseScore = word.text.length * 10;
  const focusBonus = Math.round(baseScore * (focusMultiplier - 0.5));
  const comboBonus = gameState.combo * 5;
  const levelBonus = gameState.level * 2;
  const totalPoints = baseScore + focusBonus + comboBonus + levelBonus;
  gameState.score += totalPoints;
  gameState.totalFocusBonus = (gameState.totalFocusBonus || 0) + focusBonus;
  gameState.lastFocus = Math.round(word.focus);
  
  // Show score popup (with focus indicator if bonus was earned)
  showScorePopup(totalPoints, word.x + word.width/2, word.y);
  if (focusBonus > 0) {
    setTimeout(() => showScorePopup(
      `+${focusBonus} focus`,
      word.x + word.width/2, word.y - 40
    ), 200);
  }
  
  // Show word popup
  showWordPopup(word.text);
  
  // Combo
  gameState.combo++;
  gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);
  if (gameState.combo >= 2) sounds.combo();
  // T26: COMBO x5 / x10 / x15 milestone callout floats up for 800ms.
  showComboFloater(gameState.combo);
  
  // Stats
  gameState.wordsTyped++;
  gameState.wordsCompleted++;
  
  // Check achievements
  checkAchievements();
  
  // Pet reaction — T22 acceptance: each state must be visually distinct.
  // T22 fix: the 'fire' PNG reads as defeated/faded, not celebratory, so
  // combo-5 now uses the 'celebrate' state (sparkles, open mouth, raised
  // arms). Word completion under combo-5 still bumps the bubble text so
  // the kid still gets the milestone callout.
  if (gameState.combo >= 5) {
    showPetReaction('celebrate', `🔥 ${gameState.combo} Combo!`);
  } else {
    showPetReaction('happy');
  }

  // F1 Daily Moment: end the session if wordsTarget is hit
  if (gameState.dailyMoment?.active &&
      gameState.wordsCompleted >= (gameState.dailyMoment.wordsTarget || 12)) {
    // defer to the next tick so this completeWord() finishes cleanly
    setTimeout(() => endDailyMoment({ reason: 'wordsTarget' }), 0);
  }
  
  // Plant flower in garden (session + persistent)
  const types = ['flower', 'sunflower', 'daisy', 'tulip', 'rose'];
  const flowerType = types[Math.floor(Math.random() * types.length)];
  const groundY = gameState.canvasH - 175;
  const flowerX = Math.max(60, Math.min(gameState.canvasW - 60, word.x));
  const flowerData = {
    type: flowerType,
    x: flowerX,
    y: groundY,
    scale: 0.5 + Math.random() * 0.5,
    bloomProgress: 1,
    plantedAt: new Date().toISOString(),
    level: gameState.level,
    word: word.text,
  };
  gameState.garden.push(flowerData);
  if (!gameState.profile.garden) gameState.profile.garden = [];
  gameState.profile.garden.push(flowerData);
  saveProfile();
  
  // Remove word
  const idx = gameState.activeWords.indexOf(word);
  if (idx >= 0) gameState.activeWords.splice(idx, 1);
  
  // Reset target
  gameState.targetWord = null;
  gameState.targetIndex = 0;
  updateTargetDisplay();
  updateKeyboardHighlight();
  
  // Update UI
  updateHUD();
}

function skipWord() {
  if (!gameState.targetWord) return;
  
  gameState.skipsUsed = (gameState.skipsUsed || 0) + 1;
  
  const idx = gameState.activeWords.indexOf(gameState.targetWord);
  if (idx >= 0) gameState.activeWords.splice(idx, 1);
  
  gameState.targetWord.isTarget = false;
  gameState.targetWord = null;
  gameState.targetIndex = 0;
  gameState.combo = 0;
  
  updateTargetDisplay();
  updateKeyboardHighlight();
  updateCombo();
}

function loseHealth() {
  // F1 Daily Moment: no game-over, no health loss. Words just disappear.
  if (gameState.dailyMoment?.active) {
    if (gameState.targetWord) {
      const idx = gameState.activeWords.indexOf(gameState.targetWord);
      if (idx >= 0) gameState.activeWords.splice(idx, 1);
      gameState.targetWord = null;
      gameState.targetIndex = 0;
      updateTargetDisplay();
      updateKeyboardHighlight();
    }
    return;
  }

  gameState.health--;
  gameState.combo = 0;
  sounds.heart();
  spawnParticles(gameState.canvasW/2, gameState.canvasH - 100, 15, COLORS.danger);
  showPetReaction('hurt');
  updateHearts();
  updateCombo();

  if (gameState.health <= 0) {
    gameOver();
  }
}

function gameOver() {
  gameState.gameOver = true;
  cancelAnimationFrame(animationId);
  stopAmbient();
  gameState.drillLesson = null;
  saveProfile();
  showGameOver();
}

// ===== UI UPDATES =====
function updateHUD() {
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const accuracyEl = document.getElementById('accuracy');

  if (scoreEl) scoreEl.textContent = gameState.score;
  if (levelEl) levelEl.textContent = gameState.level;

  if (accuracyEl) {
    const accuracy = gameState.totalKeystrokes > 0
      ? Math.round((gameState.correctKeystrokes / gameState.totalKeystrokes) * 100)
      : 100;
    accuracyEl.textContent = accuracy + '%';
  }

  // Focus mechanic: show the last focus score (the multiplier indicator)
  const focusScoreEl = document.getElementById('focus-score');
  if (focusScoreEl) {
    const lastFocus = gameState.lastFocus;
    focusScoreEl.textContent = (typeof lastFocus === 'number') ? lastFocus : 100;
    // Color the focus score green for high, red for low
    const focusDisplay = document.getElementById('focus-display');
    if (focusDisplay && typeof lastFocus === 'number') {
      const hue = Math.round((lastFocus / 100) * 120);
      focusDisplay.style.color = `hsl(${hue}, 80%, 45%)`;
    }
  }

  // T30: live gameplay HUD pill — WPM, accuracy, words-done.
  // The pill is the only new on-screen element; the existing
  // score/level/wpm/focus nodes stay display:none (T19 decision).
  const liveWpmEl = document.getElementById('live-wpm');
  const liveAccEl = document.getElementById('live-accuracy');
  const liveWordsEl = document.getElementById('live-words');
  const liveWordsTargetEl = document.getElementById('live-words-target');
  if (liveWpmEl) liveWpmEl.textContent = gameState.levelWPM || 0;
  if (liveAccEl) {
    const acc = gameState.totalKeystrokes > 0
      ? Math.round((gameState.correctKeystrokes / gameState.totalKeystrokes) * 100)
      : 100;
    liveAccEl.textContent = acc;
  }
  if (liveWordsEl) liveWordsEl.textContent = gameState.wordsCompleted || 0;
  if (liveWordsTargetEl) {
    // Daily Moment: 12-word target. Lesson play: wordsPerLevel. Fall back to 5.
    let target = 5;
    if (gameState.mode === 'dailyMoment' || gameState.dailyMoment?.active) {
      target = gameState.dailyMoment?.wordsTarget || 12;
    } else {
      const lesson = currentLesson();
      if (lesson && lesson.wordsPerLevel) target = lesson.wordsPerLevel;
    }
    liveWordsTargetEl.textContent = target;
    // T30: also update the inline progress bar
    const fillEl = document.getElementById('live-progress-fill');
    if (fillEl) {
      const pct = target > 0 ? Math.min(100, ((gameState.wordsCompleted || 0) / target) * 100) : 0;
      fillEl.style.width = pct + '%';
    }
  }

  updateCombo();
  updateProgressBar();
}

function updateCombo() {
  const comboEl = document.getElementById('combo-count');
  const comboDisplay = document.getElementById('combo-display');
  if (!comboEl || !comboDisplay) return;
  
  comboEl.textContent = gameState.combo;
  
  const hasCombo = gameState.combo >= 2;
  comboDisplay.classList.toggle('active', hasCombo);
  
  if (hasCombo) {
    const color = gameState.combo >= 5 ? COLORS.accent : COLORS.warning;
    comboDisplay.style.color = color;
  }
}

function updateHearts() {
  const lesson = currentLesson();
  const maxHearts = lesson.health || 5;
  for (let i = 1; i <= 5; i++) {
    const heart = document.getElementById(`heart-${i}`);
    if (!heart) continue;
    const show = i <= maxHearts;
    heart.style.display = show ? '' : 'none';
    if (show) {
      heart.textContent = i <= gameState.health ? '❤' : '♡';
      heart.classList.toggle('lost', i > gameState.health);
    }
  }
}

function updateProgressBar() {
  const fillEl = document.getElementById('level-progress-fill');
  if (!fillEl) return;
  const lesson = currentLesson();
  const pct = lesson.wordsPerLevel > 0 
    ? (gameState.wordsCompleted / lesson.wordsPerLevel) * 100 
    : 0;
  fillEl.style.width = Math.min(pct, 100) + '%';

  const barEl = document.getElementById('level-progress-bar');
  if (barEl) {
    barEl.setAttribute('aria-valuenow', Math.round(Math.min(pct, 100)));
  }
}

function updateTargetDisplay() {
  const targetWord = document.getElementById('target-word');
  const targetTyped = document.getElementById('target-typed');
  const fingerHint = document.getElementById('finger-hint');
  const fingerHintText = document.getElementById('finger-hint-text');
  const fingerHintArrow = document.getElementById('finger-hint-arrow');

  if (!targetWord) return;

  if (gameState.targetWord) {
    // T15: render the word as spans with per-character state (typed/next/finger-zone)
    const word = gameState.targetWord.text || '';
    const typed = gameState.targetIndex || 0;
    const lower = word.toLowerCase();
    let html = '';
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      const lowerCh = lower[i];
      const isTyped = i < typed;
      const isNext = i === typed;
      // Finger zone: left if a/s/d/f/g/q/w/e/r/t/z/x/c/v/b, right otherwise
      const isLeft = 'asdfgqwertzxcvb'.includes(lowerCh);
      const zoneClass = isNext ? (isLeft ? 'finger-left' : 'finger-right') : '';
      const stateClass = isTyped ? 'typed' : (isNext ? 'next' : '');
      html += `<span class="tw-char ${stateClass} ${zoneClass}">${ch}</span>`;
    }
    targetWord.innerHTML = html;

    if (targetTyped) targetTyped.textContent = word.slice(0, typed);

    // Finger hint under the word
    if (fingerHint && fingerHintText) {
      const nextCh = lower[typed];
      const isLeft = 'asdfgqwertzxcvb'.includes(nextCh);
      if (nextCh) {
        const hint = getFingerHint(nextCh);
        const label = hint ? hint.label : (isLeft ? 'left hand' : 'right hand');
        fingerHintText.textContent = `Use your ${label}`;
        if (fingerHintArrow) fingerHintArrow.textContent = isLeft ? '👈' : '👉';
        fingerHint.classList.remove('hidden');
      } else {
        fingerHint.classList.add('hidden');
      }
    }
  } else {
    targetWord.innerHTML = '';
    if (targetTyped) targetTyped.textContent = '';
    if (fingerHint) fingerHint.classList.add('hidden');
  }
}

function updateKeyboardHighlight() {
  const nextChar = gameState.targetWord?.text?.[gameState.targetIndex];
  highlightTargetKey(nextChar);
}

// ===== KEYBOARD HIGHLIGHT =====
export function highlightTargetKey(char) {
  // T19: there are TWO keyboards on the page (practice + game). querySelector
  // returned only the FIRST match, so the practice key lit up while the game
  // key stayed dark. Use querySelectorAll so both keyboards stay in sync.
  document.querySelectorAll('.key').forEach(k => k.classList.remove('target'));

  if (!char) return;

  const lower = char.toLowerCase();
  const keyEls = document.querySelectorAll(`.key[data-key="${lower}"]`);
  keyEls.forEach(keyEl => {
    keyEl.classList.add('target');
    // Only scrollIntoView the game keyboard (the visible one during play).
    // Practice keyboard is hidden so scrolling it does nothing useful.
    if (keyEl.closest('#virtual-keyboard-game')) {
      keyEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  // Show finger hint
  const hint = getFingerHint(char);
  if (hint) {
    showFingerHint(hint.label, hint.color);
  }
}

function showFingerHint(text, color) {
  const hintEl = document.getElementById('finger-hint');
  if (hintEl) {
    hintEl.textContent = text;
    hintEl.style.color = color;
    hintEl.style.display = 'block';
  }
}

export function showKeyFeedback(key, correct) {
  const keyEl = document.querySelector(`.key[data-key="${key.toLowerCase()}"]`);
  if (keyEl) {
    keyEl.classList.add(correct ? 'correct' : 'wrong');
    setTimeout(() => keyEl.classList.remove('correct', 'wrong'), 300);
  }
}

// ===== T26: PER-KEYPRESS FEEDBACK =====
// On every keystroke (correct or wrong) the pressed key gets a 200ms
// glow + 1.1x scale, on top of the existing color tint from .key.correct /
// .key.wrong. The .pressed class triggers the CSS animation; we remove it
// after 200ms so the key returns to its resting state. Both the practice
// keyboard and the game keyboard light up because we querySelectorAll.
function pulsePressedKey(key) {
  if (!key) return;
  const els = document.querySelectorAll(`.key[data-key="${key.toLowerCase()}"]`);
  els.forEach(el => {
    el.classList.remove('pressed');
    // Force reflow so re-adding the class re-fires the animation.
    void el.offsetWidth;
    el.classList.add('pressed');
    setTimeout(() => el.classList.remove('pressed'), 200);
  });
}

// Brief pulse on the target word card (canvas word's `glow` is already
// driven by Word.update). We just bump it for 100ms so the word brightens
// and the green glow blob behind it pulses.
function pulseTargetWord() {
  if (gameState.targetWord) {
    gameState.targetWord.glow = Math.max(gameState.targetWord.glow, 1.0);
  }
}

// Brief red flash on the wrong key (200ms) — different from .wrong which
// is a 300ms color tint. The flash is a stronger "nope" cue.
function flashWrongKey(key) {
  if (!key) return;
  const els = document.querySelectorAll(`.key[data-key="${key.toLowerCase()}"]`);
  els.forEach(el => {
    el.classList.remove('flash-wrong');
    void el.offsetWidth;
    el.classList.add('flash-wrong');
    setTimeout(() => el.classList.remove('flash-wrong'), 200);
  });
}

// "+1" floater above the target word card. T19 stripped the score HUD
// (`.hud-score { display: none }`) for the one-word pedagogy, so we can't
// anchor to #score — instead we anchor to .target-word, which is the single
// thing the kid is looking at. Floats up 32px and fades out in 800ms.
function showPlusOneFloater() {
  const el = document.createElement('div');
  el.className = 'plus-one-floater';
  el.textContent = '+1';
  const target = document.querySelector('.target-word') || document.getElementById('score');
  if (target) {
    const rect = target.getBoundingClientRect();
    el.style.left = (rect.left + rect.width / 2) + 'px';
    el.style.top  = (rect.top - 4) + 'px';
  } else {
    el.style.left = '50%';
    el.style.top  = '30%';
  }
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

// Combo milestone callout. Fires at combos 5, 10, 15 — matches the brief.
const COMBO_MILESTONES = new Set([5, 10, 15]);
function showComboFloater(combo) {
  if (!COMBO_MILESTONES.has(combo)) return;
  const el = document.createElement('div');
  el.className = 'combo-floater';
  el.textContent = `COMBO x${combo}! 🔥`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

// Soft pink 300ms screen flash on level complete — replaces the existing
// white 0.8s flash. Pink (var(--accent)) reads as celebratory, not jarring.
function showLevelFlash() {
  const flash = document.createElement('div');
  flash.className = 'level-flash';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 320);
}

// ===== WORD POPUP =====
function showWordPopup(word) {
  const popup = document.getElementById('word-popup');
  const emojiEl = document.getElementById('word-popup-emoji');
  const textEl = document.getElementById('word-popup-text');
  if (!popup || !emojiEl || !textEl) return;
  
  const emojis = {
    flower: '🌸', sunflower: '🌻', cat: '🐱', dog: '🐶', sun: '☀️',
    star: '⭐', moon: '🌙', tree: '🌳', bird: '🐦', rose: '🌹',
    heart: '❤️', fish: '🐟', ball: '⚽', car: '🚗', book: '📚'
  };
  emojiEl.textContent = emojis[word.toLowerCase()] || '✨';
  textEl.textContent = word;
  popup.classList.remove('hidden');
  
  setTimeout(() => popup.classList.add('hidden'), 1200);
}

// ===== SCORE POPUP =====
function showScorePopup(points, x, y) {
  const popup = document.createElement('div');
  popup.textContent = `+${points}`;
  popup.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    color: #FFD700;
    font-family: 'Fredoka One', cursive;
    font-size: 1.8rem;
    font-weight: 800;
    text-shadow: 0 0 20px rgba(255,215,0,0.6);
    z-index: 25;
    pointer-events: none;
    animation: scoreFloat 1s ease-out forwards;
  `;
  document.body.appendChild(popup);
  
  setTimeout(() => popup.remove(), 1000);
}

// ===== PET REACTIONS =====
import { PET_EMOJI_TO_NAME, getPetPath, PET_STATES, PET_NAME_LIST } from './assets.js';

let petCurrentState = 'idle';
// T22: timestamp of the last correct keystroke, used by the idle warning
// detector. Initialized when the level starts so a kid who joins late
// doesn't immediately see the "Don't forget me!" bubble.
let lastCorrectKeystrokeAt = 0;
let petIdleWarningActive = false;
const PET_IDLE_WARN_MS = 3500;

function getPetImage(state = petCurrentState) {
  const avatar = gameState.profile?.avatar || '🌸';
  return getPetPath(avatar, state);
}

function setPetImage() {
  const petImg = document.getElementById('pet-img');
  if (petImg) {
    petImg.src = getPetImage();
    const avatar = gameState.profile?.avatar || '🌸';
    const names = { '🌸': 'Flower', '🌻': 'Sunflower', '🐉': 'Dragon', '🐱': 'Cat', '🤖': 'Robot', '🐰': 'Bunny', '🐼': 'Panda', '🦊': 'Fox', '🦉': 'Owl', '🐶': 'Puppy' };
    petImg.alt = (names[avatar] || 'Flower') + ' Pet';
  }
}

function showPetReaction(type, text = '') {
  const bubbleEl = document.getElementById('pet-bubble');
  const evolution = getEvolutionStage(gameState.level || 1);

  // Map reaction type -> pet state
  let newState;
  switch(type) {
    case 'happy':
    case 'correct':
      newState = 'happy';
      break;
    case 'fire':
      newState = 'fire';
      break;
    case 'hurt':
    case 'wrong':
      newState = 'hurt';
      break;
    case 'celebrate':
    case 'levelComplete':
      newState = 'celebrate';
      break;
    case 'idle':
    default:
      newState = 'idle';
  }

  // Update state and refresh DOM image (menu avatar)
  petCurrentState = newState;
  setPetImage();

  // Set pet animation frame (in-canvas pet)
  setPetFrame(newState);
  
  if (!bubbleEl) return;
  
  // Use story personality lines if no custom text provided
  if (!text) {
    switch(type) {
      case 'happy':
      case 'correct':
        text = say('correct');
        break;
      case 'fire':
        text = say('combo5');
        break;
      case 'hurt':
      case 'wrong':
        text = say('wrong');
        break;
      case 'celebrate':
      case 'levelComplete':
        text = say('levelComplete');
        break;
      case 'encouragement':
        text = say('encouragement');
        break;
      case 'idle':
      default:
        text = say('idle');
    }
  }
  
  bubbleEl.textContent = text || `${PET_NAME_DEFAULT} says: Type!`;
  
  if (bubbleEl.textContent) {
    bubbleEl.classList.add('visible');
    setTimeout(() => bubbleEl.classList.remove('visible'), 2200);
  }

  setTimeout(() => {
    setPetFrame('idle');
  }, 2200);
}

/** T22: detect when the kid is idle with a target word on screen. Their
 *  combo is about to break and they may have lost focus. Switch the pet
 *  to the 'hurt' state (wilted/sad) with a "Don't forget me!" bubble
 *  until the next correct keystroke clears it. Runs every frame from
 *  the game loop. */
function checkPetIdleWarning() {
  // Skip if the game is paused/over or the level is complete — the pet
  // shouldn't nag during the celebration overlay.
  if (gameState.paused || gameState.gameOver || gameState.levelComplete) {
    return;
  }
  // Lazy init: on the first frame after a level start, lastCorrectKeystrokeAt
  // is still 0 from the previous level (or first boot). Set it to "now" so
  // the kid gets the full PET_IDLE_WARN_MS window before the bubble fires.
  if (lastCorrectKeystrokeAt === 0) {
    lastCorrectKeystrokeAt = performance.now();
    return;
  }
  // Need an active target word — if there isn't one, the kid isn't being
  // asked to type anything, so no nag.
  if (!gameState.targetWord) {
    if (petIdleWarningActive) clearPetWorried();
    return;
  }
  const now = performance.now();
  if (!petIdleWarningActive && (now - lastCorrectKeystrokeAt) > PET_IDLE_WARN_MS) {
    petIdleWarningActive = true;
    // Swap to the 'hurt' state (wilted, one eye closed, sad) — reads as
    // "the pet misses you" rather than the defeated/ghosted 'fire' PNG.
    // The .worried CSS filter (hue shift + desaturate) adds urgency on
    // top so the pet doesn't look totally broken.
    showPetReaction('hurt', "Don't forget me!");
    const petFace = document.getElementById('pet-img');
    if (petFace) petFace.classList.add('worried');
  }
}

/** T22: clear the idle-warning state when the kid types again. Called
 *  from onCorrectKeystroke. The 'hurt' state set in checkPetIdleWarning
 *  will time out back to idle via the 2200ms timer inside showPetReaction;
 *  we just remove the .worried filter and reset the timestamp. */
function clearPetWorried() {
  if (!petIdleWarningActive && !document.getElementById('pet-img')?.classList.contains('worried')) {
    return;
  }
  petIdleWarningActive = false;
  lastCorrectKeystrokeAt = performance.now();
  const petFace = document.getElementById('pet-img');
  if (petFace) petFace.classList.remove('worried');
}

// ===== GARDEN SYSTEM =====
// ===== PARALLAX BACKGROUND SYSTEM =====
const bgLayers = {
  sky: { img: null, scroll: 0.02, y: 0 },
  trees: { img: null, scroll: 0.05, y: 0.35 },
  hills: { img: null, scroll: 0.12, y: 0.55 },
  grass: { img: null, scroll: 0.25, y: 0.85 },
};

function loadBgImages() {
  const loadImg = (src) => {
    const img = new Image();
    img.onerror = () => { img._broken = true; };
    img.src = src;
    return img;
  };
  // New parallax layer pack: 3 layers per scene (sky / mid / foreground).
  // New parallax layer pack: 3 layers per scene (sky / mid / foreground).
  // Files were merged into the existing /backgrounds/ directory during cleanup,
  // so we read from there now (no -new suffix).
  bgLayers.sky.img = loadImg('/assets/backgrounds/magical_garden-sky.png');
  bgLayers.trees.img = loadImg('/assets/backgrounds/magical_garden-mid.png');
  bgLayers.hills.img = loadImg('/assets/backgrounds/magical_garden-foreground.png');
  bgLayers.grass.img = loadImg('/assets/backgrounds/magical_garden-foreground.png');
}

function drawBgLayer(layer, w, h, time, heightScale) {
  const img = layer.img;
  if (!img || !img.complete || img._broken || img.naturalWidth === 0) return;
  const layerH = h * heightScale;
  const layerW = (img.width / img.height) * layerH;
  const offsetX = (time * layer.scroll * 20) % layerW;

  for (let x = -offsetX; x < w; x += layerW) {
    ctx.drawImage(img, x, h - layerH, layerW, layerH);
  }
}

function drawGarden() {
  const w = gameState.canvasW;
  const h = gameState.canvasH;
  const groundY = h - 175;
  const time = gameState.currentTime / 1000;

  if (!bgLayers.sky.img || !bgLayers.sky.img.complete || bgLayers.sky.img._broken) {
    drawFallbackBackground(w, h, groundY);
    return;
  }

  drawBgLayer(bgLayers.sky, w, h, time, 0.3);
  drawStars(groundY);
  drawBgLayer(bgLayers.trees, w, h, time, 0.5);
  drawBgLayer(bgLayers.hills, w, h, time, 0.8);
  drawBgLayer(bgLayers.grass, w, h, time, 1.0);

  if (gameState.garden.length > 30) gameState.garden = gameState.garden.slice(-30);
  for (const flower of gameState.garden) {
    drawFlowerImage(flower, groundY);
  }
}

function drawFallbackBackground(w, h, groundY) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
  skyGrad.addColorStop(0, '#0d0b2e');
  skyGrad.addColorStop(0.3, '#1e1b5e');
  skyGrad.addColorStop(0.6, '#4a2d7a');
  skyGrad.addColorStop(0.85, '#8b4a8a');
  skyGrad.addColorStop(1, '#c46a8a');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, groundY);
  
  drawStars(groundY);
  
  ctx.fillStyle = '#1a3a2a';
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  for (let x = 0; x <= w; x += 50) {
    ctx.lineTo(x, groundY - 30 - Math.sin(x * 0.008) * 25 - Math.cos(x * 0.015) * 15);
  }
  ctx.lineTo(w, groundY);
  ctx.closePath();
  ctx.fill();
  
  const grassGrad = ctx.createLinearGradient(0, groundY - 40, 0, h);
  grassGrad.addColorStop(0, '#2d6b3a');
  grassGrad.addColorStop(0.5, '#3d8b4a');
  grassGrad.addColorStop(1, '#4a9b5a');
  ctx.fillStyle = grassGrad;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  for (let x = 0; x <= w; x += 40) {
    ctx.lineTo(x, groundY - 15 - Math.sin(x * 0.012) * 12 - Math.cos(x * 0.02) * 8);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
}

const stars = [];
function drawStars(groundY) {
  if (stars.length === 0) {
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * 2000,
        y: Math.random() * (groundY || 600),
        size: Math.random() * 2.5 + 0.5,
        twinkle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.03 + 0.01
      });
    }
  }

  // ⚡ Optimization: Set fillStyle once and use globalAlpha to avoid string parsing.
  // ⚡ Optimization: Removed shadowBlur as it's extremely expensive in loops.
  ctx.save();
  ctx.fillStyle = '#ffffc8';
  const canvasW = gameState.canvasW;

  for (const star of stars) {
    star.twinkle += star.speed;

    // ⚡ Optimization: Viewport culling
    if (star.x < 0 || star.x > canvasW) continue;

    ctx.globalAlpha = 0.3 + Math.sin(star.twinkle) * 0.3;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ===== ANIMATED PET SYSTEM =====
// petFrames[s] holds the Image for the player's currently-selected pet in state s
// Loaded on demand when a state change is requested.
const petFrames = {
  idle: null, happy: null, hurt: null, celebrate: null, fire: null,
};

function loadPetState(state) {
  if (petFrames[state] && petFrames[state].complete) return petFrames[state];
  const img = new Image();
  img.onload = () => { petFrames[state] = img; };
  img.onerror = () => { img._broken = true; };
  img.src = getPetImage(state);
  petFrames[state] = img; // assign immediately so concurrent calls don't re-create
  return img;
}

function loadPetImages() {
  // Preload idle for the initial render; other states load on demand
  loadPetState('idle');
}

let petCurrentFrame = 'idle';
let petFrameTimer = 0;
let petBounceY = 0;

function drawPet() {
  const img = petFrames[petCurrentFrame];
  if (!img || !img.complete) return;
  
  const w = 100;
  const h = 100;
  const x = 60;
  const baseY = gameState.canvasH - 260;
  
  // Idle breathing animation
  petBounceY = Math.sin(gameState.currentTime / 500) * 3;
  
  ctx.drawImage(img, x, baseY + petBounceY, w, h);
  
  // Reset to idle after animation
  petFrameTimer++;
  if (petFrameTimer > 60 && petCurrentFrame !== 'idle') {
    petCurrentFrame = 'idle';
    petFrameTimer = 0;
  }
}

function setPetFrame(frame) {
  // Always trigger a load for the new state (covers pet changes too)
  loadPetState(frame);
  petCurrentFrame = frame;
  petFrameTimer = 0;
}

// Called when the player picks a new avatar. Invalidate cached pet images
// and refresh both the DOM avatar and the canvas in-canvas pet.
function onAvatarChanged() {
  // Clear cached images so the next state change fetches the new pet
  for (const state of ['idle', 'happy', 'hurt', 'celebrate', 'fire']) {
    petFrames[state] = null;
  }
  // Refresh the menu DOM avatar
  setPetImage();
  // Preload idle for the new pet
  loadPetState(petCurrentState);
}

// ===== IMAGE-BASED FLOWERS =====
const flowerImages = {
  bud: null, sprout: null, bloom: null,
};

function loadFlowerImages() {
  const loadImg = (src) => {
    const img = new Image();
    img.src = src;
    return img;
  };
  flowerImages.bud = loadImg('/assets/pro/flowers/bud.png');
  flowerImages.sprout = loadImg('/assets/pro/flowers/sprout.png');
}

function drawFlowerImage(flower, groundY) {
  const types = ['bud', 'sprout', 'bud'];
  const imgName = types[Math.floor(Math.random() * types.length)];
  const img = flowerImages[imgName];

  const scale = flower.scale * flower.bloomProgress;
  if (scale <= 0.01) return;

  if (!img || !img.complete) {
    // Canvas-drawn fallback (no external image)
    const x = flower.x;
    const size = 60 * scale;
    ctx.save();
    ctx.translate(x, groundY - size * 0.5);
    ctx.fillStyle = '#ff7ab6';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2d6a4f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.3);
    ctx.lineTo(0, size * 0.8);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const x = flower.x;
  const size = 60 * scale;

  ctx.save();
  ctx.translate(x, groundY - size * 0.8);
  ctx.scale(scale, scale);

  // Gentle sway
  const sway = Math.sin(gameState.currentTime / 800 + flower.x) * 3;
  ctx.rotate(sway * Math.PI / 180);

  ctx.drawImage(img, -size/2, -size/2, size, size);
  ctx.restore();
}

// ===== TEXTURED PARTICLES =====
const particleTexture = new Image();
particleTexture.src = '/assets/pro/particles/sparkle.png';

function drawTexturedParticles() {
  if (!particleTexture.complete) {
    // Fallback to solid circles
    drawParticles();
    return;
  }
  
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    const size = p.size * p.life * 2;
    
    // ⚡ Optimization: Avoid save/restore/translate/rotate if no rotation is needed
    const needsTransform = (p.rotation !== undefined && p.rotation !== 0);

    if (p.type === 'confetti') {
      ctx.fillStyle = p.color;
      if (needsTransform) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-size / 2, -size / 4, size, size / 2);
        ctx.restore();
      } else {
        ctx.fillRect(p.x - size / 2, p.y - size / 4, size, size / 2);
      }
    } else {
      if (needsTransform) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.drawImage(particleTexture, -size/2, -size/2, size, size);
        ctx.restore();
      } else {
        ctx.drawImage(particleTexture, p.x - size/2, p.y - size/2, size, size);
      }
    }
  }
  ctx.globalAlpha = 1;
}

// ===== PARTICLE SYSTEM =====
const particles = [];

function spawnParticles(x, y, count, color = COLORS.success) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 4;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      decay: 0.02 + Math.random() * 0.02,
      color,
      size: 3 + Math.random() * 4,
    });
  }
}

function updateParticles(deltaTime) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08;
    if (p.rotation !== undefined) p.rotation += p.rotSpeed || 0.05;
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;

    // ⚡ Optimization: Avoid save/restore/translate/rotate if no rotation is needed
    const needsTransform = (p.type === 'confetti' && p.rotation !== undefined && p.rotation !== 0);

    if (p.type === 'confetti') {
      if (needsTransform) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 4, p.size, p.size / 2);
      }
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// ===== LEVEL MANAGEMENT =====
function checkLevelComplete() {
  const lesson = currentLesson();
  // Level is done when all words have been spawned and none remain active
  if (gameState.wordsSpawned >= lesson.wordsPerLevel && 
      gameState.activeWords.length === 0 &&
      !gameState.gameOver) {
    levelComplete();
  }
}

function levelComplete() {
  gameState.gameOver = true;
  sounds.level();

  // T26: soft pink 300ms screen flash (was: harsh white 800ms). Pink reads
  // as celebratory, not jarring — and 300ms is short enough to feel snappy
  // on the level-complete overlay that follows.
  showLevelFlash();
  
  // Save progress
  if (!gameState.profile.completedLevels) {
    gameState.profile.completedLevels = [];
  }
  const wasFirstCompletion = !gameState.profile.completedLevels.includes(gameState.level);
  if (wasFirstCompletion) {
    gameState.profile.completedLevels.push(gameState.level);
  }
  gameState.profile.totalStars += 10;
  
  // Check pet evolution
  const newStage = checkEvolution();
  
  saveProfile();
  
  // Evaluate daily quests
  gameState.levelComplete = true;
  const newlyCompletedQuests = evaluateQuests(gameState.profile, gameState);
  for (const q of newlyCompletedQuests) {
    // Show mini toast for quest completion (reuses achievement toast element)
    achievementQueue.push({ title: '📅 Quest Done!', desc: q.desc, icon: q.icon });
  }
  if (newlyCompletedQuests.length > 0) {
    showNextAchievement();
    saveProfile();
  }

  // Show celebration
  showLevelComplete();
  showPetReaction('celebrate', 'Level Complete! 🌟');
  spawnConfetti(gameState.canvasW/2, gameState.canvasH/2, 50);
  spawnParticles(gameState.canvasW/2, gameState.canvasH/2, 30);
  
  // Show evolution overlay if unlocked
  if (newStage && wasFirstCompletion) {
    setTimeout(() => showEvolutionOverlay(newStage), 800);
  }
}

function checkEvolution() {
  const completed = gameState.profile.completedLevels?.length || 0;
  let newStage = null;
  
  // Stage 2 at level 3 completion, Stage 3 at level 7 completion
  if (completed >= 7 && gameState.profile.petEvolution < 3) {
    gameState.profile.petEvolution = 3;
    if (!gameState.profile.seenEvolutions?.includes(3)) {
      if (!gameState.profile.seenEvolutions) gameState.profile.seenEvolutions = [];
      gameState.profile.seenEvolutions.push(3);
      newStage = 3;
    }
  } else if (completed >= 3 && gameState.profile.petEvolution < 2) {
    gameState.profile.petEvolution = 2;
    if (!gameState.profile.seenEvolutions?.includes(2)) {
      if (!gameState.profile.seenEvolutions) gameState.profile.seenEvolutions = [];
      gameState.profile.seenEvolutions.push(2);
      newStage = 2;
    }
  }
  return newStage;
}

function showEvolutionOverlay(stage) {
  const overlay = document.getElementById('evolution-overlay');
  if (!overlay) return;
  
  const stageData = {
    2: { emoji: '🌿', title: 'Bloom is Growing!', desc: 'Your typing helped Bloom sprout new leaves!', line: '"I feel stronger! Let\'s type even faster!" — Bloom' },
    3: { emoji: '👑', title: 'Legend Bloom!', desc: 'Bloom has fully bloomed! A true typing legend!', line: '"We\'re UNSTOPPABLE together!" — Bloom' }
  };
  
  const data = stageData[stage];
  if (!data) return;
  
  const imgEl = document.getElementById('evolution-stage-img');
  const titleEl = document.getElementById('evolution-title');
  const descEl = document.getElementById('evolution-desc');
  const lineEl = document.getElementById('evolution-pet-line');
  
  if (imgEl) imgEl.textContent = data.emoji;
  if (titleEl) titleEl.textContent = data.title;
  if (descEl) descEl.textContent = data.desc;
  if (lineEl) lineEl.textContent = data.line;
  
  overlay.classList.remove('hidden');
  
  // Extra confetti for evolution
  spawnConfetti(gameState.canvasW/2, gameState.canvasH/2, 80);
}

// ===== ACHIEVEMENT SYSTEM =====
let achievementQueue = [];
let achievementShowing = false;

function showNextAchievement() {
  if (achievementShowing || achievementQueue.length === 0) return;
  achievementShowing = true;
  const { title, desc, icon } = achievementQueue.shift();
  
  const toast = document.getElementById('achievement-toast');
  if (toast) {
    document.getElementById('toast-icon').textContent = icon;
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-desc').textContent = desc;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
      achievementShowing = false;
      setTimeout(showNextAchievement, 200);
    }, 3000);
  } else {
    achievementShowing = false;
  }
}

function checkAchievements() {
  if (!gameState.profile.achievements) gameState.profile.achievements = [];
  
  const newlyUnlocked = checkAchievementsNew(gameState.profile, gameState);
  
  for (const ach of newlyUnlocked) {
    achievementQueue.push({ title: ach.title, desc: ach.desc, icon: ach.icon });
  }
  
  if (achievementQueue.length > 0) {
    showNextAchievement();
    saveProfile();
  }
}

// ===== LEVEL COMPLETE CONFETTI =====
function spawnConfetti(x, y, count) {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#FFD93D', '#A78BFA', '#F472B6', '#34D399'];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 8;
    particles.push({
      x: x || gameState.canvasW / 2,
      y: y || gameState.canvasH / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 5,
      life: 1,
      decay: 0.008 + Math.random() * 0.015,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 8,
      type: 'confetti',
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3,
    });
  }
}

// ===== DAILY MOMENT (F1) =====
// Soft 60s typing session. No game-over, no hearts, no level score — just
// streak/quest progress and a gentle "session complete" landing. Reuses
// the existing game engine: words fall, focus mechanic, completeWord.
let dailyMomentTimerId = null;
let dailyMomentCountdownId = null;

export function startDailyMoment() {
  initAudio();
  playAmbient();

  // Use the player's current level (or level 1 if they've never played)
  const level = (gameState.profile?.completedLevels?.length
    ? Math.max(1, ...gameState.profile.completedLevels)
    : 1);
  const lesson = getLessonByLevel(level);

  // Reset the same fields startGame resets, but with a daily-moment flag.
  gameState.screen = 'game';
  gameState.level = level;
  gameState.score = 0;
  gameState.combo = 0;
  gameState.maxCombo = 0;
  gameState.wordsTyped = 0;
  gameState.wordsCompleted = 0;
  gameState.wordsSpawned = 0;
  gameState.totalKeystrokes = 0;
  gameState.correctKeystrokes = 0;
  gameState.health = 999; // sentinel: never drain to 0 during daily moment
  gameState.activeWords = [];
  gameState.targetWord = null;
  gameState.targetIndex = 0;
  gameState.gameOver = false;
  gameState.paused = false;
  gameState.lastSpawn = 0;
  gameState.lastFrameTime = 0;
  gameState.garden = [];
  gameState.levelStartTime = performance.now();
  gameState.keyAccuracy = {};
  gameState.levelWPM = 0;
  gameState.levelAccuracy = 0;
  gameState.levelComplete = false;
  gameState.skipsUsed = 0;
  gameState.adaptiveSpeed = 1.0;
  gameState.lastAdaptiveCheck = 0;

  // Activate daily-moment mode (consulted by loseHealth + completeWord)
  gameState.dailyMoment = {
    active: true,
    startTime: performance.now(),
    durationMs: 60_000,
    wordsTarget: 12,
    lessonSpeed: lesson?.speed || 0.4,
    lessonWords: (lesson?.words || []).slice(),
  };
  achievementQueue = [];
  achievementShowing = false;

  // Show game screen
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('game-screen').classList.add('active');

  // Show a soft chapter-style intro card (no level badge)
  const chapterOverlay = document.getElementById('chapter-intro');
  if (chapterOverlay) {
    const titleEl = chapterOverlay.querySelector('.chapter-title');
    const subtitleEl = chapterOverlay.querySelector('.chapter-subtitle');
    const introEl = chapterOverlay.querySelector('.chapter-intro-text');
    const petLineEl = chapterOverlay.querySelector('.chapter-pet-line');
    if (titleEl) titleEl.textContent = 'Daily Moment';
    if (subtitleEl) subtitleEl.textContent = '60 seconds of focused typing';
    if (introEl) introEl.textContent = 'No pressure. Type what you can. We will cheer you on!';
    if (petLineEl) petLineEl.textContent = '"I will be right here with you." — Bloom';
    chapterOverlay.classList.remove('hidden');
    const dismiss = () => chapterOverlay.classList.add('hidden');
    setTimeout(dismiss, 3500);
    chapterOverlay.addEventListener('click', dismiss, { once: true });
  }

  resizeCanvas();
  setPetImage();
  preloadImages();
  spawnWord();
  updateHUD();
  updateHearts();
  updateTargetDisplay();
  updateLessonInfo();

  // Hide level-complete / gameover overlays if they were open
  document.getElementById('level-overlay')?.classList.add('hidden');
  document.getElementById('gameover-overlay')?.classList.add('hidden');

  // Replace the level badge with a soft "Daily Moment" label
  const badge = document.getElementById('difficulty-badge');
  if (badge) badge.textContent = '⚡ Daily Moment';

  animationId = requestAnimationFrame(gameLoop);

  // Mobile input for soft keyboard (same as startGame)
  const mobileInput = document.getElementById('mobile-input');
  if (mobileInput && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
    mobileInput.focus();
  }

  // End the session after the duration, regardless of progress
  if (dailyMomentTimerId) clearTimeout(dailyMomentTimerId);
  dailyMomentTimerId = setTimeout(() => endDailyMoment({ reason: 'timeUp' }), 60_000);

  // Tick the HUD countdown once per second
  if (dailyMomentCountdownId) clearInterval(dailyMomentCountdownId);
  dailyMomentCountdownId = setInterval(updateDailyMomentHUD, 250);
  updateDailyMomentHUD();
}

function updateDailyMomentHUD() {
  if (!gameState.dailyMoment?.active) return;
  const elapsed = performance.now() - gameState.dailyMoment.startTime;
  const remaining = Math.max(0, gameState.dailyMoment.durationMs - elapsed);
  const seconds = Math.ceil(remaining / 1000);
  const wpmEl = document.getElementById('wpm');
  // Reuse the WPM slot to show time + words so we don't add new HUD chrome
  if (wpmEl) wpmEl.textContent = `${seconds}s · ${gameState.wordsCompleted}/${gameState.dailyMoment.wordsTarget}`;
}

export function endDailyMoment({ reason } = {}) {
  if (!gameState.dailyMoment?.active) return;

  // Clear timers
  if (dailyMomentTimerId) { clearTimeout(dailyMomentTimerId); dailyMomentTimerId = null; }
  if (dailyMomentCountdownId) { clearInterval(dailyMomentCountdownId); dailyMomentCountdownId = null; }

  // Capture stats
  const wordsCompleted = gameState.wordsCompleted;
  const elapsedMs = performance.now() - (gameState.dailyMoment.startTime || performance.now());
  const elapsedMin = Math.max(elapsedMs / 60_000, 1 / 60);
  const wpm = Math.round((gameState.correctKeystrokes / 5) / elapsedMin);
  const accuracy = gameState.totalKeystrokes > 0
    ? Math.round((gameState.correctKeystrokes / gameState.totalKeystrokes) * 100)
    : 100;

  // Persist + bump streak if today
  gameState.profile.lastDailyMomentDate = new Date().toISOString();
  // F2: Daily Moment completion counts toward the streak (same rule as
  // getTodaysQuests). Without this the prominent streak counter never
  // moves when the kid uses the F1 entry point.
  try { bumpStreakIfToday(gameState.profile); } catch {}
  // Bump daily-quest progress for the type_words quest (if it exists)
  try {
    evaluateQuests(gameState.profile, { ...gameState, screen: 'game', level: gameState.level });
  } catch {}
  saveProfile();

  // Soft landing: stop the loop, route back to menu, show a toast
  cancelAnimationFrame(animationId);
  stopAmbient();
  gameState.dailyMoment.active = false;
  gameState.gameOver = true; // suppress the normal level/gameover overlays

  // Hide the chapter intro if it was still up
  document.getElementById('chapter-intro')?.classList.add('hidden');

  // Toast: "Daily Moment complete — N words, X% accuracy!"
  const toast = document.getElementById('achievement-toast');
  if (toast) {
    document.getElementById('toast-icon').textContent = '⚡';
    document.getElementById('toast-title').textContent = 'Daily Moment complete!';
    document.getElementById('toast-desc').textContent =
      `${wordsCompleted} word${wordsCompleted === 1 ? '' : 's'} · ${wpm} WPM · ${accuracy}% accuracy`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 4000);
  }

  // Play a gentle completion sound (reuse "word" arpeggio at lower gain)
  sounds.word();

  // Return to menu
  showScreen('menu');
  // The menu's updateMenuStats is in main.js; use a global tick if available.
  // F3: signal the home pet to celebrate once the menu re-renders.
  window.__petHeroState = 'celebrate';
  if (typeof window.__refreshMenuStats === 'function') window.__refreshMenuStats();
}

// ===== START GAME =====
export function startGame(level = 1) {
  initAudio();
  playAmbient();

  const lesson = getLessonByLevel(level);
  
  gameState.screen = 'game';
  gameState.level = level;
  gameState.score = 0;
  gameState.combo = 0;
  gameState.maxCombo = 0;
  gameState.wordsTyped = 0;
  gameState.wordsCompleted = 0;
  gameState.wordsSpawned = 0;
  gameState.totalKeystrokes = 0;
  gameState.correctKeystrokes = 0;
  gameState.health = lesson.health || 5;
  gameState.activeWords = [];
  gameState.targetWord = null;
  gameState.targetIndex = 0;
  gameState.gameOver = false;
  gameState.paused = false;
  gameState.lastSpawn = 0;
  gameState.lastFrameTime = 0;
  gameState.garden = [];
  gameState.levelStartTime = performance.now();
  gameState.keyAccuracy = {};
  gameState.levelWPM = 0;
  gameState.levelAccuracy = 0;
  gameState.levelComplete = false;
  gameState.skipsUsed = 0;
  gameState.adaptiveSpeed = 1.0; // Multiplier applied to base lesson speed
  gameState.lastAdaptiveCheck = 0;
  achievementQueue = [];
  achievementShowing = false;
  
  // Show game screen
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('game-screen').classList.add('active');
  
  // Show chapter intro overlay for non-replayed levels
  const chapter = getChapter(level);
  const chapterOverlay = document.getElementById('chapter-intro');
  if (chapterOverlay && chapter && !gameState.profile?.completedLevels?.includes(level)) {
    const titleEl = chapterOverlay.querySelector('.chapter-title');
    const subtitleEl = chapterOverlay.querySelector('.chapter-subtitle');
    const introEl = chapterOverlay.querySelector('.chapter-intro-text');
    const petLineEl = chapterOverlay.querySelector('.chapter-pet-line');
    if (titleEl) titleEl.textContent = chapter.title;
    if (subtitleEl) subtitleEl.textContent = chapter.subtitle;
    if (introEl) introEl.textContent = chapter.intro;
    if (petLineEl) petLineEl.textContent = `"${chapter.petLine}" — ${PET_NAME_DEFAULT}`;
    chapterOverlay.classList.remove('hidden');
    // Auto-dismiss after 4s or on click
    setTimeout(() => chapterOverlay.classList.add('hidden'), 4500);
    chapterOverlay.addEventListener('click', () => chapterOverlay.classList.add('hidden'), { once: true });
  }
  
  // Show finger guide on level 1 for first-time players
  if (level === 1 && !gameState.profile?.seenFingerGuide) {
    const guide = document.getElementById('finger-guide');
    if (guide) {
      guide.classList.remove('hidden');
      gameState.profile.seenFingerGuide = true;
      saveProfile();
    }
  }
  
  // Initialize
  resizeCanvas();
  setPetImage();
  
  // Preload all image assets before starting
  preloadImages();
  
  spawnWord();
  updateHUD();
  updateHearts();
  updateTargetDisplay();
  updateLessonInfo();
  
  // Start loop
  animationId = requestAnimationFrame(gameLoop);
  
  // Focus mobile input for virtual keyboard (touch devices only — on desktop
  // it would steal keyboard focus from the real game handler).
  const mobileInput = document.getElementById('mobile-input');
  if (mobileInput && isTouchDevice()) mobileInput.focus();
}

export function startDrillMode(drillLesson) {
  initAudio();
  playAmbient();
  gameState.screen = 'game';
  gameState.level = 'drill';
  gameState.score = 0;
  gameState.combo = 0;
  gameState.maxCombo = 0;
  gameState.wordsTyped = 0;
  gameState.wordsCompleted = 0;
  gameState.wordsSpawned = 0;
  gameState.totalKeystrokes = 0;
  gameState.correctKeystrokes = 0;
  gameState.health = drillLesson.health || 5;
  gameState.activeWords = [];
  gameState.targetWord = null;
  gameState.targetIndex = 0;
  gameState.gameOver = false;
  gameState.paused = false;
  gameState.lastSpawn = 0;
  gameState.lastFrameTime = 0;
  gameState.garden = [];
  gameState.levelStartTime = performance.now();
  gameState.levelWPM = 0;
  gameState.levelAccuracy = 0;
  gameState.levelComplete = false;
  gameState.skipsUsed = 0;
  gameState.adaptiveSpeed = 1.0;
  gameState.lastAdaptiveCheck = 0;
  achievementQueue = [];
  achievementShowing = false;
  
  // Override getLessonByLevel temporarily for drill
  const originalGetLesson = getLessonByLevel;
  window._originalGetLesson = originalGetLesson;
  
  // Patch getLessonByLevel to return drill lesson for 'drill'
  // We do this by setting gameState.level to a string that the patched function checks
  
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('game-screen').classList.add('active');
  
  resizeCanvas();
  setPetImage();
  preloadImages();
  
  // Force first word with drill lesson data
  const text = drillLesson.words[Math.floor(Math.random() * drillLesson.words.length)];
  const word = new Word(text, drillLesson.speed);
  ctx.font = '700 26px Nunito, sans-serif';
  word.width = ctx.measureText(text).width + 40;
  word.x = 80 + Math.random() * (gameState.canvasW - 200);
  word.y = 100 + Math.random() * 100;
  gameState.activeWords.push(word);
  gameState.wordsSpawned++;
  
  updateHUD();
  updateHearts();
  updateTargetDisplay();
  updateLessonInfo();
  
  animationId = requestAnimationFrame(gameLoop);
  
  // Focus mobile input for virtual keyboard (touch devices only)
  const mobileInput = document.getElementById('mobile-input');
  if (mobileInput && isTouchDevice()) mobileInput.focus();
}

function preloadImages() {
  const images = [];
  
  // Collect all image URLs
  const bgUrls = ['/assets/pro/bg/sky.png','/assets/pro/bg/trees.png','/assets/pro/bg/hills.png','/assets/pro/bg/grass.png'];
  const petUrls = ['/assets/pro/pet/idle.png','/assets/pro/pet/happy.png','/assets/pro/pet/hurt.png','/assets/pro/pet/celebrate.png','/assets/pro/pet/fire.png'];
  const flowerUrls = ['/assets/pro/flowers/bud.png','/assets/pro/flowers/sprout.png'];
  const particleUrls = ['/assets/pro/particles/sparkle.png'];
  
  [...bgUrls, ...petUrls, ...flowerUrls, ...particleUrls].forEach(url => {
    const img = new Image();
    img.src = url;
    images.push(new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
      setTimeout(resolve, 1000); // Timeout after 1s
    }));
  });
  
  return Promise.all(images);
}

export function togglePause() {
  gameState.paused = !gameState.paused;
  const overlay = document.getElementById('pause-overlay');
  if (gameState.paused) {
    overlay.classList.remove('hidden');
    canvas.classList.add('blurred');
  } else {
    overlay.classList.add('hidden');
    canvas.classList.remove('blurred');
  }
}

function showGameOver() {
  const score = document.getElementById('final-score');
  const combo = document.getElementById('final-combo');
  const words = document.getElementById('final-words');
  const overlay = document.getElementById('gameover-overlay');
  if (score) score.textContent = gameState.score;
  if (combo) combo.textContent = gameState.maxCombo;
  if (words) words.textContent = gameState.wordsTyped;
  if (overlay) overlay.classList.remove('hidden');
  
  // Show drill button if there are weak keys
  const drillBtn = document.getElementById('btn-drill');
  if (drillBtn) {
    const weakKeys = getWeakKeys(gameState.keyAccuracy, 3);
    drillBtn.classList.toggle('hidden', weakKeys.length === 0);
  }
  
  showPetReaction('hurt', 'Game Over...');
}

function showLevelComplete() {
  const num = document.getElementById('level-complete-num');
  const score = document.getElementById('level-score');
  const words = document.getElementById('level-words');
  const combo = document.getElementById('level-combo');
  const overlay = document.getElementById('level-overlay');
  const nextBtn = document.getElementById('btn-next-level');
  const cardTitle = overlay?.querySelector('h2');
  
  const isFinal = gameState.level >= 10;
  
  if (num) num.textContent = gameState.level;
  if (score) score.textContent = gameState.score;
  if (words) words.textContent = gameState.wordsCompleted;
  if (combo) combo.textContent = gameState.maxCombo;
  
  if (isFinal) {
    if (cardTitle) cardTitle.textContent = '🎉 Game Complete!';
    if (nextBtn) { nextBtn.textContent = '🏆 Back to Menu'; nextBtn.classList.add('final'); }
  } else {
    if (cardTitle) cardTitle.innerHTML = `Level <span id="level-complete-num">${gameState.level}</span> Complete!`;
    if (nextBtn) { nextBtn.textContent = 'Next Level →'; nextBtn.classList.remove('final'); }
  }
  
  if (overlay) overlay.classList.remove('hidden');
}

function speakWord(word) {
  if (!('speechSynthesis' in window)) return;
  if (gameState.profile?.voiceEnabled === false) return;
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.rate = 0.85;
  utterance.pitch = 1.2;
  window.speechSynthesis.speak(utterance);
}

// ===== INIT =====
function updateLessonInfo() {
  const lesson = currentLesson();
  const infoEl = document.getElementById('lesson-info');
  if (infoEl) {
    infoEl.textContent = lesson.subtitle;
    infoEl.style.display = 'block';
    setTimeout(() => { infoEl.style.display = 'none'; }, 4000);
  }
}

export function init() {
  loadProfile();
  resizeCanvas();
  // Load pro image assets
  loadBgImages();
  loadPetImages();
  loadFlowerImages();
  // Expose for testing
  window.gameState = gameState;
  // Desktop keyboard
  document.addEventListener('keydown', handleKey);
  // Mobile virtual keyboard
  const mobileInput = document.getElementById('mobile-input');
  if (mobileInput) {
    mobileInput.addEventListener('input', handleMobileInput);
    mobileInput.addEventListener('blur', () => {
      if (gameState.screen === 'game' && !gameState.gameOver && !gameState.paused) {
        setTimeout(() => mobileInput.focus(), 50);
      }
    });
  }
  // Visual viewport resize for mobile keyboard
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      if (gameState.screen === 'game') resizeCanvas();
    });
  }
  window.addEventListener('resize', resizeCanvas);
}

export function showScreen(name) {
  gameState.screen = name;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`${name}-screen`);
  if (target) target.classList.add('active');
}
