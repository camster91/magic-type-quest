const CONFETTI_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#FFD93D', '#A78BFA', '#F472B6', '#34D399',
];

export function createCanvasEffects({
  context,
  state,
  prefersReducedMotion,
  getPetImage = () => '',
  ImageCtor = Image,
  random = Math.random,
}) {
  const particles = [];
  const particleTexture = new ImageCtor();
  particleTexture.src = 'assets/pro/particles/sparkle.png';
  const backgroundLayers = {
    sky: { img: null, scroll: 0.02 },
    trees: { img: null, scroll: 0.05 },
    hills: { img: null, scroll: 0.12 },
    grass: { img: null, scroll: 0.25 },
  };
  const flowerImages = { bud: null, sprout: null };
  const petFrames = { idle: null, happy: null, hurt: null, celebrate: null, fire: null };
  const stars = [];
  let petCurrentFrame = 'idle';
  let petFrameTimer = 0;

  function loadImage(src, trackErrors = false) {
    const image = new ImageCtor();
    if (trackErrors) image.onerror = () => { image._broken = true; };
    image.src = src;
    return image;
  }

  function loadPetState(frame) {
    if (petFrames[frame]?.complete) return petFrames[frame];
    const image = loadImage(getPetImage(frame), true);
    image.onload = () => { petFrames[frame] = image; };
    petFrames[frame] = image;
    return image;
  }

  function loadSceneImages() {
    backgroundLayers.sky.img = loadImage('assets/backgrounds/magical_garden-sky.png', true);
    backgroundLayers.trees.img = loadImage('assets/backgrounds/magical_garden-mid.png', true);
    backgroundLayers.hills.img = loadImage('assets/backgrounds/magical_garden-foreground.png', true);
    backgroundLayers.grass.img = loadImage('assets/backgrounds/magical_garden-foreground.png', true);
    flowerImages.bud = loadImage('assets/pro/flowers/bud.png');
    flowerImages.sprout = loadImage('assets/pro/flowers/sprout.png');
    loadPetState('idle');
  }

  function drawBackgroundLayer(layer, width, height, time, heightScale) {
    const image = layer.img;
    if (!image?.complete || image._broken || image.naturalWidth === 0) return;
    const layerHeight = height * heightScale;
    const layerWidth = (image.width / image.height) * layerHeight;
    const offsetX = (time * layer.scroll * 20) % layerWidth;
    for (let x = -offsetX; x < width; x += layerWidth) {
      context.drawImage(image, x, height - layerHeight, layerWidth, layerHeight);
    }
  }

  function drawStars(groundY) {
    if (stars.length === 0) {
      for (let i = 0; i < 100; i++) {
        stars.push({
          x: random() * 2000,
          y: random() * (groundY || 600),
          size: random() * 2.5 + 0.5,
          twinkle: random() * Math.PI * 2,
          speed: random() * 0.03 + 0.01,
        });
      }
    }
    context.save();
    context.fillStyle = '#ffffc8';
    for (const star of stars) {
      if (!prefersReducedMotion()) star.twinkle += star.speed;
      if (star.x < 0 || star.x > state.canvasW) continue;
      context.globalAlpha = prefersReducedMotion() ? 0.45 : 0.3 + Math.sin(star.twinkle) * 0.3;
      context.beginPath();
      context.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  function drawFallbackBackground(width, height, groundY) {
    const sky = context.createLinearGradient(0, 0, 0, groundY);
    for (const [stop, color] of [[0, '#0d0b2e'], [0.3, '#1e1b5e'], [0.6, '#4a2d7a'], [0.85, '#8b4a8a'], [1, '#c46a8a']]) {
      sky.addColorStop(stop, color);
    }
    context.fillStyle = sky;
    context.fillRect(0, 0, width, groundY);
    drawStars(groundY);

    context.fillStyle = '#1a3a2a';
    context.beginPath();
    context.moveTo(0, groundY);
    for (let x = 0; x <= width; x += 50) {
      context.lineTo(x, groundY - 30 - Math.sin(x * 0.008) * 25 - Math.cos(x * 0.015) * 15);
    }
    context.lineTo(width, groundY);
    context.closePath();
    context.fill();

    const grass = context.createLinearGradient(0, groundY - 40, 0, height);
    grass.addColorStop(0, '#2d6b3a');
    grass.addColorStop(0.5, '#3d8b4a');
    grass.addColorStop(1, '#4a9b5a');
    context.fillStyle = grass;
    context.beginPath();
    context.moveTo(0, groundY);
    for (let x = 0; x <= width; x += 40) {
      context.lineTo(x, groundY - 15 - Math.sin(x * 0.012) * 12 - Math.cos(x * 0.02) * 8);
    }
    context.lineTo(width, height);
    context.lineTo(0, height);
    context.closePath();
    context.fill();
  }

  function stableFlowerImage(flower) {
    const identity = `${flower.type || ''}:${flower.word || ''}:${flower.x || 0}`;
    const hash = [...identity].reduce((sum, character) => sum + character.charCodeAt(0), 0);
    return hash % 3 === 1 ? flowerImages.sprout : flowerImages.bud;
  }

  function drawFlower(flower, groundY) {
    const scale = flower.scale * flower.bloomProgress;
    if (scale <= 0.01) return;
    const image = stableFlowerImage(flower);
    const size = 60 * scale;
    if (!image?.complete) {
      context.save();
      context.translate(flower.x, groundY - size * 0.5);
      context.fillStyle = '#ff7ab6';
      context.beginPath();
      context.arc(0, 0, size * 0.3, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = '#2d6a4f';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(0, size * 0.3);
      context.lineTo(0, size * 0.8);
      context.stroke();
      context.restore();
      return;
    }

    context.save();
    context.translate(flower.x, groundY - size * 0.8);
    context.scale(scale, scale);
    const sway = prefersReducedMotion() ? 0 : Math.sin(state.currentTime / 800 + flower.x) * 3;
    context.rotate(sway * Math.PI / 180);
    context.drawImage(image, -size / 2, -size / 2, size, size);
    context.restore();
  }

  function drawGarden() {
    const width = state.canvasW;
    const height = state.canvasH;
    const groundY = height - 175;
    const time = state.currentTime / 1000;
    const sky = backgroundLayers.sky.img;
    if (!sky?.complete || sky._broken) {
      drawFallbackBackground(width, height, groundY);
    } else {
      drawBackgroundLayer(backgroundLayers.sky, width, height, time, 0.3);
      drawStars(groundY);
      drawBackgroundLayer(backgroundLayers.trees, width, height, time, 0.5);
      drawBackgroundLayer(backgroundLayers.hills, width, height, time, 0.8);
      drawBackgroundLayer(backgroundLayers.grass, width, height, time, 1);
    }

    if (state.garden.length > 30) state.garden = state.garden.slice(-30);
    for (const flower of state.garden) drawFlower(flower, groundY);
  }

  function setPetFrame(frame) {
    loadPetState(frame);
    petCurrentFrame = frame;
    petFrameTimer = 0;
  }

  function reloadPet(frame = 'idle') {
    for (const key of Object.keys(petFrames)) petFrames[key] = null;
    setPetFrame(frame);
  }

  function drawPet() {
    const image = petFrames[petCurrentFrame];
    if (!image?.complete || image._broken) return;
    const bounce = prefersReducedMotion() ? 0 : Math.sin(state.currentTime / 500) * 3;
    context.drawImage(image, 60, state.canvasH - 260 + bounce, 100, 100);
    petFrameTimer++;
    if (petFrameTimer > 60 && petCurrentFrame !== 'idle') {
      petCurrentFrame = 'idle';
      petFrameTimer = 0;
      loadPetState('idle');
    }
  }

  function drawQuietGradient() {
    const gradient = context.createLinearGradient(0, 0, 0, state.canvasH);
    gradient.addColorStop(0, '#1e1b4b');
    gradient.addColorStop(0.55, '#312e81');
    gradient.addColorStop(1, '#0f0a3d');
    context.fillStyle = gradient;
    context.fillRect(0, 0, state.canvasW, state.canvasH);
  }

  function drawWords() {
    for (const word of state.activeWords) word.draw(context);
  }

  function spawnParticles(x, y, count, color = '#34D399') {
    if (prefersReducedMotion()) return;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (random() - 0.5) * 0.5;
      const speed = 2 + random() * 4;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        decay: 0.02 + random() * 0.02,
        color,
        size: 3 + random() * 4,
      });
    }
  }

  function spawnConfetti(x, y, count) {
    if (prefersReducedMotion()) return;
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2;
      const speed = 3 + random() * 8;
      particles.push({
        x: x || state.canvasW / 2,
        y: y || state.canvasH / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5,
        life: 1,
        decay: 0.008 + random() * 0.015,
        color: CONFETTI_COLORS[Math.floor(random() * CONFETTI_COLORS.length)],
        size: 4 + random() * 8,
        type: 'confetti',
        rotation: random() * Math.PI * 2,
        rotSpeed: (random() - 0.5) * 0.3,
      });
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.08;
      if (particle.rotation !== undefined) particle.rotation += particle.rotSpeed || 0.05;
      particle.life -= particle.decay;
      if (particle.life <= 0) particles.splice(i, 1);
    }
  }

  function drawSolidParticles() {
    for (const particle of particles) {
      context.globalAlpha = Math.max(0, particle.life);
      context.fillStyle = particle.color;
      const transformed = particle.type === 'confetti' && particle.rotation;
      if (particle.type === 'confetti') {
        if (transformed) {
          context.save();
          context.translate(particle.x, particle.y);
          context.rotate(particle.rotation);
          context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
          context.restore();
        } else {
          context.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 4, particle.size, particle.size / 2);
        }
      } else {
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.globalAlpha = 1;
  }

  function drawTexturedParticles() {
    if (!particleTexture.complete) {
      drawSolidParticles();
      return;
    }
    for (const particle of particles) {
      context.globalAlpha = Math.max(0, particle.life);
      const size = particle.size * particle.life * 2;
      const transformed = particle.rotation !== undefined && particle.rotation !== 0;
      if (particle.type === 'confetti') {
        context.fillStyle = particle.color;
        if (transformed) {
          context.save();
          context.translate(particle.x, particle.y);
          context.rotate(particle.rotation);
          context.fillRect(-size / 2, -size / 4, size, size / 2);
          context.restore();
        } else {
          context.fillRect(particle.x - size / 2, particle.y - size / 4, size, size / 2);
        }
      } else if (transformed) {
        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.drawImage(particleTexture, -size / 2, -size / 2, size, size);
        context.restore();
      } else {
        context.drawImage(particleTexture, particle.x - size / 2, particle.y - size / 2, size, size);
      }
    }
    context.globalAlpha = 1;
  }

  return {
    drawGarden,
    drawPet,
    drawQuietGradient,
    drawTexturedParticles,
    drawWords,
    loadSceneImages,
    reloadPet,
    setPetFrame,
    spawnConfetti,
    spawnParticles,
    updateParticles,
    particles,
  };
}
