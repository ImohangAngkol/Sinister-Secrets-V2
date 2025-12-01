export class Player {
  constructor(maze, settings) {
    this.maze = maze;
    this.settings = settings;

    const spawn = maze.getSpawn();
    this.x = spawn.x + 0.5;
    this.y = spawn.y + 0.5;
    this.angle = Math.PI / 2;
    this.speed = 2.0; // units/sec
    this.sprintMul = 1.8;
    this.stamina = 1.0; // 0..1
    this.flashlightOn = true;
    this.battery = 1.0; // 0..1
    this.flicker = 0;
    this.swayAmount = 0;

    this.mouseLocked = false;
    this.keys = new Set();
    this.bindInput();
  }

  bindInput() {
    const canvas = document.getElementById('gameCanvas');

    canvas.addEventListener('click', async () => {
      try {
        await canvas.requestPointerLock({ unadjustedMovement: true });
      } catch {}
    });

    document.addEventListener('pointerlockchange', () => {
      this.mouseLocked = (document.pointerLockElement === canvas);
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.mouseLocked) return;
      const sens = this.settings.mouseSensitivity;
      this.angle += e.movementX * 0.002 * sens;
    });

    document.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      this.keys.add(k);
      if (k === 'f') {
        this.flashlightOn = !this.flashlightOn;
        window.__game?.ui.toast(`Flashlight ${this.flashlightOn ? 'ON' : 'OFF'}`, 'success');
        window.__game?.audio.playFlashlight(this.flashlightOn);
      }
    });
    document.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
  }

  tryMove(nx, ny) {
    if (!this.maze.isWall(nx, this.y)) this.x = nx;
    if (!this.maze.isWall(this.x, ny)) this.y = ny;
  }

  update(dt, audio, ui) {
    let speed = this.speed;
    const sprinting = this.keys.has('shift') && this.stamina > 0.1;
    if (sprinting) speed *= this.sprintMul;

    const sin = Math.sin(this.angle), cos = Math.cos(this.angle);
    let moved = false;

    if (this.keys.has('w')) { this.tryMove(this.x + cos * speed * dt, this.y + sin * speed * dt); moved = true; }
    if (this.keys.has('s')) { this.tryMove(this.x - cos * speed * dt, this.y - sin * speed * dt); moved = true; }
    if (this.keys.has('a')) { this.tryMove(this.x + sin * speed * dt, this.y - cos * speed * dt); moved = true; }
    if (this.keys.has('d')) { this.tryMove(this.x - sin * speed * dt, this.y + cos * speed * dt); moved = true; }

    // Sway while walking
    this.swayAmount = moved ? 0.02 : 0;

    // Stamina
    const maxStamina = 1.0;
    if (sprinting) {
      this.stamina = Math.max(0, this.stamina - dt * 0.25);
      audio.playFootstep(true);
    } else {
      this.stamina = Math.min(maxStamina, this.stamina + dt * 0.18);
      if (moved) audio.playFootstep(false);
    }

    // Battery drain if flashlight on
    const drainMul = this.settings.batteryDrain;
    if (this.flashlightOn) {
      this.battery = Math.max(0, this.battery - dt * 0.05 * drainMul);
    } else {
      // slow recharge
      this.battery = Math.min(1, this.battery + dt * 0.02);
    }

    // Flicker when low
    if (this.battery < 0.2 && this.flashlightOn) {
      this.flicker = Math.random() < 0.03 ? 1 : Math.max(0, this.flicker - dt * 3);
      if (this.flicker > 0.5) audio.playFlashlightFlicker();
      ui.toastOnce('battery-low', 'Battery low!', 'warn', 2500);
    }

    // Footstep echo if sprinting and large room (simple check)
    if (sprinting && !this.maze.isWall(this.x + cos, this.y + sin)) {
      audio.playFootstepEcho();
    }
  }

  serialize() {
    return {
      x: this.x, y: this.y, angle: this.angle,
      stamina: this.stamina, battery: this.battery,
      flashlightOn: this.flashlightOn
    };
  }

  static deserialize(data, maze, settings) {
    const p = new Player(maze, settings);
    Object.assign(p, data);
    return p;
  }
}
