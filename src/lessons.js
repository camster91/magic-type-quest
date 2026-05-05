// ===== TYPING LESSON STRUCTURE =====
// Progressive 6-level curriculum for kids touch typing

export const LESSON_STRUCTURE = {
	1: {
		id: 1,
		name: "Home Row Basics",
		subtitle: "Where your fingers rest",
		description:
			"Learn the foundation of touch typing with the home row keys. Your fingers always return here!",
		keys: ["a", "s", "d", "f", "j", "k", "l", ";"],
		fingerMap: {
			a: { finger: "leftPinky", color: "#EF4444", label: "Left Pinky" },
			s: { finger: "leftRing", color: "#F97316", label: "Left Ring" },
			d: { finger: "leftMiddle", color: "#EAB308", label: "Left Middle" },
			f: { finger: "leftIndex", color: "#22C55E", label: "Left Index" },
			j: { finger: "rightIndex", color: "#22C55E", label: "Right Index" },
			k: { finger: "rightMiddle", color: "#EAB308", label: "Right Middle" },
			l: { finger: "rightRing", color: "#F97316", label: "Right Ring" },
			";": { finger: "rightPinky", color: "#EF4444", label: "Right Pinky" },
		},
		practicePatterns: [
			"asdf",
			"jkl;",
			"asdf jkl;",
			"a;sldkfj",
			"fjdksl;a",
			"as as as",
			"df df df",
			"jk jk jk",
			"l; l; l;",
		],
		words: [
			"dad",
			"sad",
			"ask",
			"all",
			"lass",
			"fall",
			"gals",
			"halls",
			"flask",
			"fads",
			"jacks",
			"salsa",
			"salsa",
			"flags",
			"jazz",
			"alfalfa",
		],
		requiredAccuracy: 0.85,
		requiredWPM: 8,
		badge: "bronze",
		estimatedTime: "5-10 min",
		icon: "/assets/levels/home-row.png",
	},
	2: {
		id: 2,
		name: "Top Row",
		subtitle: "Reaching up",
		description:
			"Learn to reach up from home row to type the top row keys. Keep your fingers curved!",
		keys: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
		fingerMap: {
			q: { finger: "leftPinky", color: "#EF4444", label: "Left Pinky" },
			w: { finger: "leftRing", color: "#F97316", label: "Left Ring" },
			e: { finger: "leftMiddle", color: "#EAB308", label: "Left Middle" },
			r: { finger: "leftIndex", color: "#22C55E", label: "Left Index" },
			t: { finger: "leftIndex", color: "#22C55E", label: "Left Index" },
			y: { finger: "rightIndex", color: "#22C55E", label: "Right Index" },
			u: { finger: "rightIndex", color: "#22C55E", label: "Right Index" },
			i: { finger: "rightMiddle", color: "#EAB308", label: "Right Middle" },
			o: { finger: "rightRing", color: "#F97316", label: "Right Ring" },
			p: { finger: "rightPinky", color: "#EF4444", label: "Right Pinky" },
		},
		practicePatterns: [
			"qwerty",
			"uiop",
			"qwerty uiop",
			"qwertyuiop",
			"type",
			"ripe",
			"pure",
			"quit",
		],
		words: [
			"quit",
			"were",
			"tree",
			"type",
			"your",
			"pure",
			"ripe",
			"quiet",
			"quite",
			"write",
			"wrote",
			"tripe",
			"trope",
			"power",
			"tower",
			"upper",
		],
		requiredAccuracy: 0.85,
		requiredWPM: 12,
		badge: "bronze",
		estimatedTime: "8-12 min",
		icon: "/assets/levels/top-row.png",
	},
	3: {
		id: 3,
		name: "Bottom Row",
		subtitle: "Reaching down",
		description:
			"Practice reaching down to the bottom row while keeping home row position.",
		keys: ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
		fingerMap: {
			z: { finger: "leftPinky", color: "#EF4444", label: "Left Pinky" },
			x: { finger: "leftRing", color: "#F97316", label: "Left Ring" },
			c: { finger: "leftMiddle", color: "#EAB308", label: "Left Middle" },
			v: { finger: "leftIndex", color: "#22C55E", label: "Left Index" },
			b: { finger: "leftIndex", color: "#22C55E", label: "Left Index" },
			n: { finger: "rightIndex", color: "#22C55E", label: "Right Index" },
			m: { finger: "rightIndex", color: "#22C55E", label: "Right Index" },
			",": { finger: "rightMiddle", color: "#EAB308", label: "Right Middle" },
			".": { finger: "rightRing", color: "#F97316", label: "Right Ring" },
			"/": { finger: "rightPinky", color: "#EF4444", label: "Right Pinky" },
		},
		practicePatterns: [
			"zxcv",
			"bnm,.",
			"zxcvbnm,./",
			"cmvnbvcxz",
			"cv vc cv",
			"bn nb bn",
		],
		words: [
			"zoo",
			"box",
			"van",
			"man",
			"can",
			"van",
			"ban",
			"men",
			"zen",
			"maze",
			"cave",
			"vane",
			"cane",
			"bane",
			"zebra",
			"cabin",
		],
		requiredAccuracy: 0.85,
		requiredWPM: 15,
		badge: "silver",
		estimatedTime: "10-15 min",
		icon: "/assets/levels/bottom-row.png",
	},
	4: {
		id: 4,
		name: "Capital Letters",
		subtitle: "Shift into gear",
		description:
			"Learn to use the Shift key to type capital letters. Use opposite hand for Shift!",
		keys: [
			"A",
			"S",
			"D",
			"F",
			"J",
			"K",
			"L",
			"Q",
			"W",
			"E",
			"R",
			"T",
			"Y",
			"U",
			"I",
			"O",
			"P",
		],
		fingerMap: {
			shiftLeft: { finger: "leftShift", color: "#3B82F6", label: "Left Shift" },
			shiftRight: { finger: "rightShift", color: "#3B82F6", label: "Right Shift" },
		},
		practicePatterns: [
			"Aa",
			"Ss",
			"Dd",
			"Ff",
			"Jj",
			"Kk",
			"Ll",
		],
		words: [
			"Apple",
			"Sarah",
			"Dad",
			"Fall",
			"Jack",
			"Kate",
			"Lake",
			"Quiet",
			"Write",
			"Tree",
			"Pure",
			"Orange",
			"Yellow",
			"Upper",
			"Tower",
			"Power",
		],
		requiredAccuracy: 0.88,
		requiredWPM: 18,
		badge: "silver",
		estimatedTime: "12-18 min",
		icon: "/assets/levels/capitals.png",
	},
	5: {
		id: 5,
		name: "Numbers",
		subtitle: "Count on it",
		description:
			"Master the number row! These are used for dates, phone numbers, and more.",
		keys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
		fingerMap: {
			1: { finger: "leftPinky", color: "#EF4444", label: "Left Pinky" },
			2: { finger: "leftRing", color: "#F97316", label: "Left Ring" },
			3: { finger: "leftMiddle", color: "#EAB308", label: "Left Middle" },
			4: { finger: "leftIndex", color: "#22C55E", label: "Left Index" },
			5: { finger: "leftIndex", color: "#22C55E", label: "Left Index" },
			6: { finger: "rightIndex", color: "#22C55E", label: "Right Index" },
			7: { finger: "rightIndex", color: "#22C55E", label: "Right Index" },
			8: { finger: "rightMiddle", color: "#EAB308", label: "Right Middle" },
			9: { finger: "rightRing", color: "#F97316", label: "Right Ring" },
			0: { finger: "rightPinky", color: "#EF4444", label: "Right Pinky" },
		},
		practicePatterns: [
			"1234",
			"5678",
			"1234 5678",
			"1234567890",
			"2024",
			"123",
			"456",
			"789",
		],
		words: [
			"2024",
			"123",
			"456",
			"789",
			"1984",
			"2000",
			"2020",
			"100",
			"50",
			"25",
			"99",
			"365",
			"24",
			"7",
			"3.14",
			"1st",
		],
		requiredAccuracy: 0.88,
		requiredWPM: 20,
		badge: "gold",
		estimatedTime: "15-20 min",
		icon: "/assets/levels/numbers.png",
	},
	6: {
		id: 6,
		name: "Typing Master",
		subtitle: "Putting it all together",
		description:
			"Combine everything you've learned! Type real words, sentences, and challenge yourself.",
		keys: [
			"a",
			"b",
			"c",
			"d",
			"e",
			"f",
			"g",
			"h",
			"i",
			"j",
			"k",
			"l",
			"m",
			"n",
			"o",
			"p",
			"q",
			"r",
			"s",
			"t",
			"u",
			"v",
			"w",
			"x",
			"y",
			"z",
		],
		fingerMap: {}, // All fingers, full keyboard
		practicePatterns: [
			"the quick brown fox",
			"jumps over the lazy dog",
			"pack my box with five dozen",
			"liquor jugs",
			"how vexingly quick daft zebras",
			"jump",
		],
		words: [
			"the",
			"quick",
			"brown",
			"fox",
			"jumps",
			"over",
			"lazy",
			"dog",
			"typing",
			"practice",
			"keyboard",
			"lesson",
			"master",
			"speed",
			"accuracy",
			"progress",
		],
		requiredAccuracy: 0.9,
		requiredWPM: 25,
		badge: "platinum",
		estimatedTime: "20-30 min",
		icon: "/assets/levels/master.png",
	},
};

// Get lesson by ID
export function getLesson(id) {
	return LESSON_STRUCTURE[id] || null;
}

// Get all lessons as array
export function getAllLessons() {
	return Object.values(LESSON_STRUCTURE);
}

// Check if lesson is unlocked
export function isLessonUnlocked(id, progress) {
	if (id === 1) return true; // First lesson always unlocked
	const prevLesson = getLesson(id - 1);
	if (!prevLesson) return true;
	return progress.lessonsCompleted?.includes(id - 1) || false;
}

// Check if lesson requirements are met
export function checkLessonCompletion(lesson, stats) {
	return (
		stats.accuracy >= lesson.requiredAccuracy &&
		stats.wpm >= lesson.requiredWPM
	);
}

// Get finger info for a key
export function getFingerForKey(lesson, key) {
	if (!lesson?.fingerMap) return null;
	return (
		lesson.fingerMap[key.toLowerCase()] || lesson.fingerMap[key] || null
	);
}

// Get practice content for a lesson
export function getLessonWords(lesson, count = 10) {
	if (!lesson) return [];
	const words = [...lesson.words];
	// Shuffle and take requested count
	for (let i = words.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[words[i], words[j]] = [words[j], words[i]];
	}
	return words.slice(0, count);
}

// Calculate lesson progress percentage
export function getLessonProgress(lesson, stats) {
	if (!lesson || !stats) return 0;
	const accuracyProgress = Math.min(
		stats.accuracy / lesson.requiredAccuracy,
		1,
	);
	const wpmProgress = Math.min(stats.wpm / lesson.requiredWPM, 1);
	return Math.round(((accuracyProgress + wpmProgress) / 2) * 100);
}
