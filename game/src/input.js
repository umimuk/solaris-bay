/** Edge-triggered keyboard input and held movement / mouse buttons. */
export function createInput() {
  const keys = new Set();
  const pressed = new Set();
  let pointerLocked = false;
  let mouseDown = false;
  let mouseX = 0;
  let mouseY = 0;

  window.addEventListener('keydown', (event) => {
    if (!keys.has(event.code)) pressed.add(event.code);
    keys.add(event.code);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.code)) {
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => {
    keys.clear();
    mouseDown = false;
  });
  document.addEventListener('pointerlockchange', () => {
    pointerLocked = document.pointerLockElement === document.body;
  });
  window.addEventListener('mousemove', (event) => {
    mouseX += event.movementX;
    mouseY += event.movementY;
  });
  window.addEventListener('mousedown', (event) => {
    if (event.button === 0) mouseDown = true;
  });
  window.addEventListener('mouseup', (event) => {
    if (event.button === 0) mouseDown = false;
  });

  return {
    down(...codes) {
      return codes.some((code) => keys.has(code)) || (codes.includes('Mouse0') && mouseDown);
    },
    hit(...codes) {
      return codes.some((code) => pressed.has(code));
    },
    consume() {
      pressed.clear();
      mouseX = 0;
      mouseY = 0;
    },
    mouse() { return { x: mouseX, y: mouseY }; },
    get pointerLocked() { return pointerLocked; },
  };
}
