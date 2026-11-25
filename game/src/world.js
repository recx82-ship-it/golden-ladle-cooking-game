// The Golden Ladle — the kitchen simulation: orders, stations, the chef and
// the rules. No drawing here; render.js paints this state.
import {
  BURN_SECONDS, CHEF_SPEED, CHOP_SECONDS, DISHES, DISH_IDS, GRILL_SECONDS,
  HEARTS, INGREDIENTS, MAX_ORDERS, MAX_TIP, ORDER_INTERVAL, PATIENCE,
  SHIFT_SECONDS, STEP,
} from './config.js';

export const EVENT_ORDER = 1;
export const EVENT_SERVED = 2;
export const EVENT_EXPIRED = 4;
export const EVENT_BURNT = 8;
export const EVENT_OVER = 16;
export const EVENT_WRONG = 32;

/** Where each station sits, and where the chef stands to use it. */
export const STATIONS = {
  board: { x: 788, y: 196, w: 148, h: 96, standX: 862, standY: 486, label: 'Chopping board' },
  grill: { x: 952, y: 196, w: 172, h: 96, standX: 1038, standY: 486, label: 'Grill' },
  window: { x: 1140, y: 196, w: 116, h: 96, standX: 1198, standY: 486, label: 'Serving window' },
  trash: { x: 788, y: 336, w: 88, h: 88, standX: 832, standY: 486, label: 'Trash' },
  plate0: { x: 40, y: 336, w: 300, h: 88, standX: 190, standY: 486, label: 'Plate 1' },
  plate1: { x: 380, y: 336, w: 300, h: 88, standX: 530, standY: 486, label: 'Plate 2' },
};

/** The six ingredient bins along the back counter. */
export const BINS = Object.keys(INGREDIENTS).map((id, i) => ({
  id,
  x: 24 + i * 124,
  y: 196,
  w: 116,
  h: 96,
  standX: 24 + i * 124 + 58,
  standY: 486,
}));

function sameDish(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort().join(',');
  const sortedB = [...b].sort().join(',');
  return sortedA === sortedB;
}

function orderFor(dishId, patience) {
  return { id: Math.random().toString(36).slice(2, 8), dish: dishId, patience, maxPatience: patience };
}

export function createWorld(random) {
  const state = {
    time: 0,
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    combo: 0,
    bestCombo: 0,
    hearts: HEARTS,
    over: false,
    won: false,
    orders: [],
    orderTimer: 4,
    lastDish: null,
    chef: { x: 640, y: 600, tx: 640, ty: 600, moving: false, carrying: null, facing: 1, walking: false },
    pending: null,
    board: null,
    grill: [null, null],
    plates: [[], []],
    particles: [],
    messages: [],
    shake: 0,
    flash: 0,
  };

  function addMessage(text, x, y, colour) {
    state.messages.push({ text, x, y, ttl: 1.4, colour });
  }

  function burst(x, y, colour, count) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x, y,
        vx: (random.next() - 0.5) * 220,
        vy: -random.next() * 180 - 40,
        ttl: 0.7 + random.next() * 0.4,
        colour,
        size: 3 + random.next() * 4,
      });
    }
  }

  function spawnOrder(forcedDish) {
    if (state.orders.length >= MAX_ORDERS) return false;
    let dish = forcedDish ?? random.pick(DISH_IDS);
    if (dish === state.lastDish) dish = random.pick(DISH_IDS);
    state.lastDish = dish;
    const progress = Math.min(1, state.time / SHIFT_SECONDS);
    const patience = PATIENCE.start + (PATIENCE.end - PATIENCE.start) * progress;
    state.orders.push(orderFor(dish, patience));
    return true;
  }

  function dishMatches(plateItems) {
    for (const order of state.orders) {
      if (sameDish(plateItems, DISHES[order.dish].recipe)) return order;
    }
    return null;
  }

  function servePlate() {
    const carried = state.chef.carrying;
    if (!carried || carried.kind !== 'plate') return EVENT_WRONG;
    const order = dishMatches(carried.items);
    if (!order) {
      state.shake = 0.35;
      addMessage('No order wants this dish!', 1198, 320, '#d64541');
      return EVENT_WRONG;
    }
    state.orders = state.orders.filter((o) => o !== order);
    const dish = DISHES[order.dish];
    const tip = Math.round((order.patience / order.maxPatience) * MAX_TIP);
    const earned = dish.price + tip;
    state.coins += earned;
    state.served += 1;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.chef.carrying = null;
    burst(1198, 260, '#f2b234', 16);
    addMessage(`+${earned} coins${tip > 0 ? ` (tip ${tip})` : ''}`, 1198, 300, '#2e7d32');
    if (state.combo >= 3) addMessage(`Combo x${state.combo}!`, 1198, 330, '#b26a00');
    return EVENT_SERVED;
  }

  function trashCarried() {
    const carried = state.chef.carrying;
    if (!carried) return 0;
    state.chef.carrying = null;
    addMessage('Tossed', 832, 420, '#7a6a55');
    return 0;
  }

  /** What clicking a station does once the chef has walked up to it. */
  function useStation(kind, id) {
    const chef = state.chef;
    if (kind === 'bin') {
      if (chef.carrying) { addMessage('Hands full!', chef.x, chef.y - 60, '#d64541'); return EVENT_WRONG; }
      chef.carrying = { kind: 'ingredient', id, state: 'raw' };
      return 0;
    }
    if (kind === 'board') {
      if (state.board && !chef.carrying) {
        chef.carrying = { kind: 'ingredient', id: state.board.id, state: state.board.state };
        state.board = null;
        return 0;
      }
      if (!state.board && chef.carrying && chef.carrying.kind === 'ingredient') {
        const ing = INGREDIENTS[chef.carrying.id];
        if (ing.prep !== 'chop') {
          addMessage(`${ing.name} needs no chopping`, chef.x, chef.y - 60, '#d64541');
          return EVENT_WRONG;
        }
        state.board = { id: chef.carrying.id, state: 'raw', progress: 0 };
        chef.carrying = null;
        return 0;
      }
      return 0;
    }
    if (kind === 'grill') {
      const slot = state.grill[id];
      if (slot && !chef.carrying) {
        chef.carrying = { kind: 'ingredient', id: 'patty', state: slot.state };
        state.grill[id] = null;
        return 0;
      }
      if (!slot && chef.carrying && chef.carrying.kind === 'ingredient' && chef.carrying.id === 'patty' && chef.carrying.state === 'raw') {
        state.grill[id] = { id: 'patty', state: 'grilling', progress: 0, doneFor: 0 };
        chef.carrying = null;
        return 0;
      }
      if (!slot && chef.carrying) {
        addMessage('Only raw patties go on the grill', chef.x, chef.y - 60, '#d64541');
        return EVENT_WRONG;
      }
      return 0;
    }
    if (kind === 'plate') {
      const plate = state.plates[id];
      if (chef.carrying && chef.carrying.kind === 'plate') {
        if (plate.length === 0) {
          state.plates[id] = chef.carrying.items;
          chef.carrying = null;
        } else {
          addMessage('That plate is in use', chef.x, chef.y - 60, '#d64541');
          return EVENT_WRONG;
        }
        return 0;
      }
      if (chef.carrying && chef.carrying.kind === 'ingredient') {
        const item = chef.carrying;
        const ing = INGREDIENTS[item.id];
        const ready = ing.prep === 'none' || (ing.prep === 'chop' && item.state === 'chopped') || (ing.prep === 'grill' && item.state === 'done');
        if (!ready) {
          addMessage(`${ing.name} is not ready yet`, chef.x, chef.y - 60, '#d64541');
          return EVENT_WRONG;
        }
        if (plate.length >= 6) {
          addMessage('Plate is full', chef.x, chef.y - 60, '#d64541');
          return EVENT_WRONG;
        }
        plate.push(item.id);
        chef.carrying = null;
        return 0;
      }
      if (!chef.carrying && plate.length > 0) {
        chef.carrying = { kind: 'plate', items: plate };
        state.plates[id] = [];
        return 0;
      }
      return 0;
    }
    if (kind === 'window') return servePlate();
    if (kind === 'trash') return trashCarried();
    return 0;
  }

  /** Click a station: walk there, then use it. Click the floor: just walk. */
  function clickAt(x, y) {
    if (state.over) return;
    for (const bin of BINS) {
      if (x >= bin.x && x < bin.x + bin.w && y >= bin.y && y < bin.y + bin.h) {
        state.pending = { kind: 'bin', id: bin.id };
        state.chef.tx = bin.standX;
        state.chef.ty = bin.standY;
        state.chef.moving = true;
        return;
      }
    }
    for (const [key, station] of Object.entries(STATIONS)) {
      if (x >= station.x && x < station.x + station.w && y >= station.y && y < station.y + station.h) {
        const kind = key.startsWith('plate') ? 'plate' : key;
        const id = key === 'plate0' ? 0 : key === 'plate1' ? 1 : key === 'grill' ? (x < station.x + station.w / 2 ? 0 : 1) : undefined;
        state.pending = { kind, id };
        state.chef.tx = station.standX;
        state.chef.ty = station.standY;
        state.chef.moving = true;
        return;
      }
    }
    state.pending = null;
    state.chef.tx = Math.max(40, Math.min(1240, x));
    state.chef.ty = Math.max(500, Math.min(690, y));
    state.chef.moving = true;
  }

  /** Keyboard: move the chef directly; returns the station in reach, if any. */
  function nearestStation() {
    let best = null;
    let bestDist = 150;
    const targets = [];
    for (const bin of BINS) targets.push({ kind: 'bin', id: bin.id, x: bin.standX, y: bin.standY });
    for (const [key, station] of Object.entries(STATIONS)) {
      const id = key === 'plate0' ? 0 : key === 'plate1' ? 1 : undefined;
      targets.push({ kind: key.startsWith('plate') ? 'plate' : key, id, x: station.standX, y: station.standY });
    }
    for (const t of targets) {
      const dist = Math.hypot(state.chef.x - t.x, state.chef.y - t.y);
      if (dist < bestDist) { bestDist = dist; best = t; }
    }
    return best;
  }

  function reset() {
    state.time = 0;
    state.timeLeft = SHIFT_SECONDS;
    state.coins = 0;
    state.served = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.hearts = HEARTS;
    state.over = false;
    state.won = false;
    state.orders = [];
    state.orderTimer = 4;
    state.lastDish = null;
    state.chef = { x: 640, y: 600, tx: 640, ty: 600, moving: false, carrying: null, facing: 1, walking: false };
    state.pending = null;
    state.board = null;
    state.grill = [null, null];
    state.plates = [[], []];
    state.particles = [];
    state.messages = [];
    state.shake = 0;
    state.flash = 0;
  }

  function step(dt, moveX, moveY) {
    let events = 0;
    if (state.over) {
      dt = Math.min(dt, STEP);
    }
    state.time += dt;
    if (!state.over) {
      state.timeLeft = Math.max(0, SHIFT_SECONDS - state.time);
      if (state.timeLeft <= 0) {
        state.over = true;
        state.won = state.hearts > 0;
        events |= EVENT_OVER;
      }
    }

    // New orders arrive on a timer that quickens through the shift.
    if (!state.over) {
      state.orderTimer -= dt;
      if (state.orderTimer <= 0) {
        const progress = Math.min(1, state.time / SHIFT_SECONDS);
        if (spawnOrder()) events |= EVENT_ORDER;
        state.orderTimer = ORDER_INTERVAL.start + (ORDER_INTERVAL.end - ORDER_INTERVAL.start) * progress;
      }
    }

    // Patience runs out: the customer walks out, a heart is lost.
    for (let i = state.orders.length - 1; i >= 0; i -= 1) {
      const order = state.orders[i];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(i, 1);
        state.hearts -= 1;
        state.combo = 0;
        events |= EVENT_EXPIRED;
        addMessage(`${DISHES[order.dish].name} walked out!`, 640, 200, '#d64541');
        if (state.hearts <= 0) {
          state.over = true;
          state.won = false;
          events |= EVENT_OVER;
        }
      }
    }

    // Chopping finishes on its own once the ingredient is on the board.
    if (state.board && state.board.state === 'raw') {
      state.board.progress += dt / CHOP_SECONDS;
      if (state.board.progress >= 1) {
        state.board.state = 'chopped';
        state.board.progress = 1;
        burst(STATIONS.board.x + 74, STATIONS.board.y + 40, '#8a6a3a', 8);
      }
    }

    // Patties grill, then burn if left too long.
    for (let i = 0; i < state.grill.length; i += 1) {
      const slot = state.grill[i];
      if (!slot) continue;
      if (slot.state === 'grilling') {
        slot.progress += dt / GRILL_SECONDS;
        if (slot.progress >= 1) {
          slot.state = 'done';
          slot.progress = 1;
          slot.doneFor = 0;
        }
      } else if (slot.state === 'done') {
        slot.doneFor += dt;
        if (slot.doneFor >= BURN_SECONDS) {
          slot.state = 'burnt';
          events |= EVENT_BURNT;
          addMessage('A patty burned!', STATIONS.grill.x + 86, STATIONS.grill.y - 8, '#d64541');
        }
      }
    }

    // The chef walks: keyboard steering wins over a click target.
    const chef = state.chef;
    if (moveX !== 0 || moveY !== 0) {
      chef.moving = false;
      state.pending = null;
      const len = Math.hypot(moveX, moveY) || 1;
      chef.x = Math.max(36, Math.min(1244, chef.x + (moveX / len) * CHEF_SPEED * dt));
      chef.y = Math.max(496, Math.min(692, chef.y + (moveY / len) * CHEF_SPEED * dt));
      chef.facing = moveX < 0 ? -1 : moveX > 0 ? 1 : chef.facing;
      chef.walking = true;
    } else if (chef.moving) {
      const dx = chef.tx - chef.x;
      const dy = chef.ty - chef.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= 6) {
        chef.moving = false;
        chef.walking = false;
        if (state.pending) {
          events |= useStation(state.pending.kind, state.pending.id);
          state.pending = null;
        }
      } else {
        chef.x += (dx / dist) * CHEF_SPEED * dt;
        chef.y += (dy / dist) * CHEF_SPEED * dt;
        chef.facing = dx < 0 ? -1 : 1;
        chef.walking = true;
      }
    } else {
      chef.walking = false;
    }

    // Particles and floating messages fade.
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.ttl -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 320 * dt;
      if (p.ttl <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.messages.length - 1; i >= 0; i -= 1) {
      const m = state.messages[i];
      m.ttl -= dt;
      m.y -= 22 * dt;
      if (m.ttl <= 0) state.messages.splice(i, 1);
    }
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
    if (state.flash > 0) state.flash = Math.max(0, state.flash - dt);
    return events;
  }

  return {
    state,
    reset,
    step,
    clickAt,
    useStation,
    nearestStation,
    spawnOrder,
    BINS,
    STATIONS,
  };
}
