export const GameEvents = {
  GOLD_CHANGED: 'gold:changed',
  GOLD_EARNED: 'gold:earned',
  GOLD_SPENT: 'gold:spent',

  CLICK: 'click:tap',
  CLICK_POWER_CHANGED: 'click:power_changed',
  COMBO_CHANGED: 'click:combo_changed',

  AUTO_RATE_CHANGED: 'auto:rate_changed',
  IDLE_TICK: 'idle:tick',
  OFFLINE_EARNINGS: 'offline:earnings',

  UPGRADE_PURCHASED: 'upgrade:purchased',
  UPGRADE_AVAILABLE: 'upgrade:available',

  HERO_LEVEL_UP: 'hero:level_up',
  HERO_RECRUITED: 'hero:recruited',
  HERO_EQUIPPED: 'hero:equipped',
  HERO_UNEQUIPPED: 'hero:unequipped',

  ITEM_ACQUIRED: 'item:acquired',
  ITEM_USED: 'item:used',

  DUNGEON_FLOOR_CLEARED: 'dungeon:floor_cleared',
  DUNGEON_BOSS_DEFEATED: 'dungeon:boss_defeated',
  COMBAT_START: 'combat:start',
  COMBAT_END: 'combat:end',
  COMBAT_TURN: 'combat:turn',
  COMBAT_DAMAGE: 'combat:damage',

  MICROGAME_START: 'microgame:start',
  MICROGAME_END: 'microgame:end',
  MICROGAME_REWARD: 'microgame:reward',
  MULTIPLIER_ACTIVE: 'multiplier:active',
  MULTIPLIER_EXPIRED: 'multiplier:expired',

  PRESTIGE: 'prestige:reset',
  PRESTIGE_UPGRADE: 'prestige:upgrade',
  SOUL_SHARDS_CHANGED: 'prestige:shards_changed',

  SAVE: 'save:complete',
  LOAD: 'load:complete',

  SCENE_TRANSITION: 'scene:transition',
  TOAST: 'ui:toast',
} as const;

export type GameEventKey = typeof GameEvents[keyof typeof GameEvents];
