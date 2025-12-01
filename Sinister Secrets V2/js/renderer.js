// Minimal raycasting pseudo-3D renderer with flashlight cone, fog, sway, shake.
export class Renderer {
  constructor(canvas, maze, player, monster, settings) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.maze = maze;
    this.player = player;
    this.monster = monster;
    this.settings = settings;

    this.cols = canvas.width;
    this.rows = canvas.height;
    this.fov = Math.PI / 3; // 60 deg
    this.numRays = 240; // scaled by graphics quality
    this.maxDepth = 20;
    this.screenShake = 0;

    this.applySettings();
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  applySettings() {
    const q = this.settings.graphicsQuality;
    this.numRays = q === 'Low' ? 120 : (q === 'Med' ? 240 : 360);
    this.maxDepth = this.settings.viewDistance;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    this.cols = this.canvas.width;
    this.rows = this.canvas.height;
    this.ctx.imageSmoothingEnabled = false;
  }

  castRay(angle) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    let depth = 0;
    const step = 0.02;
    while (depth < this.maxDepth) {
      const x = this.player.x + cos * depth;
      const y = this.player.y + sin * depth;
      if (this.maze.isWall(x, y)) {
        return { depth, hitX: x, hitY: y };
      }
      depth += step;
    }
    return { depth: this.maxDepth, hitX: null, hitY: null };
  }

  drawFlashlightCone() {
    // brightness scales with battery and settings
    const b = this.settings.flashlightBrightness * (this.player.flashlightOn ? (0.5 + 0.5 * this.player.battery) : 0.1);
    return b;
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cols, this.rows);

    // Ambient darkness
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.cols, this.rows);

    // Camera sway and shake
    const sway = Math.sin(performance.now() * 0.002) * (this.player.swayAmount);
    const shake = (Math.random() - 0.5) * this.screenShake * 8;

    const halfH = this.rows / 2;
    const rayW = this.cols / this.numRays;
    const baseAngle = this.player.angle + sway + shake * 0.0005;

    const coneBrightness = this.drawFlashlightCone();
    const fog = this.settings.fogAmount;

    // Draw floor gradient
    const grd = ctx.createLinearGradient(0, halfH, 0, this.rows);
    grd.addColorStop(0, 'rgba(10,10,10,0.9)');
    grd.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, halfH, this.cols, halfH);

    // Raycast walls
    for (let i = 0; i < this.numRays; i++) {
      const rayAngle = baseAngle - this.fov / 2 + this.fov * (i / this.numRays);
      const ray = this.castRay(rayAngle);
      const dist = ray.depth * Math.cos(rayAngle - baseAngle); // remove fish-eye
      const height = Math.min(this.rows, Math.floor(this.rows / (dist + 0.0001)));
      const wallTop = halfH - height / 2;

      // Light falloff: flashlight cone vs ambient
      const angleDiff = Math.abs(((rayAngle - this.player.angle + Math.PI) % (2 * Math.PI)) - Math.PI);
      const inCone = angleDiff < (this.fov / 3);
      const light = inCone ? coneBrightness : 0.05;

      // Fog based on dist
      const f = Math.min(1, dist / this.maxDepth);
      const fogMul = (1 - fog * f);

      const base = 28;
      const shade = Math.floor((base + 120 * fogMul * light));
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(Math.floor(i * rayW), Math.floor(wallTop), Math.ceil(rayW) + 1, Math.floor(height));
    }

    // Monster billboard (simple red glow)
    const dx = this.monster.x - this.player.x;
    const dy = this.monster.y - this.player.y;
    const mDist = Math.hypot(dx, dy);
    const angToM = Math.atan2(dy, dx);
    let rel = ((angToM - baseAngle + Math.PI) % (2 * Math.PI)) - Math.PI;
    const onScreen = Math.abs(rel) < this.fov / 2;
    if (onScreen) {
      const xScreen = (rel + this.fov / 2) / this.fov * this.cols;
      const size = Math.max(6, Math.floor(this.rows / (mDist + 0.001)));
      const yScreen = halfH - size / 2;
      const glow = Math.min(1, 1.2 - (mDist / this.maxDepth));
      ctx.fillStyle = `rgba(230,57,70,${glow})`;
      ctx.beginPath();
      ctx.ellipse(xScreen, yScreen, size * 0.4, size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
