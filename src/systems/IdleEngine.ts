import { GameStateManager } from './GameStateManager';
import { EventBus } from './EventBus';
import { GameEvents } from '../types/events';
import { BALANCE } from '../data/balancing';

export class IdleEngine {
  private tickTimer: number = 0;
  private running: boolean = false;

  start(): void {
    this.running = true;
    this.tickTimer = 0;
  }

  stop(): void {
    this.running = false;
  }

  update(delta: number): void {
    if (!this.running) return;

    this.tickTimer += delta;

    if (this.tickTimer >= BALANCE.IDLE_TICK_MS) {
      this.tickTimer -= BALANCE.IDLE_TICK_MS;
      this.tick();
    }
  }

  private tick(): void {
    const autoRate = GameStateManager.getAutoRate();
    if (autoRate > 0) {
      GameStateManager.addGold(autoRate, 'auto');
      EventBus.emit(GameEvents.IDLE_TICK, autoRate);
    }

    // Update play time
    const state = GameStateManager.getState();
    (state as { totalPlayTime: number }).totalPlayTime += BALANCE.IDLE_TICK_MS / 1000;
    GameStateManager.updateLastOnlineTime();
  }
}
