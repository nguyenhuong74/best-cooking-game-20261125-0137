[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137/nguyenhuong74/best-cooking-game-20261125-0137)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![make.fun rank](https://make.fun/badge/best-cooking-game-20261125-0137/nguyenhuong74/best-cooking-game-20261125-0137/rank)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![make.fun reward](https://make.fun/badge/best-cooking-game-20261125-0137/nguyenhuong74/best-cooking-game-20261125-0137/reward)](https://make.fun/bounty/best-cooking-game-20261125-0137)

# Golden Ladle: Rush Hour Kitchen

A fast, original 2D canvas cooking game built for the make.fun bounty
[Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137).
You are the chef of the Golden Ladle. Tickets come in on the order board,
and you have one shift to cook your way through them: grab ingredients from
the counter, grill patties, chop vegetables, build each dish on a plate, and
serve it at the window before the ticket expires.

## How to play

- **Move:** WASD / arrow keys, or click anywhere on the kitchen floor.
- **Use a station:** press **E** (or click the station) — the chef walks over
  and uses it.
- **Chop faster:** press **SPACE** (or click the chopping board) while a
  vegetable is on the board.
- **P** pauses, **M** mutes, **R** restarts after the shift ends.

The kitchen is the puzzle: ingredient bins sit at the bottom, the grill and
chopping board at the top, plates beside them and the serving window at the
far right, so every dish is a route you have to plan. Patties grill in
seconds and burn if you leave them; vegetables need chopping; a plate only
leaves the window when it matches a ticket exactly. Six recipes recombine
the same six ingredients, new ones unlock on later days, tickets get
shorter, and the lunch rush gets faster. Serve quickly for a time bonus,
chain serves for a combo, and watch the shift timer — an expired ticket
costs a heart, and three hearts end the shift.

## Run it

No build step, no network, no libraries — plain static files.

```sh
node serve.ts
# open http://localhost:8080
```

Or serve `game/` with any static server and open `game/index.html`.
Screenshots of each scene are reproducible with
`?shot=start|play|serve|rush&seed=1` (see `shots.json`).

## Layout

- `game/index.html`, `game/style.css` — page and canvas shell
- `game/main.js` — bootstrap, game loop, input, screens
- `game/state.js` — game state, seeded RNG, shared helpers
- `game/recipes.js` — ingredients and recipes
- `game/orders.js` — order tickets, spawning, serving, days
- `game/stations.js` — kitchen layout and station interactions
- `game/chef.js` — chef movement and click-to-move
- `game/render.js` — all canvas drawing (kitchen, food, chef, HUD)
- `game/audio.js` — synthesized Web Audio sound effects
- `game/shots.js` — deterministic screenshot scenes
- `main.ts` — hand-in program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json`
- `serve.ts` — tiny static server for local play-testing

All art is drawn in canvas code and all sound is synthesized; the game
loads nothing from the network.
