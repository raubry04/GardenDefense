import { GameConfig } from '../config.js';

export class EconomyManager {
  constructor(scene) {
    this.scene = scene;
    this.balance = 0;
  }

  initialize(zone) {
    const key = `zone${zone + 1}`;
    this.balance = GameConfig.startingSunshinePoints[key]
      ?? GameConfig.startingSunshinePoints.endless;
    this.scene.events.emit('points-changed', { balance: this.balance, reason: 'initialize' });
  }

  earn(amount, reason = 'generic') {
    if (amount <= 0) return;
    this.balance += amount;
    this.scene.events.emit('points-changed', { balance: this.balance, amount, reason });
  }

  spend(amount) {
    if (!this.canAfford(amount)) return false;
    this.balance -= amount;
    this.scene.events.emit('points-changed', { balance: this.balance, amount: -amount, reason: 'spend' });
    return true;
  }

  canAfford(amount) {
    return this.balance >= amount;
  }

  getBalance() {
    return this.balance;
  }

  sellTower(tower) {
    const config = GameConfig.towers[tower.type];
    if (!config) return 0;

    const refund = Math.floor(config.cost * GameConfig.sellRefundPercent);
    this.earn(refund, 'sell_tower');
    return refund;
  }
}
