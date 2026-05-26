/**
 * BloomType - Main Entry Point v2
 */
import { LESSON_LEVELS, getLessonByLevel, getFingerHint, getLessonWordsForPractice, isLevelUnlocked } from './lessonLevels.js';
import { gameState, loadProfile, saveProfile } from './state.js';
import { init as initEngine, startGame, togglePause, showScreen, showKeyFeedback, highlightTargetKey, startDrillMode } from './gameEngine.js';
import { MENU_TAGLINES, say, PET_NAME_DEFAULT } from './story.js';
import { getAchievementStats, getAllAchievements } from './achievements.js';
import { getTodaysQuests, getQuestCompletion } from './quests.js';
import { getWeakKeys, buildDrillLesson } from './drills.js';

const $ = (id) => document.getElementById(id);

// ===== PRACTICE MODE =====
let practiceLesson = null;
let currentPracticeWord = '';
let currentWordIndex = 0; // The index of the character being typed in currentPracticeWord
let practiceInterval = null;

function startPractice(lessonId) {
  practiceLesson = getLessonByLevel(lessonId);
  if (!practiceLesson) {
    console.error("Lesson not found for practice mode:", lessonId);
    showScreen('menu');
    return;
  }
  
  gameState.screen = 'practice';
  gameState.practiceLessonId = lessonId;
  gameState.currentPracticeWords = getLessonWordsForPractice(practiceLesson);
  gameState.practiceWordIndex = 0;
  gameState.practiceKeystrokes = 0;
  gameState.practiceCorrectKeystrokes = 0;
  gameState.practiceErrors = 0;
  gameState.practiceStartTime = performance.now();
  gameState.practiceWPM = 0;
  gameState.practiceAccuracy = 0;

  currentPracticeWord = gameState.currentPracticeWords[gameState.practiceWordIndex];
  currentWordIndex = 0;
  
  updatePracticeDisplay();
  
  // Start WPM/accuracy interval
  if (practiceInterval) clearInterval(practiceInterval);
  practiceInterval = setInterval(updatePracticeStats, 1000); // Update every second
}

function updatePracticeDisplay() {
  const displayEl = $('practice-char-display');
  const hintEl = $('practice-hint');
  const fingerHintEl = $('practice-finger-hint');
  const progressFillEl = $('practice-fill');
  const progressCountEl = $('practice-count');
  const wpmEl = $('practice-wpm');
  const accuracyEl = $('practice-accuracy');

  if (!displayEl || !hintEl || !fingerHintEl || !progressFillEl || !progressCountEl || !wpmEl || !accuracyEl) return;

  // Display the full word, with the current character highlighted
  let displayText = '';
  for (let i = 0; i < currentPracticeWord.length; i++) {
    if (i === currentWordIndex) {
      displayText += `<span class="current-char">${currentPracticeWord[i]}</span>`;
    } else {
      displayText += currentPracticeWord[i];
    }
  }
  displayEl.innerHTML = displayText;

  hintEl.innerHTML = `Type: <kbd>${currentPracticeWord}</kbd>`;

  const nextChar = currentPracticeWord[currentWordIndex];
  const fingerHint = getFingerHint(nextChar);
  fingerHintEl.textContent = fingerHint ? `Use your ${fingerHint.label}` : '';
  
  const totalWords = gameState.currentPracticeWords.length;
  const wordsCompleted = gameState.practiceWordIndex;
  progressCountEl.textContent = `${wordsCompleted + 1} / ${totalWords}`;
  progressFillEl.style.width = `${((wordsCompleted + (currentWordIndex / currentPracticeWord.length)) / totalWords) * 100}%`;

  wpmEl.textContent = gameState.practiceWPM;
  accuracyEl.textContent = gameState.practiceAccuracy + '%';

  highlightTargetKey(nextChar);
}

function updatePracticeStats() {
  const elapsedSeconds = (performance.now() - gameState.practiceStartTime) / 1000;
  if (elapsedSeconds < 1) return;

  // WPM = (correct characters / 5) / minutes
  const practiceElapsedMinutes = elapsedSeconds / 60;
  gameState.practiceWPM = Math.round((gameState.practiceCorrectKeystrokes / 5) / practiceElapsedMinutes);
  
  // Accuracy
  gameState.practiceAccuracy = gameState.practiceKeystrokes > 0 
    ? Math.round((gameState.practiceCorrectKeystrokes / gameState.practiceKeystrokes) * 100) 
    : 100;

  updatePracticeDisplay();
}

function handlePracticeKey(e) {
  if (gameState.screen !== 'practice') return;
  if (e.repeat) return;
  
  const pressedKey = e.key;
  const expectedChar = currentPracticeWord[currentWordIndex];

  gameState.practiceKeystrokes++;

  if (pressedKey === expectedChar) {
    gameState.practiceCorrectKeystrokes++;
    currentWordIndex++;
    showKeyFeedback(pressedKey, true);

    if (currentWordIndex >= currentPracticeWord.length) {
      // Word complete
      gameState.practiceWordIndex++;
      if (gameState.practiceWordIndex >= gameState.currentPracticeWords.length) {
        // Lesson complete
        clearInterval(practiceInterval);
        showAchievement('Practice Master', `Lesson ${practiceLesson.name} Complete!`, '🎯');
        // Reset and go back to menu after a delay
        setTimeout(() => {
          showScreen('menu');
          // Optionally save practice stats to profile
          // gameState.profile.practiceStats[practiceLesson.id] = { wpm: gameState.practiceWPM, accuracy: gameState.practiceAccuracy };
          // saveProfile();
        }, 3000);
      } else {
        currentPracticeWord = gameState.currentPracticeWords[gameState.practiceWordIndex];
        currentWordIndex = 0;
        showAchievement('Word Typed!', `You typed "${currentPracticeWord}"!`, '✅');
      }
    }
    updatePracticeDisplay();
  } else if (pressedKey.length === 1) { // Only count single character wrong keys
    gameState.practiceErrors++;
    showKeyFeedback(pressedKey, false);
    // Optionally shake the word display
    const display = $('practice-char-display');
    display.classList.add('shake');
    setTimeout(() => display.classList.remove('shake'), 300);
  }
}

// ===== TUTORIAL =====
let tutorialSlide = 0;

function showTutorial() {
  tutorialSlide = 0;
  const overlay = $('tutorial-overlay');
  overlay.classList.remove('hidden');
  showTutorialSlide(0);
}

function showTutorialSlide(n) {
  document.querySelectorAll('.tutorial-slide').forEach(s => s.classList.remove('active'));
  const slide = document.querySelector(`.tutorial-slide[data-slide="${n}"]`);
  if (slide) slide.classList.add('active');
  
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === n));
}

function nextTutorialSlide() {
  tutorialSlide++;
  if (tutorialSlide >= 3) {
    $('tutorial-overlay').classList.add('hidden');
    startGame(1);
    return;
  }
  showTutorialSlide(tutorialSlide);
}

// ===== ACHIEVEMENT HELPER =====
function showAchievement(title, desc, icon) {
  $('toast-icon').textContent = icon;
  $('toast-title').textContent = title;
  $('toast-desc').textContent = desc;
  const toast = $('achievement-toast');
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ===== WORD POPUP =====
function showWordPopup(word) {
  const emojis = { flower: '🌸', cat: '🐱', dog: '🐶', sun: '☀️', star: '⭐', moon: '🌙', tree: '🌳', bird: '🐦' };
  const emoji = emojis[word.toLowerCase()] || '✨';
  $('word-popup-emoji').textContent = emoji;
  $('word-popup-text').textContent = word;
  $('word-popup').classList.remove('hidden');
  setTimeout(() => $('word-popup').classList.add('hidden'), 1000);
}

// ===== LEVEL CARDS =====
function renderLevelCards() {
  const container = $('level-cards');
  if (!container) return;

  const completed = gameState.profile?.completedLevels || [];
  const levelImages = {
    1: 'home-row.png', 2: 'top-row.png', 3: 'bottom-row.png',
    4: 'home-row.png', 5: 'capitals.png', 6: 'numbers.png',
    7: 'master.png', 8: 'master.png', 9: 'master.png', 10: 'master.png'
  };

  container.innerHTML = Object.values(LESSON_LEVELS).map(lev => {
    const unlocked = isLevelUnlocked(lev.id, gameState.profile);
    const done = completed.includes(lev.id);
    const status = done ? 'completed' : !unlocked ? 'locked' : 'play';
    const imgName = levelImages[lev.id] || 'home-row.png';
    
    return `
      <div class="level-card ${status}" data-level="${lev.id}">
        <img class="level-card-img" src="/assets/levels/${imgName}" alt="${lev.name}" 
             onerror="this.style.display='none'">
        <div class="level-card-name">${lev.name}</div>
        <div class="level-card-sub">${lev.subtitle}</div>
        <div class="level-card-meta">${lev.estimatedTime}</div>
        ${status === 'locked' ? '<div class="level-lock">🔒</div>' : ''}
        ${done ? '<div class="level-check">✅</div>' : ''}
      </div>
    `;
  }).join('');

  container.querySelectorAll('.level-card.play').forEach(card => {
    card.addEventListener('click', () => {
      const level = parseInt(card.dataset.level);
      showScreen('game');
      startGame(level);
    });
  });
}

// ===== UPDATE MENU STATS =====
function updateMenuStats() {
  $('menu-stars') && ($('menu-stars').textContent = gameState.profile?.totalStars || 0);
  $('menu-best') && ($('menu-best').textContent = gameState.profile?.highScore || 0);
  $('menu-words') && ($('menu-words').textContent = gameState.profile?.totalWords || 0);
  // Rotate tagline
  const tagline = document.querySelector('.tagline');
  if (tagline && MENU_TAGLINES.length > 0) {
    const idx = Math.floor(Math.random() * MENU_TAGLINES.length);
    tagline.textContent = MENU_TAGLINES[idx];
  }
  // Render daily quests
  const quests = getTodaysQuests(gameState.profile);
  const streak = gameState.profile.streak || 0;
  const streakEl = document.getElementById('quest-streak');
  if (streakEl) streakEl.textContent = streak > 0 ? `🔥 ${streak}` : '';
  const list = document.getElementById('quests-list');
  if (list) {
    list.innerHTML = '';
    for (const q of quests) {
      const item = document.createElement('div');
      item.className = `quest-item ${q.completed ? 'completed' : ''}`;
      item.innerHTML = `
        <span class="quest-icon">${q.completed ? '✅' : q.icon}</span>
        <span class="quest-text">${q.desc}</span>
        <span class="quest-check">${q.completed ? '✓' : ''}</span>
      `;
      list.appendChild(item);
    }
  }
  const container = document.getElementById('daily-quests');
  if (container) container.style.display = quests.length > 0 ? 'block' : 'none';
}

// ===== PROFILE =====
function loadProfileScreen() {
  const p = gameState.profile || {};
  $('avatar-preview') && ($('avatar-preview').textContent = p.avatar || '🌸');
  $('player-name') && ($('player-name').value = p.name || '');
  $('profile-stars') && ($('profile-stars').textContent = p.totalStars || 0);
  $('profile-best') && ($('profile-best').textContent = p.highScore || 0);
  $('profile-words') && ($('profile-words').textContent = p.totalWords || 0);
  $('profile-achievements') && ($('profile-achievements').textContent = (p.achievements?.length) || 0);
  $('voice-toggle') && ($('voice-toggle').checked = p.voiceEnabled !== false);

  document.querySelectorAll('.avatar-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.avatar === (p.avatar || '🌸'));
  });

  // Render achievements
  const stats = getAchievementStats(p);
  const countEl = document.getElementById('achievements-count');
  if (countEl) countEl.textContent = `${stats.unlocked} / ${stats.total}`;

  const catContainer = document.getElementById('achievements-categories');
  if (catContainer) {
    catContainer.innerHTML = '';
    for (const [key, cat] of Object.entries(stats.byCategory)) {
      const pill = document.createElement('div');
      pill.className = 'cat-pill';
      pill.innerHTML = `
        <span>${cat.icon} ${cat.label}</span>
        <div class="cat-bar"><div class="cat-bar-inner" style="width:${cat.pct}%;background:${cat.color}"></div></div>
        <span>${cat.unlocked}/${cat.total}</span>
      `;
      catContainer.appendChild(pill);
    }
  }

  const grid = document.getElementById('achievements-grid');
  if (grid) {
    grid.innerHTML = '';
    const all = getAllAchievements(p);
    for (const ach of all) {
      const item = document.createElement('div');
      item.className = `achievement-item ${ach.unlocked ? 'unlocked' : ''}`;
      item.innerHTML = `
        <div class="ach-icon">${ach.unlocked ? ach.icon : '🔒'}</div>
        <div class="ach-title">${ach.title}</div>
        <div class="ach-desc">${ach.desc}</div>
      `;
      grid.appendChild(item);
    }
  }
}

function saveProfileScreen() {
  const p = gameState.profile;
  p.name = $('player-name')?.value?.trim() || 'Player';
  p.avatar = document.querySelector('.avatar-btn.active')?.dataset?.avatar || '🌸';
  p.voiceEnabled = $('voice-toggle')?.checked !== false;
  saveProfile();
  updateMenuStats();
}

// ===== GARDEN SCREEN =====
const FLOWER_EMOJIS = {
  flower: '🌸', sunflower: '🌻', daisy: '🌼', tulip: '🌷', rose: '🌹'
};

function loadGardenScreen() {
  const p = gameState.profile || {};
  const garden = p.garden || [];
  const countEl = document.getElementById('garden-count');
  if (countEl) countEl.textContent = garden.length;

  const grid = document.getElementById('garden-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (garden.length === 0) {
    grid.innerHTML = `
      <div class="garden-empty">
        <div class="garden-empty-emoji">🌱</div>
        <p>Your garden is empty!</p>
        <p class="garden-empty-hint">Play levels to plant flowers here.</p>
      </div>
    `;
    return;
  }

  // Show most recent first, limit to 200 for performance
  const visible = garden.slice(-200).reverse();
  for (const f of visible) {
    const item = document.createElement('div');
    item.className = 'garden-item';
    const emoji = FLOWER_EMOJIS[f.type] || '🌸';
    const date = f.plantedAt ? new Date(f.plantedAt).toLocaleDateString() : '';
    item.innerHTML = `
      <div class="garden-flower">${emoji}</div>
      <div class="garden-word">${f.word || '?'}</div>
      <div class="garden-meta">Lv.${f.level || '?'} ${date}</div>
    `;
    grid.appendChild(item);
  }
}

// ===== EVENT BINDINGS =====
function bindEvents() {
  // Menu
  $('btn-start')?.addEventListener('click', () => {
    const tutorialSeen = gameState.profile?.tutorialSeen;
    if (!tutorialSeen) {
      gameState.profile.tutorialSeen = true;
      saveProfile();
      showScreen('game');
      showTutorial();
    } else {
      showScreen('game');
      startGame(1);
    }
  });
  
  $('btn-lesson-select')?.addEventListener('click', () => {
    showScreen('lesson-select');
    renderLevelCards();
    updateMenuStats();
  });
  
  $('btn-practice')?.addEventListener('click', () => {
    showScreen('practice');
    startPractice(1); // Start with lesson 1
  });
  
  $('btn-profile')?.addEventListener('click', () => {
    showScreen('profile');
    loadProfileScreen();
  });

  $('btn-garden')?.addEventListener('click', () => {
    showScreen('garden');
    loadGardenScreen();
  });

  // Back buttons
  $('btn-lesson-back')?.addEventListener('click', () => showScreen('menu'));
  $('btn-practice-back')?.addEventListener('click', () => showScreen('menu'));
  $('btn-profile-back')?.addEventListener('click', () => showScreen('menu'));
  $('btn-garden-back')?.addEventListener('click', () => showScreen('menu'));

  // Profile
  $('btn-save-profile')?.addEventListener('click', () => {
    saveProfileScreen();
    showScreen('menu');
  });
  
  // Avatar picker
  document.querySelectorAll('.avatar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.avatar-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $('avatar-preview').textContent = btn.dataset.avatar;
    });
  });

  // Game overlays
  $('btn-pause')?.addEventListener('click', togglePause);
  $('btn-resume')?.addEventListener('click', togglePause);
  $('btn-quit')?.addEventListener('click', () => {
    togglePause();
    showScreen('menu');
    updateMenuStats();
  });

  $('btn-next-level')?.addEventListener('click', () => {
    $('level-overlay').classList.add('hidden');
    if (gameState.level >= 10) {
      showScreen('menu');
      updateMenuStats();
    } else {
      showScreen('game');
      startGame(gameState.level + 1);
    }
  });

  $('btn-replay')?.addEventListener('click', () => {
    $('level-overlay').classList.add('hidden');
    showScreen('game');
    startGame(gameState.level);
  });

  $('btn-level-menu')?.addEventListener('click', () => {
    $('level-overlay').classList.add('hidden');
    showScreen('lesson-select');
    renderLevelCards();
  });

  $('btn-retry')?.addEventListener('click', () => {
    $('gameover-overlay').classList.add('hidden');
    showScreen('game');
    startGame(gameState.level);
  });

  $('btn-drill')?.addEventListener('click', () => {
    const weakKeys = getWeakKeys(gameState.keyAccuracy, 3);
    if (weakKeys.length === 0) return;
    const drillLesson = buildDrillLesson(weakKeys, gameState.profile);
    if (!drillLesson) return;
    gameState.drillLesson = drillLesson;
    $('gameover-overlay').classList.add('hidden');
    showScreen('game');
    startDrillMode(drillLesson);
  });

  $('btn-evolution-continue')?.addEventListener('click', () => {
    $('evolution-overlay')?.classList.add('hidden');
  });

  $('btn-menu')?.addEventListener('click', () => {
    $('gameover-overlay').classList.add('hidden');
    showScreen('menu');
    updateMenuStats();
  });

  // Tutorial
  document.querySelectorAll('.btn-tutorial-next').forEach(btn => {
    btn.addEventListener('click', nextTutorialSlide);
  });
  
  // Finger guide close
  $('btn-close-finger-guide')?.addEventListener('click', () => {
    $('finger-guide')?.classList.add('hidden');
  });
  
  $('btn-start-game')?.addEventListener('click', () => {
    $('tutorial-overlay').classList.add('hidden');
    startGame(1);
  });

  // Keyboard handler
  document.addEventListener('keydown', (e) => {
    if (gameState.screen === 'practice') handlePracticeKey(e);
  });
}

// ===== INIT =====
function init() {
  loadProfile();
  bindEvents();
  initEngine();
  updateMenuStats();
}

init();
