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
	if (!audioCtx) return;
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
			osc.type = "sawtooth";
			osc.frequency.setValueAtTime(200, now);
			osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
			gain.gain.setValueAtTime(0.1, now);
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

