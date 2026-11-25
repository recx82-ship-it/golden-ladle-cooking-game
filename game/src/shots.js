// The screenshot scenes behind ?shot=title|service|assembly|serve. Each one
// stages a real kitchen through the world's own rules — orders spawned,
// ingredients placed, patties grilled, plates stacked — then steps the world
// a few fixed steps so timers and progress bars are live, and paints it with
// the real renderer. The same seed always gives the same frame.
import { STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function settle(world, seconds) {
  for (let i = 0; i < Math.round(seconds / STEP); i += 1) world.step(STEP, 0, 0);
}

function putOnBoard(world, id) {
  world.state.board = { id, state: 'raw', progress: 0 };
}

function putOnGrill(world, slot, stateName, progress) {
  world.state.grill[slot] = { id: 'patty', state: stateName, progress, doneFor: 0 };
}

function putOnPlate(world, index, items) {
  world.state.plates[index] = [...items];
}

/**
 * Set `world` to the named scene and return the screen to draw over it and
 * the best score to show. Any other name is the title scene.
 */
export function stageShot(name, world) {
  const state = world.state;
  world.reset();
  if (name !== 'service' && name !== 'assembly' && name !== 'serve') {
    // Title: a kitchen already busy — two orders waiting, veg on the board,
    // a patty on the grill, a half-built plate.
    world.spawnOrder();
    world.spawnOrder();
    putOnBoard(world, 'tomato');
    putOnGrill(world, 0, 'grilling', 0.55);
    putOnPlate(world, 0, ['bun', 'patty']);
    state.chef.x = 640;
    state.chef.y = 600;
    settle(world, 2.5);
    return { screen: SCREEN_TITLE, best: 42 };
  }

  if (name === 'service') {
    // Mid-service: three tickets, the chef carrying a tomato toward the
    // board, a patty grilling, one plate half-built, timer running.
    world.spawnOrder();
    world.spawnOrder();
    world.spawnOrder();
    putOnGrill(world, 0, 'grilling', 0.6);
    putOnGrill(world, 1, 'done', 1);
    putOnPlate(world, 0, ['bun', 'patty']);
    state.chef.x = 420;
    state.chef.y = 560;
    state.chef.tx = 862;
    state.chef.ty = 486;
    state.chef.moving = true;
    state.chef.facing = 1;
    state.chef.carrying = { kind: 'ingredient', id: 'tomato', state: 'raw' };
    state.coins = 24;
    state.served = 3;
    state.time = 62;
    state.timeLeft = 88;
    settle(world, 1.2);
    return { screen: SCREEN_PLAY, best: 42 };
  }

  if (name === 'assembly') {
    // One dish mid-assembly: a nearly finished burger on the plate, tomato
    // being chopped, a patty done on the grill, two tickets waiting.
    world.spawnOrder();
    world.spawnOrder();
    putOnBoard(world, 'lettuce');
    state.board.progress = 0.7;
    putOnGrill(world, 0, 'done', 1);
    putOnPlate(world, 0, ['bun', 'patty', 'tomato']);
    state.chef.x = 862;
    state.chef.y = 486;
    state.chef.carrying = { kind: 'ingredient', id: 'lettuce', state: 'chopped' };
    state.coins = 38;
    state.served = 4;
    state.combo = 2;
    state.time = 84;
    state.timeLeft = 66;
    settle(world, 0.4);
    return { screen: SCREEN_PLAY, best: 42 };
  }

  // serve: a finished Classic Burger on the plate in hand at the window,
  // its ticket waiting first on the board, coins about to pop.
  world.spawnOrder('classic');
  world.spawnOrder();
  state.chef.x = 1198;
  state.chef.y = 486;
  state.chef.carrying = { kind: 'plate', items: ['bun', 'patty', 'tomato', 'lettuce'] };
  putOnPlate(world, 1, ['bun', 'patty']);
  putOnGrill(world, 1, 'done', 1);
  state.coins = 51;
  state.served = 5;
  state.combo = 3;
  state.time = 105;
  state.timeLeft = 45;
  settle(world, 0.4);
  return { screen: SCREEN_PLAY, best: 42 };
}
