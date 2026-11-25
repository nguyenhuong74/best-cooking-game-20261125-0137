// The chef: keyboard movement, click-to-move, and arriving at a station.
import { allStations, approachPoint, nearestStation, useStation } from './stations.js';

const SPEED = 280;
const FLOOR = { x0: 60, y0: 250, x1: 1220, y1: 640 };

export function updateChef(game, dt, input, onAction) {
  const chef = game.chef;
  let dx = 0;
  let dy = 0;
  if (input.keys.has('arrowleft') || input.keys.has('a')) dx -= 1;
  if (input.keys.has('arrowright') || input.keys.has('d')) dx += 1;
  if (input.keys.has('arrowup') || input.keys.has('w')) dy -= 1;
  if (input.keys.has('arrowdown') || input.keys.has('s')) dy += 1;

  if (dx !== 0 || dy !== 0) {
    // Keyboard steering beats a click target.
    chef.tx = chef.x;
    chef.ty = chef.y;
    const len = Math.hypot(dx, dy);
    chef.x += (dx / len) * SPEED * dt;
    chef.y += (dy / len) * SPEED * dt;
    chef.dir = dx !== 0 ? Math.sign(dx) : chef.dir;
    chef.moving = true;
  } else {
    const d = Math.hypot(chef.tx - chef.x, chef.ty - chef.y);
    if (d > 4) {
      const step = Math.min(d, SPEED * dt);
      chef.x += ((chef.tx - chef.x) / d) * step;
      chef.y += ((chef.ty - chef.y) / d) * step;
      chef.dir = chef.tx - chef.x !== 0 ? Math.sign(chef.tx - chef.x) : chef.dir;
      chef.moving = true;
    } else {
      chef.moving = false;
    }
  }

  chef.x = Math.max(FLOOR.x0, Math.min(FLOOR.x1, chef.x));
  chef.y = Math.max(FLOOR.y0, Math.min(FLOOR.y1, chef.y));
  chef.bob += dt * (chef.moving ? 12 : 2);

  // Arrived at a station the player clicked: use it.
  if (chef.pending) {
    const p = approachPoint(chef.pending);
    if (Math.hypot(chef.x - p.x, chef.y - p.y) < 14) {
      const station = chef.pending;
      chef.pending = null;
      const sound = useStation(game, station, onAction.serve);
      if (sound) onAction.sound(sound);
    }
  }
}

// E / Enter: use the nearest station, or walk to it first.
export function interact(game, onAction) {
  const station = nearestStation(game);
  if (!station) return;
  const p = approachPoint(station);
  const d = Math.hypot(game.chef.x - p.x, game.chef.y - p.y);
  if (d < 110) {
    const sound = useStation(game, station, onAction.serve);
    if (sound) onAction.sound(sound);
  } else {
    game.chef.tx = p.x;
    game.chef.ty = p.y;
    game.chef.pending = station;
  }
}

// Click: a station click walks there and uses it; a floor click just walks.
export function clickAt(game, x, y) {
  if (game.screen !== 'playing') return false;
  for (const st of allStations()) {
    if (x >= st.x && x <= st.x + st.w && y >= st.y && y <= st.y + st.h) {
      const p = approachPoint(st);
      game.chef.tx = p.x;
      game.chef.ty = p.y;
      game.chef.pending = st;
      return true;
    }
  }
  game.chef.tx = Math.max(FLOOR.x0, Math.min(FLOOR.x1, x));
  game.chef.ty = Math.max(FLOOR.y0, Math.min(FLOOR.y1, y));
  game.chef.pending = null;
  return true;
}
