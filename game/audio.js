// All sound is synthesized with the Web Audio API: no audio files, no network.
// Every effect is a short oscillator or noise burst so it answers at once.
let ctx = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}

function audio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', vol = 0.12, slideTo = null) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
  gain.gain.setValueAtTime(vol, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + dur);
}

function noise(dur, vol = 0.1, freq = 1200) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
}

export function sfx(name) {
  switch (name) {
    case 'pickup': tone(520, 0.08, 'triangle', 0.12, 760); break;
    case 'pickup-burnt': tone(220, 0.15, 'sawtooth', 0.08, 140); break;
    case 'place': tone(340, 0.07, 'triangle', 0.12, 260); noise(0.05, 0.06, 800); break;
    case 'chop': noise(0.06, 0.16, 500); tone(180, 0.05, 'square', 0.06); break;
    case 'chop-hint': tone(440, 0.06, 'triangle', 0.08); break;
    case 'cooked': tone(660, 0.1, 'sine', 0.1, 880); break;
    case 'chopped': tone(600, 0.08, 'triangle', 0.1, 900); break;
    case 'burnt': tone(160, 0.3, 'sawtooth', 0.1, 90); break;
    case 'serve': tone(523, 0.12, 'sine', 0.14); setTimeout(() => tone(784, 0.18, 'sine', 0.14), 90); break;
    case 'buzz': tone(140, 0.18, 'sawtooth', 0.1, 110); break;
    case 'trash': noise(0.12, 0.12, 300); break;
    case 'spawn': tone(880, 0.07, 'sine', 0.07, 990); break;
    case 'urgent': tone(980, 0.09, 'square', 0.06); break;
    case 'expire': tone(330, 0.3, 'sawtooth', 0.1, 160); break;
    case 'dayclear': [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.2, 'sine', 0.13), i * 110)); break;
    case 'gameover': [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.11), i * 140)); break;
    case 'start': tone(440, 0.1, 'sine', 0.12, 660); break;
    default: break;
  }
}
