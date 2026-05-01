// ===== GAME STATE =====
export const gameState = {
	screen: "menu",
	level: 1,
	score: 0,
	combo: 0,
	maxCombo: 0,
	health: 5,
	wordsTyped: 0,
	totalKeystrokes: 0,
	correctKeystrokes: 0,
	activeWords: [],
	particles: [],
	stars: [],
		targetWord: null,
	targetIndex: 0,
	paused: false,
	gameOver: false,
	lastSpawn: 0,
	levelStartTime: 0,
	wordsSpawned: 0,
	wordsCompleted: 0,
	canvasW: 0,
	canvasH: 0,
	frameTime: 0,
	animationId: null,
	challenge: null,
	challengeProgress: 0,
	profile: loadProfile(),
};

export function loadProfile() {
	try {
		const raw = JSON.parse(localStorage.getItem("mtp_profile"));
		if (!raw || typeof raw !== "object") throw new Error("invalid profile");
		// Restore daysPlayed from array (Set doesn't survive JSON.stringify)
		if (!(raw.daysPlayed instanceof Set)) {
			raw.daysPlayed = new Set(
				Array.isArray(raw.daysPlayed) ? raw.daysPlayed : [],
			);
		}
		// Fallback missing fields for forward compatibility
		if (!raw.levelsUnlocked) raw.levelsUnlocked = 1;
		if (!raw.unlockedAvatars) raw.unlockedAvatars = ["🦄"];
		if (!raw.challenges) raw.challenges = {};
		if (!raw.achievements) raw.achievements = {};
		return raw;
	} catch {
		return {
			name: "",
			avatar: "🦄",
			totalStars: 0,
			highScore: 0,
			totalWords: 0,
			totalTime: 0,
			daysPlayed: new Set(),
			levelsUnlocked: 1,
			challenges: {},
			achievements: {},
			unlockedAvatars: ["🦄"],
		};
	}
}

export function saveProfile() {
	try {
		const toSave = { ...gameState.profile };
		// Set does not survive JSON.stringify — convert to array
		toSave.daysPlayed = Array.from(gameState.profile.daysPlayed);
		localStorage.setItem("mtp_profile", JSON.stringify(toSave));
	} catch {}
}

/** Set tutorial-seen flag safely (works even in Safari private mode) */
export function setTutorialSeen() {
	try {
		localStorage.setItem("mtp_tutorial_seen", "1");
	} catch {}
}

