export function render(ctx,W,H,map,player,monster) {
  ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
  // simple raycast walls
  const rays=Math.floor(W/2);
  for(let i=0;i<rays;i++){
    const angle=player.dir-player.fov/2+(i/rays)*player.fov;
    const hit=castRay(map,player.x,player.y,angle,20);
    const dist=hit.dist;
    const h=Math.min(H,H/dist);
    ctx.fillStyle=`rgba(80,80,80,${1-dist/20})`;
    ctx.fillRect(i*(W/rays),(H/2)-h/2,(W/rays)+1,h);
  }
  // monster sprite
  ctx.fillStyle='rgba(255,50,50,0.7)';
  ctx.beginPath();
  ctx.arc(W/2,H/2,20,0,Math.PI*2);
  ctx.fill();
}
function castRay(map,x,y,a,max){
  let d=0;const step=0.05;
  while(d<max){
    const nx=x+Math.cos(a)*d, ny=y+Math.sin(a)*d;
    if(map[Math.floor(ny)][Math.floor(nx)]===1) return {dist:d};
    d+=step;
  }
  return {dist:max};
}
