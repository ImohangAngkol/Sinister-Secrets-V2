export class Monster {
  constructor(mapW,mapH) {
    this.x = mapW-3.5; this.y = mapH-3.5;
    this.baseSpeed = 1.4;
    this.alert = 0;
  }

  update(dt, player, collides) {
    const dx=player.x-this.x, dy=player.y-this.y;
    const dist=Math.sqrt(dx*dx+dy*dy);
    const tx=player.x, ty=player.y;
    const speed=this.baseSpeed+(player.flashlightOn?0.5:0);

    const len=Math.sqrt((tx-this.x)**2+(ty-this.y)**2)||1;
    const vx=(tx-this.x)/len*speed*dt, vy=(ty-this.y)/len*speed*dt;
    if (!collides(this.x+vx,this.y)) this.x+=vx;
    if (!collides(this.x,this.y+vy)) this.y+=vy;

    if (dist<0.6) return true; // caught
    return false;
  }
}
