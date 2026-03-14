import { UpgradeCategory } from '../types/enums';
import { UpgradeDefinition } from '../models/Upgrade';

export const UPGRADES: UpgradeDefinition[] = [
  // Click upgrades
  {
    id: 'click_power',
    name: 'Click Power',
    description: 'Increase gold per click by 1.',
    category: UpgradeCategory.Click,
    baseCost: 10,
    costScaling: 1.15,
    maxLevel: 999,
    effectPerLevel: 1,
  },
  {
    id: 'click_crit',
    name: 'Critical Click',
    description: '5% chance for 3x click gold per level.',
    category: UpgradeCategory.Click,
    baseCost: 500,
    costScaling: 1.5,
    maxLevel: 10,
    effectPerLevel: 0.05,
    prerequisite: 'click_power',
    prerequisiteLevel: 10,
  },
  {
    id: 'click_combo',
    name: 'Combo Master',
    description: 'Increase max combo by 5 per level.',
    category: UpgradeCategory.Click,
    baseCost: 1000,
    costScaling: 1.8,
    maxLevel: 5,
    effectPerLevel: 5,
    prerequisite: 'click_power',
    prerequisiteLevel: 20,
  },

  // Auto upgrades
  {
    id: 'auto_click',
    name: 'Auto Clicker',
    description: 'Generate 0.5 gold/sec per level.',
    category: UpgradeCategory.Auto,
    baseCost: 50,
    costScaling: 1.18,
    maxLevel: 999,
    effectPerLevel: 0.5,
  },
  {
    id: 'auto_speed',
    name: 'Faster Ticks',
    description: 'Auto clicker ticks 10% faster per level.',
    category: UpgradeCategory.Auto,
    baseCost: 2000,
    costScaling: 2.0,
    maxLevel: 5,
    effectPerLevel: 0.1,
    prerequisite: 'auto_click',
    prerequisiteLevel: 10,
  },
  {
    id: 'offline_boost',
    name: 'Offline Boost',
    description: 'Increase offline efficiency by 5% per level.',
    category: UpgradeCategory.Auto,
    baseCost: 5000,
    costScaling: 2.5,
    maxLevel: 10,
    effectPerLevel: 0.05,
    prerequisite: 'auto_click',
    prerequisiteLevel: 5,
  },

  // Hero upgrades
  {
    id: 'hero_xp_boost',
    name: 'Training Grounds',
    description: 'Heroes gain 10% more XP per level.',
    category: UpgradeCategory.Hero,
    baseCost: 3000,
    costScaling: 2.0,
    maxLevel: 10,
    effectPerLevel: 0.1,
  },

  // Equipment upgrades
  {
    id: 'forge_mastery',
    name: 'Forge Mastery',
    description: 'Equipment bonuses +10% per level.',
    category: UpgradeCategory.Equipment,
    baseCost: 5000,
    costScaling: 2.0,
    maxLevel: 10,
    effectPerLevel: 0.1,
  },
];

export function getUpgradeById(id: string): UpgradeDefinition | undefined {
  return UPGRADES.find(u => u.id === id);
}
