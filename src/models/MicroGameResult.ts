import { MicroGameType } from '../types/enums';

export interface MicroGameResult {
  type: MicroGameType;
  score: number;
  won: boolean;
  bonusGold: number;
  multiplier: number;
  multiplierDuration: number;
}
