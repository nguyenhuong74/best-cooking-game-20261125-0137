// All drawing for Golden Ladle: the kitchen, the food, the chef and the HUD.
// Every picture in the game is drawn here in code; there are no image files.
import { INGREDIENTS, RECIPES } from './recipes.js';
import { LAYOUT } from './stations.js';
import { findMatchingOrder } from './orders.js';
import { VIEW_W, VIEW_H } from './state.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// ---- ingredient icons (top-down, drawn) ---------------------------------
export function drawIngredient(ctx, id, x, y, s, done = true, burnt = false) {
  const r = s / 2;
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') {
    ctx.fillStyle = '#c47f2e';
    ctx.beginPath(); ctx.arc(0, 1, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8a94f';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff2cf';
    for (const [dx, dy] of [[-r * 0.3, -r * 0.25], [r * 0.3, -r * 0.3], [0, r * 0.15], [-r * 0.45, r * 0.3], [r * 0.4, r * 0.35]]) {
      ctx.beginPath(); ctx.ellipse(dx, dy, r * 0.12, r * 0.07, 0.5, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = burnt ? '#1d110a' : done ? '#5d3418' : '#a85f3c';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = burnt ? '#3a2415' : done ? '#7a4a22' : '#c07a52';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2); ctx.fill();
    if (done && !burnt) {
      ctx.strokeStyle = '#4a2a12';
      ctx.lineWidth = Math.max(1.5, r * 0.12);
      for (const off of [-r * 0.35, 0, r * 0.35]) {
        ctx.beginPath(); ctx.moveTo(off, -r * 0.5); ctx.lineTo(off, r * 0.5); ctx.stroke();
      }
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = '#4e9a26';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#6fbf3f';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8fd45e';
    ctx.lineWidth = Math.max(1.5, r * 0.1);
    ctx.beginPath(); ctx.moveTo(-r * 0.4, 0); ctx.lineTo(r * 0.4, 0); ctx.stroke();
  } else if (id === 'tomato') {
    ctx.fillStyle = '#b31f16';
    ctx.beginPath(); ctx.arc(0, 1, r * 0.95, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e0392f';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8a7a';
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, r * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4e9a26';
    ctx.beginPath(); ctx.arc(0, -r * 0.75, r * 0.22, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'cheese') {
    ctx.save();
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#e8a81c';
    rr(ctx, -r * 0.8, -r * 0.8, r * 1.6, r * 1.6, r * 0.2);
    ctx.fill();
    ctx.fillStyle = '#ffc93c';
    rr(ctx, -r * 0.68, -r * 0.68, r * 1.36, r * 1.36, r * 0.18);
    ctx.fill();
    ctx.fillStyle = '#e8a81c';
    for (const [dx, dy] of [[-r * 0.3, -r * 0.25], [r * 0.3, r * 0.2], [r * 0.1, -r * 0.4]]) {
      ctx.beginPath(); ctx.arc(dx, dy, r * 0.14, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  } else if (id === 'onion') {
    ctx.fillStyle = '#8a4d9e';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e8d5f0';
    ctx.lineWidth = Math.max(1.5, r * 0.14);
    for (const rad of [0.7, 0.45, 0.22]) {
      ctx.beginPath(); ctx.arc(0, 0, r * rad, 0, Math.PI * 2); ctx.stroke();
    }
  }
  ctx.restore();
}

// A finished dish stacked on a plate, drawn layer by layer.
export function drawPlateStack(ctx, items, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(0, 6, 34, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f4f4f0';
  ctx.beginPath(); ctx.ellipse(0, 0, 36, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9c9c2';
  ctx.lineWidth = 2;
  ctx.stroke();
  let ly = -2;
  items.forEach((id, idx) => {
    ly -= 7;
    if (id === 'bun') {
      // First bun is the flat base; a bun on top gets the tall dome.
      const top = idx === items.length - 1 && idx > 0;
      ctx.fillStyle = '#e8a94f';
      ctx.beginPath();
      ctx.ellipse(0, ly, 30, top ? 13 : 7, 0, Math.PI, 0);
      ctx.fill();
      if (top) {
        ctx.fillStyle = '#fff2cf';
        for (const dx of [-14, 0, 14]) {
          ctx.beginPath(); ctx.ellipse(dx, ly - 6, 3, 1.8, 0.4, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else if (id === 'patty') {
      ctx.fillStyle = '#6b3f1d';
      rr(ctx, -30, ly - 5, 60, 10, 5);
      ctx.fill();
    } else if (id === 'cheese') {
      ctx.fillStyle = '#ffc93c';
      ctx.beginPath();
      ctx.moveTo(-32, ly); ctx.lineTo(0, ly - 8); ctx.lineTo(32, ly); ctx.lineTo(0, ly + 4);
      ctx.closePath(); ctx.fill();
    } else if (id === 'lettuce') {
      ctx.fillStyle = '#6fbf3f';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.arc(-24 + i * 12, ly + (i % 2 ? 1 : -1), 7, 0, Math.PI * 2); ctx.fill();
      }
    } else if (id === 'tomato') {
      ctx.fillStyle = '#e0392f';
      rr(ctx, -28, ly - 5, 56, 9, 4);
      ctx.fill();
    } else if (id === 'onion') {
      ctx.strokeStyle = '#b678c9';
      ctx.lineWidth = 4;
      for (const dx of [-18, 0, 18]) {
        ctx.beginPath(); ctx.arc(dx, ly, 7, 0, Math.PI * 2); ctx.stroke();
      }
    }
  });
  ctx.restore();
}

// ---- kitchen ----------------------------------------------------------------
function drawFloor(ctx, game) {
  ctx.fillStyle = '#e8c9a0';
  ctx.fillRect(0, 100, VIEW_W, VIEW_H - 100);
  ctx.fillStyle = '#dfb98a';
  for (let y = 120; y < VIEW_H; y += 64) {
    for (let x = ((y / 64) % 2) * 32; x < VIEW_W; x += 64) {
      ctx.fillRect(x, y, 60, 60);
    }
  }
  ctx.fillStyle = '#f7ead2';
  ctx.fillRect(0, 100, VIEW_W, 34);
  ctx.fillStyle = '#d9b98c';
  ctx.fillRect(0, 130, VIEW_W, 4);
  // Wall tiles
  ctx.fillStyle = '#f3e2c7';
  for (let x = 0; x < VIEW_W; x += 46) {
    ctx.fillRect(x, 100, 42, 30);
  }
}

function drawGrill(ctx, game) {
  const g = LAYOUT.grill;
  ctx.fillStyle = '#8a5a33';
  rr(ctx, g.x - 8, g.y - 8, g.w + 16, g.h + 16, 10); ctx.fill();
  ctx.fillStyle = '#3a3a40';
  rr(ctx, g.x, g.y, g.w, g.h, 8); ctx.fill();
  ctx.strokeStyle = '#5a5a60';
  ctx.lineWidth = 3;
  for (let i = 1; i < 8; i++) {
    ctx.beginPath(); ctx.moveTo(g.x + (i * g.w) / 8, g.y + 6); ctx.lineTo(g.x + (i * g.w) / 8, g.y + g.h - 6); ctx.stroke();
  }
  text(ctx, 'GRILL', g.x + g.w / 2, g.y - 20, 13, '#fff7e8', 'center');
  g.slots.forEach((slot, i) => {
    const item = game.grill[i];
    const flick = Math.sin(game.animT * 9 + i * 2) * 0.5 + 0.5;
    if (item && !item.item.done) {
      ctx.fillStyle = `rgba(255, ${120 + Math.floor(flick * 80)}, 30, ${0.5 + flick * 0.3})`;
      ctx.beginPath();
      ctx.moveTo(slot.x - 16, slot.y + 14);
      ctx.quadraticCurveTo(slot.x - 20, slot.y - 6 - flick * 8, slot.x, slot.y - 16 - flick * 10);
      ctx.quadraticCurveTo(slot.x + 20, slot.y - 6 - flick * 8, slot.x + 16, slot.y + 14);
      ctx.closePath(); ctx.fill();
    }
    if (item) {
      drawIngredient(ctx, 'patty', slot.x, slot.y, 40, item.item.done, item.item.burnt);
      // Progress ring: fills while cooking, drains red while burning.
      const pct = item.item.done ? 1 - item.burn : item.progress;
      ctx.strokeStyle = item.item.burnt ? '#ff3b30' : item.item.done ? '#ff9a3d' : '#ffd94d';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(slot.x, slot.y, 26, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2); ctx.stroke();
      if (item.item.burnt) text(ctx, 'BURNT!', slot.x, slot.y - 34, 12, '#ff3b30');
      else if (item.item.done) text(ctx, 'READY', slot.x, slot.y - 34, 11, '#8dff7a');
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(slot.x, slot.y, 22, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
  });
}

function drawBoard(ctx, game) {
  const b = LAYOUT.board;
  ctx.fillStyle = '#8a5a33';
  rr(ctx, b.x - 8, b.y - 8, b.w + 16, b.h + 16, 10); ctx.fill();
  ctx.fillStyle = '#d9a866';
  rr(ctx, b.x, b.y, b.w, b.h, 8); ctx.fill();
  ctx.fillStyle = '#c08d4e';
  rr(ctx, b.x + 14, b.y + 12, b.w - 28, b.h - 24, 6); ctx.fill();
  text(ctx, 'CHOPPING BOARD', b.x + b.w / 2, b.y - 20, 13, '#fff7e8', 'center');
  // Knife
  ctx.save();
  ctx.translate(b.x + b.w - 34, b.y + 18);
  ctx.rotate(0.5);
  ctx.fillStyle = '#cfd6dd';
  rr(ctx, 0, 0, 34, 8, 3); ctx.fill();
  ctx.fillStyle = '#5d3418';
  rr(ctx, 34, 1, 16, 6, 3); ctx.fill();
  ctx.restore();
  if (game.board) {
    const it = game.board.item;
    drawIngredient(ctx, it.id, b.at.x, b.at.y, 40, it.done);
    if (!it.done) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      rr(ctx, b.at.x - 40, b.at.y + 26, 80, 10, 5); ctx.fill();
      ctx.fillStyle = '#8dff7a';
      rr(ctx, b.at.x - 38, b.at.y + 28, 76 * game.board.progress, 6, 3); ctx.fill();
      text(ctx, 'SPACE to chop!', b.at.x, b.at.y - 36, 12, '#fff7e8');
    } else {
      text(ctx, 'CHOPPED', b.at.x, b.at.y - 36, 11, '#8dff7a');
    }
  }
}

function drawPlates(ctx, game) {
  LAYOUT.plates.forEach((p, i) => {
    ctx.fillStyle = '#8a5a33';
    rr(ctx, p.x - 8, p.y - 8, p.w + 16, p.h + 16, 10); ctx.fill();
    ctx.fillStyle = '#c9c9c2';
    rr(ctx, p.x, p.y, p.w, p.h, 8); ctx.fill();
    text(ctx, `PLATE ${i + 1}`, p.x + p.w / 2, p.y - 20, 13, '#fff7e8', 'center');
    const items = game.plates[i].items;
    if (items.length > 0) {
      drawPlateStack(ctx, items, p.at.x, p.at.y + 6, 0.95);
      if (findMatchingOrder(game, items)) {
        const pulse = 0.6 + Math.sin(game.animT * 6) * 0.4;
        ctx.strokeStyle = `rgba(141,255,122,${pulse})`;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(p.at.x, p.at.y + 6, 44, 20, 0, 0, Math.PI * 2); ctx.stroke();
        text(ctx, 'READY TO SERVE!', p.at.x, p.y + p.h + 16, 12, '#8dff7a');
      }
    } else {
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.ellipse(p.at.x, p.at.y + 6, 36, 12, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
  });
}

function drawWindow(ctx, game) {
  const w = LAYOUT.window;
  const carryingPlate = game.chef.carry && game.chef.carry.kind === 'plate';
  const match = carryingPlate ? findMatchingOrder(game, game.chef.carry.items) : null;
  const glow = match ? 0.5 + Math.sin(game.animT * 6) * 0.3 : 0;
  ctx.fillStyle = '#8a5a33';
  rr(ctx, w.x - 8, w.y - 8, w.w + 16, w.h + 16, 10); ctx.fill();
  ctx.fillStyle = '#5d3418';
  rr(ctx, w.x, w.y, w.w, w.h, 8); ctx.fill();
  ctx.fillStyle = '#fff3d6';
  rr(ctx, w.x + 10, w.y + 10, w.w - 20, w.h - 44, 6); ctx.fill();
  // Bell
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath(); ctx.arc(w.x + w.w / 2, w.y + 34, 16, Math.PI, 0); ctx.fill();
  ctx.fillRect(w.x + w.w / 2 - 18, w.y + 34, 36, 4);
  text(ctx, 'SERVE', w.x + w.w / 2, w.y + 66, 18, '#5d3418');
  text(ctx, 'WINDOW', w.x + w.w / 2, w.y + 88, 13, '#8a5a33');
  if (match) {
    ctx.strokeStyle = `rgba(141,255,122,${glow})`;
    ctx.lineWidth = 5;
    rr(ctx, w.x - 4, w.y - 4, w.w + 8, w.h + 8, 10); ctx.stroke();
    ctx.fillStyle = 'rgba(40,20,8,0.75)';
    const label = `${match.recipe.name} — SERVE IT!`;
    ctx.font = 'bold 13px Trebuchet MS, Verdana, sans-serif';
    const lw = ctx.measureText(label).width;
    rr(ctx, w.x + w.w / 2 - lw / 2 - 44, w.y - 30, lw + 88, 22, 11); ctx.fill();
    text(ctx, label, w.x + w.w / 2, w.y - 19, 13, '#8dff7a');
  }
}

function drawBins(ctx, game) {
  for (const bin of LAYOUT.bins) {
    const ing = INGREDIENTS[bin.id];
    ctx.fillStyle = '#8a5a33';
    rr(ctx, bin.x - 6, bin.y - 6, bin.w + 12, bin.h + 12, 10); ctx.fill();
    ctx.fillStyle = '#f7ead2';
    rr(ctx, bin.x, bin.y, bin.w, bin.h, 8); ctx.fill();
    drawIngredient(ctx, bin.id, bin.x + bin.w / 2, bin.y + 34, 44, true);
    ctx.fillStyle = '#5d3418';
    rr(ctx, bin.x + 10, bin.y + bin.h - 26, bin.w - 20, 20, 5); ctx.fill();
    text(ctx, ing.name.toUpperCase(), bin.x + bin.w / 2, bin.y + bin.h - 16, 12, '#fff7e8');
    if (ing.needs === 'grill') text(ctx, 'needs grill', bin.x + bin.w / 2, bin.y + 62, 10, '#8a5a33');
    if (ing.needs === 'chop') text(ctx, 'needs chop', bin.x + bin.w / 2, bin.y + 62, 10, '#8a5a33');
  }
  const t = LAYOUT.trash;
  ctx.fillStyle = '#8a5a33';
  rr(ctx, t.x - 6, t.y - 6, t.w + 12, t.h + 12, 10); ctx.fill();
  ctx.fillStyle = '#6a6a72';
  rr(ctx, t.x, t.y, t.w, t.h, 8); ctx.fill();
  ctx.fillStyle = '#4a4a52';
  rr(ctx, t.x + 8, t.y + 8, t.w - 16, 18, 4); ctx.fill();
  text(ctx, 'TRASH', t.x + t.w / 2, t.y + t.h - 14, 13, '#fff7e8');
}

function drawChef(ctx, game) {
  const c = game.chef;
  const bob = c.moving ? Math.sin(c.bob) * 2 : Math.sin(c.bob) * 0.8;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(0, 26, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Body / apron
  ctx.fillStyle = '#ffffff';
  rr(ctx, -20, -6 + bob * 0.4, 40, 34, 12); ctx.fill();
  ctx.fillStyle = '#2f6fb2';
  rr(ctx, -20, 10 + bob * 0.4, 40, 18, 8); ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.fillRect(-2, -6 + bob * 0.4, 4, 12);
  // Head
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath(); ctx.arc(0, -20 + bob * 0.4, 15, 0, Math.PI * 2); ctx.fill();
  // Toque
  ctx.fillStyle = '#ffffff';
  rr(ctx, -15, -44 + bob * 0.4, 30, 18, 8); ctx.fill();
  ctx.beginPath(); ctx.arc(-9, -44 + bob * 0.4, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -47 + bob * 0.4, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(9, -44 + bob * 0.4, 8, 0, Math.PI * 2); ctx.fill();
  // Face
  ctx.fillStyle = '#2b2b2b';
  ctx.beginPath(); ctx.arc(-5 * c.dir, -20 + bob * 0.4, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5 * c.dir, -20 + bob * 0.4, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2b2b2b';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, -15 + bob * 0.4, 4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  // Carried item above the toque
  if (c.carry) {
    const hy = -62 + bob * 0.4;
    if (c.carry.kind === 'plate') {
      drawPlateStack(ctx, c.carry.items, 0, hy, 0.8);
    } else {
      drawIngredient(ctx, c.carry.id, 0, hy, 34, c.carry.done, c.carry.burnt);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(0, hy + 16, 20, 4, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawFloaters(ctx, game) {
  for (const f of game.floaters) {
    const a = Math.max(0, 1 - f.t / 1.4);
    ctx.globalAlpha = a;
    text(ctx, f.text, f.x, f.y - f.t * 34, 20, f.color);
    ctx.globalAlpha = 1;
  }
}

function drawParticles(ctx, game) {
  for (const p of game.particles) {
    const a = Math.max(0, 1 - p.t / p.life);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ---- HUD / order board ------------------------------------------------------
function drawTicket(ctx, order, x, y, game) {
  const urgent = order.left <= 10;
  const pulse = urgent ? 0.7 + Math.sin(game.animT * 8) * 0.3 : 1;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = urgent ? '#fff0ee' : '#fffdf5';
  rr(ctx, x, y, 186, 84, 8); ctx.fill();
  ctx.strokeStyle = urgent ? '#ff3b30' : '#c9a25e';
  ctx.lineWidth = urgent ? 3 : 2;
  rr(ctx, x, y, 186, 84, 8); ctx.stroke();
  ctx.restore();
  text(ctx, `#${order.id} ${order.recipe.name}`, x + 93, y + 14, 13, '#5d3418');
  const items = order.recipe.items;
  const iw = 26;
  const total = items.length * (iw + 4);
  items.forEach((id, i) => {
    drawIngredient(ctx, id, x + 93 - total / 2 + i * (iw + 4) + iw / 2, y + 42, iw, true);
  });
  // Timer bar
  const frac = Math.max(0, order.left / order.max);
  ctx.fillStyle = '#e5d9c0';
  rr(ctx, x + 10, y + 66, 166, 10, 5); ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#6fbf3f' : frac > 0.25 ? '#ff9a3d' : '#ff3b30';
  if (frac > 0) { rr(ctx, x + 10, y + 66, 166 * frac, 10, 5); ctx.fill(); }
  text(ctx, `${Math.ceil(order.left)}s`, x + 93, y + 71, 10, '#5d3418');
}

function drawHUD(ctx, game) {
  ctx.fillStyle = '#5d3418';
  ctx.fillRect(0, 0, VIEW_W, 100);
  ctx.fillStyle = '#7a4a22';
  ctx.fillRect(0, 96, VIEW_W, 4);
  text(ctx, 'GOLDEN LADLE', 140, 22, 24, '#ffd94d', 'center');
  text(ctx, `Day ${game.day}  •  Rush Hour Kitchen`, 140, 46, 13, '#fff7e8', 'center');
  text(ctx, `SCORE $${game.score}`, 140, 68, 16, '#ffffff', 'center');
  if (game.combo >= 2) {
    ctx.fillStyle = '#ffd94d';
    rr(ctx, 85, 80, 110, 18, 9); ctx.fill();
    text(ctx, `COMBO x${game.combo}`, 140, 89, 12, '#5d3418', 'center');
  }
  // Order board
  game.orders.forEach((order, i) => drawTicket(ctx, order, 300 + i * 194, 8, game));
  if (game.orders.length === 0) {
    ctx.fillStyle = 'rgba(255,247,232,0.6)';
    ctx.font = 'italic 14px Trebuchet MS, Verdana, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('No orders yet — the lunch rush is coming…', 300, 50);
  }
  // Shift timer + lives
  const sx = 1180;
  text(ctx, 'SHIFT', sx, 16, 11, '#ffd94d', 'center');
  const frac = Math.max(0, game.shiftLeft / game.shiftMax);
  ctx.fillStyle = '#3a2415';
  rr(ctx, sx - 55, 28, 110, 12, 6); ctx.fill();
  ctx.fillStyle = frac > 0.3 ? '#8dff7a' : '#ff3b30';
  if (frac > 0) { rr(ctx, sx - 55, 28, 110 * frac, 12, 6); ctx.fill(); }
  const mm = Math.floor(game.shiftLeft / 60);
  const ss = Math.floor(game.shiftLeft % 60);
  text(ctx, `${mm}:${String(ss).padStart(2, '0')}`, sx, 56, 18, '#ffffff', 'center');
  let hearts = '';
  for (let i = 0; i < 3; i++) hearts += i < game.lives ? '♥' : '♡';
  text(ctx, hearts, sx, 80, 18, '#ff7a6b', 'center');
}

function drawMessage(ctx, game) {
  if (game.messageT <= 0 || !game.message) return;
  const a = Math.min(1, game.messageT);
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  const w = ctx.measureText(game.message).width + 36;
  rr(ctx, VIEW_W / 2 - w / 2 - 40, 612, w + 80, 34, 17);
  ctx.fill();
  text(ctx, game.message, VIEW_W / 2, 629, 16, game.messageColor);
  ctx.globalAlpha = 1;
}

// ---- screens ----------------------------------------------------------------
function overlay(ctx, alpha) {
  ctx.fillStyle = `rgba(40,20,8,${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawTitle(ctx, game) {
  overlay(ctx, 0.55);
  text(ctx, 'GOLDEN LADLE', VIEW_W / 2, 150, 72, '#ffd94d');
  text(ctx, 'Rush Hour Kitchen', VIEW_W / 2, 210, 30, '#fff7e8');
  drawPlateStack(ctx, ['bun', 'patty', 'cheese', 'lettuce', 'tomato', 'bun'], VIEW_W / 2, 300, 1.6);
  text(ctx, 'Customers are hungry. Cook fast, serve faster.', VIEW_W / 2, 380, 18, '#ffffff');
  text(ctx, 'Move: WASD / Arrows or click  •  Use station: E or click it  •  Chop fast: SPACE', VIEW_W / 2, 420, 16, '#ffe9b0');
  text(ctx, 'Grill patties, chop veggies, build the dish on a plate, serve it at the window.', VIEW_W / 2, 448, 16, '#ffe9b0');
  text(ctx, 'An expired order costs a heart. Three hearts and the shift is over.', VIEW_W / 2, 476, 16, '#ffe9b0');
  const pulse = 0.75 + Math.sin(game.animT * 4) * 0.25;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffd94d';
  rr(ctx, VIEW_W / 2 - 170, 520, 340, 56, 28); ctx.fill();
  ctx.globalAlpha = 1;
  text(ctx, 'CLICK OR PRESS ENTER TO COOK', VIEW_W / 2, 548, 18, '#5d3418');
  text(ctx, 'P pause  •  M mute', VIEW_W / 2, 610, 14, '#fff7e8');
}

function drawPaused(ctx) {
  overlay(ctx, 0.6);
  text(ctx, 'PAUSED', VIEW_W / 2, 360, 56, '#ffd94d');
  text(ctx, 'Press P to keep cooking', VIEW_W / 2, 420, 18, '#ffffff');
}

function drawDayClear(ctx, game) {
  overlay(ctx, 0.6);
  text(ctx, `DAY ${game.day} COMPLETE!`, VIEW_W / 2, 300, 52, '#8dff7a');
  text(ctx, `Score $${game.score}  •  Dishes served: ${game.served}  •  Best combo x${game.bestCombo}`, VIEW_W / 2, 370, 20, '#ffffff');
  text(ctx, `Day ${game.day + 1} brings new recipes and a faster rush.`, VIEW_W / 2, 410, 18, '#ffe9b0');
  const pulse = 0.75 + Math.sin(game.animT * 4) * 0.25;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffd94d';
  rr(ctx, VIEW_W / 2 - 170, 460, 340, 56, 28); ctx.fill();
  ctx.globalAlpha = 1;
  text(ctx, 'PRESS ENTER FOR THE NEXT DAY', VIEW_W / 2, 488, 18, '#5d3418');
}

function drawGameOver(ctx, game) {
  overlay(ctx, 0.65);
  text(ctx, 'SHIFT OVER', VIEW_W / 2, 260, 60, '#ff7a6b');
  text(ctx, game.overReason || 'The kitchen has closed.', VIEW_W / 2, 320, 20, '#ffffff');
  text(ctx, `Final score $${game.score}  •  Days survived: ${game.day}  •  Dishes served: ${game.served}`, VIEW_W / 2, 370, 20, '#ffe9b0');
  text(ctx, `Best combo x${game.bestCombo}  •  Orders missed: ${game.missed}`, VIEW_W / 2, 402, 18, '#ffe9b0');
  const pulse = 0.75 + Math.sin(game.animT * 4) * 0.25;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffd94d';
  rr(ctx, VIEW_W / 2 - 150, 450, 300, 56, 28); ctx.fill();
  ctx.globalAlpha = 1;
  text(ctx, 'PRESS R TO COOK AGAIN', VIEW_W / 2, 478, 18, '#5d3418');
}

// ---- main entry ---------------------------------------------------------------
export function render(ctx, game) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx, game);
  drawGrill(ctx, game);
  drawBoard(ctx, game);
  drawPlates(ctx, game);
  drawWindow(ctx, game);
  drawBins(ctx, game);
  drawChef(ctx, game);
  drawParticles(ctx, game);
  drawFloaters(ctx, game);
  drawHUD(ctx, game);
  drawMessage(ctx, game);
  if (game.screen === 'title') drawTitle(ctx, game);
  else if (game.screen === 'paused') drawPaused(ctx);
  else if (game.screen === 'dayclear') drawDayClear(ctx, game);
  else if (game.screen === 'gameover') drawGameOver(ctx, game);
}

export { RECIPES };
