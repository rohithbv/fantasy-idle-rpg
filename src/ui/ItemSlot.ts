import Phaser from 'phaser';
import { ItemDefinition } from '../models/Item';
import { ItemRarity } from '../types/enums';

const RARITY_COLORS: Record<ItemRarity, number> = {
  [ItemRarity.Common]: 0x888888,
  [ItemRarity.Uncommon]: 0x44aa44,
  [ItemRarity.Rare]: 0x4488ff,
  [ItemRarity.Epic]: 0xaa44ff,
  [ItemRarity.Legendary]: 0xff8800,
};

export class ItemSlot extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    item: ItemDefinition | null,
    onClick?: () => void
  ) {
    super(scene, x, y);
    const size = 48;
    const borderColor = item ? RARITY_COLORS[item.rarity] : 0x333355;

    const bg = scene.add.rectangle(0, 0, size, size, 0x1a1a3e)
      .setStrokeStyle(2, borderColor);
    this.add(bg);

    if (item) {
      const initial = scene.add.text(0, 0, item.name.charAt(0), {
        fontSize: '20px', color: '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.add(initial);
    }

    if (onClick) {
      this.setSize(size, size);
      this.setInteractive({ useHandCursor: true }).on('pointerdown', onClick);
    }

    scene.add.existing(this);
  }
}
