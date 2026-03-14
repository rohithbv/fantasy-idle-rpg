import { GameStateManager } from './GameStateManager';
import { EventBus } from './EventBus';
import { GameEvents } from '../types/events';
import { BALANCE, enemyStats } from '../data/balancing';
import { getRandomEnemy, ENEMIES } from '../data/enemies';
import { EnemyDefinition } from '../models/Enemy';
import { EnemyType } from '../types/enums';

export interface DungeonEnemy {
  definition: EnemyDefinition;
  hp: number;
  maxHP: number;
  atk: number;
  def: number;
  goldReward: number;
  xpReward: number;
  isBoss: boolean;
}

export class DungeonSystem {
  generateEnemy(floor: number): DungeonEnemy {
    const isBoss = floor % BALANCE.BOSS_EVERY_N_FLOORS === 0;
    const def = getRandomEnemy(floor);
    const stats = enemyStats(def.baseHP, def.baseATK, def.baseDEF, floor);

    const bossMulti = isBoss ? BALANCE.BOSS_STAT_MULTIPLIER : 1;
    const rewardMulti = isBoss ? BALANCE.BOSS_REWARD_MULTIPLIER : 1;

    const hp = Math.floor(stats.hp * bossMulti);
    return {
      definition: def,
      hp,
      maxHP: hp,
      atk: Math.floor(stats.atk * bossMulti),
      def: Math.floor(stats.def * bossMulti),
      goldReward: Math.floor(def.goldReward * Math.pow(1.1, floor - 1) * rewardMulti),
      xpReward: Math.floor(def.xpReward * Math.pow(1.08, floor - 1) * rewardMulti),
      isBoss,
    };
  }

  onEnemyDefeated(enemy: DungeonEnemy): void {
    GameStateManager.addGold(enemy.goldReward, 'dungeon');

    // Give XP to party
    const party = GameStateManager.getPartyHeroes();
    const xpPerHero = Math.floor(enemy.xpReward / Math.max(1, party.length));
    party.forEach(h => GameStateManager.addHeroXP(h.id, xpPerHero));

    if (enemy.isBoss) {
      EventBus.emit(GameEvents.DUNGEON_BOSS_DEFEATED, GameStateManager.getDungeon().currentFloor);
    }

    GameStateManager.advanceFloor();
  }
}
