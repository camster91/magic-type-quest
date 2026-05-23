// ===== UNIFIED LESSON-GAME LEVELS =====
// Each game level IS a typing lesson
// Progressive curriculum that teaches proper touch typing

export const LESSON_LEVELS = {
  // ============================================
  // LEVEL 1: HOME ROW BASICS
  // ============================================
  1: {
    id: 1,
    gameLevel: 1,
    name: "Home Row Garden 🌸",
    subtitle: "Garden Words",
    description: "Learn the foundation with fun garden words! Your fingers always return here.",
    
    // Typing instruction
    keys: ["a", "s", "d", "f", "j", "k", "l", ";"],
    keyboardRows: ["home"],
    
    fingerColors: {
      a: "#EF4444", s: "#F97316", d: "#EAB308", f: "#22C55E",
      j: "#22C55E", k: "#EAB308", l: "#F97316", ";": "#EF4444"
    },
    fingerLabels: {
      a: "Left Pinky", s: "Left Ring", d: "Left Middle", f: "Left Index",
      j: "Right Index", k: "Right Middle", l: "Right Ring", ";": "Right Pinky"
    },
    
    // Tutorial prompts shown to player
    tutorialPrompts: [
      { key: "a", hint: "Press A with your LEFT PINKY 💋", color: "#EF4444" },
      { key: "s", hint: "Press S with your LEFT RING 💍", color: "#F97316" },
      { key: "d", hint: "Press D with your LEFT MIDDLE ☝️", color: "#EAB308" },
      { key: "f", hint: "Press F with your LEFT INDEX ☝️", color: "#22C55E" },
      { key: "j", hint: "Press J with your RIGHT INDEX ☝️", color: "#22C55E" },
      { key: "k", hint: "Press K with your RIGHT MIDDLE ☝️", color: "#EAB308" },
      { key: "l", hint: "Press L with your RIGHT RING 💍", color: "#F97316" },
      { key: ";", hint: "Press ; with your RIGHT PINKY 💋", color: "#EF4444" },
    ],
    
    // Words using ONLY these keys
    words: ["grass", "salad", "flask", "glass", "flags", "skill", "hills", "fills", "falls", "sacks", "lads", "gals", "kids", "dads", "glad", "dash", "asks", "digs", "silk", "hall"],
    
    // Practice patterns
    practicePatterns: ["asdf", "jkl;", "asdf jkl;", "a;sldkfj", "fjdksl;a", "as as as", "df df df", "jk jk jk", "l; l; l;"],
    
    // Game settings
    speed: 0.4,
    spawnRate: 4000,
    wordsPerLevel: 10,
    health: 5,
    
    // Lesson completion requirements
    requiredAccuracy: 0.80,
    requiredWPM: 5,
    
    badge: "bronze",
    icon: "🌸",
    estimatedTime: "5 min",
  },

  // ============================================
  // LEVEL 2: TOP ROW
  // ============================================
  2: {
    id: 2,
    gameLevel: 2,
    name: "Top Row Sky ⬆️",
    subtitle: "Sky Words",
    description: "Reach up to the sky! Learn the top row keys with flying words.",
    
    keys: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    keyboardRows: ["home", "top"],
    
    fingerColors: {
      q: "#EF4444", w: "#F97316", e: "#EAB308", r: "#22C55E", t: "#22C55E",
      y: "#22C55E", u: "#22C55E", i: "#EAB308", o: "#F97316", p: "#EF4444"
    },
    fingerLabels: {
      q: "Left Pinky", w: "Left Ring", e: "Left Middle", r: "Left Index", t: "Left Index",
      y: "Right Index", u: "Right Index", i: "Right Middle", o: "Right Ring", p: "Right Pinky"
    },
    
    tutorialPrompts: [
      { key: "q", hint: "Reach UP! Press Q with LEFT PINKY 💋", color: "#EF4444" },
      { key: "w", hint: "Reach UP! Press W with LEFT RING 💍", color: "#F97316" },
      { key: "e", hint: "Reach UP! Press E with LEFT MIDDLE ☝️", color: "#EAB308" },
      { key: "r", hint: "Reach UP! Press R with LEFT INDEX ☝️", color: "#22C55E" },
      { key: "t", hint: "Reach UP! Press T with LEFT INDEX ☝️", color: "#22C55E" },
      { key: "y", hint: "Reach UP! Press Y with RIGHT INDEX ☝️", color: "#22C55E" },
      { key: "u", hint: "Reach UP! Press U with RIGHT INDEX ☝️", color: "#22C55E" },
      { key: "i", hint: "Reach UP! Press I with RIGHT MIDDLE ☝️", color: "#EAB308" },
      { key: "o", hint: "Reach UP! Press O with RIGHT RING 💍", color: "#F97316" },
      { key: "p", hint: "Reach UP! Press P with RIGHT PINKY 💋", color: "#EF4444" },
    ],
    
    words: ["top", "toy", "put", "out", "try", "wet", "rot", "rue", "ore", "tie", "trip", "tour", "pure", "quiet", "outer", "your", "poor", "type", "tire", "rope"],
    
    practicePatterns: ["qwerty", "uiop", "qwerty uiop", "qwertyuiop", "type type", "quit quit"],
    
    speed: 0.5,
    spawnRate: 3500,
    wordsPerLevel: 12,
    health: 5,
    
    requiredAccuracy: 0.82,
    requiredWPM: 8,
    
    badge: "bronze",
    icon: "⬆️",
    estimatedTime: "8 min",
  },

  // ============================================
  // LEVEL 3: BOTTOM ROW
  // ============================================
  3: {
    id: 3,
    gameLevel: 3,
    name: "Bottom Row Ocean ⬇️",
    subtitle: "Ocean Words",
    description: "Dive deep underwater! Learn bottom row keys with sea creatures.",
    
    keys: ["z", "x", "c", "v", "b", "n", "m"],
    keyboardRows: ["home", "bottom"],
    
    fingerColors: {
      z: "#EF4444", x: "#F97316", c: "#EAB308", v: "#22C55E", b: "#22C55E",
      n: "#22C55E", m: "#22C55E"
    },
    fingerLabels: {
      z: "Left Pinky", x: "Left Ring", c: "Left Middle", v: "Left Index", b: "Left Index",
      n: "Right Index", m: "Right Middle"
    },
    
    tutorialPrompts: [
      { key: "z", hint: "Reach DOWN! Press Z with LEFT PINKY 💋", color: "#EF4444" },
      { key: "x", hint: "Reach DOWN! Press X with LEFT RING 💍", color: "#F97316" },
      { key: "c", hint: "Reach DOWN! Press C with LEFT MIDDLE ☝️", color: "#EAB308" },
      { key: "v", hint: "Reach DOWN! Press V with LEFT INDEX ☝️", color: "#22C55E" },
      { key: "b", hint: "Reach DOWN! Press B with LEFT INDEX ☝️", color: "#22C55E" },
      { key: "n", hint: "Reach DOWN! Press N with RIGHT INDEX ☝️", color: "#22C55E" },
      { key: "m", hint: "Reach DOWN! Press M with RIGHT MIDDLE ☝️", color: "#EAB308" },
    ],
    
    words: ["box", "zoo", "van", "cub", "bun", "men", "cab", "cob", "mob", "vex", "zen", "mix", "nab", "can", "axe", "web", "bin", "bum", "con", "vex"],
    
    practicePatterns: ["zxcv", "bnm,.", "zxcvbnm", "cmvnbvcxz", "box box", "van van"],
    
    speed: 0.55,
    spawnRate: 3200,
    wordsPerLevel: 12,
    health: 5,
    
    requiredAccuracy: 0.82,
    requiredWPM: 10,
    
    badge: "silver",
    icon: "⬇️",
    estimatedTime: "8 min",
  },

  // ============================================
  // LEVEL 4: ALL LETTERS
  // ============================================
  4: {
    id: 4,
    gameLevel: 4,
    name: "All Letters Forest 🌲",
    subtitle: "Forest Adventure",
    description: "Explore the enchanted forest! Use all the letters you've learned.",
    
    keys: ["a", "s", "d", "f", "j", "k", "l", ";", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "z", "x", "c", "v", "b", "n", "m"],
    keyboardRows: ["home", "top", "bottom"],
    
    fingerColors: {
      a: "#EF4444", s: "#F97316", d: "#EAB308", f: "#22C55E",
      j: "#22C55E", k: "#EAB308", l: "#F97316", ";": "#EF4444",
      q: "#EF4444", w: "#F97316", e: "#EAB308", r: "#22C55E", t: "#22C55E",
      y: "#22C55E", u: "#22C55E", i: "#EAB308", o: "#F97316", p: "#EF4444",
      z: "#EF4444", x: "#F97316", c: "#EAB308", v: "#22C55E", b: "#22C55E",
      n: "#22C55E", m: "#22C55E"
    },
    fingerLabels: {
      a: "Left Pinky", s: "Left Ring", d: "Left Middle", f: "Left Index",
      j: "Right Index", k: "Right Middle", l: "Right Ring", ";": "Right Pinky",
      q: "Left Pinky", w: "Left Ring", e: "Left Middle", r: "Left Index", t: "Left Index",
      y: "Right Index", u: "Right Index", i: "Right Middle", o: "Right Ring", p: "Right Pinky",
      z: "Left Pinky", x: "Left Ring", c: "Left Middle", v: "Left Index", b: "Left Index",
      n: "Right Index", m: "Right Middle"
    },
    
    tutorialPrompts: [
      { key: "a", hint: "A key - LEFT PINKY 💋", color: "#EF4444" },
      { key: "s", hint: "S key - LEFT RING 💍", color: "#F97316" },
      { key: "d", hint: "D key - LEFT MIDDLE ☝️", color: "#EAB308" },
      { key: "f", hint: "F key - LEFT INDEX ☝️", color: "#22C55E" },
    ],
    
    words: ["fox", "tree", "run", "bear", "leaf", "jump", "deer", "wood", "owl", "grass", "acorn", "cub", "hide", "pond", "frog", "climb", "berry", "wolf", "moss", "bunny"],
    
    practicePatterns: ["asdf jkl;", "qwerty", "zxcvbnm", "the quick", "brown fox"],
    
    speed: 0.6,
    spawnRate: 3000,
    wordsPerLevel: 15,
    health: 5,
    
    requiredAccuracy: 0.85,
    requiredWPM: 12,
    
    badge: "silver",
    icon: "🎹",
    estimatedTime: "10 min",
  },

  // ============================================
  // LEVEL 5: CAPITAL LETTERS
  // ============================================
  5: {
    id: 5,
    gameLevel: 5,
    name: "Capital City 🏙️",
    subtitle: "City Words",
    description: "Build a city with CAPITAL letters! Hold Shift with your opposite hand.",
    
    keys: ["A", "S", "D", "F", "J", "K", "L", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    keyboardRows: ["home", "top"],
    requiresShift: true,
    
    shiftInstructions: {
      left: "Hold SHIFT with RIGHT HAND when typing LEFT keys (A, S, D, F)",
      right: "Hold SHIFT with LEFT HAND when typing RIGHT keys (J, K, L, ;, P, O, etc.)"
    },
    
    fingerColors: {
      A: "#EF4444", S: "#F97316", D: "#EAB308", F: "#22C55E",
      J: "#22C55E", K: "#EAB308", L: "#F97316",
    },
    fingerLabels: {
      A: "Left Pinky (hold RIGHT Shift!)", S: "Left Ring (hold RIGHT Shift!)",
      D: "Left Middle (hold RIGHT Shift!)", F: "Left Index (hold RIGHT Shift!)",
      J: "Right Index (hold LEFT Shift!)", K: "Right Middle (hold LEFT Shift!)",
      L: "Right Ring (hold LEFT Shift!)",
    },
    
    tutorialPrompts: [
      { key: "A", hint: "CAPITAL A - Hold RIGHT shift + LEFT PINKY 💋", color: "#EF4444" },
      { key: "S", hint: "CAPITAL S - Hold RIGHT shift + LEFT RING 💍", color: "#F97316" },
      { key: "D", hint: "CAPITAL D - Hold RIGHT shift + LEFT MIDDLE ☝️", color: "#EAB308" },
      { key: "F", hint: "CAPITAL F - Hold RIGHT shift + LEFT INDEX ☝️", color: "#22C55E" },
      { key: "J", hint: "CAPITAL J - Hold LEFT shift + RIGHT INDEX ☝️", color: "#22C55E" },
      { key: "K", hint: "CAPITAL K - Hold LEFT shift + RIGHT MIDDLE ☝️", color: "#EAB308" },
      { key: "L", hint: "CAPITAL L - Hold LEFT shift + RIGHT RING 💍", color: "#F97316" },
    ],
    
    words: ["CAR", "BUS", "JET", "CITY", "TOWN", "HOME", "PARK", "ROAD", "RIDE", "WALK", "SHOP", "TAXI", "HOUSE", "TRAIN", "PLANE", "TOWER", "DRIVE", "STREET", "BRIDGE", "METRO"],
    
    practicePatterns: ["Aa", "Ss", "Dd", "Ff", "Jj", "Kk", "Ll", "ABC", "XYZ"],
    
    speed: 0.65,
    spawnRate: 2800,
    wordsPerLevel: 12,
    health: 4,
    
    requiredAccuracy: 0.85,
    requiredWPM: 10,
    
    badge: "gold",
    icon: "⬆️",
    estimatedTime: "12 min",
  },

  // ============================================
  // LEVEL 6: NUMBERS
  // ============================================
  6: {
    id: 6,
    gameLevel: 6,
    name: "Number Galaxy 🚀",
    subtitle: "Space Numbers",
    description: "Blast off with numbers! Practice 0-9 in the galaxy.",
    
    keys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    keyboardRows: ["numbers"],
    
    fingerColors: {
      1: "#EF4444", 2: "#F97316", 3: "#EAB308", 4: "#22C55E", 5: "#22C55E",
      6: "#22C55E", 7: "#22C55E", 8: "#EAB308", 9: "#F97316", 0: "#EF4444"
    },
    fingerLabels: {
      1: "Left Pinky", 2: "Left Ring", 3: "Left Middle", 4: "Left Index", 5: "Left Index",
      6: "Right Index", 7: "Right Index", 8: "Right Middle", 9: "Right Ring", 0: "Right Pinky"
    },
    
    tutorialPrompts: [
      { key: "1", hint: "Press 1 with LEFT PINKY 💋", color: "#EF4444" },
      { key: "2", hint: "Press 2 with LEFT RING 💍", color: "#F97316" },
      { key: "3", hint: "Press 3 with LEFT MIDDLE ☝️", color: "#EAB308" },
      { key: "4", hint: "Press 4 with LEFT INDEX ☝️", color: "#22C55E" },
      { key: "5", hint: "Press 5 with LEFT INDEX ☝️", color: "#22C55E" },
      { key: "6", hint: "Press 6 with RIGHT INDEX ☝️", color: "#22C55E" },
      { key: "7", hint: "Press 7 with RIGHT INDEX ☝️", color: "#22C55E" },
      { key: "8", hint: "Press 8 with RIGHT MIDDLE ☝️", color: "#EAB308" },
      { key: "9", hint: "Press 9 with RIGHT RING 💍", color: "#F97316" },
      { key: "0", hint: "Press 0 with RIGHT PINKY 💋", color: "#EF4444" },
    ],
    
    words: ["123", "456", "789", "012", "321", "555", "999", "246", "135", "100", "234", "567", "890", "111", "222", "333", "444", "777", "888", "000"],
    
    practicePatterns: ["1234", "5678", "1234567890", "2024", "999"],
    
    speed: 0.7,
    spawnRate: 2600,
    wordsPerLevel: 12,
    health: 4,
    
    requiredAccuracy: 0.85,
    requiredWPM: 12,
    
    badge: "gold",
    icon: "🔢",
    estimatedTime: "10 min",
  },

  // ============================================
  // LEVEL 7-10: SPEED & MASTERY
  // ============================================
  7: {
    id: 7,
    gameLevel: 7,
    name: "Speed Meadow ⚡",
    subtitle: "Race Through",
    description: "Race through the meadow! Build your typing speed with nature words.",
    
    keys: "abcdefghijklmnopqrstuvwxyz".split(""),
    keyboardRows: ["home", "top", "bottom"],
    
    words: ["run", "fox", "bee", "fly", "sun", "wing", "leap", "dash", "deer", "grass", "bloom", "flit", "dance", "green", "plant", "happy", "swift", "chase", "flower", "gallop"],
    
    speed: 0.85,
    spawnRate: 2400,
    wordsPerLevel: 15,
    health: 4,
    
    requiredAccuracy: 0.88,
    requiredWPM: 18,
    
    badge: "platinum",
    icon: "⚡",
    estimatedTime: "15 min",
  },

  8: {
    id: 8,
    gameLevel: 8,
    name: "Accuracy Peak 🎯",
    subtitle: "Climb High",
    description: "Climb to the peak with precision! Each keystroke matters.",
    
    keys: "abcdefghijklmnopqrstuvwxyz".split(""),
    keyboardRows: ["home", "top", "bottom"],
    
    words: ["peak", "hill", "rock", "climb", "hike", "path", "trail", "snow", "ice", "soar", "fly", "wing", "nest", "bird", "sky", "brave", "reach", "top", "view", "gear"],
    
    speed: 0.9,
    spawnRate: 2300,
    wordsPerLevel: 18,
    health: 4,
    
    requiredAccuracy: 0.92,
    requiredWPM: 20,
    
    badge: "platinum",
    icon: "🎯",
    estimatedTime: "15 min",
  },

  9: {
    id: 9,
    gameLevel: 9,
    name: "Master Valley ✨",
    subtitle: "Cross the Valley",
    description: "Cross the valley as a typing master! Use all your skills.",
    
    keys: "abcdefghijklmnopqrstuvwxyz".split(""),
    keyboardRows: ["home", "top", "bottom"],
    
    words: ["vale", "hill", "bend", "path", "flow", "swim", "boat", "fish", "arch", "over", "walk", "tree", "rock", "moss", "jump", "sand", "road", "cool", "deep", "pond"],
    
    speed: 1.0,
    spawnRate: 2100,
    wordsPerLevel: 15,
    health: 3,
    
    requiredAccuracy: 0.90,
    requiredWPM: 22,
    
    badge: "platinum",
    icon: "✨",
    estimatedTime: "18 min",
  },

  10: {
    id: 10,
    gameLevel: 10,
    name: "Legend Kingdom 🏆",
    subtitle: "Final Quest",
    description: "Become a legend in the magical kingdom! The ultimate typing challenge.",
    
    keys: "abcdefghijklmnopqrstuvwxyz0123456789".split(""),
    keyboardRows: ["home", "top", "bottom", "numbers"],
    
    words: ["king", "queen", "magic", "spell", "wand", "flame", "beast", "roar", "gold", "gem", "chest", "quest", "hero", "tower", "knight", "sword", "fly", "brave", "river", "woods"],
    
    speed: 1.1,
    spawnRate: 1900,
    wordsPerLevel: 20,
    health: 3,
    
    requiredAccuracy: 0.92,
    requiredWPM: 25,
    
    badge: "platinum",
    icon: "🏆",
    estimatedTime: "20 min",
  },
};

// Get lesson by game level
export function getLessonByLevel(level) {
  return LESSON_LEVELS[level] || LESSON_LEVELS[1];
}

// Get words or practice patterns for a lesson in practice mode
export function getLessonWordsForPractice(lesson, count = 100) {
  if (!lesson) return [];
  
  // Prioritize practice patterns if they exist
  if (lesson.practicePatterns && lesson.practicePatterns.length > 0) {
    // Shuffle and repeat patterns to reach count if needed
    let patterns = [...lesson.practicePatterns];
    while (patterns.length < count) {
      patterns = patterns.concat(lesson.practicePatterns);
    }
    return patterns.slice(0, count);
  } else if (lesson.words && lesson.words.length > 0) {
    // Fallback to words if no patterns
    let words = [...lesson.words];
    while (words.length < count) {
      words = words.concat(lesson.words);
    }
    // Shuffle and take requested count
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
    return words.slice(0, count);
  }
  return [];
}

// Get finger hint for a key
export function getFingerHint(key) {
  if (!key || typeof key !== 'string') return null;
  const lowerKey = key.toLowerCase();
  for (const level of Object.values(LESSON_LEVELS)) {
    if (!level.fingerLabels) continue;
    if (level.fingerLabels[lowerKey]) {
      return {
        label: level.fingerLabels[lowerKey],
        color: level.fingerColors?.[lowerKey] || "#8B5CF6"
      };
    }
  }
  return null;
}

// Get color for finger
export function getFingerColor(key) {
  if (!key || typeof key !== 'string') return "#8B5CF6";
  const lowerKey = key.toLowerCase();
  for (const level of Object.values(LESSON_LEVELS)) {
    if (!level.fingerColors) continue;
    if (level.fingerColors[lowerKey]) {
      return level.fingerColors[lowerKey];
    }
  }
  return "#8B5CF6"; // Default purple
}

// Check if level is unlocked
export function isLevelUnlocked(level, profile) {
  if (level === 1) return true;
  const previousLevel = profile.completedLevels || [];
  return previousLevel.includes(level - 1);
}

// Get word list for level (filtered by allowed keys)
export function getWordsForLevel(level) {
  const lesson = getLessonByLevel(level);
  return lesson.words;
}

// Generate a word from allowed keys
export function generateWordFromKeys(keys, minLength = 3, maxLength = 8) {
  const validWords = [];
  const keySet = new Set(keys.map(k => k.toLowerCase()));
  
  for (const level of Object.values(LESSON_LEVELS)) {
    for (const word of level.words) {
      const wordLower = word.toLowerCase();
      let valid = true;
      for (const char of wordLower) {
        if (!keySet.has(char)) {
          valid = false;
          break;
        }
      }
      if (valid && wordLower.length >= minLength && wordLower.length <= maxLength) {
        validWords.push(word);
      }
    }
  }
  
  if (validWords.length === 0) {
    // Fallback: generate random word from keys
    const len = minLength + Math.floor(Math.random() * (maxLength - minLength + 1));
    let word = "";
    const keyList = Array.from(keySet);
    for (let i = 0; i < len; i++) {
      word += keyList[Math.floor(Math.random() * keyList.length)];
    }
    return word;
  }
  
  return validWords[Math.floor(Math.random() * validWords.length)];
}
