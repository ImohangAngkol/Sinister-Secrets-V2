import { aStar } from './pathfinding.js'; // inline pathfinding below

// Simple in-file A* implementation to avoid extra file.
function heuristic(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
function neighbors(maze, n) {
  const res = [];
  const dirs = [ [1,0],[-1,0],[0,1],[0,-1] ];
  for (const [dx,dy] of dirs) {
    const nx = n.x + dx, ny = n.y + dy;
    if (!maze.isWall(nx + 0.5, ny + 0.5)) res.push({ x: nx, y: ny });
  }
  return res;
}
export function aStarSearch(maze, start, goal) {
  const key = (n)=> `${n.x},${n.y}`;
  const open = new Map([[key(start), {n:start, g:0, f:heuristic(start,goal), parent:null}]]);
  const closed = new Set();
  while (open.size) {
    let bestK = null, bestF = Infinity;
    for (const [k,v] of open) if (v.f < bestF) { bestF = v.f; bestK = k; }
    const cur = open.get(bestK); open.delete(bestK);
    if (cur.n.x === goal.x && cur.n.y === goal.y) {
      const path = [];
      let p = cur;
      while (p) { path.push(p.n); p = p.parent; }
      return path.reverse();
    }
    closed.add(bestK);
    for (const nb of neighbors(maze, cur.n)) {
      const nk = key(nb);
      if (closed.has(nk)) continue;
      const g = cur.g + 1;
      const f = g + heuristic(nb, goal);
      const existing = open.get(nk);
      if (!existing || g < existing.g) {
        open.set(nk, { n: nb, g, f, parent: cur });
      }
    }
  }
  return [];
}

export class Monster {
  constructor(maze, settings, player) {
    this.maze = maze;
    this.settings = settings;
    this.player = player;

    const spawn = maze.getMonsterSpawn();
    this.x = spawn.x + 0.5;
    this.y = spawn.y + 0.5;
    this.speed = 1.6;
    this.path = [];
    this.pathCooldown = 0;
    this.alert = false;
    this.lastHum = 0;
  }

  sensePlayer() {
    const dx = this.player.x - this.x;
    const dy = this.player.y - this.y;
    const dist = Math.hypot(dx, dy);

    // Detect flashlight if cone points toward monster
    const angToM = Math.atan2(this.y - this.player.y, this.x - this.player.x);
    const angleDiff = Math.abs(((angToM - this.player.angle + Math.PI) % (2 * Math.PI)) - Math.PI);
    const seesFlashlight = this.player.flashlightOn && angleDiff < (Math.PI / 6);

    const hearsSprint = this.player.keys.has('shift') && dist < 6;
    const proximity = dist < 4;

    return { dist, seesFlashlight, hearsSprint, proximity };
  }

  planPathToPlayer() {
    const start = { x: Math.floor(this.x), y: Math.floor(this.y) };
    const goal = { x: Math.floor(this.player.x), y: Math.floor(this.player.y) };
    this.path = aStarSearch(this.maze, start, goal);
  }

  followPath(dt) {
    if (!this.path || this.path.length < 2) return;
    const next = this.path[1];
    const tx = next.x + 0.5;
    const ty = next.y + 0.5;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    const speed = this.speed * (this.alert ? 1.6 : 1.0) * (this.player.keys.has('shift') ? 1.2 : 1.0) * (this.player.flashlightOn ? 1.15 : 1.0);
    if (dist > 0.001) {
      this.x += (dx / dist) * speed * dt;
      this.y += (dy / dist) * speed * dt;
    } else {
      // Reached this node
      this.path.shift();
    }
  }

  update(dt, ui) {
    const s = this.sensePlayer();
    this.alert = s.seesFlashlight || s.hearsSprint || s.proximity;

    // Hum/alert audio hooks
    this.lastHum += dt;
    if (this.lastHum > 3) {
      window.__game?.audio.playMonsterHum(this.alert);
      this.lastHum = 0;
    }
    if (this.alert && s.seesFlashlight) {
      window.__game?.audio.playMonsterAlert();
      ui.toastOnce('monster-alert', 'It sees you!', 'error', 1500);
    }

    // Replan path periodically
    this.pathCooldown -= dt;
    if (this.pathCooldown <= 0) {
      this.planPathToPlayer();
      this.pathCooldown = this.alert ? 0.5 : 1.2;
    }

    this.followPath(dt);
  }

  serialize() {
    return { x: this.x, y: this.y, alert: this.alert };
  }

  static deserialize(data, maze, settings, player) {
    const m = new Monster(maze, settings, player);
    Object.assign(m, data);
    return m;
  }
}
