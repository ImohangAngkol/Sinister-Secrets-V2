export function generateMaze(w,h,seed) {
  const rng=mulberry32(seed);
  const grid=Array.from({length:h},()=>Array(w).fill(1));
  function carve(x,y){
    grid[y][x]=0;
    const dirs=[[2,0],[-2,0],[0,2],[0,-2]].sort(()=>rng()-0.5);
    for(const [dx,dy] of dirs){
      const nx=x+dx, ny=y+dy;
      if(nx>0&&ny>0&&nx<w-1&&ny<h-1&&grid[ny][nx]===1){
        grid[y+dy/2][x+dx/2]=0;
        carve(nx,ny);
      }
    }
  }
  carve(1,1);
  return grid;
}
function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;}}
