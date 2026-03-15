export const BALANCE = {
  // Click
  BASE_CLICK_POWER: 1,
  CLICK_POWER_PER_LEVEL: 1,
  CLICK_UPGRADE_BASE_COST: 10,
  CLICK_UPGRADE_COST_SCALING: 1.15,

  // Auto / Idle
  AUTO_RATE_PER_LEVEL: 0.5, // gold/sec
  AUTO_UPGRADE_BASE_COST: 50,
  AUTO_UPGRADE_COST_SCALING: 1.18,

  // Idle engine
  IDLE_TICK_MS: 1000,
  SAVE_INTERVAL_MS: 30000,
  OFFLINE_EFFICIENCY: 0.5,
  OFFLINE_MAX_HOURS: 8,

  // Combo
  COMBO_WINDOW_MS: 500,
  COMBO_MAX: 10,
  COMBO_MULTIPLIER_PER_STACK: 0.1, // +10% per combo

  // Hero
  HERO_XP_BASE: 75,
  HERO_XP_EXPONENT: 1.3,
  HERO_LEVEL_HP_GROWTH: 1.1,
  HERO_LEVEL_ATK_GROWTH: 1.08,
  HERO_LEVEL_DEF_GROWTH: 1.06,

  // Dungeon
  ENEMY_HP_SCALING: 1.10,
  ENEMY_ATK_SCALING: 1.08,
  ENEMY_DEF_SCALING: 1.05,
  BOSS_STAT_MULTIPLIER: 2,
  BOSS_REWARD_MULTIPLIER: 10,
  BOSS_EVERY_N_FLOORS: 10,

  // Prestige
  PRESTIGE_MIN_FLOOR: 20,
  PRESTIGE_SHARD_FORMULA: 'sqrt(highestFloor) * log10(totalGoldThisRun)',

  // Micro-games
  MICROGAME_COOLDOWN_MS: 5 * 60 * 1000, // 5 min
  MICROGAME_DAILY_REWARD_MULTIPLIER: 2,
  MICROGAME_MULTIPLIER_DURATION_MS: 5 * 60 * 1000, // 5 min
  MICROGAME_BASE_MULTIPLIER: 1.5,
  MICROGAME_MAX_MULTIPLIER: 3.0,

  // Match-3
  MATCH3_GRID_COLS: 8,
  MATCH3_GRID_ROWS: 8,
  MATCH3_TIME_EASY: 120,
  MATCH3_TIME_HARD: 60,
  MATCH3_MIN_MATCH: 3,
  MATCH3_GEM_TYPES: 6,

  // Memory Match
  MEMORY_COLS_EASY: 4,
  MEMORY_ROWS_EASY: 3,
  MEMORY_COLS_HARD: 5,
  MEMORY_ROWS_HARD: 4,
  MEMORY_TIME_EASY: 120,
  MEMORY_TIME_HARD: 60,

  // Simon Says
  SIMON_BUTTONS: 4,
  SIMON_START_SEQUENCE: 3,
  SIMON_SPEED_BASE_MS: 800,
  SIMON_SPEED_MIN_MS: 200,
  SIMON_SPEED_DECREASE_MS: 50,

  // Equipment
  ENCHANT_BASE_COST: 500,
  ENCHANT_COST_SCALING: 2.5,
  ENCHANT_BONUS_PER_LEVEL: 0.1, // +10% stats per enchant level

  // Party
  BASE_PARTY_SLOTS: 3,
  MAX_PARTY_SLOTS: 5,
  PARTY_SLOT_PRESTIGE_COST: 50,
} as const;

export function upgradeCost(baseCost: number, scaling: number, level: number): number {
  return Math.floor(baseCost * Math.pow(scaling, level));
}

export function heroXpRequired(level: number): number {
  return Math.floor(BALANCE.HERO_XP_BASE * Math.pow(level, BALANCE.HERO_XP_EXPONENT));
}

export function calculateSoulShards(highestFloor: number, totalGoldThisRun: number): number {
  if (highestFloor < BALANCE.PRESTIGE_MIN_FLOOR || totalGoldThisRun <= 0) return 0;
  return Math.floor(Math.sqrt(highestFloor) * Math.log10(Math.max(1, totalGoldThisRun)));
}

export function enemyStats(baseHP: number, baseATK: number, baseDEF: number, floor: number) {
  const f = floor - 1;
  return {
    hp: Math.floor(baseHP * Math.pow(BALANCE.ENEMY_HP_SCALING, f)),
    atk: Math.floor(baseATK * Math.pow(BALANCE.ENEMY_ATK_SCALING, f)),
    def: Math.floor(baseDEF * Math.pow(BALANCE.ENEMY_DEF_SCALING, f)),
  };
}
