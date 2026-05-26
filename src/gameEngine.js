/**
 * BloomType - Core Game Engine
 * A magical garden typing adventure for kids
 */
import { LESSON_LEVELS, getLessonByLevel, getFingerHint } from './lessonLevels.js';
import { gameState, loadProfile, saveProfile } from './state.js';
import { say, getChapter, getEvolutionStage, PET_NAME_DEFAULT } from './story.js';
import { checkAchievements as checkAchievementsNew } from './achievements.js';
import { evaluateQuests } from './quests.js';
import { playAmbient, stopAmbient, audioCtx, initAudio } from './audio.js';

// ===== CONSTANTS =====
const COLORS = {
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  accent: '#EC4899',
  success: '#34D399',
  danger: '#EF4444',
  warning: '#FBBF24',
};

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
    this.glow = 0;
    this.shake = 0;
    this.width = 0;
    this.height = 36;
  }

  update(deltaTime) {
    this.y += this.speed * 60 * deltaTime;
    if (this.glow > 0) this.glow -= deltaTime * 3;
    if (this.shake > 0) this.shake -= deltaTime * 5;
  }

  draw(ctx) {
    const shakeX = this.shake > 0 ? (Math.random() - 0.5) * 6 : 0;
    const x = this.x + shakeX;
    
    // Glow effect for target
    if (this.glow > 0 || this.isTarget) {
      ctx.save();
      ctx.shadowColor = this.isTarget ? COLORS.success : COLORS.primary;
      ctx.shadowBlur = this.isTarget ? 40 : this.glow * 25;
      ctx.fillStyle = this.isTarget ? 'rgba(52, 211, 153, 0.5)' : 'rgba(139, 92, 246, 0.4)';
      ctx.globalAlpha = this.isTarget ? 0.6 : 0.3;
      ctx.beginPath();
      ctx.roundRect(x - 8, this.y - this.height/2 - 4, this.width + 16, this.height + 8, 16);
      ctx.fill();
      ctx.restore();
    }

    // Background pill
    ctx.fillStyle = this.isTarget ? 'rgba(52, 211, 153, 0.35)' : 'rgba(139, 92, 246, 0.35)';
    ctx.strokeStyle = this.isTarget ? COLORS.success : 'rgba(200, 180, 255, 0.8)';
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
      const typedText = this.text.slice(0, this.matched);
      const typedWidth = ctx.measureText(typedText).width;
      ctx.fillStyle = COLORS.success;
      ctx.fillRect(x + 10, this.y + 12, typedWidth, 5);
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
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  gameState.canvasW = rect.width;
  gameState.canvasH = rect.height;
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

  // Clear canvas
  ctx.clearRect(0, 0, gameState.canvasW, gameState.canvasH);

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

function updateWords(deltaTime) {
  // Spawn new words
  const lesson = getLessonByLevel(gameState.level);
  const now = performance.now();
  const adaptiveSpawnRate = lesson.spawnRate / gameState.adaptiveSpeed;
  
  if (gameState.wordsSpawned < lesson.wordsPerLevel && 
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
  const lesson = getLessonByLevel(gameState.level);
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
  
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

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

  const lesson = getLessonByLevel(gameState.level);
  const requiresShift = lesson.requiresShift || false;
  
  // Determine what key was pressed
  let pressedKey = e.key;
  const isShift = e.shiftKey;
  
  // For shift-required levels (capitals), require shift + letter
  if (requiresShift) {
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      if (!isShift) {
        // Typed lowercase letter when uppercase required
        onWrongKeystroke(pressedKey.toLowerCase());
        showShiftHint();
        return;
      }
      pressedKey = e.key.toUpperCase();
    }
  } else {
    // Normal levels — lowercase only
    if (e.key.length !== 1 || !/[a-z0-9]/.test(e.key)) return;
    pressedKey = e.key.toLowerCase();
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
  
  sounds.correct();
  showKeyFeedback(key, true);
  highlightTargetKey(gameState.targetWord?.text?.[gameState.targetIndex]);
  updateWPM();
}

function onWrongKeystroke(key) {
  // Track per-key accuracy
  const k = key.toLowerCase();
  if (!gameState.keyAccuracy[k]) gameState.keyAccuracy[k] = { correct: 0, wrong: 0 };
  gameState.keyAccuracy[k].wrong++;
  
  sounds.wrong();
  showKeyFeedback(key, false);
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
}

function updateWPM() {
  if (!gameState.levelStartTime) return;
  const elapsedMin = (performance.now() - gameState.levelStartTime) / 60000;
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
  
  // Score
  const baseScore = word.text.length * 10;
  const comboBonus = gameState.combo * 5;
  const levelBonus = gameState.level * 2;
  const totalPoints = baseScore + comboBonus + levelBonus;
  gameState.score += totalPoints;
  
  // Show score popup
  showScorePopup(totalPoints, word.x + word.width/2, word.y);
  
  // Show word popup
  showWordPopup(word.text);
  
  // Combo
  gameState.combo++;
  gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);
  if (gameState.combo >= 2) sounds.combo();
  
  // Stats
  gameState.wordsTyped++;
  gameState.wordsCompleted++;
  
  // Check achievements
  checkAchievements();
  
  // Pet reaction
  if (gameState.combo >= 5) {
    showPetReaction('fire', `🔥 ${gameState.combo} Combo!`);
  } else {
    showPetReaction('happy');
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
  const lesson = getLessonByLevel(gameState.level);
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
  const lesson = getLessonByLevel(gameState.level);
  const pct = lesson.wordsPerLevel > 0 
    ? (gameState.wordsCompleted / lesson.wordsPerLevel) * 100 
    : 0;
  fillEl.style.width = Math.min(pct, 100) + '%';
}

function updateTargetDisplay() {
  const targetWord = document.getElementById('target-word');
  const targetTyped = document.getElementById('target-typed');
  
  if (!targetWord || !targetTyped) return;
  
  if (gameState.targetWord) {
    targetWord.textContent = gameState.targetWord.text;
    targetTyped.textContent = gameState.targetWord.text.slice(0, gameState.targetIndex);
  } else {
    // Force clear both elements
    targetWord.innerHTML = '\u00A0';
    targetTyped.innerHTML = '\u00A0';
    requestAnimationFrame(() => {
      targetWord.innerHTML = '';
      targetTyped.innerHTML = '';
    });
  }
}

function updateKeyboardHighlight() {
  const nextChar = gameState.targetWord?.text?.[gameState.targetIndex];
  highlightTargetKey(nextChar);
}

// ===== KEYBOARD HIGHLIGHT =====
export function highlightTargetKey(char) {
  document.querySelectorAll('.key').forEach(k => k.classList.remove('target'));
  
  if (!char) return;
  
  const keyEl = document.querySelector(`.key[data-key="${char.toLowerCase()}"]`);
  if (keyEl) {
    keyEl.classList.add('target');
    keyEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  
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
const PET_IMAGES = {
  '🌸': 'assets/pets/flower.png',
  '🌻': 'assets/pets/sunflower.png',
  '🐉': 'assets/pets/dragon.png',
  '🐱': 'assets/pets/cat.png',
  '🤖': 'assets/pets/robot.png',
  '🐰': 'assets/pets/bunny.png',
  '🐼': 'assets/pets/panda.png',
  '🦊': 'assets/pets/fox.png',
};

function getPetImage() {
  const avatar = gameState.profile?.avatar || '🌸';
  return PET_IMAGES[avatar] || PET_IMAGES['🌸'];
}

function setPetImage() {
  const petImg = document.getElementById('pet-img');
  if (petImg) petImg.src = getPetImage();
}

function showPetReaction(type, text = '') {
  const bubbleEl = document.getElementById('pet-bubble');
  const evolution = getEvolutionStage(gameState.level || 1);
  
  // Set pet animation frame
  switch(type) {
    case 'happy':
    case 'correct':
      setPetFrame('happy');
      break;
    case 'fire':
      setPetFrame('fire');
      break;
    case 'hurt':
    case 'wrong':
      setPetFrame('hurt');
      break;
    case 'celebrate':
    case 'levelComplete':
      setPetFrame('celebrate');
      break;
    default:
      setPetFrame('idle');
  }
  
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
  bgLayers.sky.img = loadImg('/assets/pro/bg/sky.png');
  bgLayers.trees.img = loadImg('/assets/pro/bg/trees.png');
  bgLayers.hills.img = loadImg('/assets/pro/bg/hills.png');
  bgLayers.grass.img = loadImg('/assets/pro/bg/grass.png');
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
  const time = performance.now() / 1000;

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
  for (const star of stars) {
    star.twinkle += star.speed;
    const alpha = 0.3 + Math.sin(star.twinkle) * 0.3;
    ctx.fillStyle = `rgba(255,255,200,${alpha})`;
    ctx.shadowColor = 'rgba(255,255,200,0.5)';
    ctx.shadowBlur = star.size * 2;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// ===== ANIMATED PET SYSTEM =====
const petFrames = {
  idle: null, happy: null, hurt: null, celebrate: null, fire: null,
};

function loadPetImages() {
  const loadImg = (src) => {
    const img = new Image();
    img.src = src;
    return img;
  };
  petFrames.idle = loadImg('/assets/pro/pet/idle.png');
  petFrames.happy = loadImg('/assets/pro/pet/happy.png');
  petFrames.hurt = loadImg('/assets/pro/pet/hurt.png');
  petFrames.celebrate = loadImg('/assets/pro/pet/celebrate.png');
  petFrames.fire = loadImg('/assets/pro/pet/fire.png');
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
  petBounceY = Math.sin(performance.now() / 500) * 3;
  
  ctx.drawImage(img, x, baseY + petBounceY, w, h);
  
  // Reset to idle after animation
  petFrameTimer++;
  if (petFrameTimer > 60 && petCurrentFrame !== 'idle') {
    petCurrentFrame = 'idle';
    petFrameTimer = 0;
  }
}

function setPetFrame(frame) {
  if (petFrames[frame]) {
    petCurrentFrame = frame;
    petFrameTimer = 0;
  }
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
  
  if (!img || !img.complete) {
    // Fallback to code-drawn
    drawFlowerFromGround(flower, groundY);
    return;
  }
  
  const x = flower.x;
  const scale = flower.scale * flower.bloomProgress;
  const size = 60 * scale;
  
  if (scale <= 0.01) return;
  
  ctx.save();
  ctx.translate(x, groundY - size * 0.8);
  ctx.scale(scale, scale);
  
  // Gentle sway
  const sway = Math.sin(performance.now() / 800 + flower.x) * 3;
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
    
    if (p.type === 'confetti') {
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation || 0);
      ctx.fillRect(-size / 2, -size / 4, size, size / 2);
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation || 0);
      ctx.drawImage(particleTexture, -size/2, -size/2, size, size);
      ctx.restore();
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
    ctx.save();
    if (p.type === 'confetti') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// ===== LEVEL MANAGEMENT =====
function checkLevelComplete() {
  const lesson = getLessonByLevel(gameState.level);
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
  
  // Screen flash
  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;inset:0;background:white;z-index:25;pointer-events:none;animation:screenFlash 0.8s ease-out forwards;';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 800);
  
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
  const lesson = getLessonByLevel(gameState.level);
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
  // Event handlers bound by main.js - only register keyboard here
  document.addEventListener('keydown', handleKey);
  window.addEventListener('resize', resizeCanvas);
}

export function showScreen(name) {
  gameState.screen = name;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`${name}-screen`);
  if (target) target.classList.add('active');
}
