/** Minimal Phaser stub for unit tests that import scene-adjacent modules. */

class RandomDataGenerator {
  constructor(seeds = []) {
    let h = 0;
    for (const seed of seeds) {
      const s = String(seed);
      for (let i = 0; i < s.length; i++) {
        h = ((h << 5) - h + s.charCodeAt(i)) | 0;
      }
    }
    this._state = h || 1;
  }

  frac() {
    this._state = (this._state * 1664525 + 1013904223) >>> 0;
    return this._state / 0x100000000;
  }
}

const Phaser = {
  Math: { RandomDataGenerator },
};

export default Phaser;
export { Phaser };
