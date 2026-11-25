// The Golden Ladle — everything the player sees, painted on one canvas.
// The playfield is 1280x720 logical pixels; this scales it to the window.
import { DISHES, FONT, INGREDIENTS, PALETTE, SHIFT_SECONDS } from './config.js';
import { BINS, STATIONS } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, colour, weight = 'bold', align = 'left') {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function heart(ctx, x, y, size, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.5);
  ctx.bezierCurveTo(x - size, y - size * 0.4, x - size * 0.4, y - size, x, y - size * 0.35);
  ctx.bezierCurveTo(x + size * 0.4, y - size, x + size, y - size * 0.4, x, y + size * 0.5);
  ctx.fill();
}

/** One ingredient, drawn as a chunky readable icon. `state` changes the look:
 *  raw patty is pink-red, grilled is brown, chopped veg shows slices. */
export function drawIngredient(ctx, id, x, y, size, state = 'ready') {
  const ing = INGREDIENTS[id];
  const r = size / 2;
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') {
    ctx.fillStyle = ing.colour;
    ctx.beginPath();
    ctx.arc(0, 2, r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.fillRect(-r, 2, size, 3);
    ctx.fillStyle = '#f3d9a0';
    ctx.beginPath();
    ctx.ellipse(0, 8, r * 0.92, r * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-r * 0.5, -r * 0.55, 3, 3);
    ctx.fillRect(0, -r * 0.7, 3, 3);
    ctx.fillRect(r * 0.45, -r * 0.5, 3, 3);
  } else if (id === 'patty') {
    ctx.fillStyle = state === 'burnt' ? '#1c1a18' : state === 'done' ? '#7a4a2e' : '#b96a52';
    roundRect(ctx, -r, -r * 0.55, size, r * 1.1, r * 0.45);
    ctx.fill();
    ctx.fillStyle = state === 'burnt' ? '#000' : 'rgba(0,0,0,0.18)';
    ctx.fillRect(-r * 0.6, -r * 0.2, size * 0.5, 3);
    ctx.fillRect(-r * 0.2, r * 0.15, size * 0.55, 3);
    if (state === 'grilling') {
      ctx.strokeStyle = '#e2603a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r * 0.8);
      ctx.lineTo(-r * 0.3, -r * 0.8);
      ctx.moveTo(r * 0.1, -r * 0.8);
      ctx.lineTo(r * 0.5, -r * 0.8);
      ctx.stroke();
    }
  } else if (id === 'tomato') {
    ctx.fillStyle = state === 'chopped' ? '#f0705f' : ing.colour;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.fill();
    if (state === 'chopped') {
      ctx.strokeStyle = '#ffd9d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.55, 0);
      ctx.lineTo(r * 0.55, 0);
      ctx.moveTo(0, -r * 0.55);
      ctx.lineTo(0, r * 0.55);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#3f8f2f';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.85, r * 0.3, r * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = ing.colour;
    ctx.beginPath();
    for (let i = 0; i < 3; i += 1) {
      ctx.ellipse(-r * 0.5 + i * r * 0.5, (i % 2 === 0 ? -2 : 2), r * 0.55, r * 0.5, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, 0);
    ctx.quadraticCurveTo(0, r * 0.3, r * 0.6, 0);
    ctx.stroke();
  } else if (id === 'onion') {
    ctx.fillStyle = state === 'chopped' ? '#e6d6f5' : ing.colour;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a582c8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    ctx.stroke();
  } else if (id === 'cheese') {
    ctx.fillStyle = ing.colour;
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.6);
    ctx.lineTo(r, r * 0.6);
    ctx.lineTo(0, -r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    ctx.arc(-r * 0.3, r * 0.1, 2.5, 0, Math.PI * 2);
    ctx.arc(r * 0.25, r * 0.3, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, items, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = PALETTE.plateEdge;
  ctx.beginPath();
  ctx.ellipse(0, 0, 62, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath();
  ctx.ellipse(0, -2, 56, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  // The stack rises from the plate, bottom ingredient first.
  let stackY = -8;
  for (const id of items) {
    const state = id === 'patty' ? 'done' : (INGREDIENTS[id].prep === 'chop' ? 'chopped' : 'ready');
    drawIngredient(ctx, id, 0, stackY, 44, state);
    stackY -= 9;
  }
  ctx.restore();
}

function drawTicket(ctx, order, x, y, w, h, time) {
  const dish = DISHES[order.dish];
  const urgent = order.patience < 12;
  const frac = Math.max(0, order.patience / order.maxPatience);
  ctx.save();
  if (urgent && Math.floor(time * 3) % 2 === 0) {
    ctx.shadowColor = '#d64541';
    ctx.shadowBlur = 14;
  }
  ctx.fillStyle = PALETTE.ticket;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = urgent ? '#d64541' : PALETTE.ticketEdge;
  ctx.lineWidth = urgent ? 3 : 2;
  roundRect(ctx, x, y, w, h, 10);
  ctx.stroke();
  text(ctx, dish.name, x + 12, y + 16, 16, PALETTE.text);
  text(ctx, `${dish.price}c`, x + w - 12, y + 16, 15, '#b26a00', 'bold', 'right');
  dish.recipe.forEach((id, i) => {
    const state = id === 'patty' ? 'done' : (INGREDIENTS[id].prep === 'chop' ? 'chopped' : 'ready');
    drawIngredient(ctx, id, x + 24 + i * 34, y + 48, 28, state);
  });
  // Patience bar.
  ctx.fillStyle = '#e3d5b3';
  roundRect(ctx, x + 12, y + h - 18, w - 24, 9, 4);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#4caf50' : frac > 0.25 ? '#f2b234' : '#d64541';
  roundRect(ctx, x + 12, y + h - 18, (w - 24) * frac, 9, 4);
  ctx.fill();
  if (urgent) text(ctx, 'HURRY!', x + w - 12, y + h - 34, 12, '#d64541', 'bold', 'right');
}

function drawChef(ctx, chef, time) {
  const bob = chef.walking ? Math.sin(time * 14) * 3 : Math.sin(time * 2) * 1;
  ctx.save();
  ctx.translate(chef.x, chef.y + bob * 0.4);
  ctx.scale(chef.facing, 1);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 26, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: white apron over a checked shirt.
  ctx.fillStyle = '#e85454';
  roundRect(ctx, -20, -8, 40, 30, 10);
  ctx.fill();
  ctx.fillStyle = '#fbf7ef';
  roundRect(ctx, -16, 2, 32, 22, 8);
  ctx.fill();
  ctx.fillStyle = '#e85454';
  ctx.fillRect(-16, 8, 32, 3);
  // Head and tall chef hat.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(0, -22, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, -34, 17, 10, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-17, -40, 34, 8);
  ctx.beginPath();
  ctx.arc(-17, -36, 5, Math.PI / 2, Math.PI * 1.5);
  ctx.arc(17, -36, 5, Math.PI * 1.5, Math.PI / 2);
  ctx.fill();
  // Face.
  ctx.fillStyle = '#2b1d12';
  ctx.beginPath();
  ctx.arc(5, -24, 2, 0, Math.PI * 2);
  ctx.arc(11, -24, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b1d12';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(8, -18, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Arms: one raised when carrying.
  ctx.strokeStyle = '#f2c89b';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-14, 2);
  ctx.lineTo(-26, 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(14, 2);
  if (chef.carrying) ctx.lineTo(24, -34);
  else ctx.lineTo(26, 12);
  ctx.stroke();
  ctx.restore();
  // What the chef carries, held high above the hat.
  if (chef.carrying) {
    ctx.save();
    ctx.translate(chef.x + 26 * chef.facing, chef.y - 52 + bob * 0.4);
    if (chef.carrying.kind === 'plate') {
      drawPlate(ctx, 0, 0, chef.carrying.items, 0.62);
    } else {
      const item = chef.carrying;
      const state = item.state === 'burnt' ? 'burnt' : item.state;
      drawIngredient(ctx, item.id, 0, 0, 34, state);
    }
    ctx.restore();
  }
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function drawHeader(state, screen) {
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(0, 0, 1280, 60);
    ctx.fillStyle = PALETTE.gold;
    text(ctx, 'THE GOLDEN LADLE', 24, 31, 26, '#fff3d6');
    // Shift timer.
    const total = Math.ceil(state.timeLeft);
    const mm = String(Math.floor(total / 60)).padStart(1, '0');
    const ss = String(total % 60).padStart(2, '0');
    const lowTime = state.timeLeft <= 30 && screen === SCREEN_PLAY;
    ctx.fillStyle = lowTime ? '#d64541' : '#2b1d12';
    roundRect(ctx, 560, 10, 160, 40, 10);
    ctx.fill();
    text(ctx, `${mm}:${ss}`, 640, 31, 24, '#fff3d6', 'bold', 'center');
    // Coins.
    ctx.fillStyle = '#f2b234';
    ctx.beginPath();
    ctx.arc(768, 30, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a5200';
    ctx.font = `bold 16px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('¢', 768, 31);
    text(ctx, `${state.coins}`, 790, 31, 22, '#fff3d6');
    // Hearts.
    for (let i = 0; i < 3; i += 1) {
      heart(ctx, 900 + i * 30, 30, 11, i < state.hearts ? '#e84a5f' : 'rgba(255,255,255,0.25)');
    }
    text(ctx, `Served ${state.served}`, 1000, 31, 18, '#fff3d6');
    if (state.combo >= 2) text(ctx, `Combo x${state.combo}`, 1120, 31, 18, '#ffd76a');
    text(ctx, 'M mute · P pause', 1180, 52, 11, '#d9b98a', 'normal', 'right');
  }

  function drawOrderBoard(state, time) {
    ctx.fillStyle = PALETTE.board;
    roundRect(ctx, 12, 68, 1256, 108, 12);
    ctx.fill();
    ctx.strokeStyle = PALETTE.boardEdge;
    ctx.lineWidth = 2;
    roundRect(ctx, 12, 68, 1256, 108, 12);
    ctx.stroke();
    text(ctx, 'ORDER BOARD', 28, 84, 13, PALETTE.muted, 'bold');
    if (state.orders.length === 0) {
      text(ctx, 'No orders yet — the lunch rush is coming…', 28, 130, 18, PALETTE.muted, 'normal');
    }
    state.orders.forEach((order, i) => {
      drawTicket(ctx, order, 24 + i * 252, 92, 240, 76, time);
    });
    text(ctx, 'Serve fast for tips!', 1040, 100, 15, PALETTE.muted, 'bold');
    text(ctx, 'Match the plate to a ticket,', 1040, 124, 14, PALETTE.muted, 'normal');
    text(ctx, 'then ring the serving bell.', 1040, 144, 14, PALETTE.muted, 'normal');
  }

  function drawKitchen(state, time) {
    // Floor.
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 440, 1280, 280);
    ctx.fillStyle = PALETTE.floorTile;
    for (let x = 0; x < 1280; x += 80) {
      for (let y = 440; y < 720; y += 80) {
        if (((x + y) / 80) % 2 === 0) ctx.fillRect(x, y, 78, 78);
      }
    }
    // Back wall.
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 176, 1280, 264);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let x = 0; x < 1280; x += 64) ctx.fillRect(x, 176, 30, 264);

    // Ingredient bins.
    for (const bin of BINS) {
      const ing = INGREDIENTS[bin.id];
      ctx.fillStyle = PALETTE.counterEdge;
      roundRect(ctx, bin.x - 2, bin.y - 2, bin.w + 4, bin.h + 4, 10);
      ctx.fill();
      ctx.fillStyle = PALETTE.counterTop;
      roundRect(ctx, bin.x, bin.y, bin.w, bin.h, 8);
      ctx.fill();
      drawIngredient(ctx, bin.id, bin.x + bin.w / 2, bin.y + 38, 52, bin.id === 'patty' ? 'raw' : 'ready');
      text(ctx, ing.name, bin.x + bin.w / 2, bin.y + 80, 14, PALETTE.text, 'bold', 'center');
    }

    // Chopping board.
    const board = STATIONS.board;
    ctx.fillStyle = PALETTE.counterEdge;
    roundRect(ctx, board.x - 2, board.y - 2, board.w + 4, board.h + 4, 10);
    ctx.fill();
    ctx.fillStyle = '#8a5a2e';
    roundRect(ctx, board.x, board.y, board.w, board.h, 8);
    ctx.fill();
    ctx.fillStyle = '#a9743f';
    roundRect(ctx, board.x + 10, board.y + 10, board.w - 20, board.h - 20, 6);
    ctx.fill();
    if (state.board) {
      drawIngredient(ctx, state.board.id, board.x + 62, board.y + 48, 56, state.board.state);
      if (state.board.state === 'raw') {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        roundRect(ctx, board.x + 14, board.y + 76, board.w - 28, 8, 4);
        ctx.fill();
        ctx.fillStyle = '#f2b234';
        roundRect(ctx, board.x + 14, board.y + 76, (board.w - 28) * state.board.progress, 8, 4);
        ctx.fill();
      } else {
        text(ctx, 'CHOPPED ✓', board.x + board.w / 2, board.y + 82, 12, '#2e7d32', 'bold', 'center');
      }
      // Knife.
      ctx.save();
      ctx.translate(board.x + 118, board.y + 30);
      ctx.rotate(-0.5 + Math.sin(time * 10) * 0.15 * (state.board.state === 'raw' ? 1 : 0));
      ctx.fillStyle = '#c8ccd2';
      roundRect(ctx, -4, -26, 8, 30, 3);
      ctx.fill();
      ctx.fillStyle = '#3a2a1a';
      roundRect(ctx, -4, 4, 8, 14, 3);
      ctx.fill();
      ctx.restore();
    } else {
      text(ctx, 'CHOP', board.x + board.w / 2, board.y + 44, 18, '#e8c98f', 'bold', 'center');
      text(ctx, 'tomato · lettuce · onion', board.x + board.w / 2, board.y + 68, 11, '#d9b98a', 'normal', 'center');
    }

    // Grill.
    const grill = STATIONS.grill;
    ctx.fillStyle = PALETTE.counterEdge;
    roundRect(ctx, grill.x - 2, grill.y - 2, grill.w + 4, grill.h + 4, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.grill;
    roundRect(ctx, grill.x, grill.y, grill.w, grill.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#22252a';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(grill.x + 12, grill.y + 18 + i * 14);
      ctx.lineTo(grill.x + grill.w - 12, grill.y + 18 + i * 14);
      ctx.stroke();
    }
    state.grill.forEach((slot, i) => {
      const cx = grill.x + 44 + i * 84;
      const cy = grill.y + 48;
      if (!slot) return;
      const stateName = slot.state === 'grilling' ? 'grilling' : slot.state;
      drawIngredient(ctx, 'patty', cx, cy, 56, stateName);
      if (slot.state === 'grilling') {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        roundRect(ctx, cx - 26, cy + 30, 52, 7, 3);
        ctx.fill();
        ctx.fillStyle = '#e2603a';
        roundRect(ctx, cx - 26, cy + 30, 52 * slot.progress, 7, 3);
        ctx.fill();
      } else if (slot.state === 'done') {
        text(ctx, 'DONE!', cx, cy - 42, 13, '#ffd76a', 'bold', 'center');
      } else {
        text(ctx, 'BURNT!', cx, cy - 42, 13, '#ff8a7a', 'bold', 'center');
      }
    });
    if (state.grill.every((s) => !s)) text(ctx, 'GRILL', grill.x + grill.w / 2, grill.y + 82, 13, '#9aa2ad', 'bold', 'center');

    // Serving window.
    const win = STATIONS.window;
    const glow = state.chef.carrying && state.chef.carrying.kind === 'plate';
    ctx.save();
    if (glow) { ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 18; }
    ctx.fillStyle = PALETTE.window;
    roundRect(ctx, win.x, win.y, win.w, win.h, 10);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#17394d';
    roundRect(ctx, win.x + 8, win.y + 8, win.w - 16, 44, 6);
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(win.x + win.w / 2, win.y + 30, 10, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(win.x + win.w / 2 - 12, win.y + 30, 24, 4);
    text(ctx, 'SERVE', win.x + win.w / 2, win.y + 74, 16, '#fff3d6', 'bold', 'center');
    text(ctx, 'ring the bell', win.x + win.w / 2, win.y + 90, 10, '#bfe0ee', 'normal', 'center');

    // Plating counter with two plates.
    ctx.fillStyle = PALETTE.counter;
    roundRect(ctx, 24, 336, 672, 88, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.counterTop;
    roundRect(ctx, 24, 336, 672, 18, 8);
    ctx.fill();
    text(ctx, 'PLATING', 40, 366, 12, '#8a5f30', 'bold');
    state.plates.forEach((items, i) => {
      drawPlate(ctx, 190 + i * 340, 392, items, 1);
      if (items.length === 0) text(ctx, 'empty plate', 190 + i * 340, 392, 12, '#8a5f30', 'normal', 'center');
    });

    // Trash.
    const trash = STATIONS.trash;
    ctx.fillStyle = '#5a6068';
    roundRect(ctx, trash.x, trash.y, trash.w, trash.h, 10);
    ctx.fill();
    ctx.fillStyle = '#767e88';
    roundRect(ctx, trash.x + 6, trash.y + 6, trash.w - 12, trash.h - 12, 8);
    ctx.fill();
    text(ctx, 'TRASH', trash.x + trash.w / 2, trash.y + 44, 14, '#e8e8e8', 'bold', 'center');

    // Menu poster on the wall.
    ctx.fillStyle = '#fdf6e0';
    roundRect(ctx, 900, 336, 356, 88, 8);
    ctx.fill();
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 2;
    roundRect(ctx, 900, 336, 356, 88, 8);
    ctx.stroke();
    text(ctx, "TODAY'S MENU", 918, 354, 13, '#8a6a3a', 'bold');
    const menu = [
      ['Classic Burger — 10c', 'Cheese Burger — 12c'],
      ['Garden Salad — 9c', 'Double Stack — 15c'],
    ];
    menu.forEach((row, i) => {
      text(ctx, row[0], 918, 378 + i * 20, 13, PALETTE.text, 'normal');
      text(ctx, row[1], 1090, 378 + i * 20, 13, PALETTE.text, 'normal');
    });

    // Particles.
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.ttl);
      ctx.fillStyle = p.colour;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Floating messages.
    for (const m of state.messages) {
      ctx.globalAlpha = Math.min(1, m.ttl);
      text(ctx, m.text, m.x, m.y, 17, m.colour, 'bold', 'center');
    }
    ctx.globalAlpha = 1;
  }

  function drawTitle(state, best) {
    ctx.fillStyle = 'rgba(43,29,18,0.72)';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#fff3d6';
    roundRect(ctx, 290, 120, 700, 470, 18);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 4;
    roundRect(ctx, 290, 120, 700, 470, 18);
    ctx.stroke();
    text(ctx, 'THE GOLDEN LADLE', 640, 180, 46, '#b26a00', 'bold', 'center');
    text(ctx, 'Rush Hour Bistro — a tiny kitchen, a big lunch rush', 640, 222, 18, PALETTE.muted, 'normal', 'center');
    const lines = [
      'Orders land on the board — read the ticket, then cook it.',
      'Grab ingredients from the bins. Chop veg on the board,',
      'grill patties on the grill (don\'t let them burn!).',
      'Stack the dish on a plate, carry it to the window, serve!',
      'Fast serves earn tips. A walked-out order costs a heart.',
    ];
    lines.forEach((line, i) => text(ctx, line, 640, 268 + i * 30, 17, PALETTE.text, 'normal', 'center'));
    text(ctx, 'Click to walk & use stations · WASD / arrows to walk · E to use', 640, 452, 15, PALETTE.muted, 'bold', 'center');
    const pulse = 0.75 + Math.sin(performance.now() / 300) * 0.25;
    ctx.globalAlpha = pulse;
    text(ctx, 'CLICK OR PRESS ENTER TO START', 640, 512, 22, '#b26a00', 'bold', 'center');
    ctx.globalAlpha = 1;
    if (best > 0) text(ctx, `Best shift: ${best} coins`, 640, 556, 16, '#2e7d32', 'bold', 'center');
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(43,29,18,0.66)';
    ctx.fillRect(0, 0, 1280, 720);
    text(ctx, 'PAUSED', 640, 330, 52, '#fff3d6', 'bold', 'center');
    text(ctx, 'Press P or click to carry on', 640, 386, 18, '#e8c98f', 'normal', 'center');
  }

  function drawOver(state, best) {
    ctx.fillStyle = 'rgba(43,29,18,0.78)';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#fff3d6';
    roundRect(ctx, 340, 150, 600, 400, 18);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 4;
    roundRect(ctx, 340, 150, 600, 400, 18);
    ctx.stroke();
    text(ctx, state.won || state.served > 0 ? 'SHIFT OVER!' : 'SHIFT OVER!', 640, 210, 40, '#b26a00', 'bold', 'center');
    const stars = state.served >= 12 ? '★★★' : state.served >= 8 ? '★★☆' : state.served >= 4 ? '★☆☆' : '☆☆☆';
    text(ctx, stars, 640, 258, 34, '#f2b234', 'bold', 'center');
    text(ctx, `Coins earned: ${state.coins}`, 640, 310, 22, PALETTE.text, 'bold', 'center');
    text(ctx, `Dishes served: ${state.served}   ·   Best combo: x${state.bestCombo}`, 640, 350, 18, PALETTE.text, 'normal', 'center');
    text(ctx, `Hearts left: ${state.hearts}`, 640, 384, 18, PALETTE.text, 'normal', 'center');
    if (state.coins > best) text(ctx, 'New best shift!', 640, 420, 18, '#2e7d32', 'bold', 'center');
    else if (best > 0) text(ctx, `Best shift: ${best} coins`, 640, 420, 16, PALETTE.muted, 'normal', 'center');
    const pulse = 0.75 + Math.sin(performance.now() / 300) * 0.25;
    ctx.globalAlpha = pulse;
    text(ctx, 'PRESS ENTER TO COOK AGAIN', 640, 492, 20, '#b26a00', 'bold', 'center');
    ctx.globalAlpha = 1;
  }

  function draw(state, screen, best, time) {
    ctx.clearRect(0, 0, 1280, 720);
    const shakeX = state.shake > 0 ? (Math.random() - 0.5) * 8 * state.shake * 3 : 0;
    ctx.save();
    ctx.translate(shakeX, 0);
    drawHeader(state, screen);
    drawOrderBoard(state, time);
    drawKitchen(state, time);
    drawChef(ctx, state.chef, time);
    ctx.restore();
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawOver(state, best);
  }

  return { draw };
}
