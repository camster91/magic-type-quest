/**
 * BloomType v2 — Meadow restoration scene
 * The play screen starts as a dry, damaged meadow. Every finished word
 * plants or grows a flower, the grass turns green, and wildlife returns.
 * The red fox guide reacts to the learner's typing.
 *
 * Drawing is split from the rules: `meadowPlan()` is pure and tested;
 * `createMeadowScene()` loads the art and paints it onto the game canvas.
 */

// Static URLs so the build only ships the art the scene uses.
export const MEADOW_ART = {
  sky: new URL('../../assets/v2/meadow/biomes.meadow.layer.sky.webp', import.meta.url).href,
  far: new URL('../../assets/v2/meadow/biomes.meadow.layer.far.webp', import.meta.url).href,
  groundDamaged: new URL('../../assets/v2/meadow/biomes.meadow.layer.ground.damaged.webp', import.meta.url).href,
  groundRestored: new URL('../../assets/v2/meadow/biomes.meadow.layer.ground.restored.webp', import.meta.url).href,
  mid: new URL('../../assets/v2/meadow/biomes.meadow.layer.mid.webp', import.meta.url).href,
  foreground: new URL('../../assets/v2/meadow/biomes.meadow.layer.foreground.webp', import.meta.url).href,
  seedling: new URL('../../assets/v2/meadow/props.meadow.blackeyedsusan.seedling.webp', import.meta.url).href,
  young: new URL('../../assets/v2/meadow/props.meadow.blackeyedsusan.young.webp', import.meta.url).href,
  flowering: new URL('../../assets/v2/meadow/props.meadow.blackeyedsusan.flowering.webp', import.meta.url).href,
  milkweed: new URL('../../assets/v2/meadow/props.meadow.milkweed.webp', import.meta.url).href,
  goldenrod: new URL('../../assets/v2/meadow/props.meadow.goldenrod.webp', import.meta.url).href,
  beehotel: new URL('../../assets/v2/meadow/props.meadow.beehotel.webp', import.meta.url).href,
  nestbox: new URL('../../assets/v2/meadow/props.meadow.nestbox.webp', import.meta.url).href,
  bee: new URL('../../assets/v2/meadow/wildlife.bumblebee.move.webp', import.meta.url).href,
  monarch: new URL('../../assets/v2/meadow/wildlife.monarch.move.webp', import.meta.url).href,
  bluebird: new URL('../../assets/v2/meadow/wildlife.bluebird.webp', import.meta.url).href,
  cottontail: new URL('../../assets/v2/meadow/wildlife.cottontail.webp', import.meta.url).href,
  foxIdle: new URL('../../assets/v2/meadow/companion.fox.idle.webp', import.meta.url).href,
  foxHappy: new URL('../../assets/v2/meadow/companion.fox.happy.webp', import.meta.url).href,
  foxLook: new URL('../../assets/v2/meadow/companion.fox.look.webp', import.meta.url).href,
};

// Where flowers go, as fractions of the screen width, in planting order.
// Spread out so every word grows something new in a different spot.
const PLANT_SLOTS = [
  { x: 0.42, depth: 0.55, kind: 'susan' },
  { x: 0.60, depth: 0.70, kind: 'susan' },
  { x: 0.30, depth: 0.85, kind: 'susan' },
  { x: 0.52, depth: 0.95, kind: 'susan' },
  { x: 0.70, depth: 0.50, kind: 'milkweed' },
  { x: 0.36, depth: 0.40, kind: 'susan' },
  { x: 0.82, depth: 0.80, kind: 'susan' },
  { x: 0.08, depth: 0.60, kind: 'goldenrod' },
  { x: 0.64, depth: 0.98, kind: 'susan' },
  { x: 0.46, depth: 0.30, kind: 'goldenrod' },
  { x: 0.24, depth: 0.50, kind: 'susan' },
  { x: 0.90, depth: 0.45, kind: 'milkweed' },
];

// Progress (0–1) at which each visitor or prop appears.
const ARRIVALS = [
  { id: 'beehotel', at: 0.3 },
  { id: 'bee', at: 0.35 },
  { id: 'nestbox', at: 0.45 },
  { id: 'monarch', at: 0.55 },
  { id: 'bluebird', at: 0.7 },
  { id: 'monarch2', at: 0.8 },
  { id: 'cottontail', at: 0.9 },
];

const clamp01 = (n) => Math.max(0, Math.min(1, n));

/**
 * Pure description of the meadow for a given amount of progress.
 * `wordsDone` drives the flowers; `progress` (0–1) drives everything else.
 */
export function meadowPlan(progress, wordsDone) {
  const p = clamp01(Number(progress) || 0);
  const done = Math.max(0, Math.floor(Number(wordsDone) || 0));
  const plants = PLANT_SLOTS.slice(0, Math.min(done, PLANT_SLOTS.length)).map((slot, i) => {
    // A plant starts as a seedling and grows one stage with each later word.
    const stage = Math.min(2, done - 1 - i);
    return { ...slot, index: i, stage };
  });
  return {
    restored: clamp01(p / 0.6),
    mid: clamp01((p - 0.25) / 0.45),
    foreground: clamp01((p - 0.7) / 0.3),
    plants,
    visitors: ARRIVALS.filter((a) => p >= a.at).map((a) => a.id),
  };
}

function easeOutBack(t) {
  const c = 1.6;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
}

export function createMeadowScene({
  context,
  state,
  prefersReducedMotion = () => false,
  ImageCtor = Image,
  createCanvas = () => document.createElement('canvas'),
  getKeyboardTop = () => state.canvasH * 0.83,
  now = () => performance.now(),
}) {
  const images = {};
  let loading = false;
  // Smoothed layer alphas so changes fade in instead of popping.
  const shown = { restored: 0, mid: 0, foreground: 0 };
  const plantChanges = new Map(); // index -> { stage, at }
  const arrivals = new Map(); // id -> time first seen
  let foxMood = { pose: 'foxIdle', until: 0 };
  let layerCache = { key: '', layers: {} };
  let lastFrame = 0;

  function load() {
    if (loading) return;
    loading = true;
    for (const [name, src] of Object.entries(MEADOW_ART)) {
      const img = new ImageCtor();
      img.decoding = 'async';
      img.onerror = () => { img._broken = true; };
      img.src = src;
      images[name] = img;
    }
  }

  const ready = (img) => img && img.complete && !img._broken && img.naturalWidth > 0;

  function isReady() {
    return ['sky', 'far', 'groundDamaged'].every((name) => ready(images[name]));
  }

  /** Forget per-level animation state (call at the start of each level). */
  function reset() {
    shown.restored = 0;
    shown.mid = 0;
    shown.foreground = 0;
    plantChanges.clear();
    arrivals.clear();
    foxMood = { pose: 'foxIdle', until: 0 };
  }

  function cheer() {
    foxMood = { pose: 'foxHappy', until: now() + 1200 };
  }

  function notice() {
    if (foxMood.pose !== 'foxHappy') foxMood = { pose: 'foxLook', until: now() + 900 };
  }

  // Pre-scale each big layer to the screen once per size, so every frame
  // is a few cheap screen-sized copies instead of 2688px images.
  function scaledLayers(width, height) {
    const ratio = Math.min(1.5, globalThis.devicePixelRatio || 1);
    const key = `${width}x${height}@${ratio}`;
    if (layerCache.key === key && Object.keys(layerCache.layers).length === 6) return layerCache.layers;
    if (layerCache.key !== key) layerCache = { key, layers: {} };
    for (const name of ['sky', 'far', 'groundDamaged', 'groundRestored', 'mid', 'foreground']) {
      if (layerCache.layers[name] || !ready(images[name])) continue;
      const img = images[name];
      const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const c = createCanvas();
      c.width = Math.round(width * ratio);
      c.height = Math.round(height * ratio);
      const g = c.getContext('2d');
      g.scale(ratio, ratio);
      // Centered horizontally, anchored to the bottom so the ground shows.
      g.drawImage(img, (width - w) / 2, height - h, w, h);
      layerCache.layers[name] = c;
    }
    return layerCache.layers;
  }

  function approach(name, target, dt) {
    if (prefersReducedMotion()) {
      shown[name] = target;
      return;
    }
    const step = dt / 900;
    shown[name] = shown[name] < target
      ? Math.min(target, shown[name] + step)
      : Math.max(target, shown[name] - step);
  }

  function drawLayer(layers, name, alpha, width, height) {
    const layer = layers[name];
    if (!layer || alpha <= 0.001) return;
    context.globalAlpha = alpha;
    context.drawImage(layer, 0, 0, width, height);
    context.globalAlpha = 1;
  }

  function drawSprite(name, cx, baseY, height, { alpha = 1, flip = false, squashX = 1, scale = 1 } = {}) {
    const img = images[name];
    if (!ready(img) || alpha <= 0.001) return;
    const h = height * scale;
    const w = (img.naturalWidth / img.naturalHeight) * h;
    context.save();
    context.globalAlpha = alpha;
    context.translate(cx, baseY);
    context.scale((flip ? -1 : 1) * squashX, 1);
    context.drawImage(img, -w / 2, -h, w, h);
    context.restore();
  }

  function arrival(id, t) {
    if (!arrivals.has(id)) arrivals.set(id, t);
    if (prefersReducedMotion()) return 1;
    return clamp01((t - arrivals.get(id)) / 900);
  }

  /** Paint the scene. `progress` is 0–1 through the level. */
  function draw(progress, wordsDone) {
    const width = state.canvasW;
    const height = state.canvasH;
    const t = now();
    const dt = lastFrame ? Math.min(100, t - lastFrame) : 16;
    lastFrame = t;
    const calm = prefersReducedMotion();
    const plan = meadowPlan(progress, wordsDone);

    approach('restored', plan.restored, dt);
    approach('mid', plan.mid, dt);
    approach('foreground', plan.foreground, dt);

    const layers = scaledLayers(width, height);
    drawLayer(layers, 'sky', 1, width, height);
    drawLayer(layers, 'far', 1, width, height);
    drawLayer(layers, 'groundDamaged', 1, width, height);
    drawLayer(layers, 'groundRestored', shown.restored, width, height);
    drawLayer(layers, 'mid', shown.mid, width, height);

    // Ground band between the far hills and the on-screen keyboard.
    const groundBottom = Math.min(height, getKeyboardTop()) - 6;
    const groundTop = Math.max(height * 0.62, groundBottom - height * 0.2);
    const groundY = (depth) => groundTop + (groundBottom - groundTop) * depth;
    const sizeAt = (depth) => height * (0.75 + depth * 0.4);

    const visitors = new Set(plan.visitors);

    // Props stand at the back so flowers can grow in front of them.
    if (visitors.has('beehotel')) {
      const a = arrival('beehotel', t);
      drawSprite('beehotel', width * 0.76, groundY(0.2), sizeAt(0.2) * 0.17, { alpha: a, scale: 0.7 + 0.3 * a });
    }
    if (visitors.has('nestbox')) {
      const a = arrival('nestbox', t);
      drawSprite('nestbox', width * 0.14, groundY(0.15), sizeAt(0.15) * 0.2, { alpha: a, scale: 0.7 + 0.3 * a });
      if (visitors.has('bluebird')) {
        const b = arrival('bluebird', t);
        const hop = calm ? 0 : Math.abs(Math.sin(t / 700)) * 3;
        const perchY = groundY(0.15) - sizeAt(0.15) * 0.2 * 0.97 - hop - (1 - b) * 60;
        drawSprite('bluebird', width * 0.14, perchY, height * 0.075, { alpha: b });
      }
    }

    // Flowers, back to front, so nearer plants overlap farther ones.
    const plants = [...plan.plants].sort((a, b) => a.depth - b.depth);
    for (const plant of plants) {
      const prev = plantChanges.get(plant.index);
      if (!prev || prev.stage !== plant.stage) plantChanges.set(plant.index, { stage: plant.stage, at: t });
      const age = calm ? 1 : clamp01((t - plantChanges.get(plant.index).at) / 450);
      const pop = calm ? 1 : easeOutBack(age);
      const sway = calm ? 1 : 1 + Math.sin(t / 900 + plant.index) * 0.015;
      const base = sizeAt(plant.depth);
      let name = ['seedling', 'young', 'flowering'][plant.stage];
      let h = base * [0.05, 0.11, 0.16][plant.stage];
      if (plant.kind !== 'susan' && plant.stage === 2) {
        name = plant.kind;
        h = base * 0.2;
      }
      drawSprite(name, width * plant.x, groundY(plant.depth), h, { scale: Math.max(0.2, pop), squashX: sway });
    }

    if (visitors.has('cottontail')) {
      const a = arrival('cottontail', t);
      const x = width * (0.24 + 0.04 * a);
      drawSprite('cottontail', x, groundY(0.9), height * 0.1, { alpha: a });
    }

    drawLayer(layers, 'foreground', shown.foreground, width, height);

    // The fox guide sits in front, near the left of the meadow.
    if (foxMood.until && t > foxMood.until) foxMood = { pose: 'foxIdle', until: 0 };
    const breathe = calm ? 1 : 1 + Math.sin(t / 800) * 0.01;
    const foxH = height * (foxMood.pose === 'foxIdle' ? 0.13 : 0.17);
    drawSprite(foxMood.pose, width * 0.13, groundBottom, foxH, { squashX: breathe });

    // Flying visitors drift over the flowers.
    if (visitors.has('bee')) {
      const a = arrival('bee', t);
      const x = width * (0.55 + (calm ? 0 : Math.sin(t / 1300) * 0.12));
      const y = groundTop - height * 0.04 + (calm ? 0 : Math.sin(t / 380) * 8);
      drawSprite('bee', x, y, height * 0.055, { alpha: a, flip: !calm && Math.cos(t / 1300) < 0 });
    }
    for (const [id, phase, lane] of [['monarch', 0, 0.38], ['monarch2', 2.4, 0.7]]) {
      if (!visitors.has(id)) continue;
      const a = arrival(id, t);
      const x = width * (lane + (calm ? 0 : Math.sin(t / 2100 + phase) * 0.14));
      const y = groundTop - height * 0.1 + (calm ? 0 : Math.sin(t / 600 + phase) * 14);
      const flap = calm ? 1 : 0.75 + Math.abs(Math.sin(t / 140 + phase)) * 0.25;
      drawSprite('monarch', x, y, height * 0.06, { alpha: a, squashX: flap });
    }
  }

  return { load, isReady, reset, draw, cheer, notice };
}
