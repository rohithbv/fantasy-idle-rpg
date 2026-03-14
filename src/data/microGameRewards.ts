import { MicroGameType } from '../types/enums';
import { BALANCE } from './balancing';

export interface MicroGameRewardTier {
  minScore: number;
  bonusGold: number;
  multiplier: number;
  multiplierDuration: number;
}

export const MICROGAME_REWARDS: Record<MicroGameType, MicroGameRewardTier[]> = {
  [MicroGameType.Match3]: [
    { minScore: 0, bonusGold: 50, multiplier: 1.5, multiplierDuration: BALANCE.MICROGAME_MULTIPLIER_DURATION_MS },
    { minScore: 500, bonusGold: 150, multiplier: 2.0, multiplierDuration: BALANCE.MICROGAME_MULTIPLIER_DURATION_MS },
    { minScore: 1500, bonusGold: 500, multiplier: 3.0, multiplierDuration: BALANCE.MICROGAME_MULTIPLIER_DURATION_MS },
  ],
  [MicroGameType.MemoryMatch]: [
    { minScore: 0, bonusGold: 50, multiplier: 1.5, multiplierDuration: BALANCE.MICROGAME_MULTIPLIER_DURATION_MS },
    { minScore: 300, bonusGold: 150, multiplier: 2.0, multiplierDuration: BALANCE.MICROGAME_MULTIPLIER_DURATION_MS },
    { minScore: 800, bonusGold: 500, multiplier: 3.0, multiplierDuration: BALANCE.MICROGAME_MULTIPLIER_DURATION_MS },
  ],
  [MicroGameType.SimonSays]: [
    { minScore: 0, bonusGold: 50, multiplier: 1.5, multiplierDuration: BALANCE.MICROGAME_MULTIPLIER_DURATION_MS },
    { minScore: 5, bonusGold: 150, multiplier: 2.0, multiplierDuration: BALANCE.MICROGAME_MULTIPLIER_DURATION_MS },
    { minScore: 12, bonusGold: 500, multiplier: 3.0, multiplierDuration: BALANCE.MICROGAME_MULTIPLIER_DURATION_MS },
  ],
};
