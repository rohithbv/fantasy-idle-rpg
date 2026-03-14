import { GameStateManager } from './GameStateManager';
import { EventBus } from './EventBus';
import { GameEvents } from '../types/events';

export class AdManager {
  private lastAdTime: number = 0;
  private AD_COOLDOWN_MS = 60000; // 1 min between ads

  canShowAd(): boolean {
    return Date.now() - this.lastAdTime >= this.AD_COOLDOWN_MS;
  }

  showRewardedAd(rewardType: 'gold' | 'multiplier'): Promise<boolean> {
    // Stub: in production, integrate with ad SDK
    return new Promise(resolve => {
      this.lastAdTime = Date.now();

      // Simulate ad completion
      setTimeout(() => {
        if (rewardType === 'gold') {
          const bonus = Math.floor(GameStateManager.getState().gold * 0.1 + 100);
          GameStateManager.addGold(bonus, 'ad');
          EventBus.emit(GameEvents.TOAST, `Ad bonus: +${bonus} gold!`);
        } else {
          GameStateManager.addMultiplier(2, 5 * 60 * 1000, 'ad');
          EventBus.emit(GameEvents.TOAST, 'Ad bonus: 2x gold for 5 minutes!');
        }
        resolve(true);
      }, 500);
    });
  }
}
