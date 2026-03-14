import { MicroGameType } from '../types/enums';
import { GameStateManager } from './GameStateManager';
import { EventBus } from './EventBus';
import { GameEvents } from '../types/events';
import { BALANCE } from '../data/balancing';
import { MICROGAME_REWARDS } from '../data/microGameRewards';
import { MicroGameResult } from '../models/MicroGameResult';
import { todayDateString } from '../utils/Time';

export class MicroGameManager {
  canPlay(gameType: MicroGameType): boolean {
    const mgState = GameStateManager.getMicroGameState();
    const lastPlayed = mgState.lastPlayedTime[gameType] ?? 0;
    return Date.now() - lastPlayed >= BALANCE.MICROGAME_COOLDOWN_MS;
  }

  getCooldownRemaining(gameType: MicroGameType): number {
    const mgState = GameStateManager.getMicroGameState();
    const lastPlayed = mgState.lastPlayedTime[gameType] ?? 0;
    const remaining = BALANCE.MICROGAME_COOLDOWN_MS - (Date.now() - lastPlayed);
    return Math.max(0, remaining);
  }

  getDailyFeatured(): MicroGameType {
    const mgState = GameStateManager.getMicroGameState();
    const today = todayDateString();
    if (mgState.dailyFeaturedDate !== today) {
      const types = Object.values(MicroGameType);
      const idx = new Date().getDate() % types.length;
      (mgState as { dailyFeatured: MicroGameType }).dailyFeatured = types[idx];
      (mgState as { dailyFeaturedDate: string }).dailyFeaturedDate = today;
    }
    return mgState.dailyFeatured;
  }

  processResult(result: MicroGameResult): { bonusGold: number; multiplier: number; duration: number } {
    const rewards = MICROGAME_REWARDS[result.type];
    let tier = rewards[0];
    for (const r of rewards) {
      if (result.score >= r.minScore) tier = r;
    }

    const isDaily = result.type === this.getDailyFeatured();
    const dailyMulti = isDaily ? BALANCE.MICROGAME_DAILY_REWARD_MULTIPLIER : 1;

    const bonusGold = Math.floor(tier.bonusGold * dailyMulti);
    const multiplier = tier.multiplier;
    const duration = tier.multiplierDuration;

    GameStateManager.addGold(bonusGold, 'microgame');
    GameStateManager.addMultiplier(multiplier, duration, `microgame:${result.type}`);
    GameStateManager.setLastPlayedTime(result.type);

    // Update high score
    const mgState = GameStateManager.getMicroGameState();
    const currentHigh = mgState.highScores[result.type] ?? 0;
    if (result.score > currentHigh) {
      (mgState.highScores as Record<string, number>)[result.type] = result.score;
    }
    (mgState.totalPlays as Record<string, number>)[result.type] = (mgState.totalPlays[result.type] ?? 0) + 1;

    EventBus.emit(GameEvents.MICROGAME_REWARD, bonusGold, multiplier, duration);

    return { bonusGold, multiplier, duration };
  }
}
