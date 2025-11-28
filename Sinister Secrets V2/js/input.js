export const keys = {};

export function setupInput(canvas, player) {
  let pointerLocked = false;

  canvas.addEventListener('click', () => {
    if (!pointerLocked) canvas.requestPointerLock();
  });

  document.addEventListener('pointerlockchange', () => {
    pointerLocked = (document.pointerLockElement === canvas);
  });

  document.addEventListener('mousemove', (e) => {
    if (!pointerLocked) return;
    player.dir += e.movementX * 0.002 * player.mouseSensitivity;
  });

  document.addEventListener('keydown', (e) => { keys[e.code] = true; });
  document.addEventListener('keyup', (e) => { keys[e.code] = false; });
}
