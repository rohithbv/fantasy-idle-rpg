import { GameStateManager } from './GameStateManager';
import { BALANCE, upgradeCost } from '../data/balancing';

export class EconomySystem {
  static getClickValue(comboMultiplier: number = 1): number {
    const base = GameStateManager.getClickPower();
    const critChance = (GameStateManager.getUpgradeLevel('click_crit') ?? 0) * 0.05;
    const isCrit = Math.random() < critChance;
    const critMulti = isCrit ? 3 : 1;
    return Math.floor(base * comboMultiplier * critMulti);
  }

  static getAutoIncomePerSecond(): number {
    return GameStateManager.getAutoRate();
  }

  static getUpgradeCost(upgradeId: string): number {
    return GameStateManager.getUpgradeCost(upgradeId);
  }

  static getOfflineEarnings(elapsedMs: number): number {
    const maxMs = BALANCE.OFFLINE_MAX_HOURS * 3600 * 1000;
    const cappedMs = Math.min(elapsedMs, maxMs);
    const autoRate = GameStateManager.getAutoRate();
    if (autoRate <= 0) return 0;
    const seconds = cappedMs / 1000;
    return Math.floor(autoRate * seconds * BALANCE.OFFLINE_EFFICIENCY);
  }
}
