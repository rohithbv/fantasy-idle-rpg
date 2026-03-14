import { ItemSlotType, ItemRarity } from '../types/enums';
import { ItemDefinition } from '../models/Item';

export const ITEMS: ItemDefinition[] = [
  // Weapons
  { id: 'rusty_sword', name: 'Rusty Sword', description: 'A worn but serviceable blade.', slot: ItemSlotType.Weapon, rarity: ItemRarity.Common, cost: 100, atkBonus: 5, defBonus: 0, hpBonus: 0 },
  { id: 'iron_sword', name: 'Iron Sword', description: 'A reliable iron sword.', slot: ItemSlotType.Weapon, rarity: ItemRarity.Common, cost: 500, atkBonus: 12, defBonus: 0, hpBonus: 0 },
  { id: 'flame_blade', name: 'Flame Blade', description: 'A sword wreathed in fire.', slot: ItemSlotType.Weapon, rarity: ItemRarity.Rare, cost: 2500, atkBonus: 25, defBonus: 0, hpBonus: 0, specialEffect: '+10% ATK' },
  { id: 'staff_wisdom', name: 'Staff of Wisdom', description: 'Channels arcane energy.', slot: ItemSlotType.Weapon, rarity: ItemRarity.Uncommon, cost: 800, atkBonus: 18, defBonus: 0, hpBonus: 10 },
  { id: 'shadow_dagger', name: 'Shadow Dagger', description: 'Strikes from the shadows.', slot: ItemSlotType.Weapon, rarity: ItemRarity.Rare, cost: 3000, atkBonus: 30, defBonus: 0, hpBonus: 0, specialEffect: '+15% crit' },
  { id: 'excalibur', name: 'Excalibur', description: 'A legendary blade of kings.', slot: ItemSlotType.Weapon, rarity: ItemRarity.Legendary, cost: 50000, atkBonus: 80, defBonus: 10, hpBonus: 50, unlockCondition: 'prestige5' },

  // Armor
  { id: 'leather_armor', name: 'Leather Armor', description: 'Basic protection.', slot: ItemSlotType.Armor, rarity: ItemRarity.Common, cost: 150, atkBonus: 0, defBonus: 5, hpBonus: 10 },
  { id: 'chain_mail', name: 'Chain Mail', description: 'Linked metal rings.', slot: ItemSlotType.Armor, rarity: ItemRarity.Uncommon, cost: 700, atkBonus: 0, defBonus: 12, hpBonus: 25 },
  { id: 'plate_armor', name: 'Plate Armor', description: 'Heavy but extremely protective.', slot: ItemSlotType.Armor, rarity: ItemRarity.Rare, cost: 3500, atkBonus: 0, defBonus: 30, hpBonus: 50 },
  { id: 'dragon_scale', name: 'Dragon Scale Mail', description: 'Forged from dragon scales.', slot: ItemSlotType.Armor, rarity: ItemRarity.Epic, cost: 15000, atkBonus: 5, defBonus: 50, hpBonus: 100, specialEffect: 'Fire resist' },

  // Accessories
  { id: 'copper_ring', name: 'Copper Ring', description: 'A simple ring.', slot: ItemSlotType.Accessory, rarity: ItemRarity.Common, cost: 80, atkBonus: 2, defBonus: 2, hpBonus: 5 },
  { id: 'ruby_amulet', name: 'Ruby Amulet', description: 'Glows with inner fire.', slot: ItemSlotType.Accessory, rarity: ItemRarity.Uncommon, cost: 600, atkBonus: 8, defBonus: 3, hpBonus: 15 },
  { id: 'shield_charm', name: 'Shield Charm', description: 'A protective trinket.', slot: ItemSlotType.Accessory, rarity: ItemRarity.Rare, cost: 2000, atkBonus: 0, defBonus: 20, hpBonus: 40 },
  { id: 'gold_compass', name: 'Gold Compass', description: 'Increases gold find.', slot: ItemSlotType.Accessory, rarity: ItemRarity.Rare, cost: 4000, atkBonus: 5, defBonus: 5, hpBonus: 20, specialEffect: '+25% gold' },
  { id: 'crown_ages', name: 'Crown of Ages', description: 'An ancient crown of immense power.', slot: ItemSlotType.Accessory, rarity: ItemRarity.Legendary, cost: 75000, atkBonus: 30, defBonus: 30, hpBonus: 200, unlockCondition: 'prestige5' },
];

export function getItemById(id: string): ItemDefinition | undefined {
  return ITEMS.find(i => i.id === id);
}
