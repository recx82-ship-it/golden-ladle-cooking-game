// The Golden Ladle — every tuning number, colour and recipe in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** A shift lasts this long; the day ends when it runs out. */
export const SHIFT_SECONDS = 150;

/** Orders waiting on the board at once, at most. */
export const MAX_ORDERS = 4;

/** Seconds between new orders at the start of the shift, shrinking as it goes on. */
export const ORDER_INTERVAL = { start: 15, end: 9 };

/** How long an order waits before the customer walks out (seconds). */
export const PATIENCE = { start: 58, end: 40 };

/** Reputation hearts: an expired order costs one; none left ends the shift. */
export const HEARTS = 3;

/** How long chopping takes, and how long a patty takes on the grill. */
export const CHOP_SECONDS = 1.6;
export const GRILL_SECONDS = 3.2;
/** A cooked patty left on the grill this long after it is done burns. */
export const BURN_SECONDS = 5;

/** The chef's walking speed, in logical pixels per second. */
export const CHEF_SPEED = 330;

/** Tip for a fast serve: up to this many coins on top of the dish price. */
export const MAX_TIP = 6;
/** Coins for serving a dish no order asked for (the window sends it back). */
export const WRONG_DISH_PENALTY = 0;

/** Ingredients, keyed by id. `prep` is what the ingredient needs before it
 *  can go on a plate: none (ready as taken), chop, or grill. */
export const INGREDIENTS = {
  bun: { name: 'Bun', prep: 'none', colour: '#e8a94f', dark: '#b97a28', icon: 'bun' },
  patty: { name: 'Patty', prep: 'grill', colour: '#a05a3c', dark: '#6e3520', icon: 'patty' },
  tomato: { name: 'Tomato', prep: 'chop', colour: '#e84a3f', dark: '#a92c24', icon: 'tomato' },
  lettuce: { name: 'Lettuce', prep: 'chop', colour: '#5fbf4a', dark: '#357a28', icon: 'lettuce' },
  onion: { name: 'Onion', prep: 'chop', colour: '#d9c8ef', dark: '#8a6fb0', icon: 'onion' },
  cheese: { name: 'Cheese', prep: 'none', colour: '#f7c948', dark: '#c99a1e', icon: 'cheese' },
};

/** The menu: each dish is a list of ingredient ids in plating order, bottom first. */
export const DISHES = {
  classic: {
    name: 'Classic Burger', price: 10,
    recipe: ['bun', 'patty', 'tomato', 'lettuce'],
    blurb: 'Bun, grilled patty, tomato, lettuce',
  },
  cheese: {
    name: 'Cheese Burger', price: 12,
    recipe: ['bun', 'patty', 'cheese', 'tomato'],
    blurb: 'Bun, grilled patty, cheese, tomato',
  },
  salad: {
    name: 'Garden Salad', price: 9,
    recipe: ['tomato', 'lettuce', 'onion'],
    blurb: 'Tomato, lettuce, onion — no bun',
  },
  double: {
    name: 'Double Stack', price: 15,
    recipe: ['bun', 'patty', 'patty', 'cheese', 'lettuce'],
    blurb: 'Bun, two grilled patties, cheese, lettuce',
  },
};
export const DISH_IDS = ['classic', 'cheese', 'salad', 'double'];

/** Where the best shift total is kept between visits (this browser only). */
export const BEST_KEY = 'golden-ladle.best';

export const PALETTE = {
  wall: '#3d2b1f',
  wallTop: '#5a3d2a',
  floor: '#8a5a34',
  floorTile: '#7a4e2c',
  counter: '#c98f4e',
  counterTop: '#e8b878',
  counterEdge: '#8a5f30',
  board: '#f6e8c8',
  boardEdge: '#8a6a3a',
  ticket: '#fff8e6',
  ticketEdge: '#c9a86a',
  grill: '#3a3f46',
  grillHot: '#e2603a',
  plate: '#f4f6f8',
  plateEdge: '#b9c2cc',
  text: '#2b1d12',
  muted: '#7a6a55',
  cream: '#fff3d6',
  gold: '#f2b234',
  red: '#d64541',
  green: '#4caf50',
  window: '#2e6f8e',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';
