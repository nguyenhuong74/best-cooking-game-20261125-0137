// The kitchen itself: where every station sits, and what happens when the
// chef uses one. The floor plan is the route puzzle: bins at the bottom,
// grill and chopping board at the top, plates beside them, the serving
// window at the far right, trash at the far left.
import { BIN_ORDER, INGREDIENTS, freshItem, itemLabel } from './recipes.js';
import { say, floater, burst } from './state.js';

export const LAYOUT = {
  grill: { x: 70, y: 132, w: 230, h: 86, slots: [{ x: 140, y: 175 }, { x: 235, y: 175 }] },
  board: { x: 380, y: 132, w: 230, h: 86, at: { x: 495, y: 175 } },
  plates: [
    { x: 690, y: 132, w: 110, h: 86, at: { x: 745, y: 175 } },
    { x: 820, y: 132, w: 110, h: 86, at: { x: 875, y: 175 } },
  ],
  window: { x: 1000, y: 132, w: 210, h: 116, at: { x: 1105, y: 268 } },
  trash: { x: 40, y: 690, w: 100, h: 84, at: { x: 90, y: 672 } },
  bins: BIN_ORDER.map((id, i) => ({
    id, x: 180 + i * 170, y: 668, w: 150, h: 100, at: { x: 255 + i * 170, y: 650 },
  })),
};

// Where the chef stands to reach a station.
export function approachPoint(station) {
  if (station.kind === 'bin') return { x: station.at.x, y: station.at.y };
  if (station.kind === 'trash') return { x: station.at.x, y: station.at.y };
  if (station.kind === 'grill') return { x: (station.slots[0].x + station.slots[1].x) / 2, y: 258 };
  if (station.kind === 'board') return { x: station.at.x, y: 258 };
  if (station.kind === 'plate') return { x: station.at.x, y: 258 };
  if (station.kind === 'window') return { x: station.at.x, y: station.at.y };
  return { x: 640, y: 470 };
}

// Every clickable station, with its approach point, for mouse input.
export function allStations() {
  const list = [
    { kind: 'grill', ...LAYOUT.grill },
    { kind: 'board', ...LAYOUT.board },
    { kind: 'window', ...LAYOUT.window },
    { kind: 'trash', ...LAYOUT.trash },
  ];
  LAYOUT.plates.forEach((p, i) => list.push({ kind: 'plate', index: i, ...p }));
  LAYOUT.bins.forEach((b) => list.push({ kind: 'bin', id: b.id, ...b }));
  return list;
}

// Nearest station whose approach point is within reach of the chef.
export function nearestStation(game) {
  const chef = game.chef;
  let best = null;
  let bestD = 110;
  for (const st of allStations()) {
    const p = approachPoint(st);
    const d = Math.hypot(chef.x - p.x, chef.y - p.y);
    if (d < bestD) { bestD = d; best = st; }
  }
  return best;
}

// Grill: a patty cooks in 4s, then burns over the next 5s.
export function updateStations(game, dt, onTick) {
  for (const slot of game.grill) {
    if (!slot) continue;
    if (!slot.item.done) {
      slot.progress += dt / 4;
      if (slot.progress >= 1) {
        slot.progress = 1;
        slot.item.done = true;
        onTick('cooked');
      }
    } else {
      slot.burn += dt / 5;
      if (slot.burn >= 1) {
        slot.item.burnt = true;
        onTick('burnt');
      }
    }
  }
  if (game.board && !game.board.item.done) {
    game.board.progress += dt * 0.08; // slow passive chopping; Space speeds it up
    if (game.board.progress >= 1) {
      game.board.progress = 1;
      game.board.item.done = true;
      onTick('chopped');
    }
  }
}

// One chop action (Space or clicking the board): a big jump of progress.
export function chopHit(game) {
  if (!game.board || game.board.item.done) return false;
  game.board.progress = Math.min(1, game.board.progress + 0.22);
  burst(game, LAYOUT.board.at.x, LAYOUT.board.at.y - 10, '#ffffff', 4);
  if (game.board.progress >= 1) {
    game.board.item.done = true;
    return 'done';
  }
  return 'hit';
}

function isCarryingItem(game) {
  return game.chef.carry && game.chef.carry.kind === 'item';
}

function isCarryingPlate(game) {
  return game.chef.carry && game.chef.carry.kind === 'plate';
}

// Use the station the chef is standing at. Returns a sound key or null.
export function useStation(game, station, onServe) {
  const chef = game.chef;
  const carry = chef.carry;

  if (station.kind === 'bin') {
    if (carry) { say(game, 'Hands full — serve or trash it first.', '#ffb3a7'); return 'buzz'; }
    chef.carry = { kind: 'item', ...freshItem(station.id) };
    return 'pickup';
  }

  if (station.kind === 'grill') {
    for (let i = 0; i < game.grill.length; i++) {
      const slot = game.grill[i];
      if (isCarryingItem(game) && carry.id === 'patty' && !carry.done && !slot) {
        game.grill[i] = { item: carry, progress: 0, burn: 0 };
        chef.carry = null;
        return 'place';
      }
      if (!carry && slot) {
        chef.carry = { kind: 'item', ...slot.item };
        game.grill[i] = null;
        return slot.item.burnt ? 'pickup-burnt' : 'pickup';
      }
    }
    if (isCarryingItem(game) && carry.id !== 'patty') say(game, 'Only patties go on the grill.', '#ffb3a7');
    else if (isCarryingItem(game) && carry.done) say(game, 'That patty is already grilled.', '#ffb3a7');
    else if (!carry) say(game, 'Grill is empty — grab a raw patty.', '#ffb3a7');
    else say(game, 'Both grill spots are busy.', '#ffb3a7');
    return 'buzz';
  }

  if (station.kind === 'board') {
    const board = game.board;
    if (isCarryingItem(game) && INGREDIENTS[carry.id].needs === 'chop' && !carry.done && !board) {
      game.board = { item: carry, progress: 0 };
      chef.carry = null;
      return 'place';
    }
    if (!carry && board && board.item.done) {
      chef.carry = { kind: 'item', ...board.item };
      game.board = null;
      return 'pickup';
    }
    if (!carry && board && !board.item.done) {
      say(game, 'Keep chopping! (Space or click the board)', '#7be0ff');
      return 'chop-hint';
    }
    if (isCarryingItem(game)) say(game, 'Only whole veggies go on the board.', '#ffb3a7');
    else say(game, 'Board is empty — grab a veggie.', '#ffb3a7');
    return 'buzz';
  }

  if (station.kind === 'plate') {
    const plate = game.plates[station.index];
    if (isCarryingItem(game)) {
      if (!carry.done) { say(game, `${itemLabel(carry)} needs prep first!`, '#ffb3a7'); return 'buzz'; }
      if (plate.items.length >= 6) { say(game, 'That plate is full.', '#ffb3a7'); return 'buzz'; }
      plate.items.push(carry.id);
      chef.carry = null;
      return 'place';
    }
    if (!carry && plate.items.length > 0) {
      chef.carry = { kind: 'plate', index: station.index, items: plate.items };
      game.plates[station.index] = { items: [] };
      return 'pickup';
    }
    if (isCarryingPlate(game)) {
      if (plate.items.length === 0) {
        game.plates[station.index] = { items: carry.items };
        chef.carry = null;
        return 'place';
      }
      say(game, 'That plate spot is taken.', '#ffb3a7');
      return 'buzz';
    }
    say(game, 'Plate is empty — add ingredients.', '#ffb3a7');
    return 'buzz';
  }

  if (station.kind === 'window') {
    if (isCarryingPlate(game)) {
      const ok = onServe(carry.items, station.at.x, station.at.y);
      if (ok) {
        chef.carry = null;
        return 'serve';
      }
      return 'buzz';
    }
    if (carry) { say(game, 'Only a finished plate goes out the window.', '#ffb3a7'); return 'buzz'; }
    say(game, 'Bring a finished plate here to serve.', '#ffb3a7');
    return 'buzz';
  }

  if (station.kind === 'trash') {
    if (carry) {
      const label = carry.kind === 'plate' ? 'plate' : itemLabel(carry);
      floater(game, station.at.x, station.at.y - 20, `Tossed ${label}`, '#c9c9c9');
      chef.carry = null;
      return 'trash';
    }
    say(game, 'Nothing to throw away.', '#ffb3a7');
    return 'buzz';
  }

  return null;
}
