import { EnemyType } from '../types/enums';
import { EnemyDefinition } from '../models/Enemy';

export const ENEMIES: EnemyDefinition[] = [
  { id: 'slime', name: 'Slime', type: EnemyType.Normal, baseHP: 20, baseATK: 3, baseDEF: 1, goldReward: 5, xpReward: 20, color: 0x44dd44 },
  { id: 'goblin', name: 'Goblin', type: EnemyType.Normal, baseHP: 30, baseATK: 5, baseDEF: 2, goldReward: 8, xpReward: 30, color: 0x88aa33 },
  { id: 'skeleton', name: 'Skeleton', type: EnemyType.Normal, baseHP: 40, baseATK: 7, baseDEF: 3, goldReward: 12, xpReward: 40, color: 0xcccccc },
  { id: 'orc', name: 'Orc', type: EnemyType.Normal, baseHP: 60, baseATK: 10, baseDEF: 5, goldReward: 20, xpReward: 60, color: 0x669933 },
  { id: 'dark_mage', name: 'Dark Mage', type: EnemyType.Normal, baseHP: 35, baseATK: 15, baseDEF: 2, goldReward: 25, xpReward: 70, color: 0x6633aa },
  { id: 'golem', name: 'Stone Golem', type: EnemyType.Elite, baseHP: 100, baseATK: 8, baseDEF: 15, goldReward: 40, xpReward: 100, color: 0x888888 },
  { id: 'vampire', name: 'Vampire', type: EnemyType.Elite, baseHP: 70, baseATK: 18, baseDEF: 8, goldReward: 50, xpReward: 120, color: 0x990033 },
  { id: 'wyrm', name: 'Wyrm', type: EnemyType.Elite, baseHP: 120, baseATK: 14, baseDEF: 12, goldReward: 60, xpReward: 140, color: 0xcc6600 },
  { id: 'dragon', name: 'Dragon Lord', type: EnemyType.Boss, baseHP: 200, baseATK: 25, baseDEF: 20, goldReward: 200, xpReward: 300, color: 0xff3300 },
  { id: 'lich', name: 'Lich King', type: EnemyType.Boss, baseHP: 150, baseATK: 35, baseDEF: 15, goldReward: 250, xpReward: 350, color: 0x330066 },
];

export function getRandomEnemy(floor: number): EnemyDefinition {
  const isBossFloor = floor % 10 === 0;
  if (isBossFloor) {
    const bosses = ENEMIES.filter(e => e.type === EnemyType.Boss);
    return bosses[floor % bosses.length];
  }
  const normals = ENEMIES.filter(e => e.type !== EnemyType.Boss);
  const idx = Math.floor(Math.random() * normals.length);
  return normals[idx];
}
