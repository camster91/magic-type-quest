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
	garden: [], // { type, x, scale, life } - flowers grown on ground
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

	// ===== LESSON SYSTEM =====
	currentLesson: 1,
	lessonMode: false, // true when in practice lesson mode
	lessonWords: [], // words for current lesson
	lessonWordIndex: 0, // current word in lesson
	lessonStats: {
		accuracy: 0,
		wpm: 0,
		wordsTyped: 0,
		correctKeystrokes: 0,
		totalKeystrokes: 0,
		startTime: 0,
	},
	// ===== STRUGGLE DETECTION =====
	strugglingMode: false,
	confidenceLevel: 1, // 0=struggling, 1=normal, 2=confident
	recentKeystrokes: [], // {key, correct} for last N keystrokes
	wrongStreak: 0, // consecutive wrong keystrokes
	correctStreak: 0, // consecutive correct keystrokes
	flashEffect: 0, // for screen flashes
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
		if (!raw.lessonsCompleted) raw.lessonsCompleted = [];
		if (!raw.lessonBestScores) raw.lessonBestScores = {};
		if (!raw.petSelected) raw.petSelected = "flower";
		if (!raw.petsUnlocked) raw.petsUnlocked = ["flower"];
		if (!raw.totalWPM) raw.totalWPM = 0;
		if (!raw.bestAccuracy) raw.bestAccuracy = 0;
		return raw;
	} catch {
		// Return default profile and save it
		const defaultProfile = {
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
			lessonsCompleted: [],
			lessonBestScores: {},
			petSelected: "flower",
			petsUnlocked: ["flower"],
			totalWPM: 0,
			bestAccuracy: 0,
		};
		// Save default profile to localStorage
		try {
			const toSave = { ...defaultProfile };
			toSave.daysPlayed = [];
			localStorage.setItem("mtp_profile", JSON.stringify(toSave));
		} catch {}
		return defaultProfile;
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
