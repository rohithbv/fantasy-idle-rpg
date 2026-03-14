import Phaser from 'phaser';
import { SceneKey, UpgradeCategory, ItemRarity } from '../types/enums';
import { GameStateManager } from '../systems/GameStateManager';
import { Button } from '../ui/Button';
import { UPGRADES } from '../data/upgrades';
import { ITEMS, getItemById } from '../data/items';
import { formatGold } from '../utils/FormatNumber';
import { HUD_HEIGHT } from '../ui/HUD';

const TOP = HUD_HEIGHT + 4;

interface ShopEntry {
  yOffset: number;
  buyBg: Phaser.GameObjects.Rectangle;
  buyLabel: Phaser.GameObjects.Text;
  costText: Phaser.GameObjects.Text;
  levelText: Phaser.GameObjects.Text;
  id: string;
  type: 'upgrade' | 'item';
}

export class ShopScene extends Phaser.Scene {
  private entries: ShopEntry[] = [];
  private scrollY: number = 0;
  private contentContainer!: Phaser.GameObjects.Container;
  private activeTab: string = 'click';
  private tabButtons: Button[] = [];
  private maxScroll: number = 0;
  private contentTop: number = 0;
  private contentBottom: number = 0;

  constructor() {
    super({ key: SceneKey.Shop });
  }

  create(): void {
    const cx = this.scale.width / 2;
    const w = this.scale.width;
    const h = this.scale.height;

    // Full opaque background
    this.add.rectangle(cx, h / 2, w, h, 0x0f1123);

    // Title
    const titleY = TOP + 16;
    this.add.text(cx, titleY, 'SHOP', {
      fontSize: '20px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Close button
    new Button(this, w - 30, titleY, 40, 28, 'X', () => {
      this.scene.stop();
    }, { fontSize: 14, bgColor: 0x883333 });

    // Sub-tab buttons
    const tabsY = titleY + 28;
    const tabs = [
      { key: 'click', label: 'Click' },
      { key: 'auto', label: 'Auto' },
      { key: 'equip', label: 'Equip' },
      { key: 'potion', label: 'Potions' },
    ];
    const tabW = (w - 20) / tabs.length;
    tabs.forEach((tab, i) => {
      const btn = new Button(this, 10 + tabW * i + tabW / 2, tabsY, tabW - 4, 28, tab.label, () => {
        this.switchTab(tab.key);
      }, { fontSize: 11, bgColor: 0x3a3a6a });
      this.tabButtons.push(btn);
    });

    this.contentTop = tabsY + 20;
    this.contentBottom = h - 50;

    // Content container (scrollable)
    this.contentContainer = this.add.container(0, 0);

    // Mask for scrollable area
    const maskShape = this.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, this.contentTop, w, this.contentBottom - this.contentTop);
    this.contentContainer.setMask(maskShape.createGeometryMask());

    // Drag scrolling
    let dragStartY = 0;
    let startScrollY = 0;
    let dragging = false;
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > this.contentTop && pointer.y < this.contentBottom) {
        dragStartY = pointer.y;
        startScrollY = this.scrollY;
        dragging = true;
      }
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (dragging && pointer.isDown) {
        const dy = dragStartY - pointer.y;
        this.scrollY = Phaser.Math.Clamp(startScrollY + dy, 0, this.maxScroll);
        this.contentContainer.y = -this.scrollY;
      }
    });
    this.input.on('pointerup', () => { dragging = false; });

    this.switchTab('click');

    // Gold display at bottom
    this.add.rectangle(cx, h - 28, w, 40, 0x0f1123).setDepth(500);
    this.add.rectangle(cx, h - 28, w - 16, 30, 0x16213e, 0.9)
      .setStrokeStyle(1, 0x4a4a8a).setDepth(500);
    const goldLabel = this.add.text(cx, h - 28, '', {
      fontSize: '14px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(501);

    this.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        goldLabel.setText(`Gold: ${formatGold(GameStateManager.getGold())}`);
        this.updateEntries();
      },
    });
  }

  private switchTab(tabKey: string): void {
    this.activeTab = tabKey;
    this.scrollY = 0;
    this.entries = [];
    this.contentContainer.removeAll(true);
    this.contentContainer.y = 0;

    const tabKeys = ['click', 'auto', 'equip', 'potion'];
    this.tabButtons.forEach((btn, i) => {
      btn.setAlpha(tabKeys[i] === tabKey ? 1 : 0.6);
    });

    switch (tabKey) {
      case 'click':
        this.buildUpgradeList(UpgradeCategory.Click);
        break;
      case 'auto':
        this.buildUpgradeList(UpgradeCategory.Auto);
        break;
      case 'equip':
        this.buildEquipmentList();
        break;
      case 'potion':
        this.buildPotionList();
        break;
    }
  }

  private buildUpgradeList(category: UpgradeCategory): void {
    const upgrades = UPGRADES.filter(u => u.category === category);
    const w = this.scale.width;
    const cardH = 80;
    const gap = 8;
    let yOff = this.contentTop + 6;

    for (const upg of upgrades) {
      const container = this.add.container(0, yOff);
      this.contentContainer.add(container);

      // Card background
      const bg = this.add.rectangle(w / 2, cardH / 2, w - 16, cardH, 0x16213e, 0.9)
        .setStrokeStyle(1, 0x4a4a8a);
      container.add(bg);

      // Name (top-left)
      container.add(this.add.text(14, 8, upg.name, {
        fontSize: '13px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }));

      // Description
      container.add(this.add.text(14, 26, upg.description, {
        fontSize: '10px', color: '#aaaaaa', fontFamily: 'monospace',
        wordWrap: { width: w - 120 },
      }));

      // Level (bottom-left)
      const level = GameStateManager.getUpgradeLevel(upg.id);
      const levelText = this.add.text(14, 50, `Lv ${level}/${upg.maxLevel}`, {
        fontSize: '10px', color: '#88aa88', fontFamily: 'monospace',
      });
      container.add(levelText);

      // Cost (below level, left side)
      const cost = GameStateManager.getUpgradeCost(upg.id);
      const costText = this.add.text(14, 63, `Cost: ${formatGold(cost)}`, {
        fontSize: '10px', color: '#ffdd44', fontFamily: 'monospace',
      });
      container.add(costText);

      // Buy button - embedded in container as rect + text
      const canBuy = GameStateManager.canPurchaseUpgrade(upg.id);
      const btnX = w - 50;
      const btnY = cardH / 2;
      const buyBg = this.add.rectangle(btnX, btnY, 60, 32, canBuy ? 0x44aa44 : 0x333355)
        .setStrokeStyle(1, 0xffffff, 0.2)
        .setInteractive({ useHandCursor: true });
      container.add(buyBg);

      const buyLabel = this.add.text(btnX, btnY, 'Buy', {
        fontSize: '12px', color: canBuy ? '#ffffff' : '#666666', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(buyLabel);

      const upgId = upg.id;
      buyBg.on('pointerdown', () => {
        if (GameStateManager.canPurchaseUpgrade(upgId)) {
          GameStateManager.purchaseUpgrade(upgId);
          this.switchTab(this.activeTab);
        }
      });
      buyBg.on('pointerover', () => { if (GameStateManager.canPurchaseUpgrade(upgId)) buyBg.setFillStyle(0x55bb55); });
      buyBg.on('pointerout', () => { buyBg.setFillStyle(GameStateManager.canPurchaseUpgrade(upgId) ? 0x44aa44 : 0x333355); });

      this.entries.push({ yOffset: yOff, buyBg, buyLabel, costText, levelText, id: upg.id, type: 'upgrade' });
      yOff += cardH + gap;
    }

    this.maxScroll = Math.max(0, yOff - this.contentBottom);
  }

  private buildEquipmentList(): void {
    const w = this.scale.width;
    const cardH = 90;
    const gap = 8;
    let yOff = this.contentTop + 6;

    const rarityColors: Record<string, string> = {
      [ItemRarity.Common]: '#aaaaaa',
      [ItemRarity.Uncommon]: '#44cc44',
      [ItemRarity.Rare]: '#4488ff',
      [ItemRarity.Epic]: '#aa44ff',
      [ItemRarity.Legendary]: '#ffaa44',
    };

    for (const item of ITEMS) {
      const container = this.add.container(0, yOff);
      this.contentContainer.add(container);

      const owned = GameStateManager.getItem(item.id)?.owned ?? false;
      const color = rarityColors[item.rarity] ?? '#aaaaaa';

      const bg = this.add.rectangle(w / 2, cardH / 2, w - 16, cardH, 0x16213e, 0.9)
        .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(color).color);
      container.add(bg);

      // Rarity badge
      container.add(this.add.text(14, 6, `[${item.rarity}]`, {
        fontSize: '9px', color, fontFamily: 'monospace',
      }));

      // Name
      container.add(this.add.text(14, 18, item.name, {
        fontSize: '12px', color, fontFamily: 'monospace', fontStyle: 'bold',
      }));

      // Description
      container.add(this.add.text(14, 34, item.description, {
        fontSize: '9px', color: '#999999', fontFamily: 'monospace',
        wordWrap: { width: w - 120 },
      }));

      // Stats
      const stats: string[] = [];
      if (item.atkBonus > 0) stats.push(`ATK+${item.atkBonus}`);
      if (item.defBonus > 0) stats.push(`DEF+${item.defBonus}`);
      if (item.hpBonus > 0) stats.push(`HP+${item.hpBonus}`);
      container.add(this.add.text(14, 52, stats.join(' | '), {
        fontSize: '9px', color: '#88aacc', fontFamily: 'monospace',
      }));

      // Cost / Owned label
      const costText = this.add.text(14, 68, owned ? 'OWNED' : `Cost: ${formatGold(item.cost)}`, {
        fontSize: '10px', color: owned ? '#44aa44' : '#ffdd44', fontFamily: 'monospace',
      });
      container.add(costText);

      // Buy button - embedded in container
      const btnX = w - 50;
      const btnY = cardH / 2;
      const canBuy = !owned && GameStateManager.getGold() >= item.cost;
      const buyBg = this.add.rectangle(btnX, btnY, 60, 32, owned ? 0x333355 : canBuy ? 0x44aa44 : 0x555533)
        .setStrokeStyle(1, 0xffffff, 0.2)
        .setInteractive({ useHandCursor: true });
      container.add(buyBg);

      const buyLabel = this.add.text(btnX, btnY, owned ? '--' : 'Buy', {
        fontSize: '12px', color: owned ? '#444444' : canBuy ? '#ffffff' : '#999966',
        fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(buyLabel);

      if (!owned) {
        const itemId = item.id;
        const itemCost = item.cost;
        buyBg.on('pointerdown', () => {
          if (GameStateManager.getGold() >= itemCost && !GameStateManager.getItem(itemId)?.owned) {
            GameStateManager.buyItem(itemId, itemCost);
            this.switchTab(this.activeTab);
          }
        });
      }

      // Dummy levelText for entry interface
      const levelText = this.add.text(0, 0, '', { fontSize: '1px', color: '#000' });
      container.add(levelText);

      this.entries.push({ yOffset: yOff, buyBg, buyLabel, costText, levelText, id: item.id, type: 'item' });
      yOff += cardH + gap;
    }

    this.maxScroll = Math.max(0, yOff - this.contentBottom);
  }

  private buildPotionList(): void {
    const cx = this.scale.width / 2;
    const container = this.add.container(0, 0);
    this.contentContainer.add(container);
    const msgY = (this.contentTop + this.contentBottom) / 2;
    container.add(this.add.text(cx, msgY, 'Potions coming soon!\n\nVisit the Mini-Games\nto earn multipliers.', {
      fontSize: '14px', color: '#888888', fontFamily: 'monospace', align: 'center',
    }).setOrigin(0.5));
    this.maxScroll = 0;
  }

  private updateEntries(): void {
    for (const entry of this.entries) {
      if (entry.type === 'upgrade') {
        const canBuy = GameStateManager.canPurchaseUpgrade(entry.id);
        entry.buyBg.setFillStyle(canBuy ? 0x44aa44 : 0x333355);
        entry.buyLabel.setColor(canBuy ? '#ffffff' : '#666666');
        entry.costText.setText(`Cost: ${formatGold(GameStateManager.getUpgradeCost(entry.id))}`);
        const level = GameStateManager.getUpgradeLevel(entry.id);
        const upg = UPGRADES.find(u => u.id === entry.id);
        entry.levelText.setText(`Lv ${level}/${upg?.maxLevel ?? 0}`);
      } else if (entry.type === 'item') {
        const owned = GameStateManager.getItem(entry.id)?.owned ?? false;
        const item = getItemById(entry.id);
        if (item) {
          const canBuy = !owned && GameStateManager.getGold() >= item.cost;
          entry.buyBg.setFillStyle(owned ? 0x333355 : canBuy ? 0x44aa44 : 0x555533);
          entry.buyLabel.setText(owned ? '--' : 'Buy');
          entry.buyLabel.setColor(owned ? '#444444' : canBuy ? '#ffffff' : '#999966');
          entry.costText.setText(owned ? 'OWNED' : `Cost: ${formatGold(item.cost)}`);
          entry.costText.setColor(owned ? '#44aa44' : '#ffdd44');
        }
      }
    }
  }
}
