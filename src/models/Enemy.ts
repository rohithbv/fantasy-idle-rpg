import { EnemyType } from '../types/enums';

export interface EnemyDefinition {
  id: string;
  name: string;
  type: EnemyType;
  baseHP: number;
  baseATK: number;
  baseDEF: number;
  goldReward: number;
  xpReward: number;
  color: number;
}
