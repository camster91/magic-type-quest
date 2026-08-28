const CONFETTI_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#FFD93D', '#A78BFA', '#F472B6', '#34D399',
];

export function createCanvasEffects({
  context,
  state,
  prefersReducedMotion,
  ImageCtor = Image,
  random = Math.random,
}) {
  const particles = [];
  const particleTexture = new ImageCtor();
  particleTexture.src = 'assets/pro/particles/sparkle.png';

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
    drawQuietGradient,
    drawTexturedParticles,
    drawWords,
    spawnConfetti,
    spawnParticles,
    updateParticles,
    particles,
  };
}
