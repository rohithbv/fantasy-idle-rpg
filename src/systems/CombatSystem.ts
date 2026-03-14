import { GameStateManager } from './GameStateManager';
import { EventBus } from './EventBus';
import { GameEvents } from '../types/events';
import { DungeonEnemy } from './DungeonSystem';
import { HeroState } from '../models/GameState';
import { getItemById } from '../data/items';
import { BALANCE } from '../data/balancing';

export interface CombatState {
  partyHP: Record<string, number>;
  partyMaxHP: Record<string, number>;
  enemy: DungeonEnemy;
  turnIndex: number;
  isOver: boolean;
  victory: boolean;
}

export class CombatSystem {
  initCombat(enemy: DungeonEnemy): CombatState {
    const party = GameStateManager.getPartyHeroes();
    const partyHP: Record<string, number> = {};
    const partyMaxHP: Record<string, number> = {};

    for (const hero of party) {
      const hp = this.getHeroMaxHP(hero);
      partyHP[hero.id] = hp;
      partyMaxHP[hero.id] = hp;
    }

    EventBus.emit(GameEvents.COMBAT_START);

    return {
      partyHP,
      partyMaxHP,
      enemy: { ...enemy },
      turnIndex: 0,
      isOver: false,
      victory: false,
    };
  }

  processTurn(state: CombatState): { damage: number; target: string; attacker: string } | null {
    if (state.isOver) return null;

    const party = GameStateManager.getPartyHeroes();
    const aliveHeroes = party.filter(h => (state.partyHP[h.id] ?? 0) > 0);

    if (aliveHeroes.length === 0) {
      state.isOver = true;
      state.victory = false;
      EventBus.emit(GameEvents.COMBAT_END, false);
      return null;
    }

    if (state.enemy.hp <= 0) {
      state.isOver = true;
      state.victory = true;
      EventBus.emit(GameEvents.COMBAT_END, true);
      return null;
    }

    const isHeroTurn = state.turnIndex % 2 === 0;
    state.turnIndex++;

    if (isHeroTurn) {
      // Hero attacks enemy
      const hero = aliveHeroes[state.turnIndex % aliveHeroes.length];
      const atk = this.getHeroATK(hero);
      const damage = Math.max(1, atk - Math.floor(state.enemy.def * 0.5));
      state.enemy.hp = Math.max(0, state.enemy.hp - damage);

      EventBus.emit(GameEvents.COMBAT_TURN, hero.id, 'enemy', damage);
      return { damage, target: 'enemy', attacker: hero.id };
    } else {
      // Enemy attacks random hero
      const target = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
      const heroDef = this.getHeroDEF(target);
      const damage = Math.max(1, state.enemy.atk - Math.floor(heroDef * 0.5));
      state.partyHP[target.id] = Math.max(0, (state.partyHP[target.id] ?? 0) - damage);

      EventBus.emit(GameEvents.COMBAT_TURN, 'enemy', target.id, damage);
      return { damage, target: target.id, attacker: 'enemy' };
    }
  }

  private getHeroMaxHP(hero: HeroState): number {
    let hp = hero.baseHP + hero.level * 10;
    hp += this.getEquipBonus(hero, 'hpBonus');
    return Math.floor(hp);
  }

  private getHeroATK(hero: HeroState): number {
    let atk = hero.baseATK + hero.level * 2;
    atk += this.getEquipBonus(hero, 'atkBonus');
    return Math.floor(atk);
  }

  private getHeroDEF(hero: HeroState): number {
    let def = hero.baseDEF + hero.level * 1;
    def += this.getEquipBonus(hero, 'defBonus');
    return Math.floor(def);
  }

  private getEquipBonus(hero: HeroState, stat: 'atkBonus' | 'defBonus' | 'hpBonus'): number {
    let bonus = 0;
    const slots = [hero.equippedWeapon, hero.equippedArmor, hero.equippedAccessory];
    for (const itemId of slots) {
      if (itemId) {
        const item = getItemById(itemId);
        if (item) bonus += item[stat];
      }
    }
    // Forge mastery bonus
    const forgeLevel = GameStateManager.getUpgradeLevel('forge_mastery');
    if (forgeLevel > 0) {
      bonus *= 1 + forgeLevel * 0.1;
    }
    return Math.floor(bonus);
  }
}
