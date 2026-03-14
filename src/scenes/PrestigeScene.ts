import Phaser from 'phaser';
import { SceneKey } from '../types/enums';
import { GameStateManager } from '../systems/GameStateManager';
import { PrestigeSystem } from '../systems/PrestigeSystem';
import { EventBus } from '../systems/EventBus';
import { GameEvents } from '../types/events';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { PRESTIGE_UPGRADES } from '../data/prestigeRewards';
import { formatNumber, formatGold } from '../utils/FormatNumber';
import { HUD_HEIGHT } from '../ui/HUD';

const TOP = HUD_HEIGHT + 4;

export class PrestigeScene extends Phaser.Scene {
  private prestigeSystem!: PrestigeSystem;
  private contentContainer!: Phaser.GameObjects.Container;
  private scrollY: number = 0;
  private maxScroll: number = 0;

  constructor() {
    super({ key: SceneKey.Prestige });
  }

  create(): void {
    this.prestigeSystem = new PrestigeSystem();
    this.scrollY = 0;

    const cx = this.scale.width / 2;
    const w = this.scale.width;
    const h = this.scale.height;

    // Full opaque background
    this.add.rectangle(cx, h / 2, w, h, 0x0f1123);

    const titleY = TOP + 16;
    this.add.text(cx, titleY, 'PRESTIGE', {
      fontSize: '20px',
      color: '#aa44ff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    new Button(this, w - 30, titleY, 40, 28, 'X', () => {
      this.scene.stop();
    }, { fontSize: 14, bgColor: 0x883333 });

    // Soul shards
    const shardY = titleY + 28;
    const shards = GameStateManager.getPrestigeState().soulShards;
    this.add.text(cx, shardY, `${formatNumber(shards)} Soul Shards`, {
      fontSize: '14px', color: '#cc88ff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Current run stats
    const state = GameStateManager.getState();
    const dungeon = GameStateManager.getDungeon();
    const statsY = shardY + 20;
    const statsH = 80;

    this.add.rectangle(cx, statsY + statsH / 2, w - 16, statsH, 0x16213e, 0.9)
      .setStrokeStyle(1, 0x4a4a8a);

    this.add.text(14, statsY + 6, 'CURRENT RUN', {
      fontSize: '10px', color: '#aaaaaa', fontFamily: 'monospace', fontStyle: 'bold',
    });
    this.add.text(14, statsY + 22, `Highest Floor: ${dungeon.highestFloor}`, {
      fontSize: '10px', color: '#cccccc', fontFamily: 'monospace',
    });
    this.add.text(14, statsY + 36, `Total Gold: ${formatGold(state.totalGoldThisRun)}`, {
      fontSize: '10px', color: '#ffdd44', fontFamily: 'monospace',
    });
    this.add.text(14, statsY + 50, `Prestiges: ${state.prestige.totalPrestiges}`, {
      fontSize: '10px', color: '#cc88ff', fontFamily: 'monospace',
    });
    this.add.text(w / 2 + 10, statsY + 22, `Heroes: ${Object.values(state.heroes).filter(h => h.recruited).length}`, {
      fontSize: '10px', color: '#88aacc', fontFamily: 'monospace',
    });

    // Prestige preview
    const previewY = statsY + statsH + 8;
    const canPrestige = this.prestigeSystem.canPrestige();
    const shardsPreview = this.prestigeSystem.getShardsPreview();
    const previewH = 50;

    this.add.rectangle(cx, previewY + previewH / 2, w - 16, previewH, 0x1a0a2a, 0.9)
      .setStrokeStyle(1, canPrestige ? 0xaa44ff : 0x444466);

    this.add.text(cx, previewY + 14, canPrestige
      ? `Soul Shards: +${formatNumber(shardsPreview)}`
      : 'Requires Floor 20+', {
      fontSize: '12px', color: canPrestige ? '#ffdd44' : '#666666', fontFamily: 'monospace',
    }).setOrigin(0.5);

    if (!canPrestige) {
      this.add.text(cx, previewY + 32, `Current: Floor ${dungeon.highestFloor}/20`, {
        fontSize: '9px', color: '#888888', fontFamily: 'monospace',
      }).setOrigin(0.5);
    }

    // Prestige button - embedded
    const btnY = previewY + previewH + 28;
    const prestigeBg = this.add.rectangle(cx, btnY, 200, 38, canPrestige ? 0x8844cc : 0x333355)
      .setStrokeStyle(1, 0xffffff, 0.2)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, btnY, canPrestige ? `PRESTIGE (+${formatNumber(shardsPreview)})` : 'Cannot Prestige', {
      fontSize: '12px', color: canPrestige ? '#ffffff' : '#666666', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    if (canPrestige) {
      prestigeBg.on('pointerdown', () => this.showPrestigeConfirmation(shardsPreview));
    }

    // Prestige upgrades header
    const upgradesHeaderY = btnY + 30;
    this.add.text(14, upgradesHeaderY, 'PRESTIGE UPGRADES', {
      fontSize: '12px', color: '#cc88ff', fontFamily: 'monospace', fontStyle: 'bold',
    });

    // Scrollable content for upgrades
    const upgradesStartY = upgradesHeaderY + 20;
    this.contentContainer = this.add.container(0, 0);
    const maskShape = this.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, upgradesStartY, w, h - upgradesStartY - 10);
    this.contentContainer.setMask(maskShape.createGeometryMask());

    const cardH = 76;
    const gap = 6;
    let yOff = upgradesStartY + 4;
    const prestigeState = GameStateManager.getPrestigeState();

    for (const upgrade of PRESTIGE_UPGRADES) {
      const container = this.add.container(0, yOff);
      this.contentContainer.add(container);

      const owned = prestigeState.purchasedUpgrades.filter(id => id === upgrade.id).length;
      const cost = Math.floor(upgrade.cost * Math.pow(upgrade.costScaling, owned));
      const isMaxed = owned >= upgrade.maxLevel;
      const canBuy = !isMaxed && prestigeState.soulShards >= cost;

      // Card background
      container.add(this.add.rectangle(cx, cardH / 2, w - 16, cardH, 0x16213e, 0.9)
        .setStrokeStyle(1, isMaxed ? 0x44aa44 : canBuy ? 0xaa44ff : 0x333355));

      // Name
      container.add(this.add.text(14, 8, upgrade.name, {
        fontSize: '12px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }));

      // Description
      container.add(this.add.text(14, 24, upgrade.description, {
        fontSize: '9px', color: '#aaaaaa', fontFamily: 'monospace',
      }));

      // Level
      container.add(this.add.text(14, 40, `Level: ${owned}/${upgrade.maxLevel}`, {
        fontSize: '9px', color: isMaxed ? '#44ff44' : '#888888', fontFamily: 'monospace',
      }));

      // Cost or MAXED
      if (!isMaxed) {
        container.add(this.add.text(14, 54, `Cost: ${formatNumber(cost)} shards`, {
          fontSize: '9px', color: canBuy ? '#cc88ff' : '#666666', fontFamily: 'monospace',
        }));

        // Buy button - embedded in container
        const buyBtnX = w - 50;
        const buyBtnY = cardH / 2;
        const buyBg = this.add.rectangle(buyBtnX, buyBtnY, 60, 30, canBuy ? 0x8844cc : 0x333355)
          .setStrokeStyle(1, 0xffffff, 0.2)
          .setInteractive({ useHandCursor: true });
        container.add(buyBg);
        container.add(this.add.text(buyBtnX, buyBtnY, 'Buy', {
          fontSize: '11px', color: canBuy ? '#ffffff' : '#666666', fontFamily: 'monospace',
        }).setOrigin(0.5));

        if (canBuy) {
          const upgId = upgrade.id;
          buyBg.on('pointerdown', () => {
            if (this.prestigeSystem.buyPrestigeUpgrade(upgId)) {
              this.scene.restart();
            }
          });
          buyBg.on('pointerover', () => buyBg.setFillStyle(0x9955dd));
          buyBg.on('pointerout', () => buyBg.setFillStyle(0x8844cc));
        }
      } else {
        container.add(this.add.text(14, 54, 'MAXED', {
          fontSize: '9px', color: '#44ff44', fontFamily: 'monospace', fontStyle: 'bold',
        }));
      }

      yOff += cardH + gap;
    }

    this.maxScroll = Math.max(0, yOff - (h - 10));

    // Drag scrolling for upgrades
    let dragStartY = 0;
    let startScrollY = 0;
    let dragging = false;
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > upgradesStartY) {
        dragStartY = pointer.y;
        startScrollY = this.scrollY;
        dragging = true;
      }
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (dragging && pointer.isDown && pointer.y > upgradesStartY) {
        const dy = dragStartY - pointer.y;
        this.scrollY = Phaser.Math.Clamp(startScrollY + dy, 0, this.maxScroll);
        this.contentContainer.y = -this.scrollY;
      }
    });
    this.input.on('pointerup', () => { dragging = false; });
  }

  private showPrestigeConfirmation(shards: number): void {
    let modalRef: Modal | null = null;
    modalRef = new Modal(this, 280, 200, 'Prestige?',
      `Reset gold, upgrades & dungeon.\n\nEarn ${formatNumber(shards)} Soul Shards.\nHeroes & items kept.`,
      [
        { text: 'Cancel', callback: () => modalRef?.close() },
        { text: 'Prestige!', callback: () => { modalRef?.close(); this.performPrestige(); } },
      ]
    );
  }

  private performPrestige(): void {
    const shards = this.prestigeSystem.prestige();
    if (shards > 0) {
      EventBus.emit(GameEvents.TOAST, `Prestige! +${formatNumber(shards)} Soul Shards`);
      this.scene.stop(SceneKey.HUD);
      this.scene.stop(SceneKey.Town);
      this.scene.stop();
      this.scene.start(SceneKey.Town);
      this.scene.launch(SceneKey.HUD);
    }
  }
}
