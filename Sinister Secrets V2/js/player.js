import { keys } from './input.js';

export class Player {
  constructor() {
    this.x = 2.5; this.y = 2.5;
    this.dir = 0;
    this.fov = Math.PI/3;
    this.speed = 2.2;
    this.sprintMult = 1.7;
    this.flashlightOn = true;
    this.battery = 1.0;
    this.stamina = 1.0;
    this.mouseSensitivity = 0.5;
  }

  update(dt, collides) {
    const forward = (keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0);
    const strafe = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);
    const sprinting = (keys['ShiftLeft'] || keys['ShiftRight']) && this.stamina > 0.05;
    const speed = this.speed * (sprinting ? this.sprintMult : 1);

    let vx = Math.cos(this.dir) * forward + Math.cos(this.dir+Math.PI/2)*strafe;
    let vy = Math.sin(this.dir) * forward + Math.sin(this.dir+Math.PI/2)*strafe;
    const norm = Math.sqrt(vx*vx+vy*vy) || 1;
    vx = (vx/norm)*speed*dt; vy = (vy/norm)*speed*dt;

    if (!collides(this.x+vx,this.y)) this.x+=vx;
    if (!collides(this.x,this.y+vy)) this.y+=vy;

    // stamina
    if (sprinting && (forward||strafe)) this.stamina=Math.max(0,this.stamina-dt*0.25);
    else this.stamina=Math.min(1,this.stamina+dt*0.18);

    // battery drain
    if (this.flashlightOn) this.battery=Math.max(0,this.battery-dt*0.06);
    else this.battery=Math.min(1,this.battery+dt*0.02);
  }
}
