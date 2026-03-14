import { GameStateManager } from './GameStateManager';
import { BALANCE, calculateSoulShards } from '../data/balancing';
import { PRESTIGE_UPGRADES } from '../data/prestigeRewards';

export class PrestigeSystem {
  canPrestige(): boolean {
    const dungeon = GameStateManager.getDungeon();
    return dungeon.highestFloor >= BALANCE.PRESTIGE_MIN_FLOOR;
  }

  getShardsPreview(): number {
    const dungeon = GameStateManager.getDungeon();
    const state = GameStateManager.getState();
    return calculateSoulShards(dungeon.highestFloor, state.totalGoldThisRun);
  }

  prestige(): number {
    if (!this.canPrestige()) return 0;
    const shards = this.getShardsPreview();
    GameStateManager.performPrestige(shards);
    return shards;
  }

  canBuyPrestigeUpgrade(upgradeId: string): boolean {
    const upgrade = PRESTIGE_UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return false;
    const state = GameStateManager.getPrestigeState();
    const owned = state.purchasedUpgrades.filter(id => id === upgradeId).length;
    if (owned >= upgrade.maxLevel) return false;
    const cost = Math.floor(upgrade.cost * Math.pow(upgrade.costScaling, owned));
    return state.soulShards >= cost;
  }

  buyPrestigeUpgrade(upgradeId: string): boolean {
    if (!this.canBuyPrestigeUpgrade(upgradeId)) return false;
    const upgrade = PRESTIGE_UPGRADES.find(u => u.id === upgradeId)!;
    const state = GameStateManager.getPrestigeState();
    const owned = state.purchasedUpgrades.filter(id => id === upgradeId).length;
    const cost = Math.floor(upgrade.cost * Math.pow(upgrade.costScaling, owned));
    (state as { soulShards: number }).soulShards -= cost;
    state.purchasedUpgrades.push(upgradeId);
    return true;
  }
}
