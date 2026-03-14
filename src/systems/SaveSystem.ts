import { GameStateManager } from './GameStateManager';
import { EventBus } from './EventBus';
import { GameEvents } from '../types/events';
import { BALANCE } from '../data/balancing';

const SAVE_KEY = 'fantasy_idle_rpg_save';

export class SaveSystem {
  private saveTimer: number = 0;

  init(): void {
    // Save on tab hide
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.save();
      }
    });

    // Save before unload
    window.addEventListener('beforeunload', () => {
      this.save();
    });
  }

  update(delta: number): void {
    this.saveTimer += delta;
    if (this.saveTimer >= BALANCE.SAVE_INTERVAL_MS) {
      this.saveTimer = 0;
      this.save();
    }
  }

  save(): void {
    GameStateManager.updateLastSaveTime();
    GameStateManager.updateLastOnlineTime();
    const state = GameStateManager.getState();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      EventBus.emit(GameEvents.SAVE);
    } catch {
      // localStorage full or unavailable
    }
  }

  load(): boolean {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      if (!data) return false;
      const parsed = JSON.parse(data);
      GameStateManager.setState(parsed);
      GameStateManager.initUpgrades();
      EventBus.emit(GameEvents.LOAD);
      return true;
    } catch {
      return false;
    }
  }

  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  getOfflineTime(): number {
    const state = GameStateManager.getState();
    return Date.now() - state.lastOnlineTime;
  }
}
