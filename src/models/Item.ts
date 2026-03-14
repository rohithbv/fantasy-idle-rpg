import { ItemSlotType, ItemRarity } from '../types/enums';

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  slot: ItemSlotType;
  rarity: ItemRarity;
  cost: number;
  atkBonus: number;
  defBonus: number;
  hpBonus: number;
  specialEffect?: string;
  unlockCondition?: string;
}
