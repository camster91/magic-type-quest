/**
 * BloomType — Story & Narrative Engine
 * All in-game dialogue, chapter data, and pet personality live here.
 */

export const PET_NAME_DEFAULT = 'Bloom';

export const PET_PERSONALITY = {
  greeting: [
    "Hey hey! Ready to grow something awesome?",
    "Let's make the garden sparkle today!",
    "Typing time! I'm so excited I could bloom!",
    "Ready? Set? TYPE!",
    "Another day, more flowers to plant!",
  ],
  correct: [
    "Nice one! You're getting FAST!",
    "Boom! That was clean!",
    "Look at you go!",
    "Yes yes YES! Keep it up!",
    "You're a typing wizard!",
    "That letter practically jumped out!",
  ],
  wrong: [
    "Oof, almost! Try again!",
    "No worries, even I trip sometimes!",
    "Shake it off! Next letter's yours!",
    "Whoops! Your fingers are still warming up!",
    "Hey, that's how we learn!",
  ],
  combo2: ["Combo! That's two! 🔥", "Double trouble! Nice!", "Two in a row!"],
  combo3: ["TRIPLE! You're on fire! 🔥🔥", "Three! Don't stop now!", "That's three! Keep going!"],
  combo5: ["FIVE?! You're UNSTOPPABLE! 🔥🔥🔥", "Holy petals! Five combos!", "Legendary streak!"],
  combo10: ["TEN?! ARE YOU EVEN HUMAN?! 🌟", "THE GARDEN IS SHAKING!", "MAXIMUM POWER!"],
  wordComplete: [
    "Word planted! Another flower for the garden!",
    "Beautiful! The garden loves that one!",
    "Blooming gorgeous!",
    "That word just became a flower!",
    "Garden's getting crowded — in a good way!",
  ],
  levelComplete: [
    "Level crushed! We're getting stronger!",
    "YES! We did it! High five! 🙌",
    "That level was no match for us!",
    "Bloom power! On to the next one!",
    "The garden is THRIVING thanks to you!",
  ],
  gameOver: [
    "Aww, the stars got away... but we'll catch them next time!",
    "Hey, every gardener has a bad day. Try again?",
    "Those tricky words won't win twice!",
    "Dust off your petals and let's go again!",
    "You were SO close! One more try?",
  ],
  newLevel: [
    "New challenge! I can feel the excitement!",
    "Here we go! New letters, new flowers!",
    "Ready to level up? Let's bloom this!",
    "Fresh ground to plant on!",
  ],
  hurt: [
    "Ouch! A word snuck past us!",
    "Hey! That one got away!",
    "No! Our garden! Quick, type faster!",
    "We're losing flowers! Focus up!",
  ],
  encouragement: [
    "You're doing great! Don't stop!",
    "Every letter counts!",
    "The garden is cheering for you!",
    "You're a natural!",
    "Type like nobody's watching!",
  ],
  idle: [
    "Type the word!",
    "I'm waiting for your magic fingers!",
    "Next word's coming!",
    "Ready when you are!",
  ],
};

// Chapter narrative data — each level is a chapter in Bloom's journey
export const CHAPTERS = {
  1: {
    title: "The Garden Awakens",
    subtitle: "Home Row Garden",
    intro: "Bloom has been sleeping all winter. Wake them up by typing home row letters — A, S, D, F, J, K, L. Each word plants a seed!",
    petLine: "First letters of the season! Let's wake this garden up!",
    outro: "The first sprouts are peeking through! Bloom is stretching their petals. Home row = DONE!",
    theme: "spring",
  },
  2: {
    title: "Reach for the Sky",
    subtitle: "Top Row Sky",
    intro: "The sun is rising! Reach UP to the top row keys — Q, W, E, R, T, Y, U, I, O, P. The higher you type, the brighter the garden gets!",
    petLine: "Reach for the sky! These keys are way up there!",
    outro: "Look at that sunshine! The top row is unlocked and the flowers are turning toward the light!",
    theme: "sunrise",
  },
  3: {
    title: "Dive Deep",
    subtitle: "Bottom Row Ocean",
    intro: "Rain clouds are coming! Dive DOWN to the bottom row — Z, X, C, V, B, N, M. Type fast to water all the thirsty plants!",
    petLine: "Down we go! These keys are hiding underground!",
    outro: "Splash! The garden is fully watered. Bottom row = mastered!",
    theme: "ocean",
  },
  4: {
    title: "The Full Keyboard",
    subtitle: "Forest Adventure",
    intro: "The forest is calling! Now you know all three rows. Use EVERY letter to explore deeper into the woods. Watch out for tricky words!",
    petLine: "All rows together! The forest is huge — let's explore!",
    outro: "We made it through the forest! Every letter is your friend now!",
    theme: "forest",
  },
  5: {
    title: "Build the City",
    subtitle: "Capital City",
    intro: "Time to build something BIG! Hold Shift to make CAPITAL letters. A city needs tall buildings — tall letters!",
    petLine: "Shift power! Let's build the tallest tower ever!",
    outro: "Skyscrapers everywhere! Capital City is OPEN FOR BUSINESS!",
    theme: "city",
  },
  6: {
    title: "Blast Off!",
    subtitle: "Number Galaxy",
    intro: "3... 2... 1... BLAST OFF! Numbers 0-9 power the rocket. Type them to launch Bloom into space!",
    petLine: "Rocket fuel = numbers! Let's count our way to the stars!",
    outro: "WE HAVE LIFTOFF! The galaxy is ours! Numbers = NAILED!",
    theme: "space",
  },
  7: {
    title: "Speed Meadow",
    subtitle: "Race Through",
    intro: "The flowers are racing! Can you keep up? Type FAST to win the meadow sprint!",
    petLine: "Faster! The flowers are literally running away!",
    outro: "ZOOM! You flew through that meadow! Speed demon status: ACHIEVED!",
    theme: "speed",
  },
  8: {
    title: "Accuracy Peak",
    subtitle: "Climb High",
    intro: "One wrong step and you slip! Every letter matters on this mountain. Type with PRECISION to reach the summit!",
    petLine: "Slow and steady wins the peak! Make every letter count!",
    outro: "SUMMIT REACHED! The view is incredible — and so is your accuracy!",
    theme: "mountain",
  },
  9: {
    title: "Master Valley",
    subtitle: "Cross the Valley",
    intro: "The final test before legend status. Everything you've learned — ALL keys, speed, AND accuracy. The valley doesn't forgive mistakes!",
    petLine: "This is it. Everything we've trained for. Don't hold back!",
    outro: "You CROSSED THE VALLEY! Master status is within reach!",
    theme: "valley",
  },
  10: {
    title: "Legend Kingdom",
    subtitle: "Final Quest",
    intro: "The Ultimate Challenge. The Legend Kingdom only opens for true typing masters. Show them what you've got!",
    petLine: "The kingdom gates are creaking open... for YOU!",
    outro: "LEGEND ACHIEVED! Bloom is crying happy tears! YOU DID IT!",
    theme: "kingdom",
  },
};

// Pet evolution stages
export const PET_EVOLUTION = {
  1: { stage: 'sprout', label: 'Baby Bloom', unlockAt: 1, lines: { greeting: "Hi! I'm Bloom! I'm just a little sprout but I'm ready to type!" } },
  2: { stage: 'bud', label: 'Growing Bloom', unlockAt: 4, lines: { greeting: "Hey! I'm getting bigger! Look at my new leaves!" } },
  3: { stage: 'bloom', label: 'Legend Bloom', unlockAt: 8, lines: { greeting: "I've bloomed! And YOU made it happen! Let's go legend!" } },
};

// Utility: pick random line from array
export function say(category, evolutionStage = 1) {
  const pool = PET_PERSONALITY[category];
  if (!pool) return '';
  const lines = Array.isArray(pool) ? pool : [pool];
  return lines[Math.floor(Math.random() * lines.length)];
}

// Get chapter data
export function getChapter(level) {
  return CHAPTERS[level] || CHAPTERS[1];
}

// Get pet evolution stage for a level
export function getEvolutionStage(level) {
  if (level >= 8) return PET_EVOLUTION[3];
  if (level >= 4) return PET_EVOLUTION[2];
  return PET_EVOLUTION[1];
}

// Menu taglines that rotate
export const MENU_TAGLINES = [
  "Type words. Grow flowers. Become a legend.",
  "Bloom the garden one letter at a time!",
  "Your fingers have magic in them. Prove it!",
  "Every word plants a seed. How big will your garden grow?",
  "The typing dragon is sleeping. Wake it up!",
  "Can you type fast enough to save the garden?",
];
