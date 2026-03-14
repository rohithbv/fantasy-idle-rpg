import { UpgradeCategory } from '../types/enums';

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  category: UpgradeCategory;
  baseCost: number;
  costScaling: number;
  maxLevel: number;
  effectPerLevel: number;
  prerequisite?: string;
  prerequisiteLevel?: number;
}
