/**
 * ✨ Bloom Typing ✨
 * A beautiful typing game for kids - full Canvas game engine
 */

// ===== AUDIO ENGINE =====
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
	if (audioCtx) {
		if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
		return;
	}
	try {
		audioCtx = new AudioCtx();
	} catch {
		// Audio blocked — game works silently
	}
}

function playSound(type) {
	if (!audioCtx) return;
	const osc = audioCtx.createOscillator();
	const gain = audioCtx.createGain();
	osc.connect(gain);
	gain.connect(audioCtx.destination);
	const now = audioCtx.currentTime;

	switch (type) {
		case "correct":
			osc.type = "sine";
			osc.frequency.setValueAtTime(880, now);
			osc.frequency.exponentialRampToValueAtTime(1318, now + 0.1);
			gain.gain.setValueAtTime(0.15, now);
			gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
			osc.start(now);
			osc.stop(now + 0.2);
			break;
		case "wrong":
			osc.type = "sawtooth";
			osc.frequency.setValueAtTime(200, now);
			osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
			gain.gain.setValueAtTime(0.1, now);
			gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
			osc.start(now);
			osc.stop(now + 0.2);
			break;
		case "word":
			osc.type = "sine";
			[659, 784, 1047].forEach((freq, i) => {
				const o = audioCtx.createOscillator();
				const g = audioCtx.createGain();
				o.connect(g);
				g.connect(audioCtx.destination);
				o.frequency.setValueAtTime(freq, now + i * 0.1);
				g.gain.setValueAtTime(0.12, now + i * 0.1);
				g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);
				o.start(now + i * 0.1);
				o.stop(now + i * 0.1 + 0.2);
			});
			break;
		case "level":
			[523, 659, 784, 1047, 1318].forEach((freq, i) => {
				setTimeout(() => {
					if (!audioCtx) return;
					const o = audioCtx.createOscillator();
					const g = audioCtx.createGain();
					o.connect(g);
					g.connect(audioCtx.destination);
					o.frequency.setValueAtTime(freq, audioCtx.currentTime);
					g.gain.setValueAtTime(0.12, audioCtx.currentTime);
					g.gain.exponentialRampToValueAtTime(
						0.001,
						audioCtx.currentTime + 0.25,
					);
					o.start(audioCtx.currentTime);
					o.stop(audioCtx.currentTime + 0.25);
				}, i * 120);
			});
			break;
		case "gameover":
			[400, 350, 300, 200].forEach((freq, i) => {
				setTimeout(() => {
					if (!audioCtx) return;
					const o = audioCtx.createOscillator();
					const g = audioCtx.createGain();
					o.connect(g);
					g.connect(audioCtx.destination);
					o.frequency.setValueAtTime(freq, audioCtx.currentTime);
					o.type = "sawtooth";
					g.gain.setValueAtTime(0.1, audioCtx.currentTime);
					g.gain.exponentialRampToValueAtTime(
						0.001,
						audioCtx.currentTime + 0.3,
					);
					o.start(audioCtx.currentTime);
					o.stop(audioCtx.currentTime + 0.3);
				}, i * 180);
			});
			break;
		case "heart": {
			const o = audioCtx.createOscillator();
			const g = audioCtx.createGain();
			o.connect(g);
			g.connect(audioCtx.destination);
			o.type = "sine";
			o.frequency.setValueAtTime(523, now);
			o.frequency.exponentialRampToValueAtTime(784, now + 0.15);
			g.gain.setValueAtTime(0.15, now);
			g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
			o.start(now);
			o.stop(now + 0.25);
			break;
		}
		case "combo": {
			const c = audioCtx.createOscillator();
			const cg = audioCtx.createGain();
			c.connect(cg);
			cg.connect(audioCtx.destination);
			c.type = "triangle";
			const base = 440 + Math.min(Math.max(gameState.combo - 1, 0), 8) * 65;
			c.frequency.setValueAtTime(base, now);
			c.frequency.exponentialRampToValueAtTime(base * 1.5, now + 0.1);
			cg.gain.setValueAtTime(0.12, now);
			cg.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
			c.start(now);
			c.stop(now + 0.2);
			break;
		}
	}
}

// ===== DATA =====
const WORD_LISTS = {
	1: [
		"cat",
		"dog",
		"sun",
		"hat",
		"cup",
		"red",
		"big",
		"run",
		"fun",
		"bed",
		"box",
		"net",
		"pen",
		"pig",
		"van",
		"zoo",
		"ant",
		"bee",
		"cow",
		"fox",
		"owl",
		"rat",
		"bat",
		"bug",
		"egg",
		"jam",
		"leg",
		"mop",
		"nut",
		"pet",
		"rug",
		"tag",
		"web",
		"yam",
		"zip",
	],
	2: [
		"cake",
		"fish",
		"door",
		"tree",
		"bird",
		"moon",
		"star",
		"duck",
		"frog",
		"hand",
		"jump",
		"king",
		"lamp",
		"milk",
		"nose",
		"open",
		"pink",
		"queen",
		"rain",
		"shoe",
		"toy",
		"unicorn",
		"vase",
		"wall",
		"yarn",
		"zebra",
		"book",
		"candy",
		"dance",
		"eagle",
		"fairy",
		"gift",
		"happy",
		"ice",
		"jelly",
		"kite",
		"lion",
		"magic",
		"nest",
		"orange",
		"puppy",
		"quiet",
		"rose",
		"smile",
		"tiger",
		"under",
		"violet",
		"wolf",
		"xray",
		"yellow",
	],
	3: [
		"apple",
		"beach",
		"cloud",
		"dance",
		"earth",
		"flame",
		"garden",
		"honey",
		"island",
		"jewel",
		"kiwi",
		"lemon",
		"melon",
		"night",
		"ocean",
		"pearl",
		"queen",
		"robot",
		"shell",
		"tulip",
		"unicorn",
		"violet",
		"water",
		"xray",
		"yogurt",
		"zebra",
		"angel",
		"butterfly",
		"castle",
		"diamond",
		"emerald",
		"flower",
		"glitter",
		"heaven",
		"island",
		"jasmine",
		"kingdom",
		"lullaby",
		"moonlight",
		"nebula",
		"orchid",
		"paradise",
		"rainbow",
		"stardust",
		"treasure",
		"universe",
		"velvet",
		"wonder",
		"xylophone",
		"yesterday",
	],
	4: [
		"rainbow",
		"butterfly",
		"fireworks",
		"wonderful",
		"beautiful",
		"chocolate",
		"marshmallow",
		"sparkling",
		"glittering",
		"adventure",
		"enchanted",
		"fairyland",
		"starlight",
		"moonbeams",
		"daydreams",
		"treasure",
		"kingdom",
		"friendship",
		"happiness",
		"champion",
		"chocolate",
		"dandelion",
		"fantastic",
		"glistening",
		"jellybean",
		"lollypop",
		"macaroon",
		"mermaid",
		"nighttime",
		"parachute",
		"quest",
		"rosebud",
		"sunshine",
		"twilight",
		"underwater",
		"vacation",
		"waterfall",
		"xylophone",
		"yesterday",
		"zeppelin",
		"carousel",
		"dolphins",
		"elephant",
		"football",
		"gorgeous",
		"honeybee",
		"icecream",
		"juggling",
		"kangaroo",
		"laughter",
	],
	5: [
		"fantastical",
		"marvellous",
		"butterflies",
		"marshmallow",
		"chocolates",
		"adventures",
		"wonderland",
		"glistening",
		"champignon",
		"beautifully",
		"dandelion",
		"butterscotch",
		"jellybeans",
		"lollipops",
		"macaroons",
		"mermaids",
		"nightingale",
		"pirouettes",
		"rainbow",
		"sunflower",
		"twinkling",
		"underwater",
		"volleyball",
		"wonderful",
		"xenophobia",
		"youngsters",
		"zoological",
	],
};

const LEVEL_CONFIG = {
	1: { words: 10, speed: 0.4, spawnRate: 3500, health: 5 },
	2: { words: 12, speed: 0.5, spawnRate: 3200, health: 5 },
	3: { words: 14, speed: 0.6, spawnRate: 3000, health: 5 },
	4: { words: 15, speed: 0.7, spawnRate: 2800, health: 5 },
	5: { words: 16, speed: 0.75, spawnRate: 2600, health: 5 },
	6: { words: 18, speed: 0.85, spawnRate: 2400, health: 5 },
	7: { words: 20, speed: 0.9, spawnRate: 2200, health: 4 },
	8: { words: 22, speed: 1.0, spawnRate: 2000, health: 4 },
	9: { words: 25, speed: 1.1, spawnRate: 1900, health: 4 },
	10: { words: 30, speed: 1.2, spawnRate: 1700, health: 3 },
};
function getLevelConfig(lvl) {
	if (LEVEL_CONFIG[lvl]) return LEVEL_CONFIG[lvl];
	return {
		words: 30 + (lvl - 10) * 2,
		speed: Math.min(1.2 + (lvl - 10) * 0.08, 2.5),
		spawnRate: Math.max(1700 - (lvl - 10) * 50, 800),
		health: 3,
	};
}
function getWordList(lvl) {
	const key = Math.min(lvl, 5);
	return WORD_LISTS[key] || WORD_LISTS[1];
}
// ===== WORD EMOJIS =====
const WORD_EMOJIS = {
	cat: "🐱",
	dog: "🐶",
	sun: "☀️",
	hat: "🧢",
	cup: "☕",
	red: "🔴",
	big: "📏",
	run: "🏃",
	fun: "🎉",
	bed: "🛏️",
	box: "📦",
	net: "🕸️",
	pen: "✏️",
	pig: "🐷",
	van: "🚐",
	zoo: "🦁",
	ant: "🐜",
	bee: "🐝",
	cow: "🐮",
	fox: "🦊",
	owl: "🦉",
	rat: "🐀",
	bat: "🦇",
	bug: "🐛",
	egg: "🥚",
	jam: "🍓",
	leg: "🦵",
	mop: "🧹",
	nut: "🥜",
	pet: "🐕",
	rug: "🧶",
	tag: "🏷️",
	web: "🕸️",
	yam: "🍠",
	zip: "🤐",
	cake: "🎂",
	fish: "🐟",
	door: "🚪",
	tree: "🌳",
	bird: "🐦",
	moon: "🌙",
	star: "⭐",
	duck: "🦆",
	frog: "🐸",
	hand: "✋",
	jump: "🤸",
	king: "👑",
	lamp: "💡",
	milk: "🥛",
	nose: "👃",
	open: "📂",
	pink: "🩷",
	queen: "👸",
	rain: "🌧️",
	shoe: "👟",
	toy: "🧸",
	unicorn: "🦄",
	vase: "🏺",
	wall: "🧱",
	yarn: "🧵",
	zebra: "🦓",
	book: "📚",
	candy: "🍬",
	dance: "💃",
	eagle: "🦅",
	fairy: "🧚",
	gift: "🎁",
	happy: "😊",
	ice: "🧊",
	jelly: "🍇",
	kite: "🪁",
	lion: "🦁",
	magic: "✨",
	nest: "🪺",
	orange: "🍊",
	puppy: "🐶",
	quiet: "🤫",
	rose: "🌹",
	smile: "🙂",
	tiger: "🐯",
	under: "⬇️",
	violet: "🟣",
	water: "💧",
	xray: "🩻",
	yellow: "🟡",
	apple: "🍎",
	beach: "🏖️",
	cloud: "☁️",
	earth: "🌍",
	flame: "🔥",
	garden: "🏡",
	honey: "🍯",
	island: "🏝️",
	jewel: "💎",
	kiwi: "🥝",
	lemon: "🍋",
	melon: "🍈",
	night: "🌃",
	ocean: "🌊",
	pearl: "🦪",
	robot: "🤖",
	shell: "🐚",
	tulip: "🌷",
	yogurt: "🥛",
	angel: "😇",
	butterfly: "🦋",
	castle: "🏰",
	diamond: "💎",
	emerald: "❇️",
	flower: "🌸",
	glitter: "✨",
	heaven: "☁️",
	jasmine: "🌼",
	kingdom: "👑",
	lullaby: "🎵",
	moonlight: "🌙",
	nebula: "🌌",
	orchid: "🌺",
	paradise: "🏝️",
	rainbow: "🌈",
	stardust: "✨",
	treasure: "💰",
	universe: "🌌",
	velvet: "🪵",
	wonder: "🤩",
	xylophone: "🎹",
	yesterday: "📅",
	fireworks: "🎆",
	wonderful: "🤩",
	beautiful: "💐",
	chocolate: "🍫",
	marshmallow: "🍡",
	sparkling: "✨",
	glittering: "✨",
	adventure: "🗺️",
	enchanted: "✨",
	fairyland: "🧚",
	starlight: "⭐",
	moonbeams: "🌙",
	daydreams: "💭",
	friendship: "🤝",
	happiness: "😄",
	champion: "🏆",
	dandelion: "🌼",
	fantastic: "🤩",
	glistening: "✨",
	jellybeans: "🍬",
	lollypop: "🍭",
	macaroon: "🥐",
	mermaid: "🧜",
	nightingale: "🐦",
	saffron: "🟨",
	carrot: "🥕",
	mango: "🥭",
	peach: "🍑",
	grape: "🍇",
	coconut: "🥥",
	pizza: "🍕",
	burger: "🍔",
	donut: "🍩",
	cookie: "🍪",
	pancake: "🥞",
	cereal: "🥣",
	cheese: "🧀",
	bread: "🍞",
	salad: "🥗",
	soup: "🍲",
	spaghetti: "🍝",
	taco: "🌮",
	sushi: "🍣",
	noodle: "🍜",
};

function getWordEmoji(word) {
	return WORD_EMOJIS[word.toLowerCase()] || "⭐";
}

// ===== GAME STATE =====
const gameState = {
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

function loadProfile() {
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

function saveProfile() {
	try {
		const toSave = { ...gameState.profile };
		// Set does not survive JSON.stringify — convert to array
		toSave.daysPlayed = Array.from(gameState.profile.daysPlayed);
		localStorage.setItem("mtp_profile", JSON.stringify(toSave));
	} catch {}
}

/** Set tutorial-seen flag safely (works even in Safari private mode) */
function setTutorialSeen() {
	try {
		localStorage.setItem("mtp_tutorial_seen", "1");
	} catch {}
}

// ===== DOM ELEMENTS =====
const $ = (id) => document.getElementById(id);
const canvas = $("game-canvas");
const ctx = canvas.getContext("2d");

// ===== STARS BACKGROUND =====
function initStars() {
	gameState.stars = [];
	for (let i = 0; i < 80; i++) {
		gameState.stars.push({
			x: Math.random() * gameState.canvasW,
			y: Math.random() * gameState.canvasH,
			size: Math.random() * 2 + 0.5,
			twinkleSpeed: Math.random() * 3 + 1,
			twinkleOffset: Math.random() * Math.PI * 2,
		});
	}
}

function drawStars(_dt) {
	const time = performance.now() / 1000;
	for (const s of gameState.stars) {
		const alpha =
			0.3 +
			0.7 * (0.5 + 0.5 * Math.sin(time * s.twinkleSpeed + s.twinkleOffset));
		ctx.globalAlpha = alpha;
		ctx.fillStyle = "#fff";
		ctx.beginPath();
		ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.globalAlpha = 1;
}

// ===== PARTICLES =====
function spawnParticles(x, y, color, count = 15, type = "burst") {
	for (let i = 0; i < count; i++) {
		const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
		const speed =
			type === "burst" ? 2 + Math.random() * 4 : 1 + Math.random() * 2;
		gameState.particles.push({
			x,
			y,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed - (type === "burst" ? 2 : 0),
			life: 1,
			decay: 0.02 + Math.random() * 0.02,
			color,
			size: type === "burst" ? 3 + Math.random() * 4 : 2 + Math.random() * 2,
			type,
		});
	}
}

function updateParticles(_dt) {
	for (let i = gameState.particles.length - 1; i >= 0; i--) {
		const p = gameState.particles[i];
		p.x += p.vx;
		p.y += p.vy;
		p.vy += 0.08; // gravity
		p.life -= p.decay;
		if (p.life <= 0) gameState.particles.splice(i, 1);
	}
}

function drawParticles() {
	for (const p of gameState.particles) {
		ctx.globalAlpha = Math.max(0, p.life);
		ctx.fillStyle = p.color;
		ctx.beginPath();
		ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.globalAlpha = 1;
}

// ===== WORDS =====
class FallingWord {
	constructor(text, speed) {
		this.text = text;
		this.speed = speed;
		// Measure with correct font so x-position is accurate (was using stale font)
		const fontSize = Math.max(20, Math.min(32, Math.floor(gameState.canvasW / 30)));
		ctx.font = `700 ${fontSize}px Nunito, sans-serif`;
		const textW = ctx.measureText(text).width;
		const margin = 80;
		const minX = margin;
		const maxX = Math.max(margin + 20, gameState.canvasW - textW - margin);
		this.x = minX + Math.random() * Math.max(1, maxX - minX);
		this.y = -30;
		this.w = textW + 24;
		this.h = 36;
		this.glow = 0;
		this.shake = 0;
		this.matched = 0;
		this.isTarget = false;
	}

	update(dt) {
		this.y += this.speed * (60 * dt);
		if (this.glow > 0) this.glow -= dt * 3;
		if (this.shake > 0) this.shake -= dt * 5;
	}

	draw() {
		const isTarget = this.isTarget;
		const shakeX = this.shake > 0 ? (Math.random() - 0.5) * 6 : 0;
		const x = this.x + shakeX;
		const y = this.y;

		// Responsive font size
		const fontSize = Math.max(
			20,
			Math.min(32, Math.floor(gameState.canvasW / 30)),
		);
		ctx.font = `700 ${fontSize}px Nunito, sans-serif`;

		// Recalculate width to fit actual rendered font
		const textW = ctx.measureText(this.text).width;
		const pillW = textW + 28;
		const pillH = fontSize + 16;

		// Glow
		if (this.glow > 0 || isTarget) {
			ctx.save();
			ctx.shadowColor = isTarget ? "#34D399" : "#A78BFA";
			ctx.shadowBlur = isTarget ? 15 : this.glow * 20;
			ctx.fillStyle = isTarget ? "rgba(52,211,153,0.3)" : "rgba(139,92,246,0.3)";
			ctx.globalAlpha = isTarget ? 0.3 : 0.2;
			ctx.beginPath();
			ctx.roundRect(x - 6, y - pillH / 2 - 2, pillW + 12, pillH + 4, 14);
			ctx.fill();
			ctx.restore();
		}

		// Word pill
		ctx.fillStyle = isTarget ? "rgba(52,211,153,0.25)" : "rgba(139,92,246,0.25)";
		ctx.strokeStyle = isTarget ? "#34D399" : "rgba(200,180,255,0.6)";
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.roundRect(x - 6, y - pillH / 2 - 2, pillW + 12, pillH + 4, 14);
		ctx.fill();
		ctx.stroke();

		// Text — white for readability
		ctx.fillStyle = "#ffffff";
		ctx.textAlign = "left";
		ctx.textBaseline = "middle";
		ctx.fillText(this.text, x + 8, y);

		// Matched underline (if partially typed)
		if (this.matched > 0) {
			const matchedText = this.text.slice(0, this.matched);
			const mW = ctx.measureText(matchedText).width;
			ctx.fillStyle = "#34D399";
			ctx.fillRect(x + 8, y + fontSize * 0.55, mW, 4);
		}

		// Target indicator
		if (isTarget) {
			ctx.fillStyle = "#34D399";
			ctx.font = "12px Nunito, sans-serif";
			ctx.textAlign = "center";
			ctx.fillText("▲", x + pillW / 2, y - pillH / 2 - 10);
		}

		ctx.globalAlpha = 1;
	}

	isAtBottom() {
		return this.y > gameState.canvasH - 80;
	}
}

function spawnWord() {
	const list = getWordList(gameState.level);
	const text = list[Math.floor(Math.random() * list.length)];
	const cfg = getLevelConfig(gameState.level);
	const speed = getAdaptiveSpeed() * (0.8 + Math.random() * 0.4);
	const word = new FallingWord(text, speed);

	// Pick target: shortest or first available
	if (!gameState.targetWord) {
		word.isTarget = true;
		gameState.targetWord = word;
		gameState.targetIndex = 0;
		updateTargetDisplay();
	}

	gameState.activeWords.push(word);
	gameState.wordsSpawned++;
}

function updateTargetDisplay() {
	const tw = $("target-word");
	const tt = $("target-typed");
	if (!gameState.targetWord) {
		tw.innerHTML = "";
		tt.innerHTML = "";
		return;
	}
	const word = gameState.targetWord.text;
	const done = word.slice(0, gameState.targetIndex);
	const rest = word.slice(gameState.targetIndex);
	tw.textContent = rest;
	tt.textContent = done;
}

// ===== INPUT HANDLING =====
function handleKey(e) {
	if (gameState.screen !== "game") return;
	if (gameState.paused || gameState.gameOver) return;
	if (e.ctrlKey || e.altKey || e.metaKey) return;
	// Ignore auto-repeat (holding a key down) — prevents space-spamming
	if (e.repeat) return;
	// Don't steal keystrokes from form inputs or the browser UI
	const tag = document.activeElement?.tagName;
	if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

	// Resume audio context after tab suspension — fast no-op when running
	if (audioCtx?.state === "suspended") audioCtx.resume().catch(() => {});

	const key = e.key.toLowerCase();
	if (key === " ") {
		e.preventDefault();
		skipWord();
		return;
	}
	if (key.length !== 1 || !/[a-z]/.test(key)) return;

	e.preventDefault();
	gameState.totalKeystrokes++;

	if (!gameState.targetWord) {
		// No target — try to find a word starting with this letter
		const match = gameState.activeWords.find(
			(w) => w.text[0].toLowerCase() === key && !w.isTarget,
		);
		if (match) {
			gameState.targetWord = match;
			gameState.targetIndex = 1;
			match.isTarget = true;
			updateTargetDisplay();
			gameState.correctKeystrokes++;
			match.glow = 1;
			playSound("correct");
			checkWordComplete();
		} else {
			playSound("wrong");
			gameState.combo = 0;
			updateCombo();
		}
		return;
	}

	const word = gameState.targetWord.text;
	const needed = word[gameState.targetIndex]?.toLowerCase();

	if (key === needed) {
		gameState.targetIndex++;
		gameState.targetWord.matched = gameState.targetIndex;
		gameState.correctKeystrokes++;
		gameState.targetWord.glow = 1;
		playSound("correct");

		if (gameState.targetIndex >= word.length) {
			completeWord();
		} else {
			updateTargetDisplay();
		}
	} else {
		playSound("wrong");
		showPetReaction("miss");
		gameState.targetWord.shake = 1;
		gameState.combo = 0;
		updateCombo();
		spawnParticles(
			gameState.targetWord.x + gameState.targetWord.w / 2,
			gameState.targetWord.y,
			"#EF4444",
			8,
		);
	}
}

function skipWord() {
	if (!gameState.targetWord) return;
	gameState.targetWord.isTarget = false;
	gameState.targetWord = null;
	gameState.targetIndex = 0;
	gameState.combo = 0;
	updateCombo();

	// Find next shortest word as target
	const sorted = gameState.activeWords
		.filter((w) => !w.isTarget)
		.sort((a, b) => a.text.length - b.text.length);
	if (sorted.length > 0) {
		sorted[0].isTarget = true;
		gameState.targetWord = sorted[0];
		gameState.targetIndex = 0;
	}
	updateTargetDisplay();
}

function completeWord() {
	const word = gameState.targetWord;
	spawnParticles(word.x + word.w / 2, word.y, "#34D399", 20);
	showWordPopup(word.text);
	gameState.wordTimes.push({ t: performance.now(), word: word.text });
	checkAdaptiveDifficulty();
	updateLevelProgress();

	// Pet shows the actual word in its bubble
	const wordEmoji = getWordEmoji(word.text);
	if (gameState.combo >= 5)
		showPetReaction("combo", wordEmoji + " " + word.text);
	else showPetReaction("happy", wordEmoji + " " + word.text);

	// Score calculation
	const baseScore = word.text.length * 10;
	const comboBonus = gameState.combo * 5;
	const levelBonus = gameState.level * 2;
	const points = baseScore + comboBonus + levelBonus;

	gameState.score += points;
	gameState.combo++;
	gameState.wordsTyped++;
	gameState.wordsCompleted++;
	if (gameState.combo > gameState.maxCombo)
		gameState.maxCombo = gameState.combo;

	// Remove word
	const idx = gameState.activeWords.indexOf(word);
	if (idx >= 0) gameState.activeWords.splice(idx, 1);

	// Heart recovery at combo multiples
	if (gameState.combo % 5 === 0 && gameState.health < 5) {
		gameState.health++;
		playSound("heart");
		updateHearts();
	}

	// Challenge progress
	if (gameState.challenge) {
		gameState.challengeProgress++;
		checkChallenge();
	}

	// Pick new target
	gameState.targetWord = null;
	gameState.targetIndex = 0;
	const remaining = gameState.activeWords
		.filter((w) => !w.isTarget)
		.sort((a, b) => a.text.length - b.text.length);
	if (remaining.length > 0) {
		remaining[0].isTarget = true;
		gameState.targetWord = remaining[0];
	}
	updateTargetDisplay();
	updateHUD();
	updateCombo();
	playSound("word");

	// Check level complete
	checkLevelComplete();
}

function loseHeart() {
	if (gameState.health <= 0 || gameState.gameOver) return;
	gameState.health--;
	gameState.combo = 0;
	gameState.difficultyMod = Math.max(gameState.difficultyMod - 1, -2);
	updateHearts();
	updateCombo();
	updateDifficultyBadge();
	screenShake();
	showPetReaction("hurt");
	playSound("gameover");
	spawnParticles(gameState.canvasW / 2, gameState.canvasH - 100, "#EF4444", 25);

	if (gameState.health <= 0) {
		endGame(false);
	}
}

function checkLevelComplete() {
	const cfg = getLevelConfig(gameState.level);
	if (
		gameState.wordsCompleted >= cfg.words &&
		gameState.wordsSpawned >= cfg.words
	) {
		endGame(true);
	}
}

function checkChallenge() {
	if (!gameState.challenge) return;
	const c = gameState.challenge;
	let done = false;
	if (c === "speed" && gameState.wordsTyped >= 20) done = true;
	if (c === "combo" && gameState.combo >= 10) done = true;
	if (
		c === "accuracy" &&
		gameState.wordsTyped >= 15 &&
		gameState.totalKeystrokes > 0 &&
		gameState.correctKeystrokes / gameState.totalKeystrokes >= 1.0
	)
		done = true;

	if (done) {
		gameState.profile.challenges[c] = true;
		gameState.profile.totalStars += 50;
		saveProfile();
		updateMenuStats();
	}
}

function updateHUD() {
	$("score").textContent = gameState.score;
	$("level").textContent = gameState.level;
	const acc =
		gameState.totalKeystrokes > 0
			? Math.round(
					(gameState.correctKeystrokes / gameState.totalKeystrokes) * 100,
				)
			: 100;
	$("accuracy").textContent = `${acc}%`;
}

function updateCombo() {
	const el = $("combo-display");
	$("combo-count").textContent = gameState.combo;
	el.classList.toggle("active", gameState.combo >= 2);
	if (gameState.combo >= 2) playSound("combo");
	// Bonus combo visual on HUD
	if (gameState.combo >= 5) {
		el.style.color = "#FBBF24";
	} else if (gameState.combo >= 3) {
		el.style.color = "#F472B6";
	} else {
		el.style.color = "#FBBF24";
	}
}

function updateHearts() {
	for (let i = 1; i <= 5; i++) {
		const h = $(`heart-${i}`);
		h.textContent = i <= gameState.health ? "💜" : "🖤";
		h.classList.toggle("lost", i > gameState.health);
		if (i <= gameState.health) h.classList.add("animated");
		else h.classList.remove("animated");
		setTimeout(() => h.classList.remove("animated"), 400);
	}
}

// ===== GAME FLOW =====
function startGame(opts = {}) {
	initAudio();
	// Prevent duplicate animation loops on restart
	cancelAnimationFrame(gameState.animationId);
	gameState.animationId = 0;
	lastFrameTime = 0;

	gameState.screen = "game";
	gameState.score = 0;
	gameState.combo = 0;
	gameState.maxCombo = 0;
	gameState.wordsTyped = 0;
	gameState.totalKeystrokes = 0;
	gameState.correctKeystrokes = 0;
	gameState.activeWords = [];
	gameState.particles = [];
		gameState.targetWord = null;
	gameState.targetIndex = 0;
	gameState.paused = false;
	gameState.gameOver = false;
	gameState.lastSpawn = 0;
	gameState.wordsSpawned = 0;
	gameState.wordsCompleted = 0;
	gameState.challenge = opts.challenge || null;
	gameState.challengeProgress = 0;

	// Track total time
	gameState.levelStartTime = performance.now();

	// Determine level
	if (opts.challenge) {
		gameState.level = Math.min(gameState.profile.levelsUnlocked, 3);
	} else if (opts.level) {
		gameState.level = opts.level;
	} else {
		gameState.level = 1;
	}

	// Health from config
	gameState.health = getLevelConfig(gameState.level).health;
	gameState.difficultyMod = 0;
	gameState.wordTimes = [];

	// Init new features
	showPetReaction("idle");
	updateDifficultyBadge();
	updateLevelProgress();

	// Clear any leftover floating scores from previous game
	floatingScores.splice(0, floatingScores.length);
	// Clear particles
	gameState.particles.splice(0, gameState.particles.length);

	// Switch screens
	for (const s of document.querySelectorAll(".screen"))
		s.classList.remove("active");
	$("game-screen").classList.add("active");

	// Defensively hide overlays that might be stuck from previous session
	$("tutorial-overlay")?.classList.add("hidden");
	$("pause-overlay")?.classList.add("hidden");
	$("level-overlay")?.classList.add("hidden");
	$("gameover-overlay")?.classList.add("hidden");

	resizeCanvas();
	initStars();
	updateHUD();
	updateHearts();
	updateCombo();
	updateTargetDisplay();

	// Show tutorial on first play only
	let hasPlayed = false;
	try {
		hasPlayed = !!localStorage.getItem("mtp_tutorial_seen");
	} catch {
		hasPlayed = true; // Gracefully skip tutorial if localStorage is blocked
	}
	if (!hasPlayed) {
		showTutorial();
	} else {
		gameState.animationId = requestAnimationFrame(gameLoop);
	}
}

let lastFrameTime = 0;
function gameLoop(timestamp) {
	if (gameState.screen !== "game") return;
	// Zombie-loop fix: stop scheduling when game is over — only resume for pause
	if (gameState.gameOver) return;
	if (gameState.paused) {
		gameState.animationId = requestAnimationFrame(gameLoop);
		return;
	}

	const dt = lastFrameTime
		? Math.min((timestamp - lastFrameTime) / 1000, 0.05)
		: 0.016;
	lastFrameTime = timestamp;
	gameState.frameTime = dt;

	ctx.clearRect(0, 0, gameState.canvasW, gameState.canvasH);

	// Background
	drawStars(dt);

	// Spawn words
	const now = timestamp;
	if (gameState.wordsSpawned < getLevelConfig(gameState.level).words) {
		if (now - gameState.lastSpawn > getAdaptiveSpawnRate()) {
			spawnWord();
			gameState.lastSpawn = now;
		}
	}

	// Update & draw words
	for (let i = gameState.activeWords.length - 1; i >= 0; i--) {
		const w = gameState.activeWords[i];
		w.update(dt);
		w.draw();

		if (w.isAtBottom()) {
			if (w.isTarget) {
				loseHeart();
				gameState.targetWord = null;
				gameState.targetIndex = 0;
				// Pick a new target
				const remaining = gameState.activeWords
					.filter((x) => x !== w && !x.isTarget)
					.sort((a, b) => a.text.length - b.text.length);
				if (remaining.length > 0) {
					remaining[0].isTarget = true;
					gameState.targetWord = remaining[0];
				}
				updateTargetDisplay();
			}
			gameState.activeWords.splice(i, 1);
			updateHUD();
		}
	}

	// Particles
	updateParticles(dt);
	drawParticles();

	// Floating score text
	drawFloatingScores(dt);

	// Deadlock guard: all words spawned AND none left means level is over
	const cfg = getLevelConfig(gameState.level);
	if (
		!gameState.gameOver &&
		gameState.activeWords.length === 0 &&
		gameState.wordsSpawned >= cfg.words
	) {
		endGame(gameState.wordsCompleted >= cfg.words);
	}

	gameState.animationId = requestAnimationFrame(gameLoop);
}

const floatingScores = [];
function drawFloatingScores(dt) {
	ctx.textAlign = "center";
	ctx.font = "700 18px Nunito, sans-serif";
	for (let i = floatingScores.length - 1; i >= 0; i--) {
		const fs = floatingScores[i];
		fs.y -= 40 * dt;
		fs.life -= dt;
		ctx.globalAlpha = Math.max(0, fs.life);
		ctx.fillStyle = fs.color;
		ctx.fillText(fs.text, fs.x, fs.y);
	}
	// Cleanup
	for (let i = floatingScores.length - 1; i >= 0; i--) {
		if (floatingScores[i].life <= 0) floatingScores.splice(i, 1);
	}
	ctx.globalAlpha = 1;
}

function _addFloatingScore(text, x, y, color = "#FBBF24") {
	floatingScores.push({ text, x, y, color, life: 1.2 });
}

function endGame(won) {
	if (gameState.gameOver) return;
	gameState.gameOver = true;
	cancelAnimationFrame(gameState.animationId);

	// Any completed game = player has seen how to play → skip wizard forever
	setTutorialSeen();

	// Calculate total time
	const elapsed = Math.round(
		(performance.now() - gameState.levelStartTime) / 1000,
	);
	gameState.profile.totalTime += elapsed;
	gameState.profile.totalWords += gameState.wordsTyped;
	gameState.profile.daysPlayed.add(new Date().toDateString());

	// Stars earned
	const acc =
		gameState.totalKeystrokes > 0
			? gameState.correctKeystrokes / gameState.totalKeystrokes
			: 1;
	let starsEarned = 0;
	if (won) {
		if (acc >= 0.95) starsEarned = 3;
		else if (acc >= 0.85) starsEarned = 2;
		else starsEarned = 1;

		// Unlock next level
		if (gameState.level >= gameState.profile.levelsUnlocked) {
			gameState.profile.levelsUnlocked = gameState.level + 1;
		}
	}
	checkAchievements();
	gameState.profile.totalStars += starsEarned * 10 + gameState.score;
	if (gameState.score > gameState.profile.highScore) {
		gameState.profile.highScore = gameState.score;
	}
	saveProfile();
	updateMenuStats();

	if (won) {
		playSound("level");
		$("level-complete-num").textContent = gameState.level;
		$("level-score").textContent = gameState.score;
		$("level-words").textContent = gameState.wordsTyped;
		$("level-combo").textContent = gameState.maxCombo;

		const starsDisp = $("level-overlay").querySelector(".level-stars");
		starsDisp.textContent =
			"⭐".repeat(starsEarned) + "☆".repeat(3 - starsEarned);

		$("level-overlay").classList.remove("hidden");
	} else {
		playSound("gameover");
		$("final-score").textContent = gameState.score;
		$("final-combo").textContent = gameState.maxCombo;
		$("final-words").textContent = gameState.wordsTyped;
		$("gameover-emoji").textContent = gameState.score > 100 ? "😅" : "😢";
		$("gameover-message").textContent =
			gameState.score > 100
				? "Good try! Practice makes perfect!"
				: "The stars got away!";
		$("gameover-overlay").classList.remove("hidden");
	}
}

// ===== PRACTICE MODE =====
const practiceChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
let practiceIndex = 0;

function startPractice() {
	initAudio();
	gameState.screen = "practice";
	for (const s of document.querySelectorAll(".screen"))
		s.classList.remove("active");
	$("practice-screen").classList.add("active");
	practiceIndex = 0;
	shuffleArray(practiceChars);
	updatePractice();
}

function updatePractice() {
	const char = practiceChars[practiceIndex];
	$("practice-char-display").textContent = char;
	$("practice-count").textContent = `${practiceIndex + 1} / 26`;
	$("practice-fill").style.width = `${(practiceIndex / 26) * 100}%`;
	$("practice-hint").innerHTML = `Press <kbd>${char}</kbd> on your keyboard`;
}

function handlePracticeKey(e) {
	if (gameState.screen !== "practice") return;
	const tag = document.activeElement?.tagName;
	if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
	const key = e.key.toUpperCase();
	if (key === practiceChars[practiceIndex]) {
		playSound("correct");
		practiceIndex++;
		if (practiceIndex >= 26) {
			playSound("level");
			gameState.profile.challenges.letters = true;
			gameState.profile.totalStars += 30;
			saveProfile();
			updateMenuStats();
			// Restart
			practiceIndex = 0;
			shuffleArray(practiceChars);
			updatePractice();
		} else {
			updatePractice();
		}
	} else if (key.length === 1 && /[A-Z]/.test(key)) {
		playSound("wrong");
		$("practice-char-display").style.transform = "scale(1.2)";
		$("practice-char-display").style.color = "#EF4444";
		setTimeout(() => {
			$("practice-char-display").style.transform = "scale(1)";
			$("practice-char-display").style.color = "";
		}, 200);
	}
}

function shuffleArray(arr) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
}

// ===== CHALLENGES =====
function showChallenges() {
	gameState.screen = "challenges";
	for (const s of document.querySelectorAll(".screen"))
		s.classList.remove("active");
	$("challenges-screen").classList.add("active");

	const challenges = [
		{
			id: "speed",
			icon: "⚡",
			name: "Speedster",
			desc: "Type 20 words in under 2 minutes",
			total: 20,
		},
		{
			id: "combo",
			icon: "🔥",
			name: "Combo Master",
			desc: "Get a 10-word combo streak",
			total: 10,
		},
		{
			id: "accuracy",
			icon: "🎯",
			name: "Perfect Aim",
			desc: "Type 15 words with 100% accuracy",
			total: 15,
		},
		{
			id: "letters",
			icon: "🔤",
			name: "Alphabet Ace",
			desc: "Complete the letter practice mode",
			total: 1,
		},
	];

	challenges.forEach((c, i) => {
		const card = $(`challenge-${i + 1}`);
		const completed = gameState.profile.challenges[c.id];
		card.classList.toggle("completed", completed);
		const status = card.querySelector(".challenge-status");
		const fill = card.querySelector(".challenge-progress-fill");
		status.textContent = completed ? "✅ Done!" : "Start!";
		fill.style.width = completed ? "100%" : "0%";
	});
}

// ===== PROFILE =====
function showProfile() {
	gameState.screen = "profile";
	for (const s of document.querySelectorAll(".screen"))
		s.classList.remove("active");
	$("profile-screen").classList.add("active");

	const p = gameState.profile;
	$("player-name").value = p.name;
	$("avatar-preview").textContent = p.avatar;
	$("profile-stars").textContent = p.totalStars;
	$("profile-best").textContent = p.highScore;
	$("profile-words").textContent = p.totalWords;
	$("profile-time").textContent = formatTime(p.totalTime);

	for (const btn of document.querySelectorAll(".avatar-btn")) {
		btn.classList.toggle("active", btn.dataset.avatar === p.avatar);
	}
}

function formatTime(sec) {
	if (sec < 60) return `${sec}s`;
	if (sec < 3600) return `${Math.floor(sec / 60)}m`;
	return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
}

// ===== TUTORIAL =====
let tutorialSlide = 0;
function showTutorial() {
	tutorialSlide = 0;
	$("tutorial-overlay").classList.remove("hidden");
	updateTutorialSlides();
}

function updateTutorialSlides() {
	document.querySelectorAll(".tutorial-slide").forEach((s, i) => {
		s.classList.toggle("active", i === tutorialSlide);
	});
}

function nextTutorial() {
	tutorialSlide++;
	if (tutorialSlide >= 3) {
		$("tutorial-overlay").classList.add("hidden");
		setTutorialSeen();
		gameState.animationId = requestAnimationFrame(gameLoop);
	} else {
		updateTutorialSlides();
	}
}

// ===== SCREEN MANAGEMENT =====
function showScreen(name) {
	gameState.screen = name;
	for (const s of document.querySelectorAll(".screen"))
		s.classList.remove("active");
	$(`${name}-screen`).classList.add("active");
	if (name === "menu") updateMenuStats();
}

function _showMenu() {
	showScreen("menu");
}

function updateMenuStats() {
	const p = gameState.profile;
	$("total-stars").textContent = p.totalStars;
	$("high-score").textContent = p.highScore;
	$("days-played").textContent = p.daysPlayed?.size || 0;
}

function resumeGame() {
	$("pause-overlay").classList.add("hidden");
	gameState.paused = false;
	lastFrameTime = 0;
}

// ===== CANVAS RESIZE =====
function resizeCanvas() {
	const rect = canvas.parentElement.getBoundingClientRect();
	canvas.width = rect.width * window.devicePixelRatio;
	canvas.height = rect.height * window.devicePixelRatio;
	ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
	gameState.canvasW = rect.width;
	gameState.canvasH = rect.height;
}

// ===== PWA =====
let deferredPrompt = null;
function handleBeforeInstallPrompt(e) {
	e.preventDefault();
	deferredPrompt = e;
	$("install-prompt").classList.remove("hidden");
}

function installApp() {
	if (!deferredPrompt) return;
	deferredPrompt.prompt();
	deferredPrompt.userChoice.then(() => {
		$("install-prompt").classList.add("hidden");
		deferredPrompt = null;
	});
}

// ===== EVENT LISTENERS =====
function bindEvents() {
	// Menu
	$("btn-start").addEventListener("click", () => startGame());
	$("btn-practice").addEventListener("click", () => startPractice());
	$("btn-challenges").addEventListener("click", () => showChallenges());
	$("btn-avatars").addEventListener("click", () => showProfile());

	// Profile
	$("btn-profile-back").addEventListener("click", () => showScreen("menu"));
	$("btn-save-profile").addEventListener("click", () => {
		gameState.profile.name = $("player-name").value.trim();
		saveProfile();
		showScreen("menu");
	});
	for (const btn of document.querySelectorAll(".avatar-btn")) {
		btn.addEventListener("click", () => {
			for (const b of document.querySelectorAll(".avatar-btn"))
				b.classList.remove("active");
			btn.classList.add("active");
			gameState.profile.avatar = btn.dataset.avatar;
			$("avatar-preview").textContent = btn.dataset.avatar;
		});
	}

	// Challenges
	$("btn-challenges-back").addEventListener("click", () => showScreen("menu"));
	document.querySelectorAll(".challenge-card").forEach((card) => {
		card.addEventListener("click", () => {
			const ch = card.dataset.challenge;
			if (ch === "letters") {
				startPractice();
				return;
			}
			if (ch === "accuracy" || ch === "combo" || ch === "speed") {
				startGame({ challenge: ch });
			}
		});
	});

	// Practice
	$("btn-practice-back").addEventListener("click", () => showScreen("menu"));

	// Game
	$("btn-pause").addEventListener("click", () => {
		gameState.paused = true;
		$("pause-overlay").classList.remove("hidden");
	});
	$("btn-resume").addEventListener("click", () => resumeGame());
	$("btn-quit").addEventListener("click", () => {
		$("pause-overlay").classList.add("hidden");
		showScreen("menu");
	});

	// Level complete
	$("btn-next-level").addEventListener("click", () => {
		$("level-overlay").classList.add("hidden");
		startGame({ level: gameState.level + 1 });
	});

	// Game over
	$("btn-retry").addEventListener("click", () => {
		$("gameover-overlay").classList.add("hidden");
		startGame({ level: gameState.level });
	});
	$("btn-menu").addEventListener("click", () => {
		$("gameover-overlay").classList.add("hidden");
		showScreen("menu");
	});

	// Tutorial
	for (const b of document.querySelectorAll(".btn-tutorial-next"))
		b.addEventListener("click", nextTutorial);
	$("btn-start-game").addEventListener("click", () => {
		$("tutorial-overlay").classList.add("hidden");
		setTutorialSeen();
		gameState.animationId = requestAnimationFrame(gameLoop);
	});

	// Keyboard
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") {
			if (gameState.screen === "game" && !gameState.gameOver) {
				if (gameState.paused) resumeGame();
				else {
					gameState.paused = true;
					$("pause-overlay").classList.remove("hidden");
				}
			}
		}
		handleKey(e);
		handlePracticeKey(e);
	});

	// Resize
	window.addEventListener("resize", () => {
		if (gameState.screen === "game" || gameState.screen === "practice") {
			resizeCanvas();
		}
	});

	// PWA
	window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
	$("install-btn").addEventListener("click", installApp);
	$("dismiss-install").addEventListener("click", () =>
		$("install-prompt").classList.add("hidden"),
	);
}

// ===== INIT =====
function init() {
	updateMenuStats();
	bindEvents();
}

document.addEventListener("DOMContentLoaded", init);

// ===== ADAPTIVE DIFFICULTY ENGINE =====
function checkAdaptiveDifficulty() {
	const now = performance.now();
	const windowMs = 15000;
	const history = gameState.wordTimes.filter((t) => now - t.t < windowMs);
	gameState.wordTimes = history;
	if (history.length < 5) return;
	const avgAccuracy =
		gameState.totalKeystrokes > 0
			? gameState.correctKeystrokes / gameState.totalKeystrokes
			: 1;
	const wpm = history.length / (windowMs / 60000);
	const oldMod = gameState.difficultyMod;
	if (avgAccuracy > 0.85 && wpm > 15) {
		gameState.difficultyMod = Math.min(oldMod + 1, 3);
	} else if (avgAccuracy < 0.6 && wpm < 10 && oldMod > -2) {
		gameState.difficultyMod = Math.max(oldMod - 1, -2);
	}
	if (oldMod !== gameState.difficultyMod) {
		updateDifficultyBadge();
		showPowerUp(
			gameState.difficultyMod > oldMod
				? "⚡ Speeding up!"
				: "🐢 Slowing down...",
		);
	}
}

function getAdaptiveSpeed() {
	const base = getLevelConfig(gameState.level).speed;
	return base * (1 + gameState.difficultyMod * 0.15);
}

function getAdaptiveSpawnRate() {
	const base = getLevelConfig(gameState.level).spawnRate;
	return base * (1 - gameState.difficultyMod * 0.1);
}

function updateDifficultyBadge() {
	const badge = document.getElementById("difficulty-badge");
	if (!badge) return;
	const mod = gameState.difficultyMod;
	let label = "Normal";
	let color = "var(--text-dim)";
	if (mod <= -2) {
		label = "Easy 😌";
		color = "#34D399";
	} else if (mod === -1) {
		label = "Gentle 🙂";
		color = "#A78BFA";
	} else if (mod === 0) {
		label = "Normal 😊";
		color = "var(--text-dim)";
	} else if (mod === 1) {
		label = "Challenging 😤";
		color = "#FBBF24";
	} else if (mod === 2) {
		label = "Hard 🔥";
		color = "#F472B6";
	} else if (mod >= 3) {
		label = "EXTREME! 💀";
		color = "#EF4444";
	}
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
		happy: { emoji: "🌻", msg: "Nice!", class: "happy" },
		combo: { emoji: "🔥", msg: "On fire!", class: "celebrate" },
		levelup: { emoji: "🎉", msg: "Level up!", class: "celebrate" },
		miss: { emoji: "😵", msg: "Oops!", class: "sad" },
		hurt: { emoji: "😢", msg: "Watch out!", class: "sad" },
		idle: { emoji: "🌻", msg: "", class: "" },
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
	first_word: {
		title: "First Word!",
		desc: "Type your very first word",
		icon: "🎯",
		check(s) {
			return s.wordsTyped >= 1;
		},
	},
	combo_starter: {
		title: "Combo Starter",
		desc: "Get a 5-word combo streak",
		icon: "🔥",
		check(s) {
			return s.maxCombo >= 5;
		},
	},
	combo_master: {
		title: "Combo Master",
		desc: "Get a 10-word combo streak",
		icon: "⚡",
		check(s) {
			return s.maxCombo >= 10;
		},
	},
	combo_champion: {
		title: "Combo Champion",
		desc: "Get a 20-word combo streak!",
		icon: "🏆",
		check(s) {
			return s.maxCombo >= 20;
		},
	},
	word_warrior: {
		title: "Word Warrior",
		desc: "Type 50 total words in the game",
		icon: "⚔️",
		check(s) {
			return s.wordsTyped >= 50;
		},
	},
	accuracy_ace: {
		title: "Accuracy Ace",
		desc: "Type 20 words with 95%+ accuracy",
		icon: "⭐",
		check(s) {
			return (
				s.totalKeystrokes > 0 &&
				s.correctKeystrokes / s.totalKeystrokes >= 0.95 &&
				s.wordsTyped >= 20
			);
		},
	},
};

function checkAchievements() {
	const unlocked = gameState.profile.achievements || {};
	gameState.profile.achievements = unlocked;
	for (const [key, ach] of Object.entries(ACHIEVEMENTS)) {
		if (unlocked[key]) continue;
		if (ach.check(gameState)) {
			unlocked[key] = true;
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
