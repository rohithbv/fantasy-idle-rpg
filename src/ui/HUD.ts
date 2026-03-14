import Phaser from 'phaser';
import { SceneKey } from '../types/enums';
import { GameStateManager } from '../systems/GameStateManager';
import { EventBus } from '../systems/EventBus';
import { GameEvents } from '../types/events';
import { formatGold, formatNumber, formatTime } from '../utils/FormatNumber';

export const HUD_HEIGHT = 36;

export class HUDScene extends Phaser.Scene {
  private goldText!: Phaser.GameObjects.Text;
  private goldRateText!: Phaser.GameObjects.Text;
  private multiplierText!: Phaser.GameObjects.Text;
  private floorText!: Phaser.GameObjects.Text;

  private toastQueue: string[] = [];
  private toastActive: boolean = false;

  constructor() {
    super({ key: SceneKey.HUD });
  }

  create(): void {
    const w = this.scale.width;

    // HUD background bar at top
    this.add.rectangle(w / 2, HUD_HEIGHT / 2, w, HUD_HEIGHT, 0x0a0a1e, 0.95)
      .setStrokeStyle(1, 0x4a4a8a, 0.4)
      .setDepth(999);

    // Gold icon + text (left side)
    if (this.textures.exists('icon_gold')) {
      this.add.image(16, HUD_HEIGHT / 2, 'icon_gold').setScale(0.7).setDepth(1000);
    }
    this.goldText = this.add.text(30, HUD_HEIGHT / 2 - 8, '0 G', {
      fontSize: '13px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setDepth(1000);

    this.goldRateText = this.add.text(30, HUD_HEIGHT / 2 + 5, '', {
      fontSize: '9px',
      color: '#88aa88',
      fontFamily: 'monospace',
    }).setDepth(1000);

    // Multiplier (center)
    this.multiplierText = this.add.text(w / 2, HUD_HEIGHT / 2, '', {
      fontSize: '11px',
      color: '#ff88ff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1000).setAlpha(0);

    // Dungeon floor (right)
    this.floorText = this.add.text(w - 10, HUD_HEIGHT / 2, '', {
      fontSize: '11px',
      color: '#88aacc',
      fontFamily: 'monospace',
    }).setOrigin(1, 0.5).setDepth(1000);

    // Listen for toast events
    EventBus.on(GameEvents.TOAST, this.onToast);

    this.scene.bringToTop();

    this.events.on('shutdown', () => {
      EventBus.off(GameEvents.TOAST, this.onToast);
    });
  }

  private onToast = (message: unknown): void => {
    this.toastQueue.push(message as string);
    if (!this.toastActive) {
      this.showNextToast();
    }
  };

  private showNextToast(): void {
    if (this.toastQueue.length === 0) {
      this.toastActive = false;
      return;
    }

    this.toastActive = true;
    const message = this.toastQueue.shift()!;
    const cx = this.scale.width / 2;
    const toastY = HUD_HEIGHT + 12;

    const bg = this.add.rectangle(cx, toastY, this.scale.width - 20, 28, 0x1a1a3e, 0.92)
      .setStrokeStyle(1, 0x6666aa, 0.7)
      .setDepth(1001);

    const text = this.add.text(cx, toastY, message, {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'monospace',
      align: 'center',
      wordWrap: { width: this.scale.width - 40 },
    }).setOrigin(0.5).setDepth(1002);

    this.tweens.add({
      targets: [bg, text],
      alpha: 0,
      y: toastY - 15,
      duration: 400,
      delay: 2500,
      onComplete: () => {
        bg.destroy();
        text.destroy();
        this.showNextToast();
      },
    });
  }

  update(): void {
    this.goldText.setText(formatGold(GameStateManager.getGold()));

    const rate = GameStateManager.getAutoRate();
    this.goldRateText.setText(rate > 0 ? `${formatNumber(rate)}/s` : '');

    const multipliers = GameStateManager.getActiveMultipliers();
    if (multipliers.length > 0) {
      const totalMulti = multipliers.reduce((acc, m) => acc * m.value, 1);
      const soonestExpire = Math.min(...multipliers.map(m => m.expiresAt));
      const remaining = soonestExpire - Date.now();
      if (remaining > 0) {
        this.multiplierText
          .setText(`${totalMulti.toFixed(1)}x | ${formatTime(remaining)}`)
          .setAlpha(1);
      } else {
        this.multiplierText.setAlpha(0);
      }
    } else {
      this.multiplierText.setAlpha(0);
    }

    const dungeon = GameStateManager.getDungeon();
    if (dungeon.highestFloor > 0) {
      this.floorText.setText(`F${dungeon.currentFloor}`);
    }

    this.scene.bringToTop();
  }
}
