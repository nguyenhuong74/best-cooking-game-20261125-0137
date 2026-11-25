// Ingredients and recipes for Golden Ladle.
// Every dish is a combination of the same six ingredients, so later days
// recombine what the player already knows instead of adding new chores.

export const INGREDIENTS = {
  bun:     { name: 'Bun',     color: '#e8a94f', needs: null },
  patty:   { name: 'Patty',   color: '#8a5a2b', needs: 'grill' },
  lettuce: { name: 'Lettuce', color: '#6fbf3f', needs: 'chop' },
  tomato:  { name: 'Tomato',  color: '#e0392f', needs: 'chop' },
  cheese:  { name: 'Cheese',  color: '#ffc93c', needs: null },
  onion:   { name: 'Onion',   color: '#b678c9', needs: 'chop' },
};

export const BIN_ORDER = ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'onion'];

// items are ingredient ids; patty must be grilled, lettuce/tomato/onion chopped.
export const RECIPES = [
  { id: 'salad',        name: 'Garden Salad',   price: 8,  day: 1, items: ['lettuce', 'tomato', 'onion'] },
  { id: 'burger',       name: 'Classic Burger', price: 12, day: 1, items: ['bun', 'patty', 'lettuce'] },
  { id: 'cheeseburger', name: 'Cheese Burger',  price: 15, day: 1, items: ['bun', 'patty', 'cheese', 'tomato'] },
  { id: 'veggie',       name: 'Veggie Delight', price: 14, day: 2, items: ['bun', 'lettuce', 'tomato', 'cheese', 'onion'] },
  { id: 'double',       name: 'Double Stack',   price: 20, day: 2, items: ['bun', 'patty', 'patty', 'cheese', 'lettuce'] },
  { id: 'mega',         name: 'Mega Burger',    price: 26, day: 3, items: ['bun', 'patty', 'patty', 'cheese', 'tomato', 'lettuce'] },
];

export function recipesForDay(day) {
  return RECIPES.filter((r) => r.day <= day);
}

// Human name for a carried ingredient, e.g. "Raw Patty" / "Grilled Patty".
export function itemLabel(item) {
  const base = INGREDIENTS[item.id].name;
  if (item.done) {
    if (item.id === 'patty') return 'Grilled Patty';
    if (INGREDIENTS[item.id].needs === 'chop') return `Chopped ${base}`;
    return base;
  }
  if (item.id === 'patty') return 'Raw Patty';
  if (INGREDIENTS[item.id].needs === 'chop') return `Whole ${base}`;
  return base;
}

// A fresh ingredient taken from a bin: ready at once unless it needs work.
export function freshItem(id) {
  return { id, done: INGREDIENTS[id].needs === null };
}

// Multiset compare: same ingredients in any order.
export function sameItems(a, b) {
  if (a.length !== b.length) return false;
  const count = {};
  for (const id of a) count[id] = (count[id] || 0) + 1;
  for (const id of b) {
    if (!count[id]) return false;
    count[id] -= 1;
  }
  return true;
}
