import Phaser from 'phaser';
import { SceneKey } from '../types/enums';
import { Button } from '../ui/Button';
import { GameStateManager } from '../systems/GameStateManager';
import { SaveSystem } from '../systems/SaveSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { EventBus } from '../systems/EventBus';
import { GameEvents } from '../types/events';
import { formatGold, formatTime } from '../utils/FormatNumber';

export class MainMenuScene extends Phaser.Scene {
  private saveSystem!: SaveSystem;

  constructor() {
    super({ key: SceneKey.MainMenu });
  }

  create(): void {
    this.saveSystem = new SaveSystem();
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    // Background gradient
    const bg = this.add.graphics();
    for (let y = 0; y < this.scale.height; y++) {
      const t = y / this.scale.height;
      const r = Math.floor(15 + 15 * t);
      const g = Math.floor(10 + 20 * t);
      const b = Math.floor(40 + 20 * (1 - t));
      bg.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
      bg.fillRect(0, y, this.scale.width, 1);
    }

    // Floating particles
    for (let i = 0; i < 20; i++) {
      const px = Phaser.Math.Between(20, this.scale.width - 20);
      const py = Phaser.Math.Between(50, this.scale.height - 100);
      const dot = this.add.circle(px, py, Phaser.Math.Between(1, 3), 0xffdd44, 0.3);
      this.tweens.add({
        targets: dot,
        y: py - Phaser.Math.Between(20, 60),
        alpha: 0,
        duration: Phaser.Math.Between(2000, 5000),
        repeat: -1,
        yoyo: true,
      });
    }

    // Logo
    this.add.image(cx, cy - 200, 'logo').setOrigin(0.5).setScale(1.5);

    // Title text
    const title = this.add.text(cx, cy - 120, 'Fantasy\nIdle RPG', {
      fontSize: '36px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Pulsing title
    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtitle
    this.add.text(cx, cy - 60, 'Tap. Upgrade. Conquer.', {
      fontSize: '14px',
      color: '#aaaacc',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // New Game button
    new Button(this, cx, cy + 20, 200, 50, 'New Game', () => {
      this.startNewGame();
    }, { fontSize: 18, bgColor: 0x44aa44 });

    // Continue button (only if save exists)
    const hasSave = this.saveSystem.hasSave();
    const continueBtn = new Button(this, cx, cy + 85, 200, 50, 'Continue', () => {
      this.continueGame();
    }, { fontSize: 18, bgColor: 0x4488cc });
    continueBtn.setDisabled(!hasSave);

    if (!hasSave) {
      this.add.text(cx, cy + 120, 'No save data found', {
        fontSize: '10px',
        color: '#666688',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    }

    // Settings button
    new Button(this, cx, cy + 160, 160, 40, 'Settings', () => {
      this.scene.start(SceneKey.Settings);
    }, { fontSize: 14, bgColor: 0x4a4a6a });

    // Version
    this.add.text(cx, this.scale.height - 30, 'v1.0.0', {
      fontSize: '10px',
      color: '#444466',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  private startNewGame(): void {
    GameStateManager.reset();
    this.saveSystem.init();
    this.launchGameScenes();
  }

  private continueGame(): void {
    const loaded = this.saveSystem.load();
    if (!loaded) {
      // Fallback to new game if load fails
      this.startNewGame();
      return;
    }

    this.saveSystem.init();

    // Calculate offline earnings
    const offlineMs = this.saveSystem.getOfflineTime();
    if (offlineMs > 5000) {
      const earnings = EconomySystem.getOfflineEarnings(offlineMs);
      if (earnings > 0) {
        GameStateManager.addGold(earnings, 'offline');
        EventBus.emit(
          GameEvents.TOAST,
          `Welcome back! Earned ${formatGold(earnings)} while away (${formatTime(offlineMs)})`
        );
      }
    }

    this.launchGameScenes();
  }

  private launchGameScenes(): void {
    this.scene.start(SceneKey.Town);
    this.scene.launch(SceneKey.HUD);
  }
}
