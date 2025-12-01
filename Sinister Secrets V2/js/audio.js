export class AudioManager {
  constructor(settings) {
    this.settings = settings;
    this.buffers = {};
    this.ctx = null;
    this.ambientGain = null;
    this.sfxGain = null;
    this.masterGain = null;
    this.walkCooldown = 0;
    this.runCooldown = 0;
    this.echoCooldown = 0;
    this.init();
  }

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.ambientGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);
      this.ambientGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.applySettings();
      // Preload minimal audio with fetch (optional; safe-guarded)
      const files = {
        walk: 'assets/audio/footstep_walk.mp3',
        run: 'assets/audio/footstep_run.mp3',
        echo: 'assets/audio/footstep_run.mp3',
        hum: 'assets/audio/monster_hum.mp3',
        alert: 'assets/audio/monster_alert.mp3',
        click: 'assets/audio/flashlight_click.mp3',
        flicker: 'assets/audio/flashlight_flicker.mp3',
        ui: 'assets/audio/ui_click.mp3'
      };
      for (const [k, url] of Object.entries(files)) this.load(k, url);
    } catch {}
  }

  async load(key, url) {
    try {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      const audioBuf = await this.ctx.decodeAudioData(buf);
      this.buffers[key] = audioBuf;
    } catch {}
  }

  applySettings() {
    if (!this.masterGain) return;
    this.masterGain.gain.value = this.settings.masterVolume;
    this.sfxGain.gain.value = this.settings.sfxVolume;
    this.ambientGain.gain.value = this.settings.ambientVolume;
  }

  playBuffer(key, gainNode = this.sfxGain, rate = 1) {
    if (!this.ctx || !this.buffers[key]) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers[key];
    src.playbackRate.value = rate;
    src.connect(gainNode);
    src.start(0);
  }

  startAmbient() { /* could loop hum softly */ }
  stopAmbient() { /* stop ambient */ }

  playFootstep(running=false) {
    if (!this.ctx) return;
    const now = performance.now();
    if (running) {
      if (now < this.runCooldown) return;
      this.playBuffer('run', this.sfxGain, 1 + Math.random()*0.1);
      this.runCooldown = now + 220;
    } else {
      if (now < this.walkCooldown) return;
      this.playBuffer('walk', this.sfxGain, 1 + Math.random()*0.05);
      this.walkCooldown = now + 300;
    }
  }

  playFootstepEcho() {
    const now = performance.now();
      if (now < this.echoCooldown) return;
      this.playBuffer('echo', this.sfxGain, 0.9);
      this.echoCooldown = now + 900;
  }

  playMonsterHum(alert=false) {
    this.playBuffer('hum', this.ambientGain, alert ? 1.05 : 1.0);
  }
  playMonsterAlert() {
    this.playBuffer('alert', this.sfxGain, 1.0);
  }
  playFlashlight(on=true) {
    this.playBuffer('click', this.sfxGain, on ? 1.0 : 0.9);
  }
  playFlashlightFlicker() {
    this.playBuffer('flicker', this.sfxGain, 1.0);
  }
  playUI() {
    this.playBuffer('ui', this.sfxGain, 1.0);
  }
  playJumpscare() {
  this.playBuffer('alert', this.sfxGain, 1.2); // reuse monster_alert or add jumpscare.mp3
}

}

