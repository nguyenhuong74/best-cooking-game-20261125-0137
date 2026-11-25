// Shared game state for Golden Ladle: Rush Hour Kitchen.
// One factory builds a fresh game; nothing here knows how to draw or play.

export const VIEW_W = 1280;
export const VIEW_H = 800;

// Small deterministic RNG so screenshot scenes can be seeded.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A carried thing is either one ingredient or a whole plate.
//   { kind: 'item', id: 'patty', done: false }
//   { kind: 'plate', items: ['bun', 'patty', 'lettuce'] }  (ids, all done)
export function createGame(seed = 1) {
  return {
    seed,
    rand: mulberry32(seed),
    screen: 'title', // title | playing | paused | dayclear | gameover
    day: 1,
    score: 0,
    served: 0,
    missed: 0,
    lives: 3,
    combo: 0,
    bestCombo: 0,
    shiftLeft: 150,
    shiftMax: 150,
    time: 0,
    chef: {
      x: 640, y: 470, tx: 640, ty: 470,
      dir: 1, moving: false, bob: 0,
      carry: null, pending: null, // pending: station id to use on arrival
    },
    orders: [],
    nextOrderId: 1,
    spawnT: 3,
    grill: [null, null], // { item, progress, burn } per slot
    board: null, // { item, progress }
    plates: [{ items: [] }, { items: [] }],
    floaters: [], // { x, y, text, color, t }
    particles: [], // { x, y, vx, vy, r, color, t, life }
    message: '',
    messageT: 0,
    messageColor: '#ffffff',
    muted: false,
    overReason: '',
    shot: null, // 'start' | 'play' | 'serve' | 'rush' in screenshot mode
    animT: 0, // visual clock; frozen in screenshot mode
  };
}

export function say(game, text, color = '#ffffff') {
  game.message = text;
  game.messageT = 2.2;
  game.messageColor = color;
}

export function floater(game, x, y, text, color = '#ffd94d') {
  game.floaters.push({ x, y, text, color, t: 0 });
}

export function burst(game, x, y, color, n = 10) {
  for (let i = 0; i < n; i++) {
    const a = game.rand() * Math.PI * 2;
    const sp = 40 + game.rand() * 90;
    game.particles.push({
      x, y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
      r: 2 + game.rand() * 3, color, t: 0, life: 0.6 + game.rand() * 0.4,
    });
  }
}

export function loseLife(game, reason) {
  game.lives -= 1;
  game.combo = 0;
  game.missed += 1;
  say(game, reason, '#ff7a6b');
  if (game.lives <= 0) {
    game.screen = 'gameover';
    game.overReason = reason;
  }
}
