// Golden Ladle: Rush Hour Kitchen — bootstrap, game loop and input.
// Owns the screens, the clock and the wiring between the modules; the rules
// live in orders.js / stations.js and the pictures in render.js.
import { createGame, say } from './state.js';
import { updateOrders, serveOrder, findMatchingOrder, startDay } from './orders.js';
import { updateStations, chopHit, nearestStation } from './stations.js';
import { updateChef, interact, clickAt } from './chef.js';
import { render } from './render.js';
import { sfx, setMuted } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || 1) || 1;

let game = createGame(seed);
const input = { keys: new Set() };

// Fit the 1280x800 canvas into the window while keeping its shape.
function fit() {
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 800);
  canvas.style.width = `${Math.floor(1280 * scale)}px`;
  canvas.style.height = `${Math.floor(800 * scale)}px`;
}
window.addEventListener('resize', fit);
fit();

function announce(text) {
  if (statusEl) statusEl.textContent = text;
}

function sound(name) {
  sfx(name);
}

function onServe(items, x, y) {
  const order = findMatchingOrder(game, items);
  if (!order) {
    say(game, 'No ticket matches that plate — check the order board!', '#ffb3a7');
    return false;
  }
  serveOrder(game, order, x, y, (ev) => {
    if (ev === 'serve') sound('serve');
  });
  return true;
}

const actions = {
  serve: (items, x, y) => onServe(items, x, y),
  sound: (name) => sound(name),
};

function onTickEvent(ev) {
  if (ev === 'spawn') sound('spawn');
  else if (ev === 'urgent') sound('urgent');
  else if (ev === 'expire') sound('expire');
  else if (ev === 'cooked') sound('cooked');
  else if (ev === 'chopped') sound('chopped');
  else if (ev === 'burnt') { sound('burnt'); say(game, 'A patty burnt on the grill!', '#ff7a6b'); }
}

function startPlaying() {
  game = createGame(seed);
  game.screen = 'playing';
  sound('start');
  say(game, 'Welcome to the Golden Ladle! First orders are coming in…', '#ffe9b0');
  announce('Game started. Cook the dishes on the order board.');
}

function endDay() {
  game.screen = 'dayclear';
  sound('dayclear');
  announce(`Day ${game.day} complete. Score ${game.score}.`);
}

function gameOver(reason) {
  game.screen = 'gameover';
  game.overReason = reason || '';
  sound('gameover');
  announce(`Shift over. Final score ${game.score}.`);
}

function update(dt) {
  game.time += dt;
  game.animT += dt;
  if (game.messageT > 0) game.messageT -= dt;
  for (let i = game.floaters.length - 1; i >= 0; i--) {
    const f = game.floaters[i];
    f.t += dt;
    if (f.t > 1.4) game.floaters.splice(i, 1);
  }
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 160 * dt;
    if (p.t > p.life) game.particles.splice(i, 1);
  }

  if (game.screen !== 'playing') return;

  updateChef(game, dt, input, actions);
  updateStations(game, dt, onTickEvent);
  updateOrders(game, dt, onTickEvent);

  game.shiftLeft -= dt;
  if (game.shiftLeft <= 0) {
    game.shiftLeft = 0;
    endDay();
  }
  // Note: an expired order can end the shift inside updateOrders, which
  // switches the screen to 'gameover' itself via loseLife.
}

// ---- input ---------------------------------------------------------------
function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 1280,
    y: ((event.clientY - rect.top) / rect.height) * 800,
  };
}

canvas.addEventListener('click', (event) => {
  if (game.screen === 'title') { startPlaying(); return; }
  if (game.screen === 'dayclear') { startDay(game); game.screen = 'playing'; sound('start'); return; }
  if (game.screen === 'gameover') { startPlaying(); return; }
  if (game.screen === 'paused') return;
  const p = canvasPoint(event);
  // Clicking the chopping board while something chops speeds it up.
  const board = { x: 380, y: 132, w: 230, h: 86 };
  if (game.board && !game.board.item.done && p.x >= board.x && p.x <= board.x + board.w && p.y >= board.y && p.y <= board.y + board.h) {
    const res = chopHit(game);
    sound('chop');
    if (res === 'done') sound('chopped');
    return;
  }
  clickAt(game, p.x, p.y);
});

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
  if (key === 'm') {
    game.muted = !game.muted;
    setMuted(game.muted);
    say(game, game.muted ? 'Sound off.' : 'Sound on.', '#ffe9b0');
    return;
  }
  if (game.screen === 'title' && (key === 'enter' || key === ' ')) { startPlaying(); return; }
  if (game.screen === 'dayclear' && key === 'enter') { startDay(game); game.screen = 'playing'; sound('start'); return; }
  if (game.screen === 'gameover' && (key === 'r' || key === 'enter')) { startPlaying(); return; }
  if (key === 'p' || key === 'escape') {
    if (game.screen === 'playing') { game.screen = 'paused'; announce('Paused.'); }
    else if (game.screen === 'paused') { game.screen = 'playing'; announce('Resumed.'); }
    return;
  }
  if (game.screen !== 'playing') return;
  if (key === 'e' || key === 'enter') { interact(game, actions); return; }
  if (key === ' ') {
    const near = nearestStation(game);
    if (near && near.kind === 'board') {
      const res = chopHit(game);
      sound('chop');
      if (res === 'done') sound('chopped');
      return;
    }
    interact(game, actions);
    return;
  }
  input.keys.add(key);
});

window.addEventListener('keyup', (event) => {
  input.keys.delete(event.key.toLowerCase());
});

// ---- main loop ------------------------------------------------------------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.shot) update(dt);
  else game.animT = 0.6; // screenshot mode: frozen frame, timers still
  render(ctx, game);
  requestAnimationFrame(frame);
}

if (shotName) {
  applyShot(game, shotName);
  announce(`Screenshot scene: ${shotName}`);
} else {
  announce('Golden Ladle: Rush Hour Kitchen. Press Enter or click to start cooking.');
}
requestAnimationFrame(frame);

// Exposed for automated play-testing only (not part of the game itself).
window.__game = {
  get state() { return game; },
  start: startPlaying,
  interact: () => interact(game, actions),
  clickAt: (x, y) => clickAt(game, x, y),
};
