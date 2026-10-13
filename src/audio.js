import { gameState } from './state.js';
// ===== AUDIO ENGINE =====
export const AudioCtx = window.AudioContext || window.webkitAudioContext;
export let audioCtx = null;

// Polyfill: roundRect for older Safari (< 16.4) and other legacy browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
	CanvasRenderingContext2D.prototype.roundRect = function (
		x,
		y,
		w,
		h,
		r,
	) {
		const radius = Math.min(r, w / 2, h / 2);
		this.moveTo(x + radius, y);
		this.lineTo(x + w - radius, y);
		this.arcTo(x + w, y, x + w, y + radius, radius);
		this.lineTo(x + w, y + h - radius);
		this.arcTo(x + w, y + h, x + w - radius, y + h, radius);
		this.lineTo(x + radius, y + h);
		this.arcTo(x, y + h, x, y + h - radius, radius);
		this.lineTo(x, y + radius);
		this.arcTo(x, y, x + radius, y, radius);
		this.closePath();
	};
}

export function initAudio() {
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

// ===== AMBIENT MUSIC =====
let ambientNodes = [];
let ambientGain = null;

// Children and teachers can mute everything; the choice is saved.
export function isSoundOn() {
	return gameState.profile?.soundEnabled !== false;
}

let birdTimer = null;

// A short two-note chirp, like a songbird far across the meadow.
export function chirpPlan(random = Math.random) {
	const base = 2200 + random() * 1600;
	const notes = 2 + Math.floor(random() * 3);
	return Array.from({ length: notes }, (_, i) => ({
		start: i * (0.11 + random() * 0.05),
		from: base * (1 + (i % 2) * 0.18),
		to: base * (1.25 + (i % 2) * 0.1),
		length: 0.07 + random() * 0.05,
	}));
}

function playChirp() {
	if (!audioCtx || !ambientGain || !isSoundOn()) return;
	const now = audioCtx.currentTime;
	for (const note of chirpPlan()) {
		const osc = audioCtx.createOscillator();
		const g = audioCtx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(note.from, now + note.start);
		osc.frequency.exponentialRampToValueAtTime(note.to, now + note.start + note.length);
		g.gain.setValueAtTime(0.0001, now + note.start);
		g.gain.exponentialRampToValueAtTime(0.5, now + note.start + 0.015);
		g.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.length);
		osc.connect(g);
		g.connect(ambientGain);
		osc.start(now + note.start);
		osc.stop(now + note.start + note.length + 0.02);
		osc.onended = () => { g.disconnect(); osc.disconnect(); };
	}
}

function scheduleBirds() {
	birdTimer = setTimeout(() => {
		playChirp();
		scheduleBirds();
	}, 3500 + Math.random() * 5000);
}

// Soft meadow sounds: a gentle breeze and the odd distant bird.
export function playAmbient() {
	if (!audioCtx || !isSoundOn()) return;
	stopAmbient();
	try {
		ambientGain = audioCtx.createGain();
		ambientGain.gain.value = 0.05;
		ambientGain.connect(audioCtx.destination);

		// Breeze: looping soft noise through a low-pass filter that slowly sways.
		const seconds = 2;
		const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * seconds, audioCtx.sampleRate);
		const data = buffer.getChannelData(0);
		let last = 0;
		for (let i = 0; i < data.length; i++) {
			last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; // brown-ish noise
			data[i] = last * 3.5;
		}
		const noise = audioCtx.createBufferSource();
		noise.buffer = buffer;
		noise.loop = true;
		const filter = audioCtx.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.value = 420;
		const sway = audioCtx.createOscillator();
		sway.frequency.value = 0.08;
		const swayDepth = audioCtx.createGain();
		swayDepth.gain.value = 180;
		sway.connect(swayDepth);
		swayDepth.connect(filter.frequency);
		const breezeGain = audioCtx.createGain();
		breezeGain.gain.value = 0.6;
		noise.connect(filter);
		filter.connect(breezeGain);
		breezeGain.connect(ambientGain);
		noise.start();
		sway.start();
		ambientNodes.push(noise, sway, swayDepth, filter, breezeGain);
		scheduleBirds();
	} catch {}
}

export function stopAmbient() {
	if (birdTimer) clearTimeout(birdTimer);
	birdTimer = null;
	for (const n of ambientNodes) {
		try { n.stop ? n.stop() : n.disconnect(); } catch {}
	}
	ambientNodes = [];
	ambientGain = null;
}

export function setAmbientVolume(vol) {
	if (ambientGain) ambientGain.gain.value = vol;
}

export function speakWord(text) {
	if (!("speechSynthesis" in window)) return;
	if (gameState.profile.voiceEnabled === false) return;
	window.speechSynthesis.cancel();
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.rate = 0.85; // slightly slower for kids
	utterance.pitch = 1.2; // friendly pitch
	window.speechSynthesis.speak(utterance);
}

export function playSound(type) {
	if (!audioCtx || !isSoundOn()) return;
	const osc = audioCtx.createOscillator();
	const gain = audioCtx.createGain();
	osc.connect(gain);
	gain.connect(audioCtx.destination);
	const now = audioCtx.currentTime;

	// Helper to clean up nodes after they finish playing
	const cleanup = (o, g) => {
		o.onended = () => {
			g.disconnect();
			o.disconnect();
		};
	};

	switch (type) {
		case "correct":
			osc.type = "sine";
			osc.frequency.setValueAtTime(880, now);
			osc.frequency.exponentialRampToValueAtTime(1318, now + 0.1);
			gain.gain.setValueAtTime(0.15, now);
			gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
			osc.start(now);
			osc.stop(now + 0.2);
			cleanup(osc, gain);
			break;
		case "wrong":
			// A soft, low "boop": a gentle nudge, never a buzzer.
			osc.type = "sine";
			osc.frequency.setValueAtTime(330, now);
			osc.frequency.exponentialRampToValueAtTime(247, now + 0.15);
			gain.gain.setValueAtTime(0.08, now);
			gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
			osc.start(now);
			osc.stop(now + 0.2);
			cleanup(osc, gain);
			break;
		case "word":
			osc.disconnect(); // Not using the outer ones for this case
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
				cleanup(o, g);
			});
			break;
		case "level":
			osc.disconnect();
			[523, 659, 784, 1047, 1318].forEach((freq, i) => {
				const startTime = now + (i * 0.12);
				const o = audioCtx.createOscillator();
				const g = audioCtx.createGain();
				o.connect(g);
				g.connect(audioCtx.destination);
				o.frequency.setValueAtTime(freq, startTime);
				g.gain.setValueAtTime(0.12, startTime);
				g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
				o.start(startTime);
				o.stop(startTime + 0.25);
				cleanup(o, g);
			});
			break;
		case "gameover":
			osc.disconnect();
			[400, 350, 300, 200].forEach((freq, i) => {
				const startTime = now + (i * 0.18);
				const o = audioCtx.createOscillator();
				const g = audioCtx.createGain();
				o.connect(g);
				g.connect(audioCtx.destination);
				o.frequency.setValueAtTime(freq, startTime);
				o.type = "sawtooth";
				g.gain.setValueAtTime(0.1, startTime);
				g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
				o.start(startTime);
				o.stop(startTime + 0.3);
				cleanup(o, g);
			});
			break;
		case "heart": {
			osc.type = "sine";
			osc.frequency.setValueAtTime(523, now);
			osc.frequency.exponentialRampToValueAtTime(784, now + 0.15);
			gain.gain.setValueAtTime(0.15, now);
			gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
			osc.start(now);
			osc.stop(now + 0.25);
			cleanup(osc, gain);
			break;
		}
		case "combo": {
			osc.type = "triangle";
			const base = 440 + Math.min(Math.max(gameState.combo - 1, 0), 8) * 65;
			osc.frequency.setValueAtTime(base, now);
			osc.frequency.exponentialRampToValueAtTime(base * 1.5, now + 0.1);
			gain.gain.setValueAtTime(0.12, now);
			gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
			osc.start(now);
			osc.stop(now + 0.2);
			cleanup(osc, gain);
			break;
		}
	}
}

