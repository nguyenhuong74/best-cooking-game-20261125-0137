// Deterministic scenes for screenshots: ?shot=start|play|serve|rush&seed=N
// builds a fixed kitchen state so every screenshot is reproducible.
// Shot mode freezes the timers; the game still plays normally without it.
import { RECIPES } from './recipes.js';

function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

function ticket(game, id, recipeId, left, max) {
  return { id, recipe: recipeById(recipeId), left, max };
}

export function applyShot(game, shot) {
  game.shot = shot;
  game.screen = 'playing';
  game.animT = 0.6; // frozen frame: flames and pulses stay readable
  game.message = '';
  game.messageT = 0;

  if (shot === 'start') {
    game.screen = 'title';
    return;
  }

  if (shot === 'play') {
    game.day = 2;
    game.score = 84;
    game.served = 5;
    game.combo = 2;
    game.bestCombo = 3;
    game.lives = 3;
    game.shiftLeft = 96;
    game.shiftMax = 150;
    game.orders = [
      ticket(game, 7, 'cheeseburger', 32, 45),
      ticket(game, 8, 'salad', 18, 40),
      ticket(game, 9, 'burger', 41, 48),
    ];
    game.nextOrderId = 10;
    // Chef mid-kitchen carrying a chopped tomato toward the plate.
    game.chef.x = 560;
    game.chef.y = 430;
    game.chef.tx = 560;
    game.chef.ty = 430;
    game.chef.dir = 1;
    game.chef.carry = { kind: 'item', id: 'tomato', done: true };
    // Patty sizzling on the grill, onion half-chopped on the board.
    game.grill = [{ item: { id: 'patty', done: false }, progress: 0.55, burn: 0 }, null];
    game.board = { item: { id: 'onion', done: false }, progress: 0.6 };
    // Plate 1 mid-assembly: bun + grilled patty + lettuce, tomato on its way.
    game.plates = [
      { items: ['bun', 'patty', 'lettuce'] },
      { items: ['bun'] },
    ];
    return;
  }

  if (shot === 'serve') {
    game.day = 2;
    game.score = 132;
    game.served = 8;
    game.combo = 3;
    game.bestCombo = 4;
    game.lives = 3;
    game.shiftLeft = 74;
    game.shiftMax = 150;
    game.orders = [
      ticket(game, 12, 'cheeseburger', 12, 45),
      ticket(game, 13, 'salad', 30, 40),
    ];
    game.nextOrderId = 14;
    // Chef at the serving window holding the finished Cheese Burger.
    game.chef.x = 1105;
    game.chef.y = 300;
    game.chef.tx = 1105;
    game.chef.ty = 300;
    game.chef.dir = 1;
    game.chef.carry = { kind: 'plate', index: 0, items: ['bun', 'patty', 'cheese', 'tomato'] };
    game.grill = [{ item: { id: 'patty', done: true }, progress: 1, burn: 0.25 }, null];
    game.board = { item: { id: 'lettuce', done: true }, progress: 1 };
    game.plates = [{ items: [] }, { items: ['bun', 'lettuce'] }];
    game.message = 'Cheese Burger ready — serve it at the window!';
    game.messageT = 10;
    game.messageColor = '#8dff7a';
    return;
  }

  if (shot === 'rush') {
    game.day = 3;
    game.score = 246;
    game.served = 15;
    game.combo = 4;
    game.bestCombo = 5;
    game.lives = 1;
    game.shiftLeft = 22;
    game.shiftMax = 150;
    game.orders = [
      ticket(game, 21, 'mega', 6, 44),
      ticket(game, 22, 'double', 14, 42),
      ticket(game, 23, 'veggie', 24, 40),
      ticket(game, 24, 'salad', 33, 38),
    ];
    game.nextOrderId = 25;
    game.chef.x = 300;
    game.chef.y = 430;
    game.chef.tx = 300;
    game.chef.ty = 430;
    game.chef.dir = -1;
    game.chef.carry = { kind: 'item', id: 'patty', done: false };
    game.grill = [
      { item: { id: 'patty', done: false }, progress: 0.8, burn: 0 },
      { item: { id: 'patty', done: true }, progress: 1, burn: 0.7 },
    ];
    game.board = { item: { id: 'tomato', done: false }, progress: 0.35 };
    game.plates = [
      { items: ['bun', 'patty', 'cheese'] },
      { items: ['bun', 'lettuce', 'tomato'] },
    ];
    game.message = 'RUSH HOUR! The Mega Burger ticket is about to expire!';
    game.messageT = 10;
    game.messageColor = '#ff7a6b';
    return;
  }

  // Unknown shot name: plain title screen.
  game.screen = 'title';
}
