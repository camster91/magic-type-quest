/**
 * BloomType - Main Entry Point v2
 */
import { LESSON_LEVELS, getLessonByLevel, isLevelUnlocked, getFingerHint } from './lessonLevels.js';
import { gameState, loadProfile, saveProfile } from './state.js';
import { init as initEngine, startGame, togglePause, showScreen } from './gameEngine.js';

const $ = (id) => document.getElementById(id);

// ===== PRACTICE MODE =====
let practiceIndex = 0;
const practiceLetters = 'abcdefghijklmnopqrstuvwxyz'.split('');

function updatePracticeDisplay() {
  const char = practiceLetters[practiceIndex].toUpperCase();
  $('practice-char-display').textContent = char;
  $('practice-hint').innerHTML = `Press <kbd>${char}</kbd> on your keyboard`;
  $('practice-count').textContent = `${practiceIndex + 1} / 26`;
  $('practice-fill').style.width = `${(practiceIndex / 26) * 100}%`;
  
  const hint = getFingerHint(char.toLowerCase());
  $('practice-finger-hint').textContent = hint ? `Use your ${hint.label}` : '';
}

function handlePracticeKey(e) {
  if (gameState.screen !== 'practice') return;
  if (e.repeat) return;
  
  const expected = practiceLetters[practiceIndex];
  const key = e.key.toLowerCase();
  
  if (key === expected) {
    practiceIndex++;
    if (practiceIndex >= 26) {
      practiceIndex = 0;
      showAchievement('Alphabet Master', 'All 26 letters!', '🔤');
    }
    updatePracticeDisplay();
  } else if (key.length === 1 && /[a-z]/.test(key)) {
    // Wrong letter
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
}

function saveProfileScreen() {
  const p = gameState.profile;
  p.name = $('player-name')?.value?.trim() || 'Player';
  p.avatar = document.querySelector('.avatar-btn.active')?.dataset?.avatar || '🌸';
  p.voiceEnabled = $('voice-toggle')?.checked !== false;
  saveProfile();
  updateMenuStats();
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
    practiceIndex = 0;
    updatePracticeDisplay();
  });
  
  $('btn-profile')?.addEventListener('click', () => {
    showScreen('profile');
    loadProfileScreen();
  });

  // Back buttons
  $('btn-lesson-back')?.addEventListener('click', () => showScreen('menu'));
  $('btn-practice-back')?.addEventListener('click', () => showScreen('menu'));
  $('btn-profile-back')?.addEventListener('click', () => showScreen('menu'));

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
      // Final level complete - go to menu
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
