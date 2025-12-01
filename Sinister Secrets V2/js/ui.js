export class UI {
  constructor() {
    this.toastKeys = new Map();
  }

  toast(msg, type='success', ms=1800) {
    const cont = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    cont.appendChild(el);
    setTimeout(() => el.remove(), ms);
  }

  toastOnce(key, msg, type='success', ms=1800) {
    const now = performance.now();
    const last = this.toastKeys.get(key) || 0;
    if (now - last < ms) return;
    this.toastKeys.set(key, now);
    this.toast(msg, type, ms);
  }

  updateBars(battery, stamina) {
    const bEl = document.getElementById('batteryBar');
    const sEl = document.getElementById('staminaBar');
    bEl.style.width = `${Math.floor(battery * 100)}%`;
    sEl.style.width = `${Math.floor(stamina * 100)}%`;
    bEl.style.background = battery < 0.2 ? 'var(--bar-fill-low)' : (battery < 0.5 ? 'var(--bar-fill-2)' : 'var(--bar-fill)');
    sEl.style.background = stamina < 0.2 ? 'var(--bar-fill-low)' : (stamina < 0.5 ? 'var(--bar-fill-2)' : 'var(--bar-fill)');
  }

  openSettings(settings, onApply) {
    document.getElementById('settings-menu').classList.remove('hidden');
    document.getElementById('main-menu').classList.add('hidden');
    settings.bindUI();
    document.getElementById('applySettings').onclick = () => {
      settings.applyFromUI();
      onApply?.();
      this.toast('Settings applied', 'success');
    };
    document.getElementById('closeSettings').onclick = () => this.closeSettings();
  }
  closeSettings() {
    document.getElementById('settings-menu').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
  }

  openSaveLoad(saveManager, game) {
    document.getElementById('save-load-menu').classList.remove('hidden');
    document.getElementById('main-menu').classList.add('hidden');
    // Click to load
    document.getElementById('slots').onclick = (e) => {
      const slot = e.target.closest('.slot');
      if (!slot) return;
      const idx = Number(slot.dataset.index);
      if (game.loadFromSlot(idx)) {
        document.getElementById('save-load-menu').classList.add('hidden');
      }
    };
  }

  // ...existing code...

  showJumpscare() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = "assets/images/jumpscare.png";
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    // Play scream/static
    window.__game?.audio.playJumpscare();

    // Clear after 1 second
    setTimeout(() => {
      window.__game?.renderer.draw();
    }, 1000);
  }
}


