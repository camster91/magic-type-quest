/**
 * BloomType - Main Entry Point v2
 */
import { LESSON_LEVELS, getLessonByLevel, getFingerHint, getLessonWordsForPractice, isLevelUnlocked } from './lessonLevels.js';
import { gameState, loadProfile, saveProfile } from './state.js';
import { init as initEngine, startGame, togglePause, showScreen, showKeyFeedback, highlightTargetKey, startDrillMode, startDailyMoment } from './gameEngine.js';
import { MENU_TAGLINES, say, PET_NAME_DEFAULT } from './story.js';
import { getAchievementStats, getAllAchievements } from './achievements.js';
import { getTodaysQuests, getQuestCompletion, isStreakAtRisk } from './quests.js';
import { getWeakKeys, buildDrillLesson } from './drills.js';
import { getDueKeys } from './spacedRep.js';
import { joinClass } from './classroom.js';
import { escapeHTML } from './utils.js';

const $ = (id) => document.getElementById(id);

// ===== T15: one-word-centered pedagogy mode =====
// When this flag is on, gameplay uses the HTML .target-word overlay
// instead of canvas-falling words. No timer, no lives, no falling.
window.__bloomtypeT15Overlay = true;

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
  // Unique artwork per lesson where it exists. Lessons 4, 7, 8, 9, 10 fall back
  // to the big "master" badge — we render the lesson's emoji icon over it instead
  // of leaning on a generic illustration.
  const levelImages = {
    1: 'home-row.png', 2: 'top-row.png', 3: 'bottom-row.png',
    4: 'master.png', 5: 'capitals.png', 6: 'numbers.png',
    7: 'master.png', 8: 'master.png', 9: 'master.png', 10: 'master.png'
  };

  container.innerHTML = Object.values(LESSON_LEVELS).map(lev => {
    const unlocked = isLevelUnlocked(lev.id, gameState.profile);
    const done = completed.includes(lev.id);
    const status = done ? 'completed' : !unlocked ? 'locked' : 'play';
    const imgName = levelImages[lev.id] || 'home-row.png';
    // T15: build a "what this teaches" 1-line subtitle from the description.
    // T20: 90 char ceiling + 2-line clamp in CSS so the sentence reads clean
    // and never gets cut mid-word.
    const teaches = (lev.description || lev.subtitle || '').split(/[!?.]/)[0].trim();
    const shortTeaches = teaches.length > 90 ? teaches.slice(0, 88) + '…' : teaches;
    const lockHint = lev.id > 1 ? `Complete level ${lev.id - 1} to unlock` : 'Locked';
    
    return `
      <button type="button" class="level-card ${status}" data-level="${lev.id}" ${status === 'locked' ? 'disabled' : ''} aria-label="${lev.name}: ${shortTeaches}" title="${status === 'locked' ? lockHint : ''}">
        <div class="level-card-art">
          <img class="level-card-img" src="/assets/levels/${imgName}" alt="" aria-hidden="true"
               onerror="this.style.display='none'">
          <div class="level-card-icon" aria-hidden="true">${lev.icon || '⌨️'}</div>
          ${status === 'locked' ? `<div class="level-lock-art" aria-hidden="true"><span class="level-lock-icon">🔒</span><span class="level-lock-chip">LOCKED</span></div>` : ''}
        </div>
        <div class="level-card-name">${lev.name}</div>
        <div class="level-card-sub">${shortTeaches}</div>
        ${done ? '<div class="level-check" aria-hidden="true">✅</div>' : ''}
      </button>
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
  // T17: hide the bottom stats row when all values are 0 — a brand-new
  // player shouldn't see three zeroes under a "Type to plant" button.
  // The stats reappear as soon as the kid has any progress.
  const totalStats = (gameState.profile?.totalStars || 0)
                   + (gameState.profile?.highScore || 0)
                   + (gameState.profile?.totalWords || 0);
  const menuBottom = document.querySelector('#menu-screen .menu-bottom');
  if (menuBottom) menuBottom.classList.toggle('menu-bottom-empty', totalStats === 0);
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

  // F2: render the prominent streak card on the home screen.
  // States: streak=0 → hidden (no fake streak per F2 anti-features).
  //         streak>=7 → gold gradient. at-risk (>20h since last Daily Moment) → pulsing red border.
  const streakCard = document.getElementById('streak-prominent');
  if (streakCard) {
    const streakCountEl = document.getElementById('streak-count');
    if (streakCountEl) streakCountEl.textContent = streak;
    streakCard.classList.remove('streak-hidden', 'streak-gold', 'streak-at-risk');
    if (streak < 1) {
      streakCard.classList.add('streak-hidden');
    } else {
      if (streak >= 7) streakCard.classList.add('streak-gold');
      if (isStreakAtRisk(gameState.profile)) streakCard.classList.add('streak-at-risk');
    }
  }
  // T25: streak warning on the Daily Moment button. Surfaces only when
  // isStreakAtRisk is true (streak >= 2 AND last Daily Moment > 20h ago).
  // Hidden for brand-new players and for kids who already played today.
  const dmWrapper = document.getElementById('daily-moment-warning');
  const dmButton = document.getElementById('btn-daily-moment');
  const dmSubtitle = document.getElementById('btn-daily-moment-subtitle');
  const dmStreakChip = document.getElementById('btn-daily-moment-streak');
  const atRisk = isStreakAtRisk(gameState.profile);
  if (dmWrapper) dmWrapper.hidden = !atRisk;
  if (dmButton) dmButton.classList.toggle('at-risk', atRisk);
  if (dmSubtitle) dmSubtitle.textContent = atRisk ? 'Tap to keep your 🔥!' : '60s · low stress';
  if (dmStreakChip) dmStreakChip.textContent = atRisk && streak > 0 ? `🔥 ${streak} — at risk!` : '';
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
  // T17: daily-quests panel is intentionally hidden on the home screen.
  // The streak-prominent chip + .progress-card are the only quest
  // surfaces — one primary action, one focal point. The panel still
  // renders its DOM and gets updated so it's ready for any future
  // re-introduction (e.g. a dedicated quests screen), but it does not
  // appear on the home.
  const container = document.getElementById('daily-quests');
  if (container) container.style.display = 'none';

  // F3: pet hero on the home screen. Runs after streak/quest state above so
  // the at-risk and post-Daily-Moment signals are already known.
  updateHomePet();

  // T15: progress card on the home screen (level, next-up, mini-keyboard).
  updateHomeProgressCard();
}

// ===== T15: HOME PROGRESS CARD =====
// Populates the level badge, "next up" preview, progress fill, and the
// mini-keyboard that highlights mastered keys. Drives off profile state.
const HOME_ROW_KEYS = ['a','s','d','f','g','h','j','k','l'];
const TOP_ROW_KEYS = ['q','w','e','r','t','y','u','i','o','p'];
const BOTTOM_ROW_KEYS = ['z','x','c','v','b','n','m'];
const LEVEL_INFO = [
  { id: 1, name: 'Home Row',   keys: HOME_ROW_KEYS },
  { id: 2, name: 'Top Row',    keys: TOP_ROW_KEYS },
  { id: 3, name: 'Bottom Row', keys: BOTTOM_ROW_KEYS },
  { id: 4, name: 'All Letters', keys: [...HOME_ROW_KEYS, ...TOP_ROW_KEYS, ...BOTTOM_ROW_KEYS] },
  { id: 5, name: 'Capitals',   keys: null },
  { id: 6, name: 'Numbers',    keys: null },
];

function getCurrentLevelInfo() {
  const completed = gameState.profile?.completedLevels || [];
  let current = 1;
  for (const lv of [1,2,3,4,5,6]) {
    if (completed.includes(lv)) current = lv + 1;
  }
  if (current > 6) current = 6;
  return LEVEL_INFO.find(l => l.id === current) || LEVEL_INFO[0];
}

function updateHomeProgressCard() {
  const badge = document.getElementById('menu-level-badge');
  const next = document.getElementById('menu-level-next');
  const fill = document.getElementById('menu-level-fill');
  const mini = document.getElementById('menu-keyboard-mini');
  if (!badge || !mini) return;

  const level = getCurrentLevelInfo();
  const completed = gameState.profile?.completedLevels || [];
  const isComplete = completed.includes(level.id);
  const masteredSet = new Set();
  // Everything in levels 1..level.id-1 is mastered
  for (let i = 1; i < level.id; i++) {
    const prev = LEVEL_INFO.find(l => l.id === i);
    if (prev?.keys) for (const k of prev.keys) masteredSet.add(k);
  }

  badge.textContent = `Level ${level.id} · ${level.name}`;
  if (next) {
    if (isComplete) {
      next.textContent = `Level ${level.id} cleared — try the next!`;
    } else if (level.id >= 5) {
      next.textContent = `Keep going to become a Typing Master!`;
    } else {
      next.textContent = `Master the ${level.name.toLowerCase()} to unlock Lv ${level.id + 1}`;
    }
  }
  if (fill) {
    // Progress: % of completed levels out of 6
    const pct = (completed.length / 6) * 100;
    fill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  }

  // Mini-keyboard: show the active level's keys (or all if no specific keys)
  mini.innerHTML = '';
  const keys = level.keys || (isComplete ? [] : [...HOME_ROW_KEYS, ...TOP_ROW_KEYS, ...BOTTOM_ROW_KEYS]);
  for (const k of keys) {
    const span = document.createElement('span');
    span.className = 'km-key' + (masteredSet.has(k) ? ' mastered' : ' learning');
    span.textContent = k.toUpperCase();
    span.setAttribute('aria-label', k.toUpperCase() + (masteredSet.has(k) ? ' mastered' : ' learning'));
    mini.appendChild(span);
  }
  if (keys.length === 0) {
    const span = document.createElement('span');
    span.className = 'km-key';
    span.style.cssText = 'width:auto;padding:2px 8px;font-size:0.7rem';
    span.textContent = '🏆 All levels cleared!';
    mini.appendChild(span);
  }
}

// ===== F3: HOME PET HERO =====
// Renders the pet image, evolution dots, and warning/celebrate class on
// #pet-hero. Anti-features: reuses the 5 existing pet states, no new
// animations, no pet dialogue beyond what story.js provides, no
// customization UI. The pet is identity, not mechanic — the JS only
// picks the right PNG; the kid never has to "feed" it.
function updateHomePet() {
  const petHero = document.getElementById('pet-hero');
  const petImg = document.getElementById('pet-hero-img');
  const petBubble = document.getElementById('pet-hero-bubble');
  const evoContainer = document.getElementById('pet-evolution');
  if (!petHero || !petImg) return;

  const profile = gameState.profile || {};
  const avatar = profile.avatar || '🌸';
  const streak = profile.streak || 0;
  const lastDM = profile.lastDailyMomentDate;
  const atRisk = streak >= 1 && isStreakAtRisk(profile);

  // Pick the pet state. Celebrate flag is a transient window signal set
  // by gameEngine.endDailyMoment so the pet pops after a Daily Moment
  // completion. We auto-clear it after the animation lands.
  let state = 'idle';
  let bubbleText = '';
  if (window.__petHeroState === 'celebrate') {
    state = 'celebrate';
    window.__petHeroState = null; // single-shot
    bubbleText = 'Yay! 🎉';
  } else if (atRisk) {
    state = 'idle'; // base state; .warning class drives the shake + red glow
    bubbleText = streak >= 7 ? 'Tap me! 🏃' : 'Play to keep me! 💪';
  } else if (streak >= 7) {
    state = 'idle';
    bubbleText = `🔥 ${streak} days!`;
  } else if (streak >= 1) {
    state = 'idle';
    bubbleText = `${streak} day${streak === 1 ? '' : 's'}! Keep going!`;
  } else {
    state = 'idle';
    bubbleText = `Hi! I'm ${avatar} 🌸`;
  }

  // Apply class + image
  petHero.classList.remove('celebrate', 'warning');
  if (state === 'celebrate') petHero.classList.add('celebrate');
  if (atRisk) petHero.classList.add('warning');
  petImg.src = getPetPath(avatar, state);

  // Bubble: show for 2.4s when text changes; persistent while at-risk
  if (petBubble) {
    if (bubbleText && petBubble.textContent !== bubbleText) {
      petBubble.textContent = bubbleText;
      petBubble.classList.add('visible');
      if (petBubble._hideTimer) clearTimeout(petBubble._hideTimer);
      petBubble._hideTimer = setTimeout(() => {
        if (!atRisk) petBubble.classList.remove('visible');
      }, 2400);
    } else if (atRisk) {
      petBubble.classList.add('visible');
    }
  }

  // Evolution dots — drive from profile.petEvolution (1/2/3)
  if (evoContainer) {
    const stage = Math.max(1, Math.min(3, profile.petEvolution || 1));
    evoContainer.querySelectorAll('.evo-dot').forEach((dot) => {
      const dotStage = parseInt(dot.dataset.stage, 10);
      dot.classList.toggle('active', dotStage === stage);
    });
  }
}

// Trigger a one-shot celebrate on the home pet. Called by
// gameEngine.endDailyMoment via window.__triggerPetHeroCelebrate so
// the pet pops when the kid lands back on the menu after a Daily
// Moment session. Equivalent to setting window.__petHeroState = 'celebrate'
// and calling __refreshMenuStats().
function triggerPetHeroCelebrate() {
  window.__petHeroState = 'celebrate';
  // Re-render the home pet now (in case the menu is already on screen)
  if (typeof updateHomePet === 'function') updateHomePet();
  // Also refresh streak/quest numbers in case the session just bumped them
  if (typeof window.__refreshMenuStats === 'function') window.__refreshMenuStats();
}

// ===== PROFILE =====
import { getPetPath } from './assets.js';

function loadProfileScreen() {
  const p = gameState.profile || {};
  const avatar = p.avatar || '🌸';
  // Update both the kawaii image and the emoji fallback
  const img = $('avatar-preview-img');
  if (img) img.src = getPetPath(avatar, 'idle');
  const emoji = $('avatar-preview-emoji');
  if (emoji) emoji.textContent = avatar;
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

  // Render spaced-repetition review section
  const reviewContainer = document.getElementById('review-keys');
  if (reviewContainer) {
    const due = getDueKeys(p, 6);
    if (due.length > 0) {
      reviewContainer.innerHTML = `
        <div class="review-header">🔄 Keys to Review</div>
        <div class="review-list">${due.map(k => `<span class="review-key">${k.toUpperCase()}</span>`).join('')}</div>
      `;
      reviewContainer.style.display = 'block';
    } else {
      reviewContainer.innerHTML = '';
      reviewContainer.style.display = 'none';
    }
  }
}

function saveProfileScreen() {
  const p = gameState.profile;
  const oldAvatar = p.avatar;
  p.name = $('player-name')?.value?.trim() || 'Player';
  p.avatar = document.querySelector('.avatar-btn.active')?.dataset?.avatar || '🌸';
  p.voiceEnabled = $('voice-toggle')?.checked !== false;
  const code = $('class-code')?.value?.trim();
  if (code) joinClass(p, code);
  saveProfile();
  updateMenuStats();
  // If the avatar changed, invalidate pet image cache and reload for current state
  if (oldAvatar !== p.avatar && typeof onAvatarChanged === 'function') {
    onAvatarChanged();
  }
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
      <div class="garden-word">${escapeHTML(f.word || '?')}</div>
      <div class="garden-meta">Lv.${f.level || '?'} ${date}</div>
    `;
    grid.appendChild(item);
  }
}

// ===== EVENT BINDINGS =====
function bindEvents() {
  // Menu
  $('btn-daily-moment')?.addEventListener('click', () => {
    startDailyMoment();
  });

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
      // Update both the kawaii image preview and the emoji fallback
      const avatar = btn.dataset.avatar;
      const img = $('avatar-preview-img');
      if (img) img.src = getPetPath(avatar, 'idle');
      const emoji = $('avatar-preview-emoji');
      if (emoji) emoji.textContent = avatar;
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
  // F1: let gameEngine's endDailyMoment refresh the menu's stats
  // (streak counter, lastDailyMomentDate label, quest progress) without
  // having to import updateMenuStats from this module.
  window.__refreshMenuStats = updateMenuStats;
  // F3: let gameEngine's endDailyMoment trigger a one-shot pet celebrate
  // when the kid lands back on the menu after a Daily Moment.
  window.__triggerPetHeroCelebrate = triggerPetHeroCelebrate;
}

init();
