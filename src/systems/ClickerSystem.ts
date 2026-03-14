import { GameStateManager } from './GameStateManager';
import { EconomySystem } from './EconomySystem';
import { EventBus } from './EventBus';
import { GameEvents } from '../types/events';
import { BALANCE } from '../data/balancing';

export class ClickerSystem {
  private comboCount: number = 0;
  private lastClickTime: number = 0;

  handleClick(): { gold: number; combo: number; isCrit: boolean } {
    const now = Date.now();

    // Combo logic
    if (now - this.lastClickTime <= BALANCE.COMBO_WINDOW_MS) {
      const maxCombo = BALANCE.COMBO_MAX + (GameStateManager.getUpgradeLevel('click_combo') ?? 0) * 5;
      this.comboCount = Math.min(this.comboCount + 1, maxCombo);
    } else {
      this.comboCount = 0;
    }
    this.lastClickTime = now;

    const comboMultiplier = 1 + this.comboCount * BALANCE.COMBO_MULTIPLIER_PER_STACK;

    // Calculate gold
    const basePower = GameStateManager.getClickPower();
    const critChance = (GameStateManager.getUpgradeLevel('click_crit') ?? 0) * 0.05;
    const isCrit = Math.random() < critChance;
    const critMulti = isCrit ? 3 : 1;
    const gold = Math.floor(basePower * comboMultiplier * critMulti);

    GameStateManager.registerClick();
    GameStateManager.addGold(gold, 'click');

    EventBus.emit(GameEvents.CLICK, gold, this.comboCount, isCrit);
    if (this.comboCount > 0) {
      EventBus.emit(GameEvents.COMBO_CHANGED, this.comboCount);
    }

    return { gold, combo: this.comboCount, isCrit };
  }

  getCombo(): number {
    return this.comboCount;
  }
}
