// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between four screens:
// title, play, paused and shift over.
//
// ?seed=N fixes the order pattern. ?shot=title|service|assembly|serve (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import {
  EVENT_BURNT, EVENT_EXPIRED, EVENT_ORDER, EVENT_OVER, EVENT_SERVED, EVENT_WRONG,
  createWorld,
} from './world.js';
import { ACTION_CONFIRM, ACTION_INTERACT, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, createRenderer } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();
const input = createInput(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, world.state.time);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  // A read-only handle for play-testing and debugging.
  window.__goldenLadle = { world, get screen() { return screen; } };

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    audio.startMusic();
    announce('Playing. The lunch rush is on.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    audio.stopMusic();
    audio.stopSizzle();
    if (world.state.coins > best) {
      best = world.state.coins;
      saveBest(best);
    }
    announce(`Shift over. ${world.state.coins} coins, ${world.state.served} dishes served. Best ${best}.`);
  }

  function handleEvents(events) {
    if (events & EVENT_ORDER) audio.ding();
    if (events & EVENT_SERVED) { audio.serve(); audio.coin(); }
    if (events & EVENT_EXPIRED) audio.walkOut();
    if (events & EVENT_BURNT) audio.burn();
    if (events & EVENT_WRONG) audio.error();
    if (events & EVENT_OVER) endGame();
    const grilling = world.state.grill.some((slot) => slot && slot.state === 'grilling');
    if (grilling) audio.startSizzle();
    else audio.stopSizzle();
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      audio.stopSizzle();
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    } else if (actions & ACTION_INTERACT && screen === SCREEN_PLAY) {
      const station = world.nearestStation();
      if (station) {
        const events = world.useStation(station.kind, station.id);
        handleEvents(events);
      }
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      // The kitchen idles behind the title: orders drift in for flavour.
      // If the idle kitchen ever runs out of hearts, quietly reset it.
      world.step(STEP, 0, 0);
      if (world.state.over) world.reset();
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const dir = input.direction();
    const events = world.step(STEP, dir.x, dir.y);
    handleEvents(events);
    const click = input.takeClick();
    if (click) {
      audio.unlock();
      world.clickAt(click.x, click.y);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    while (accumulator >= STEP) {
      step();
      accumulator -= STEP;
    }
    // Clicks also work on the title and end screens (Enter starts, but a
    // click on the big button area does too).
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      const click = input.takeClick();
      if (click) startGame();
    }
    renderer.draw(world.state, screen, best, world.state.time);
  }

  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
