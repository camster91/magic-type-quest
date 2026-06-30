// ===== ASSET REGISTRY =====
// Central registry for all game assets
// Usage: import { getAsset, preloadAssets } from './assets.js'

// Pet emoji -> pet name (used for player pet selection)
export const PET_EMOJI_TO_NAME = {
  '🌸': 'flower',
  '🌻': 'sunflower',
  '🐉': 'dragon',
  '🐱': 'cat',
  '🤖': 'robot',
  '🐰': 'bunny',
  '🐼': 'panda',
  '🦊': 'fox',
  '🦉': 'owl',
  '🐶': 'puppy',
};

// Pet emoji -> asset path (state-aware: idle / happy / hurt / celebrate / fire)
// Uses the new 5-state pack at /assets/pets/{name}-{state}.png
export const PET_NAME_LIST = Object.values(PET_EMOJI_TO_NAME);

export const PET_STATES = ['idle', 'happy', 'hurt', 'celebrate', 'fire'];

export function getPetPath(emoji, state = 'idle') {
  const name = PET_EMOJI_TO_NAME[emoji] || 'flower';
  return `/assets/pets/${name}-${state}.png`;
}

export const ASSET_PATHS = {
  pets: {
    // Legacy single-frame (kept for backwards compat)
    flower: "/assets/pets/flower.png",
    sunflower: "/assets/pets/sunflower.png",
    dragon: "/assets/pets/dragon.png",
    cat: "/assets/pets/cat.png",
    robot: "/assets/pets/robot.png",
    bunny: "/assets/pets/bunny.png",
    panda: "/assets/pets/panda.png",
    fox: "/assets/pets/fox.png",
  },
  badges: {
    bronze: "/assets/badges/bronze.png",
    silver: "/assets/badges/silver.png",
    gold: "/assets/badges/gold.png",
    platinum: "/assets/badges/platinum.png",
  },
  levels: {
    homeRow: "/assets/levels/home-row.png",
    topRow: "/assets/levels/top-row.png",
    bottomRow: "/assets/levels/bottom-row.png",
    capitals: "/assets/levels/capitals.png",
    numbers: "/assets/levels/numbers.png",
    master: "/assets/levels/master.png",
  },
  guides: {
    leftHand: "/assets/guides/left-hand.png",
    rightHand: "/assets/guides/right-hand.png",
    keyboardZones: "/assets/guides/keyboard-zones.png",
  },
  ui: {
    progressBar: "/assets/ui/progress-bar.png",
    speedometer: "/assets/ui/speedometer.png",
    accuracyMeter: "/assets/ui/accuracy-meter.png",
    celebrationBanner: "/assets/ui/celebration-banner.png",
    encouragementBubble: "/assets/ui/encouragement-bubble.png",
    locked: "/assets/ui/locked.png",
    completed: "/assets/ui/completed.png",
    pause: "/assets/ui/pause.png",
    streak: "/assets/ui/streak.png",
  },
  achievements: {
    perfect: "/assets/achievements/perfect.png",
    speed10: "/assets/achievements/speed-10.png",
    speed30: "/assets/achievements/speed-30.png",
    speed50: "/assets/achievements/speed-50.png",
    combo: "/assets/achievements/combo.png",
  },
  backgrounds: {
    menu: "/assets/backgrounds/menu.png",
    practice: "/assets/backgrounds/practice.png",
    gameplay: "/assets/backgrounds/gameplay.png",
  },
  particles: {
    heart: "/assets/particles/heart.png",
    gem: "/assets/particles/gem.png",
    sparkle: "/assets/particles/sparkle.png",
    cloud: "/assets/particles/cloud.png",
    fingerGlow: "/assets/particles/finger-glow.png",
    grassTuft: "/assets/particles/grass-tuft.png",
  },
};

// Flatten all paths for preloading
export const ALL_ASSET_PATHS = Object.values(ASSET_PATHS).reduce(
  (acc, category) => [...acc, ...Object.values(category)],
  [],
);

// Critical assets to preload first (blocking)
export const CRITICAL_ASSETS = [
  // Player's default pet (flower) in all states — for instant state swap
  getPetPath('🌸', 'idle'),
  getPetPath('🌸', 'happy'),
  getPetPath('🌸', 'hurt'),
  getPetPath('🌸', 'celebrate'),
  getPetPath('🌸', 'fire'),
  ASSET_PATHS.ui.progressBar,
  ASSET_PATHS.ui.speedometer,
  ASSET_PATHS.ui.accuracyMeter,
  ASSET_PATHS.ui.celebrationBanner,
  ASSET_PATHS.ui.encouragementBubble,
];

// Image cache
const assetCache = new Map();

// Load a single asset
export function loadAsset(path) {
  if (assetCache.has(path)) return Promise.resolve(assetCache.get(path));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      assetCache.set(path, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load: ${path}`));
    img.src = path;
  });
}

// Preload multiple assets
export async function preloadAssets(paths) {
  const results = await Promise.allSettled(
    paths.map((path) => loadAsset(path)),
  );
  const loaded = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);
  const failed = results
    .filter((r) => r.status === "rejected")
    .map((r) => r.reason.message);
  if (failed.length > 0) {
    console.warn("[BloomType] Failed to load assets:", failed);
  }
  return loaded;
}

// Get asset (Image object) by key path (e.g., "pets.flower")
export function getAsset(keyPath) {
  const keys = keyPath.split(".");
  let current = ASSET_PATHS;
  for (const key of keys) {
    if (current[key] === undefined) {
      console.warn(`[BloomType] Asset path not found: ${keyPath}`);
      return null;
    }
    current = current[key];
  }
  // 'current' is the path string now, get from cache
  if (assetCache.has(current)) {
    return assetCache.get(current);
  }

  // If not in cache, trigger a lazy load but return null for now
  // This prevents crashing
  loadAsset(current).catch(() => {});
  return null;
}

// Preload all critical assets on app start
export async function preloadCriticalAssets() {
  console.log("[BloomType] Preloading critical assets...");
  await preloadAssets(CRITICAL_ASSETS);
  console.log("[BloomType] Critical assets loaded");
}
