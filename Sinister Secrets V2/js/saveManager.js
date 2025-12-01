export class SaveManager {
  constructor() {
    this.slotsKey = 'hm_slots';
    this.ensureSlots();
    this.bindUI();
  }

  ensureSlots() {
    const raw = localStorage.getItem(this.slotsKey);
    if (!raw) {
      const slots = Array.from({ length: 5 }, (_, i) => ({
        name: `Slot ${i+1}`,
        timestamp: 0,
        data: null,
        seedPreview: ''
      }));
      localStorage.setItem(this.slotsKey, JSON.stringify(slots));
    }
  }

  getSlots() {
    return JSON.parse(localStorage.getItem(this.slotsKey) || '[]');
  }
  setSlots(slots) {
    localStorage.setItem(this.slotsKey, JSON.stringify(slots));
  }

  save(index, payload) {
    const slots = this.getSlots();
    const seed = payload?.maze?.seed ?? '';
    slots[index] = {
      name: slots[index]?.name || `Slot ${index+1}`,
      timestamp: Date.now(),
      data: payload,
      seedPreview: `${seed}`
    };
    this.setSlots(slots);
  }

  load(index) {
    const slots = this.getSlots();
    return slots[index]?.data || null;
  }

  delete(index) {
    const slots = this.getSlots();
    slots[index] = { name: `Slot ${index+1}`, timestamp: 0, data: null, seedPreview: '' };
    this.setSlots(slots);
  }

  rename(index, newName) {
    const slots = this.getSlots();
    slots[index].name = newName;
    this.setSlots(slots);
  }

  export(index) {
    const slots = this.getSlots();
    const data = slots[index]?.data;
    if (!data) return null;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    return blob;
  }

  async import(index, file) {
    const text = await file.text();
    const data = JSON.parse(text);
    const slots = this.getSlots();
    const seed = data?.maze?.seed || '';
    slots[index] = {
      name: slots[index]?.name || `Slot ${index+1}`,
      timestamp: Date.now(),
      data,
      seedPreview: `${seed}`
    };
    this.setSlots(slots);
  }

  autoLoad(game) {
    const slots = this.getSlots();
    let bestIdx = -1, bestTs = 0;
    slots.forEach((s, i) => {
      if (s.timestamp > bestTs && s.data) { bestTs = s.timestamp; bestIdx = i; }
    });
    if (bestIdx >= 0) {
      return game.loadFromSlot(bestIdx);
    }
    return false;
  }

  bindUI() {
    const slotsEl = document.getElementById('slots');
    const renderSlots = () => {
      const slots = this.getSlots();
      slotsEl.innerHTML = '';
      slots.forEach((s, i) => {
        const el = document.createElement('div');
        el.className = 'slot';
        el.dataset.index = i;
        const ts = s.timestamp ? new Date(s.timestamp).toLocaleString() : 'Empty';
        el.innerHTML = `
          <strong>${s.name}</strong><br/>
          <small>${ts}${s.seedPreview ? ' — seed '+s.seedPreview : ''}</small>
        `;
        slotsEl.appendChild(el);
      });
    };
    renderSlots();

    slotsEl.addEventListener('click', (e) => {
      const slot = e.target.closest('.slot');
      if (!slot) return;
      document.querySelectorAll('.slot').forEach(el => el.classList.remove('selected'));
      slot.classList.add('selected');
    });

    document.getElementById('exportSlot').addEventListener('click', () => {
      const sel = document.querySelector('.slot.selected');
      if (!sel) return;
      const idx = Number(sel.dataset.index);
      const blob = this.export(idx);
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `horror_maze_slot_${idx+1}.json`;
      a.click();
    });

    document.getElementById('importSlot').addEventListener('click', async () => {
      const sel = document.querySelector('.slot.selected');
      const fileEl = document.getElementById('importFile');
      if (!sel || !fileEl.files?.length) return;
      const idx = Number(sel.dataset.index);
      await this.import(idx, fileEl.files[0]);
      renderSlots();
      window.__game?.ui.toast('Save imported', 'success');
    });

    document.getElementById('deleteSlot').addEventListener('click', () => {
      const sel = document.querySelector('.slot.selected');
      if (!sel) return;
      this.delete(Number(sel.dataset.index));
      renderSlots();
      window.__game?.ui.toast('Deleted slot', 'warn');
    });

    document.getElementById('renameSlot').addEventListener('click', () => {
      const sel = document.querySelector('.slot.selected');
      if (!sel) return;
      const idx = Number(sel.dataset.index);
      const name = prompt('New name for slot:');
      if (!name) return;
      this.rename(idx, name);
      renderSlots();
      window.__game?.ui.toast('Renamed slot', 'success');
    });

    document.getElementById('closeSaveLoad').addEventListener('click', () => {
      document.getElementById('save-load-menu').classList.add('hidden');
      document.getElementById('main-menu').classList.remove('hidden');
    });
  }
}
