// Order tickets: spawning, countdowns, expiry and matching a plate to a ticket.
import { recipesForDay, sameItems } from './recipes.js';
import { loseLife, say, floater, burst } from './state.js';

export function orderTimeFor(day) {
  return Math.max(26, 52 - day * 3);
}

export function maxOrdersFor(day) {
  return Math.min(4, 2 + day);
}

export function spawnIntervalFor(day) {
  return Math.max(6, 13 - day);
}

export function spawnOrder(game) {
  const pool = recipesForDay(game.day);
  const recipe = pool[Math.floor(game.rand() * pool.length)];
  const seconds = orderTimeFor(game.day);
  game.orders.push({ id: game.nextOrderId, recipe, left: seconds, max: seconds });
  game.nextOrderId += 1;
}

export function updateOrders(game, dt, onTick) {
  game.spawnT -= dt;
  if (game.spawnT <= 0 && game.orders.length < maxOrdersFor(game.day)) {
    spawnOrder(game);
    game.spawnT = spawnIntervalFor(game.day) * (0.8 + game.rand() * 0.4);
    onTick('spawn');
  }
  for (let i = game.orders.length - 1; i >= 0; i--) {
    const order = game.orders[i];
    const wasUrgent = order.left <= 10;
    order.left -= dt;
    if (!wasUrgent && order.left <= 10 && order.left > 0) onTick('urgent');
    if (order.left <= 0) {
      game.orders.splice(i, 1);
      loseLife(game, `${order.recipe.name} walked out! Order expired.`);
      onTick('expire');
    }
  }
}

// The first open ticket whose dish matches the plate exactly.
export function findMatchingOrder(game, items) {
  for (const order of game.orders) {
    if (sameItems(order.recipe.items, items)) return order;
  }
  return null;
}

export function serveOrder(game, order, x, y, onTick) {
  const timeBonus = Math.round((order.left / order.max) * 10);
  const comboBonus = game.combo * 2;
  const earned = order.recipe.price + timeBonus + comboBonus;
  game.score += earned;
  game.combo += 1;
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  game.served += 1;
  game.orders.splice(game.orders.indexOf(order), 1);
  floater(game, x, y - 30, `+$${earned}`, '#ffd94d');
  if (game.combo >= 3) floater(game, x, y - 58, `Combo x${game.combo}!`, '#7be0ff');
  burst(game, x, y, '#ffd94d', 14);
  say(game, `${order.recipe.name} served! +$${earned}`, '#8dff7a');
  onTick('serve');
}

export function startDay(game) {
  game.day += 1;
  game.shiftLeft = game.shiftMax;
  game.spawnT = 2;
  game.orders = [];
  game.grill = [null, null];
  game.board = null;
  game.plates = [{ items: [] }, { items: [] }];
  game.chef.carry = null;
  game.chef.x = 640;
  game.chef.y = 470;
  game.chef.tx = 640;
  game.chef.ty = 470;
}
