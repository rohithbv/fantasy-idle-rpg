export interface PrestigeUpgradeDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  maxLevel: number;
  costScaling: number;
  effect: string;
  effectPerLevel: number;
}

export const PRESTIGE_UPGRADES: PrestigeUpgradeDefinition[] = [
  { id: 'starting_gold', name: 'Head Start', description: 'Start with bonus gold after prestige.', cost: 5, maxLevel: 10, costScaling: 1.5, effect: 'startingGold', effectPerLevel: 100 },
  { id: 'click_multi', name: 'Soul Click', description: 'Permanent click power multiplier.', cost: 10, maxLevel: 5, costScaling: 2.0, effect: 'clickMultiplier', effectPerLevel: 0.25 },
  { id: 'auto_multi', name: 'Soul Flow', description: 'Permanent auto income multiplier.', cost: 10, maxLevel: 5, costScaling: 2.0, effect: 'autoMultiplier', effectPerLevel: 0.25 },
  { id: 'xp_multi', name: 'Soul Wisdom', description: 'Heroes gain more XP.', cost: 15, maxLevel: 5, costScaling: 2.0, effect: 'xpMultiplier', effectPerLevel: 0.2 },
  { id: 'party_slot', name: 'Soul Bond', description: 'Unlock additional party slot.', cost: 50, maxLevel: 2, costScaling: 3.0, effect: 'partySlot', effectPerLevel: 1 },
  { id: 'offline_extend', name: 'Soul Rest', description: 'Extend offline cap by 2 hours.', cost: 20, maxLevel: 4, costScaling: 2.0, effect: 'offlineCap', effectPerLevel: 2 },
  { id: 'gold_multi', name: 'Soul Fortune', description: 'All gold earned +10%.', cost: 25, maxLevel: 10, costScaling: 1.8, effect: 'goldMultiplier', effectPerLevel: 0.1 },
];
