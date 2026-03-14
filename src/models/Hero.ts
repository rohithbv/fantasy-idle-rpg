import { HeroClass } from '../types/enums';

export interface HeroDefinition {
  id: string;
  name: string;
  classType: HeroClass;
  description: string;
  baseHP: number;
  baseATK: number;
  baseDEF: number;
  hpGrowth: number;
  atkGrowth: number;
  defGrowth: number;
  recruitCost: number;
  startingLevel: number;
  unlockCondition: string | null;
  color: number;
}
