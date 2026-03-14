import Phaser from 'phaser';
import { SceneKey, ItemSlotType } from '../types/enums';
import { GameStateManager } from '../systems/GameStateManager';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { HEROES, getHeroById } from '../data/heroes';
import { ITEMS, getItemById } from '../data/items';
import { heroXpRequired } from '../data/balancing';
import { formatGold, formatNumber } from '../utils/FormatNumber';
import { HeroState } from '../models/GameState';
import { HUD_HEIGHT } from '../ui/HUD';

const TOP = HUD_HEIGHT + 4;

export class HeroScene extends Phaser.Scene {
  private heroListContainer!: Phaser.GameObjects.Container;
  private detailContainer!: Phaser.GameObjects.Container;
  private scrollY: number = 0;
  private maxScroll: number = 0;
  private viewMode: 'list' | 'detail' = 'list';
  private contentTop: number = 0;

  constructor() {
    super({ key: SceneKey.Hero });
  }

  create(): void {
    const cx = this.scale.width / 2;
    const w = this.scale.width;
    const h = this.scale.height;

    // Full opaque background
    this.add.rectangle(cx, h / 2, w, h, 0x0f1123);

    // Title
    const titleY = TOP + 16;
    this.add.text(cx, titleY, 'HEROES', {
      fontSize: '20px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Close button
    new Button(this, w - 30, titleY, 40, 28, 'X', () => {
      this.scene.stop();
    }, { fontSize: 14, bgColor: 0x883333 });

    this.contentTop = titleY + 22;

    // Create containers
    this.heroListContainer = this.add.container(0, 0);
    this.detailContainer = this.add.container(0, 0).setVisible(false);

    // Scroll mask
    const maskShape = this.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, this.contentTop, w, h - this.contentTop - 10);
    this.heroListContainer.setMask(maskShape.createGeometryMask());

    // Drag scrolling
    let dragStartY = 0;
    let startScrollY = 0;
    let dragging = false;
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.viewMode === 'list' && pointer.y > this.contentTop) {
        dragStartY = pointer.y;
        startScrollY = this.scrollY;
        dragging = true;
      }
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (dragging && pointer.isDown && this.viewMode === 'list') {
        const dy = dragStartY - pointer.y;
        this.scrollY = Phaser.Math.Clamp(startScrollY + dy, 0, this.maxScroll);
        this.heroListContainer.y = -this.scrollY;
      }
    });
    this.input.on('pointerup', () => { dragging = false; });

    this.buildHeroList();
  }

  private buildHeroList(): void {
    this.heroListContainer.removeAll(true);
    this.viewMode = 'list';
    this.detailContainer.setVisible(false);
    this.heroListContainer.setVisible(true);
    this.scrollY = 0;
    this.heroListContainer.y = 0;

    const w = this.scale.width;
    const cardH = 100;
    const gap = 8;
    let yOff = this.contentTop + 4;

    // Recruited heroes
    const recruitedHeroes = Object.values(GameStateManager.getState().heroes).filter(h => h.recruited);

    if (recruitedHeroes.length > 0) {
      this.heroListContainer.add(this.add.text(14, yOff, 'YOUR HEROES', {
        fontSize: '11px', color: '#aaaaaa', fontFamily: 'monospace',
      }));
      yOff += 20;

      for (const hero of recruitedHeroes) {
        const heroDef = getHeroById(hero.id);
        if (!heroDef) continue;

        const card = this.add.container(0, yOff);
        this.heroListContainer.add(card);

        // Card background
        card.add(this.add.rectangle(w / 2, cardH / 2, w - 16, cardH, 0x16213e, 0.9)
          .setStrokeStyle(1, hero.inParty ? 0x44aa44 : 0x4a4a8a));

        // Hero color square
        card.add(this.add.rectangle(36, cardH / 2, 40, 40, heroDef.color)
          .setStrokeStyle(1, 0xffffff, 0.3));

        // Name & class
        card.add(this.add.text(66, 10, `${hero.name} (${hero.classType})`, {
          fontSize: '12px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
        }));

        // Level
        card.add(this.add.text(66, 28, `Level ${hero.level}`, {
          fontSize: '10px', color: '#88aacc', fontFamily: 'monospace',
        }));

        // XP bar
        const xpRequired = heroXpRequired(hero.level);
        const xpBar = new ProgressBar(this, 66, 46, w - 190, 8, { fillColor: 0x44aaff, bgColor: 0x222244 });
        xpBar.setProgress(hero.xp / xpRequired);
        card.add(xpBar);

        // XP text
        card.add(this.add.text(66, 58, `XP: ${formatNumber(hero.xp)}/${formatNumber(xpRequired)}`, {
          fontSize: '8px', color: '#6688aa', fontFamily: 'monospace',
        }));

        // Stats
        card.add(this.add.text(66, 72, `HP:${hero.baseHP + hero.level * 10} ATK:${hero.baseATK + hero.level * 2} DEF:${hero.baseDEF + hero.level}`, {
          fontSize: '8px', color: '#aaaaaa', fontFamily: 'monospace',
        }));

        // IN PARTY badge
        if (hero.inParty) {
          card.add(this.add.text(w - 80, 10, 'IN PARTY', {
            fontSize: '8px', color: '#44ff44', fontFamily: 'monospace', fontStyle: 'bold',
          }));
        }

        // View button - embedded in container
        const btnX = w - 55;
        const btnY = cardH / 2 + 8;
        const viewBg = this.add.rectangle(btnX, btnY, 60, 28, 0x4a4a8a)
          .setStrokeStyle(1, 0xffffff, 0.2)
          .setInteractive({ useHandCursor: true });
        card.add(viewBg);
        card.add(this.add.text(btnX, btnY, 'View', {
          fontSize: '11px', color: '#ffffff', fontFamily: 'monospace',
        }).setOrigin(0.5));

        const heroId = hero.id;
        viewBg.on('pointerdown', () => this.showHeroDetail(heroId));
        viewBg.on('pointerover', () => viewBg.setFillStyle(0x6a6aaa));
        viewBg.on('pointerout', () => viewBg.setFillStyle(0x4a4a8a));

        yOff += cardH + gap;
      }
    }

    // Recruitable heroes
    const unrecruited = HEROES.filter(h => {
      const heroState = GameStateManager.getHero(h.id);
      return !heroState?.recruited && h.recruitCost > 0;
    });

    if (unrecruited.length > 0) {
      yOff += 6;
      this.heroListContainer.add(this.add.text(14, yOff, 'RECRUIT NEW HEROES', {
        fontSize: '11px', color: '#aaaaaa', fontFamily: 'monospace',
      }));
      yOff += 20;

      const recruitCardH = 80;
      for (const heroDef of unrecruited) {
        const card = this.add.container(0, yOff);
        this.heroListContainer.add(card);

        card.add(this.add.rectangle(w / 2, recruitCardH / 2, w - 16, recruitCardH, 0x16213e, 0.9)
          .setStrokeStyle(1, 0x666666));

        // Hero icon (dimmed)
        card.add(this.add.rectangle(36, recruitCardH / 2, 40, 40, heroDef.color, 0.5)
          .setStrokeStyle(1, 0xffffff, 0.2));

        card.add(this.add.text(66, 10, `${heroDef.name} (${heroDef.classType})`, {
          fontSize: '12px', color: '#888888', fontFamily: 'monospace',
        }));

        card.add(this.add.text(66, 28, heroDef.description, {
          fontSize: '9px', color: '#666666', fontFamily: 'monospace',
          wordWrap: { width: w - 180 },
        }));

        card.add(this.add.text(66, 50, `Cost: ${formatGold(heroDef.recruitCost)}`, {
          fontSize: '10px', color: '#ffdd44', fontFamily: 'monospace',
        }));

        // Recruit button - embedded in container
        const canAfford = GameStateManager.getGold() >= heroDef.recruitCost;
        const btnX = w - 55;
        const btnY = recruitCardH / 2;
        const recruitBg = this.add.rectangle(btnX, btnY, 65, 30, canAfford ? 0x44aa44 : 0x333355)
          .setStrokeStyle(1, 0xffffff, 0.2)
          .setInteractive({ useHandCursor: true });
        card.add(recruitBg);
        card.add(this.add.text(btnX, btnY, 'Recruit', {
          fontSize: '10px', color: canAfford ? '#ffffff' : '#666666', fontFamily: 'monospace',
        }).setOrigin(0.5));

        const hId = heroDef.id;
        const hCost = heroDef.recruitCost;
        recruitBg.on('pointerdown', () => {
          if (GameStateManager.getGold() >= hCost) {
            GameStateManager.recruitHero(hId, hCost);
            this.buildHeroList();
          }
        });

        yOff += recruitCardH + gap;
      }
    }

    this.maxScroll = Math.max(0, yOff - (this.scale.height - 10));
  }

  private showHeroDetail(heroId: string): void {
    this.viewMode = 'detail';
    this.heroListContainer.setVisible(false);
    this.detailContainer.setVisible(true);
    this.detailContainer.removeAll(true);

    const hero = GameStateManager.getHero(heroId);
    const heroDef = getHeroById(heroId);
    if (!hero || !heroDef) return;

    const cx = this.scale.width / 2;
    const w = this.scale.width;
    let y = this.contentTop + 6;

    // Back button - embedded
    const backBg = this.add.rectangle(45, y + 14, 65, 28, 0x4a4a8a)
      .setStrokeStyle(1, 0xffffff, 0.2)
      .setInteractive({ useHandCursor: true });
    this.detailContainer.add(backBg);
    this.detailContainer.add(this.add.text(45, y + 14, 'Back', {
      fontSize: '12px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5));
    backBg.on('pointerdown', () => this.buildHeroList());

    // Hero portrait
    y += 46;
    this.detailContainer.add(this.add.rectangle(cx, y, 56, 56, heroDef.color)
      .setStrokeStyle(2, 0xffffff, 0.4));

    y += 40;
    this.detailContainer.add(this.add.text(cx, y, hero.name, {
      fontSize: '18px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5));

    y += 20;
    this.detailContainer.add(this.add.text(cx, y, `${hero.classType} - Level ${hero.level}`, {
      fontSize: '12px', color: '#88aacc', fontFamily: 'monospace',
    }).setOrigin(0.5));

    // XP Bar
    y += 20;
    const xpRequired = heroXpRequired(hero.level);
    const xpBar = new ProgressBar(this, cx - 90, y, 180, 12, { fillColor: 0x44aaff });
    xpBar.setProgress(hero.xp / xpRequired);
    this.detailContainer.add(xpBar);

    y += 16;
    this.detailContainer.add(this.add.text(cx, y, `XP: ${formatNumber(hero.xp)} / ${formatNumber(xpRequired)}`, {
      fontSize: '9px', color: '#6688aa', fontFamily: 'monospace',
    }).setOrigin(0.5));

    // Stats
    y += 22;
    const hp = hero.baseHP + hero.level * 10;
    const atk = hero.baseATK + hero.level * 2;
    const def = hero.baseDEF + hero.level;
    this.detailContainer.add(this.add.text(cx, y, `HP: ${hp}    ATK: ${atk}    DEF: ${def}`, {
      fontSize: '12px', color: '#cccccc', fontFamily: 'monospace',
    }).setOrigin(0.5));

    // Equipment
    y += 26;
    this.detailContainer.add(this.add.text(cx, y, 'EQUIPMENT', {
      fontSize: '12px', color: '#aaaaaa', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5));

    const slots: { key: 'equippedWeapon' | 'equippedArmor' | 'equippedAccessory'; label: string; slotType: ItemSlotType }[] = [
      { key: 'equippedWeapon', label: 'Weapon', slotType: ItemSlotType.Weapon },
      { key: 'equippedArmor', label: 'Armor', slotType: ItemSlotType.Armor },
      { key: 'equippedAccessory', label: 'Accessory', slotType: ItemSlotType.Accessory },
    ];

    y += 18;
    slots.forEach((slot) => {
      const slotH = 42;
      this.detailContainer.add(this.add.rectangle(cx, y + slotH / 2, w - 30, slotH, 0x1a2040, 0.9)
        .setStrokeStyle(1, 0x4a4a8a));

      this.detailContainer.add(this.add.text(22, y + 6, slot.label, {
        fontSize: '10px', color: '#888888', fontFamily: 'monospace',
      }));

      const equippedItemId = hero[slot.key];
      if (equippedItemId) {
        const itemDef = getItemById(equippedItemId);
        if (itemDef) {
          this.detailContainer.add(this.add.text(22, y + 22, itemDef.name, {
            fontSize: '11px', color: '#44aaff', fontFamily: 'monospace',
          }));

          // Remove button - embedded
          const removeBg = this.add.rectangle(w - 50, y + slotH / 2, 55, 24, 0x883333)
            .setStrokeStyle(1, 0xffffff, 0.2)
            .setInteractive({ useHandCursor: true });
          this.detailContainer.add(removeBg);
          this.detailContainer.add(this.add.text(w - 50, y + slotH / 2, 'Remove', {
            fontSize: '9px', color: '#ffffff', fontFamily: 'monospace',
          }).setOrigin(0.5));

          const eqItemId = equippedItemId;
          const slotKey = slot.key;
          removeBg.on('pointerdown', () => {
            const itemState = GameStateManager.getItem(eqItemId);
            if (itemState) {
              const state = GameStateManager.getState() as import('../models/GameState').GameState;
              const heroState = state.heroes[heroId];
              if (heroState) {
                heroState[slotKey] = null;
                itemState.equipped = false;
                itemState.equippedBy = null;
              }
            }
            this.showHeroDetail(heroId);
          });
        }
      } else {
        this.detailContainer.add(this.add.text(22, y + 22, '[ Empty ]', {
          fontSize: '11px', color: '#555555', fontFamily: 'monospace',
        }));

        const availableItems = ITEMS.filter(item => {
          const itemState = GameStateManager.getItem(item.id);
          return item.slot === slot.slotType && itemState?.owned && !itemState.equipped;
        });

        if (availableItems.length > 0) {
          const equipBg = this.add.rectangle(w - 50, y + slotH / 2, 55, 24, 0x44aa44)
            .setStrokeStyle(1, 0xffffff, 0.2)
            .setInteractive({ useHandCursor: true });
          this.detailContainer.add(equipBg);
          this.detailContainer.add(this.add.text(w - 50, y + slotH / 2, 'Equip', {
            fontSize: '9px', color: '#ffffff', fontFamily: 'monospace',
          }).setOrigin(0.5));

          const firstItem = availableItems[0];
          const slotKey = slot.key;
          equipBg.on('pointerdown', () => {
            GameStateManager.equipItem(firstItem.id, heroId, slotKey);
            this.showHeroDetail(heroId);
          });
        }
      }

      y += slotH + 6;
    });

    // Party toggle - embedded
    y += 10;
    const toggleColor = hero.inParty ? 0x883333 : 0x44aa44;
    const toggleLabel = hero.inParty ? 'Remove from Party' : 'Add to Party';
    const toggleBg = this.add.rectangle(cx, y, 180, 38, toggleColor)
      .setStrokeStyle(1, 0xffffff, 0.2)
      .setInteractive({ useHandCursor: true });
    this.detailContainer.add(toggleBg);
    this.detailContainer.add(this.add.text(cx, y, toggleLabel, {
      fontSize: '12px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5));

    toggleBg.on('pointerdown', () => {
      const state = GameStateManager.getState() as import('../models/GameState').GameState;
      const heroState = state.heroes[heroId];
      if (heroState) {
        if (heroState.inParty) {
          heroState.inParty = false;
        } else {
          if (GameStateManager.getPartyHeroes().length < state.partySlots) {
            heroState.inParty = true;
          }
        }
      }
      this.showHeroDetail(heroId);
    });
  }
}
