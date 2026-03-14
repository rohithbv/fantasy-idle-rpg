import { GameState, createDefaultGameState, HeroState, ItemState, MultiplierState } from '../models/GameState';
import { EventBus } from './EventBus';
import { GameEvents } from '../types/events';
import { HEROES } from '../data/heroes';
import { BALANCE, upgradeCost, heroXpRequired } from '../data/balancing';
import { getUpgradeById, UPGRADES } from '../data/upgrades';
import { PRESTIGE_UPGRADES } from '../data/prestigeRewards';

class GameStateManagerImpl {
  private state: GameState = createDefaultGameState();

  getState(): Readonly<GameState> {
    return this.state;
  }

  setState(state: GameState): void {
    this.state = state;
  }

  reset(): void {
    this.state = createDefaultGameState();
    this.initStartingHeroes();
    this.initUpgrades();
  }

  initStartingHeroes(): void {
    HEROES.forEach(h => {
      if (h.recruitCost === 0) {
        this.state.heroes[h.id] = {
          id: h.id,
          classType: h.classType,
          name: h.name,
          level: h.startingLevel,
          xp: 0,
          baseHP: h.baseHP,
          baseATK: h.baseATK,
          baseDEF: h.baseDEF,
          equippedWeapon: null,
          equippedArmor: null,
          equippedAccessory: null,
          recruited: true,
          inParty: true,
        };
      }
    });
  }

  initUpgrades(): void {
    UPGRADES.forEach(u => {
      if (!this.state.upgrades[u.id]) {
        this.state.upgrades[u.id] = { id: u.id, level: 0, maxLevel: u.maxLevel };
      }
    });
  }

  // Gold
  addGold(amount: number, source?: string): void {
    const multiplied = amount * this.getGoldMultiplier();
    this.state.gold += multiplied;
    this.state.totalGoldEarned += multiplied;
    this.state.totalGoldThisRun += multiplied;
    EventBus.emit(GameEvents.GOLD_EARNED, multiplied, source);
    EventBus.emit(GameEvents.GOLD_CHANGED, this.state.gold);
  }

  spendGold(amount: number): boolean {
    if (this.state.gold < amount) return false;
    this.state.gold -= amount;
    EventBus.emit(GameEvents.GOLD_SPENT, amount);
    EventBus.emit(GameEvents.GOLD_CHANGED, this.state.gold);
    return true;
  }

  getGold(): number {
    return this.state.gold;
  }

  // Click
  getClickPower(): number {
    const clickLevel = this.state.upgrades['click_power']?.level ?? 0;
    let power = BALANCE.BASE_CLICK_POWER + clickLevel * BALANCE.CLICK_POWER_PER_LEVEL;
    // Prestige click multiplier
    power *= this.getPrestigeMultiplier('clickMultiplier');
    return Math.floor(power);
  }

  registerClick(): void {
    this.state.totalClicks++;
    EventBus.emit(GameEvents.CLICK);
  }

  // Auto rate
  getAutoRate(): number {
    const autoLevel = this.state.upgrades['auto_click']?.level ?? 0;
    if (autoLevel === 0) return 0;
    let rate = autoLevel * BALANCE.AUTO_RATE_PER_LEVEL;
    rate *= this.getPrestigeMultiplier('autoMultiplier');
    return rate;
  }

  // Multipliers
  getGoldMultiplier(): number {
    let multi = 1;
    // Active temp multipliers
    const now = Date.now();
    this.state.activeMultipliers = this.state.activeMultipliers.filter(m => m.expiresAt > now);
    for (const m of this.state.activeMultipliers) {
      multi *= m.value;
    }
    // Prestige gold multiplier
    multi *= this.getPrestigeMultiplier('goldMultiplier');
    return multi;
  }

  addMultiplier(value: number, durationMs: number, source: string): void {
    this.state.activeMultipliers.push({
      value,
      expiresAt: Date.now() + durationMs,
      source,
    });
    EventBus.emit(GameEvents.MULTIPLIER_ACTIVE, value, durationMs, source);
  }

  getActiveMultipliers(): MultiplierState[] {
    const now = Date.now();
    this.state.activeMultipliers = this.state.activeMultipliers.filter(m => m.expiresAt > now);
    return this.state.activeMultipliers;
  }

  // Upgrades
  getUpgradeLevel(id: string): number {
    return this.state.upgrades[id]?.level ?? 0;
  }

  getUpgradeCost(id: string): number {
    const def = getUpgradeById(id);
    if (!def) return Infinity;
    const level = this.getUpgradeLevel(id);
    return upgradeCost(def.baseCost, def.costScaling, level);
  }

  canPurchaseUpgrade(id: string): boolean {
    const def = getUpgradeById(id);
    if (!def) return false;
    const state = this.state.upgrades[id];
    if (!state || state.level >= state.maxLevel) return false;
    if (def.prerequisite) {
      const prereqLevel = this.getUpgradeLevel(def.prerequisite);
      if (prereqLevel < (def.prerequisiteLevel ?? 1)) return false;
    }
    return this.state.gold >= this.getUpgradeCost(id);
  }

  purchaseUpgrade(id: string): boolean {
    if (!this.canPurchaseUpgrade(id)) return false;
    const cost = this.getUpgradeCost(id);
    this.spendGold(cost);
    this.state.upgrades[id].level++;
    EventBus.emit(GameEvents.UPGRADE_PURCHASED, id, this.state.upgrades[id].level);
    return true;
  }

  // Heroes
  getHero(id: string): HeroState | undefined {
    return this.state.heroes[id];
  }

  getPartyHeroes(): HeroState[] {
    return Object.values(this.state.heroes).filter(h => h.recruited && h.inParty);
  }

  addHeroXP(heroId: string, xp: number): void {
    const hero = this.state.heroes[heroId];
    if (!hero) return;
    hero.xp += xp * this.getPrestigeMultiplier('xpMultiplier');
    while (hero.xp >= heroXpRequired(hero.level)) {
      hero.xp -= heroXpRequired(hero.level);
      hero.level++;
      EventBus.emit(GameEvents.HERO_LEVEL_UP, heroId, hero.level);
    }
  }

  recruitHero(heroId: string, cost: number): boolean {
    if (!this.spendGold(cost)) return false;
    const def = HEROES.find(h => h.id === heroId);
    if (!def) return false;
    this.state.heroes[heroId] = {
      id: heroId,
      classType: def.classType,
      name: def.name,
      level: def.startingLevel,
      xp: 0,
      baseHP: def.baseHP,
      baseATK: def.baseATK,
      baseDEF: def.baseDEF,
      equippedWeapon: null,
      equippedArmor: null,
      equippedAccessory: null,
      recruited: true,
      inParty: this.getPartyHeroes().length < this.state.partySlots,
    };
    EventBus.emit(GameEvents.HERO_RECRUITED, heroId);
    return true;
  }

  // Items
  getItem(id: string): ItemState | undefined {
    return this.state.items[id];
  }

  buyItem(id: string, cost: number): boolean {
    if (this.state.items[id]?.owned) return false;
    if (!this.spendGold(cost)) return false;
    this.state.items[id] = { id, owned: true, equipped: false, equippedBy: null, enchantLevel: 0 };
    EventBus.emit(GameEvents.ITEM_ACQUIRED, id);
    return true;
  }

  equipItem(itemId: string, heroId: string, slot: 'equippedWeapon' | 'equippedArmor' | 'equippedAccessory'): boolean {
    const item = this.state.items[itemId];
    const hero = this.state.heroes[heroId];
    if (!item?.owned || !hero) return false;

    // Unequip from previous holder
    if (item.equippedBy) {
      const prevHero = this.state.heroes[item.equippedBy];
      if (prevHero) {
        if (prevHero.equippedWeapon === itemId) prevHero.equippedWeapon = null;
        if (prevHero.equippedArmor === itemId) prevHero.equippedArmor = null;
        if (prevHero.equippedAccessory === itemId) prevHero.equippedAccessory = null;
      }
    }

    // Unequip current in that slot
    const currentInSlot = hero[slot];
    if (currentInSlot && this.state.items[currentInSlot]) {
      this.state.items[currentInSlot].equipped = false;
      this.state.items[currentInSlot].equippedBy = null;
    }

    hero[slot] = itemId;
    item.equipped = true;
    item.equippedBy = heroId;
    EventBus.emit(GameEvents.HERO_EQUIPPED, heroId, itemId);
    return true;
  }

  // Dungeon
  getDungeon() {
    return this.state.dungeon;
  }

  advanceFloor(): void {
    this.state.dungeon.currentFloor++;
    if (this.state.dungeon.currentFloor > this.state.dungeon.highestFloor) {
      this.state.dungeon.highestFloor = this.state.dungeon.currentFloor;
    }
    EventBus.emit(GameEvents.DUNGEON_FLOOR_CLEARED, this.state.dungeon.currentFloor);
  }

  // Prestige
  getPrestigeState() {
    return this.state.prestige;
  }

  getPrestigeMultiplier(effect: string): number {
    let total = 1;
    for (const upgrade of PRESTIGE_UPGRADES) {
      if (upgrade.effect === effect && this.state.prestige.purchasedUpgrades.includes(upgrade.id)) {
        const count = this.state.prestige.purchasedUpgrades.filter((id: string) => id === upgrade.id).length;
        total += upgrade.effectPerLevel * count;
      }
    }
    return total;
  }

  // Micro-games
  getMicroGameState() {
    return this.state.microGames;
  }

  setLastPlayedTime(gameType: string): void {
    this.state.microGames.lastPlayedTime[gameType] = Date.now();
  }

  // Save/Load timestamps
  updateLastOnlineTime(): void {
    this.state.lastOnlineTime = Date.now();
  }

  updateLastSaveTime(): void {
    this.state.lastSaveTime = Date.now();
  }

  // Prestige reset
  performPrestige(shardsEarned: number): void {
    const preserved = {
      heroes: { ...this.state.heroes },
      items: { ...this.state.items },
      prestige: { ...this.state.prestige },
      microGames: { ...this.state.microGames },
      settings: { ...this.state.settings },
      partySlots: this.state.partySlots,
      createdAt: this.state.createdAt,
      totalPlayTime: this.state.totalPlayTime,
    };

    // Reset heroes to level 1 but keep recruited status
    for (const id in preserved.heroes) {
      const h = preserved.heroes[id];
      const def = HEROES.find(hd => hd.id === id);
      if (h.recruited && def) {
        h.level = def.startingLevel;
        h.xp = 0;
      }
    }

    this.state = createDefaultGameState();
    this.state.heroes = preserved.heroes;
    this.state.items = preserved.items;
    this.state.prestige = preserved.prestige;
    this.state.microGames = preserved.microGames;
    this.state.settings = preserved.settings;
    this.state.partySlots = preserved.partySlots;
    this.state.createdAt = preserved.createdAt;
    this.state.totalPlayTime = preserved.totalPlayTime;

    this.state.prestige.soulShards += shardsEarned;
    this.state.prestige.totalSoulShardsEarned += shardsEarned;
    this.state.prestige.totalPrestiges++;

    // Apply starting gold prestige bonus
    const startingGoldBonus = this.getPrestigeMultiplier('startingGold');
    if (startingGoldBonus > 1) {
      this.state.gold = (startingGoldBonus - 1) * 100;
    }

    this.initUpgrades();
    EventBus.emit(GameEvents.PRESTIGE, shardsEarned);
  }
}

export const GameStateManager = new GameStateManagerImpl();
