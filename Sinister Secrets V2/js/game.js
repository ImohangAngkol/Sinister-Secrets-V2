import { Renderer } from './renderer.js';
import { Player } from './player.js';
import { Monster } from './monster.js';
import { Maze } from './maze.js';
import { AudioManager } from './audio.js';
import { Settings } from './settings.js';
import { SaveManager } from './saveManager.js';
import { UI } from './ui.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.ui = new UI();
    this.settings = new Settings();
    this.audio = new AudioManager(this.settings);
    this.save = new SaveManager();

    this.state = 'menu'; // menu | playing | paused
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.fixedDt = 1000 / 60;

    this.jumpscareTriggered = false;

    this.bindMenus();
    this.resetGame();
  }

  resetGame(seed = Date.now()) {
    this.maze = new Maze(24, 24, seed); // grid size
    this.player = new Player(this.maze, this.settings);
    this.monster = new Monster(this.maze, this.settings, this.player);
    this.renderer = new Renderer(this.canvas, this.maze, this.player, this.monster, this.settings);
  }

  bindMenus() {
    // Main menu
    const menu = document.getElementById('main-menu');
    menu.addEventListener('click', (e) => {
      const action = e.target?.dataset?.action;
      if (!action) return;
      this.audio.playUI();
      if (action === 'play') {
        this.startNew();
      } else if (action === 'continue') {
        const loaded = this.save.autoLoad(this);
        if (!loaded) this.ui.toast('No recent save found', 'warn');
      } else if (action === 'load') {
        this.ui.openSaveLoad(this.save, this);
      } else if (action === 'settings') {
        this.ui.openSettings(this.settings, () => this.applySettings());
      } else if (action === 'credits') {
        document.getElementById('credits').classList.toggle('hidden');
      } else if (action === 'quit') {
        this.ui.toast('Quit to menu', 'success');
      }
    });

    // Pause menu
    const pauseMenu = document.getElementById('pause-menu');
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'escape') {
        if (this.state === 'playing') this.pause();
        else if (this.state === 'paused') this.resume();
      }
    });
    pauseMenu.addEventListener('click', (e) => {
      const action = e.target?.dataset?.action;
      if (!action) return;
      this.audio.playUI();
      if (action === 'resume') this.resume();
      else if (action === 'save') this.saveToSlot();
      else if (action === 'load') this.ui.openSaveLoad(this.save, this);
      else if (action === 'settings') this.ui.openSettings(this.settings, () => this.applySettings());
      else if (action === 'exit') this.exitToMenu();
    });

    // Settings buttons
    document.getElementById('applySettings').addEventListener('click', () => {
      this.applySettings();
      this.ui.toast('Settings applied', 'success');
    });
    document.getElementById('closeSettings').addEventListener('click', () => {
      this.ui.closeSettings();
    });
  }

  startNew() {
    this.resetGame();
    this.showCanvasHud();
    this.state = 'playing';
    this.audio.startAmbient();
    this.loop(performance.now());
    this.ui.toast('New game started', 'success');
  }

  showCanvasHud() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('pause-menu').classList.add('hidden');
    document.getElementById('gameCanvas').classList.remove('hidden');
    document.getElementById('hud').classList.remove('hidden');
  }
  showMenu() {
    document.getElementById('main-menu').classList.add('visible');
    document.getElementById('main-menu').classList.remove('hidden');
    document.getElementById('pause-menu').classList.add('hidden');
    document.getElementById('gameCanvas').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
  }

  pause() {
    this.state = 'paused';
    document.getElementById('pause-menu').classList.remove('hidden');
    this.ui.toast('Paused', 'success');
  }
  resume() {
    this.state = 'playing';
    document.getElementById('pause-menu').classList.add('hidden');
    this.ui.toast('Resumed', 'success');
  }
  exitToMenu() {
    this.state = 'menu';
    this.audio.stopAmbient();
    this.showMenu();
  }

  applySettings() {
    this.settings.persist();
    this.renderer.applySettings();
    this.audio.applySettings();
  }

  saveToSlot(slotIndex = 0) {
    const payload = {
      player: this.player.serialize(),
      monster: this.monster.serialize(),
      maze: this.maze.serialize(),
      settings: this.settings.serialize(),
      timestamp: Date.now()
    };
    this.save.save(slotIndex, payload);
    this.ui.toast('Game saved', 'success');
  }

  loadFromSlot(slotIndex) {
    const data = this.save.load(slotIndex);
    if (!data) return false;
    this.maze = Maze.deserialize(data.maze);
    this.player = Player.deserialize(data.player, this.maze, this.settings);
    this.monster = Monster.deserialize(data.monster, this.maze, this.settings, this.player);
    this.settings.deserialize(data.settings);
    this.renderer = new Renderer(this.canvas, this.maze, this.player, this.monster, this.settings);
    this.applySettings();
    this.ui.toast('Game loaded', 'success');
    this.showCanvasHud();
    this.state = 'playing';
    this.loop(performance.now());
    return true;
  }

  loop(now) {
    if (this.state !== 'playing') return;
    const dt = now - this.lastTime;
    this.lastTime = now;
    this.accumulator += dt;

    while (this.accumulator >= this.fixedDt) {
      this.update(this.fixedDt / 1000);
      this.accumulator -= this.fixedDt;
    }
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    this.player.update(dt, this.audio, this.ui);
    this.monster.update(dt, this.ui);
    // Simple encounter: if monster close => screen shake
    const dx = this.monster.x - this.player.x;
    const dy = this.monster.y - this.player.y;
    const dist = Math.hypot(dx, dy);
    this.renderer.screenShake = dist < 0.9 ? 0.6 : Math.max(this.renderer.screenShake - dt, 0);
    if (dist < 0.8 && !this.jumpscareTriggered) {
      this.jumpscareTriggered = true;
      this.ui.showJumpscare();
    }
  }

  render() {
    this.renderer.render();
  }
}

const wallImg = new Image();
wallImg.src = "assets/images/wall.png";
const floorImg = new Image();
floorImg.src = "assets/images/floor.png";
const red_orbImg = new Image();
red_orbImg.src = "assets/images/red_orb.png";
