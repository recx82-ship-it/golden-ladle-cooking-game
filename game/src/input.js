// Keyboard and mouse for The Golden Ladle: WASD or arrows steer the chef,
// E or Space uses the nearest station, P or Escape pauses, M mutes, Enter
// confirms on the title and end screens. Clicks go straight to the world.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_INTERACT = 4;
export const ACTION_MUTE = 8;

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let clicked = null;

  function keyName(event) {
    return event.key.toLowerCase();
  }

  window.addEventListener('keydown', (event) => {
    const key = keyName(event);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    if (event.repeat) return;
    keys.add(key);
    if (key === 'enter' || key === ' ') actions |= ACTION_CONFIRM;
    if (key === 'p' || key === 'escape') actions |= ACTION_PAUSE;
    if (key === 'e') actions |= ACTION_INTERACT;
    if (key === 'm') actions |= ACTION_MUTE;
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(keyName(event));
  });

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    clicked = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  });

  return {
    /** -1, 0 or 1 on each axis from the keys held down. */
    direction() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      return { x, y };
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    takeClick() {
      const taken = clicked;
      clicked = null;
      return taken;
    },
  };
}
