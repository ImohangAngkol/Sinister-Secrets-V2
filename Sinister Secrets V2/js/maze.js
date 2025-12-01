// Maze generation (randomized DFS) + utilities + JSON serialization
export class Maze {
  constructor(w, h, seed = Date.now()) {
    this.w = w; this.h = h; this.seed = seed;
    this.grid = this.generate(w, h, seed);
  }

  random(seed) {
    let s = seed >>> 0;
    return () => {
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
      return (s >>> 0) / 4294967296;
    };
  }

  generate(w, h, seed) {
    // Start with all walls; carve paths via DFS
    const rnd = this.random(seed);
    const grid = Array.from({ length: h }, () => Array(w).fill(1));
    const stack = [];
    const start = { x: 1, y: 1 };
    grid[start.y][start.x] = 0;
    stack.push(start);

    const dirs = [ [1,0],[-1,0],[0,1],[0,-1] ];
    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    while (stack.length) {
      const cur = stack[stack.length - 1];
      const candidates = shuffle([...dirs]).filter(([dx,dy]) => {
        const nx = cur.x + dx * 2; const ny = cur.y + dy * 2;
        if (nx <= 0 || ny <= 0 || nx >= w - 1 || ny >= h - 1) return false;
        return grid[ny][nx] === 1;
      });
      if (!candidates.length) { stack.pop(); continue; }
      const [dx,dy] = candidates[0];
      const mx = cur.x + dx; const my = cur.y + dy;
      const nx = cur.x + dx * 2; const ny = cur.y + dy * 2;
      grid[my][mx] = 0; grid[ny][nx] = 0;
      stack.push({ x: nx, y: ny });
    }

    // Ensure some rooms
    for (let y = 2; y < h - 2; y += 6) {
      for (let x = 2; x < w - 2; x += 6) {
        for (let yy = y; yy < y + 3; yy++) {
          for (let xx = x; xx < x + 3; xx++) {
            if (yy < h && xx < w) grid[yy][xx] = 0;
          }
        }
      }
    }
    return grid;
  }

  isWall(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    if (xi < 0 || yi < 0 || xi >= this.w || yi >= this.h) return true;
    return this.grid[yi][xi] === 1;
  }

  getSpawn() {
    return { x: 1, y: 1 };
  }
  getMonsterSpawn() {
    return { x: this.w - 2, y: this.h - 2 };
  }

  serialize() {
    return { w: this.w, h: this.h, seed: this.seed, grid: this.grid };
  }
  static deserialize(data) {
    const m = new Maze(data.w, data.h, data.seed);
    m.grid = data.grid;
    return m;
  }
}
