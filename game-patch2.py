import re

new_code = """

// ===== ADAPTIVE DIFFICULTY ENGINE =====
function checkAdaptiveDifficulty() {
	const now = performance.now();
	const windowMs = 15000;
	const history = gameState.wordTimes.filter((t) => now - t.t < windowMs);
	gameState.wordTimes = history;
	if (history.length < 5) return;
	const avgAccuracy = gameState.totalKeystrokes > 0 ? (gameState.correctKeystrokes / gameState.totalKeystrokes) : 1;
	const wpm = history.length / (windowMs / 60000);
	const oldMod = gameState.difficultyMod;
	if (avgAccuracy > 0.85 && wpm > 15) {
		gameState.difficultyMod = Math.min(oldMod + 1, 3);
	} else if (avgAccuracy < 0.60 && wpm < 10 && oldMod > -2) {
		gameState.difficultyMod = Math.max(oldMod - 1, -2);
	}
	if (oldMod !== gameState.difficultyMod) {
		updateDifficultyBadge();
		showPowerUp(gameState.difficultyMod > oldMod ? "⚡ Speeding up!" : "🐢 Slowing down...");
	}
}

function getAdaptiveSpeed() {
	const base = getLevelConfig(gameState.level).speed;
	return base * (1 + gameState.difficultyMod * 0.15);
}

function getAdaptiveSpawnRate() {
	const base = getLevelConfig(gameState.level).spawnRate;
	return base * (1 - gameState.difficultyMod * 0.10);
}

function updateDifficultyBadge() {
	const badge = document.getElementById("difficulty-badge");
	if (!badge) return;
	const mod = gameState.difficultyMod;
	let label = "Normal";
	let color = "var(--text-dim)";
	if (mod <= -2) { label = "Easy 😌"; color = "#34D399"; }
	else if (mod === -1) { label = "Gentle 🙂"; color = "#A78BFA"; }
	else if (mod === 0) { label = "Normal 😊"; color = "var(--text-dim)"; }
	else if (mod === 1) { label = "Challenging 😤"; color = "#FBBF24"; }
	else if (mod === 2) { label = "Hard 🔥"; color = "#F472B6"; }
	else if (mod >= 3) { label = "EXTREME! 💀"; color = "#EF4444"; }
	badge.textContent = "Level " + gameState.level + " — " + label;
	badge.style.color = color;
	badge.style.borderColor = color;
	badge.classList.add("active");
}

function showPowerUp(text) {
	const el = document.getElementById("powerup-indicator");
	if (!el) return;
	el.textContent = text;
	el.classList.add("active");
	setTimeout(() => el.classList.remove("active"), 2000);
}

// ===== TYPING PET =====
function showPetReaction(type, text) {
	text = text || "";
	const pet = document.getElementById("pet-emoji");
	const bubble = document.getElementById("pet-bubble");
	if (!pet || !bubble) return;
	pet.classList.remove("happy", "celebrate", "sad", "shake");
	void pet.offsetWidth;
	const reactions = {
		"happy": { emoji: "🐉", msg: "Nice!", class: "happy" },
		"combo": { emoji: "🔥", msg: "On fire!", class: "celebrate" },
		"levelup": { emoji: "🎉", msg: "Level up!", class: "celebrate" },
		"miss": { emoji: "😵", msg: "Oops!", class: "sad" },
		"hurt": { emoji: "😢", msg: "Watch out!", class: "sad" },
		"idle": { emoji: "🐉", msg: "", class: "" },
	};
	const r = reactions[type] || reactions.idle;
	pet.textContent = r.emoji;
	if (r.class) pet.classList.add(r.class);
	if (r.msg) {
		bubble.textContent = text || r.msg;
		bubble.classList.add("visible");
		setTimeout(() => bubble.classList.remove("visible"), 1500);
	}
}

// ===== SCREEN SHAKE =====
function screenShake() {
	const game = document.getElementById("game-screen");
	if (!game) return;
	game.classList.remove("shake-screen");
	void game.offsetWidth;
	game.classList.add("shake-screen");
	setTimeout(() => game.classList.remove("shake-screen"), 400);
}

// ===== WORD POPUP =====
function showWordPopup(word) {
	const popup = document.getElementById("word-popup");
	const emoji = document.getElementById("word-popup-emoji");
	const text = document.getElementById("word-popup-text");
	if (!popup || !emoji || !text) return;
	const em = WORD_EMOJIS[word.toLowerCase()] || "⭐";
	emoji.textContent = em;
	text.textContent = word;
	popup.classList.remove("hidden");
	void popup.offsetWidth;
	popup.classList.add("visible");
	setTimeout(() => {
		popup.classList.remove("visible");
		setTimeout(() => popup.classList.add("hidden"), 350);
	}, 1200);
}

// ===== ACHIEVEMENTS =====
const ACHIEVEMENTS = {
	"first_word": { title: "First Word!", desc: "Type your very first word", icon: "🎯", check(s) { return s.wordsTyped >= 1; } },
	"combo_starter": { title: "Combo Starter", desc: "Get a 5-word combo streak", icon: "🔥", check(s) { return s.maxCombo >= 5; } },
	"combo_master": { title: "Combo Master", desc: "Get a 10-word combo streak", icon: "⚡", check(s) { return s.maxCombo >= 10; } },
	"combo_champion": { title: "Combo Champion", desc: "Get a 20-word combo streak!", icon: "🏆", check(s) { return s.maxCombo >= 20; } },
	"word_warrior": { title: "Word Warrior", desc: "Type 50 total words in the game", icon: "⚔️", check(s) { return s.wordsTyped >= 50; } },
	"accuracy_ace": { title: "Accuracy Ace", desc: "Type 20 words with 95%+ accuracy", icon: "⭐", check(s) { return s.totalKeystrokes > 0 && (s.correctKeystrokes / s.totalKeystrokes) >= 0.95 && s.wordsTyped >= 20; } },
};

function checkAchievements() {
	for (const [key, ach] of Object.entries(ACHIEVEMENTS)) {
		if (gameState.achievementsUnlocked[key]) continue;
		if (ach.check(gameState)) {
			gameState.achievementsUnlocked[key] = true;
			gameState.profile.totalStars += 25;
			saveProfile();
			showAchievementToast(ach.title, ach.desc, ach.icon);
		}
	}
}

function showAchievementToast(title, desc, icon) {
	const toast = document.getElementById("achievement-toast");
	if (!toast) return;
	document.getElementById("toast-title").textContent = title;
	document.getElementById("toast-desc").textContent = desc;
	document.getElementById("toast-icon").textContent = icon;
	toast.classList.remove("hidden");
	void toast.offsetWidth;
	toast.classList.add("visible");
	setTimeout(() => {
		toast.classList.remove("visible");
		setTimeout(() => toast.classList.add("hidden"), 500);
	}, 3000);
}

// ===== LEVEL PROGRESS =====
function updateLevelProgress() {
	const fill = document.getElementById("level-progress-fill");
	const wrap = document.getElementById("level-progress-wrap");
	if (!fill || !wrap) return;
	const cfg = getLevelConfig(gameState.level);
	const pct = cfg.words > 0 ? (gameState.wordsCompleted / cfg.words) * 100 : 0;
	fill.style.width = String(Math.min(pct, 100)) + "%";
	wrap.style.display = gameState.screen === "game" ? "block" : "none";
}
"""

with open('/home/camst/typing-kids-game/game.js', 'a') as f:
    f.write(new_code)

print('Appended new functions to game.js')
