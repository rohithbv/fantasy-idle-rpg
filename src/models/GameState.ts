import { HeroClass, MicroGameType } from '../types/enums';

export interface HeroState {
  id: string;
  classType: HeroClass;
  name: string;
  level: number;
  xp: number;
  baseHP: number;
  baseATK: number;
  baseDEF: number;
  equippedWeapon: string | null;
  equippedArmor: string | null;
  equippedAccessory: string | null;
  recruited: boolean;
  inParty: boolean;
}

export interface ItemState {
  id: string;
  owned: boolean;
  equipped: boolean;
  equippedBy: string | null;
  enchantLevel: number;
}

export interface UpgradeState {
  id: string;
  level: number;
  maxLevel: number;
}

export interface DungeonState {
  currentFloor: number;
  highestFloor: number;
  inBattle: boolean;
  autoBattle: boolean;
  currentEnemyHP: number;
  currentEnemyMaxHP: number;
}

export interface PrestigeState {
  totalPrestiges: number;
  soulShards: number;
  totalSoulShardsEarned: number;
  purchasedUpgrades: string[];
}

export interface MicroGameState {
  lastPlayedTime: Record<string, number>;
  highScores: Record<string, number>;
  totalPlays: Record<string, number>;
  dailyFeatured: MicroGameType;
  dailyFeaturedDate: string;
}

export interface MultiplierState {
  value: number;
  expiresAt: number;
  source: string;
}

export interface GameState {
  gold: number;
  totalGoldEarned: number;
  totalGoldThisRun: number;
  totalClicks: number;

  clickLevel: number;
  autoLevel: number;

  heroes: Record<string, HeroState>;
  items: Record<string, ItemState>;
  upgrades: Record<string, UpgradeState>;

  dungeon: DungeonState;
  prestige: PrestigeState;
  microGames: MicroGameState;

  activeMultipliers: MultiplierState[];
  partySlots: number;

  lastSaveTime: number;
  lastOnlineTime: number;
  totalPlayTime: number;
  createdAt: number;

  settings: {
    musicVolume: number;
    sfxVolume: number;
    musicMuted: boolean;
    sfxMuted: boolean;
  };
}

export function createDefaultGameState(): GameState {
  return {
    gold: 0,
    totalGoldEarned: 0,
    totalGoldThisRun: 0,
    totalClicks: 0,

    clickLevel: 1,
    autoLevel: 0,

    heroes: {},
    items: {},
    upgrades: {},

    dungeon: {
      currentFloor: 1,
      highestFloor: 0,
      inBattle: false,
      autoBattle: false,
      currentEnemyHP: 0,
      currentEnemyMaxHP: 0,
    },

    prestige: {
      totalPrestiges: 0,
      soulShards: 0,
      totalSoulShardsEarned: 0,
      purchasedUpgrades: [],
    },

    microGames: {
      lastPlayedTime: {},
      highScores: {},
      totalPlays: {},
      dailyFeatured: MicroGameType.Match3,
      dailyFeaturedDate: '',
    },

    activeMultipliers: [],
    partySlots: 3,

    lastSaveTime: Date.now(),
    lastOnlineTime: Date.now(),
    totalPlayTime: 0,
    createdAt: Date.now(),

    settings: {
      musicVolume: 0.5,
      sfxVolume: 0.7,
      musicMuted: false,
      sfxMuted: false,
    },
  };
}
