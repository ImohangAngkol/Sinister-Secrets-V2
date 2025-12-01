export class Settings {
  constructor() {
    // Defaults
    this.graphicsQuality = 'Med';
    this.viewDistance = 10;
    this.fogAmount = 0.5;
    this.masterVolume = 0.7;
    this.sfxVolume = 0.9;
    this.ambientVolume = 0.4;
    this.mouseSensitivity = 0.6;
    this.flashlightBrightness = 1.0;
    this.batteryDrain = 1.0;
    this.uiScale = 1.0;
    this.subtitles = false;
    this.colorblindMode = false;

    this.load();
    this.bindUI();
  }

  bindUI() {
    const id = (x) => document.getElementById(x);
    id('graphicsQuality').value = this.graphicsQuality;
    id('viewDistance').value = this.viewDistance;
    id('fogAmount').value = this.fogAmount;
    id('masterVolume').value = this.masterVolume;
    id('sfxVolume').value = this.sfxVolume;
    id('ambientVolume').value = this.ambientVolume;
    id('mouseSensitivity').value = this.mouseSensitivity;
    id('flashlightBrightness').value = this.flashlightBrightness;
    id('batteryDrain').value = this.batteryDrain;
    id('uiScale').value = this.uiScale;
    id('subtitles').checked = this.subtitles;
    id('colorblindMode').checked = this.colorblindMode;
  }

  applyFromUI() {
    const id = (x) => document.getElementById(x);
    this.graphicsQuality = id('graphicsQuality').value;
    this.viewDistance = Number(id('viewDistance').value);
    this.fogAmount = Number(id('fogAmount').value);
    this.masterVolume = Number(id('masterVolume').value);
    this.sfxVolume = Number(id('sfxVolume').value);
    this.ambientVolume = Number(id('ambientVolume').value);
    this.mouseSensitivity = Number(id('mouseSensitivity').value);
    this.flashlightBrightness = Number(id('flashlightBrightness').value);
    this.batteryDrain = Number(id('batteryDrain').value);
    this.uiScale = Number(id('uiScale').value);
    this.subtitles = id('subtitles').checked;
    this.colorblindMode = id('colorblindMode').checked;

    document.documentElement.style.fontSize = `${16 * this.uiScale}px`;
  }

  persist() {
    localStorage.setItem('hm_settings', JSON.stringify(this.serialize()));
  }
  load() {
    try {
      const raw = localStorage.getItem('hm_settings');
      if (!raw) return;
      const s = JSON.parse(raw);
      this.deserialize(s);
    } catch {}
  }

  serialize() {
    return {
      graphicsQuality: this.graphicsQuality,
      viewDistance: this.viewDistance,
      fogAmount: this.fogAmount,
      masterVolume: this.masterVolume,
      sfxVolume: this.sfxVolume,
      ambientVolume: this.ambientVolume,
      mouseSensitivity: this.mouseSensitivity,
      flashlightBrightness: this.flashlightBrightness,
      batteryDrain: this.batteryDrain,
      uiScale: this.uiScale,
      subtitles: this.subtitles,
      colorblindMode: this.colorblindMode
    };
  }
  deserialize(s) {
    Object.assign(this, s);
  }
}
