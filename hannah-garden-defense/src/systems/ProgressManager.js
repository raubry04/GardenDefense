const STORAGE_KEY = 'hannahGarden_progress';

const DEFAULT_PROGRESS = {
  playerName: '',
  hannahLevel: 1,
  hannahXp: 0,
  gardenLevel: 1,
  sunshinePoints: 0,
  battleStars: {},
};

export class ProgressManager {
  constructor() {
    this.data = this._loadLocal();
  }

  async load(playerName) {
    try {
      const res = await fetch(`/api/progress/${encodeURIComponent(playerName)}`);
      if (res.status === 404) {
        this.data = { ...DEFAULT_PROGRESS, playerName };
        return this.data;
      }
      if (res.ok) {
        const serverData = await res.json();
        this.data = { ...DEFAULT_PROGRESS, ...serverData };
        this._saveLocal();
        return this.data;
      }
    } catch { /* network unavailable, fall through */ }

    const local = this._loadLocal();
    if (local.playerName === playerName) {
      this.data = local;
    } else {
      this.data = { ...DEFAULT_PROGRESS, playerName };
    }
    return this.data;
  }

  async save(data) {
    if (data) {
      this.data = { ...this.data, ...data };
    }
    this._saveLocal();

    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.data),
      });
    } catch { /* offline – local save is sufficient */ }
  }

  getProgress() {
    return { ...this.data };
  }

  get hannahLevel() { return this.data.hannahLevel; }
  set hannahLevel(val) { this.data.hannahLevel = val; }

  get hannahXp() { return this.data.hannahXp; }
  set hannahXp(val) { this.data.hannahXp = val; }

  get gardenLevel() { return this.data.gardenLevel; }
  set gardenLevel(val) { this.data.gardenLevel = val; }

  get sunshinePoints() { return this.data.sunshinePoints; }
  set sunshinePoints(val) { this.data.sunshinePoints = val; }

  get battleStars() { return this.data.battleStars; }
  set battleStars(val) { this.data.battleStars = val; }

  _loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_PROGRESS, ...JSON.parse(raw) } : { ...DEFAULT_PROGRESS };
    } catch {
      return { ...DEFAULT_PROGRESS };
    }
  }

  _saveLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch { /* storage unavailable */ }
  }
}
