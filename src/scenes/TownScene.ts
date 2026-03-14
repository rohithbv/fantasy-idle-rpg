import Phaser from 'phaser';
import { SceneKey } from '../types/enums';
import { GameEvents } from '../types/events';
import { EventBus } from '../systems/EventBus';
import { GameStateManager } from '../systems/GameStateManager';
import { IdleEngine } from '../systems/IdleEngine';
import { ClickerSystem } from '../systems/ClickerSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { formatGold, formatNumber, formatTime } from '../utils/FormatNumber';
import { TabBar, TabConfig } from '../ui/TabBar';
import { HUD_HEIGHT } from '../ui/HUD';

const TAB_BAR_HEIGHT = 60;

export class TownScene extends Phaser.Scene {
  private idleEngine!: IdleEngine;
  private clickerSystem!: ClickerSystem;
  private saveSystem!: SaveSystem;

  private clickPowerText!: Phaser.GameObjects.Text;
  private autoRateText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private multiplierText!: Phaser.GameObjects.Text;

  private heroSprite!: Phaser.GameObjects.Image;
  private tapZone!: Phaser.GameObjects.Zone;
  private tabBar!: TabBar;

  private activeSubScene: string = '';

  constructor() {
    super({ key: SceneKey.Town });
  }

  create(): void {
    this.idleEngine = new IdleEngine();
    this.clickerSystem = new ClickerSystem();
    this.saveSystem = new SaveSystem();
    this.saveSystem.init();

    const cx = this.scale.width / 2;
    const w = this.scale.width;
    const h = this.scale.height;
    const contentTop = HUD_HEIGHT + 8;
    const contentBottom = h - TAB_BAR_HEIGHT - 10;
    const contentMid = (contentTop + contentBottom) / 2;

    // Background - town scene
    if (this.textures.exists('town_bg')) {
      this.add.image(cx, h / 2, 'town_bg')
        .setOrigin(0.5)
        .setDisplaySize(w, h);
    }
    this.add.rectangle(cx, h / 2, w, h, 0x1a1a2e, 0.5);

    // --- Stats panel below HUD ---
    const panelY = contentTop + 28;
    this.add.rectangle(cx, panelY, w - 16, 48, 0x0f1123, 0.85)
      .setStrokeStyle(1, 0x4a4a8a, 0.5);

    // Click power (left)
    if (this.textures.exists('icon_sword')) {
      this.add.image(24, panelY - 6, 'icon_sword').setScale(0.7);
    }
    this.clickPowerText = this.add.text(42, panelY - 12, 'Click: 1', {
      fontSize: '12px',
      color: '#cccccc',
      fontFamily: 'monospace',
    });

    // Auto rate (right)
    this.autoRateText = this.add.text(w / 2 + 10, panelY - 12, '0/s', {
      fontSize: '12px',
      color: '#aaccaa',
      fontFamily: 'monospace',
    });

    // Multiplier display below stats panel
    this.multiplierText = this.add.text(cx, panelY + 32, '', {
      fontSize: '12px',
      color: '#ff88ff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    // --- Center tap area ---
    const partyHeroes = GameStateManager.getPartyHeroes();
    const firstHeroId = partyHeroes.length > 0 ? partyHeroes[0].id : 'warrior';
    const heroY = contentMid - 20;

    const heroTexKey = this.textures.exists(`hero_${firstHeroId}`) ? `hero_${firstHeroId}` : 'hero_warrior';
    this.heroSprite = this.add.image(cx, heroY, heroTexKey)
      .setScale(3)
      .setOrigin(0.5);

    this.add.text(cx, heroY + 80, 'TAP TO EARN GOLD', {
      fontSize: '14px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.7);

    // Tap zone
    this.tapZone = this.add.zone(cx, heroY, w - 40, 240)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.tapZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleTap(pointer);
    });

    // Combo text
    this.comboText = this.add.text(cx, heroY - 70, '', {
      fontSize: '18px',
      color: '#ff8844',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    // --- Bottom tab bar ---
    const tabConfigs: TabConfig[] = [
      { key: 'town', label: 'Town' },
      { key: 'shop', label: 'Shop' },
      { key: 'heroes', label: 'Heroes' },
      { key: 'dungeon', label: 'Dungeon' },
      { key: 'games', label: 'Games' },
      { key: 'prestige', label: 'Prestige' },
    ];

    this.tabBar = new TabBar(this, tabConfigs, (key: string) => {
      this.onTabChange(key);
    });
    this.tabBar.selectTab('town');

    // Start idle engine
    this.idleEngine.start();
    this.setupEventListeners();
    this.updateDisplays();

    this.events.on('wake', () => {
      this.onSceneWake();
    });

    this.events.on('shutdown', () => {
      this.idleEngine.stop();
      this.cleanupEventListeners();
    });
  }

  private setupEventListeners(): void {
    EventBus.on(GameEvents.MULTIPLIER_ACTIVE, this.onMultiplierActive);
  }

  private cleanupEventListeners(): void {
    EventBus.off(GameEvents.MULTIPLIER_ACTIVE, this.onMultiplierActive);
  }

  private onMultiplierActive = (): void => {
    this.updateMultiplierDisplay();
  };

  update(_time: number, delta: number): void {
    this.idleEngine.update(delta);
    this.saveSystem.update(delta);
    this.updateDisplays();
  }

  private handleTap(pointer: Phaser.Input.Pointer): void {
    const result = this.clickerSystem.handleClick();

    // Number popup
    const text = result.isCrit ? `CRIT! +${formatNumber(result.gold)}` : `+${formatNumber(result.gold)}`;
    const color = result.isCrit ? '#ff4444' : '#ffdd44';
    const size = result.isCrit ? '22px' : '16px';

    const popup = this.add.text(pointer.x, pointer.y - 20, text, {
      fontSize: size,
      color,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: popup,
      y: pointer.y - 80,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => popup.destroy(),
    });

    // Hero bounce
    this.tweens.add({
      targets: this.heroSprite,
      scaleX: 3.2,
      scaleY: 2.8,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    // Combo display
    if (result.combo > 0) {
      this.comboText.setText(`COMBO x${result.combo}`).setAlpha(1);
      this.tweens.add({
        targets: this.comboText,
        alpha: 0,
        duration: 1500,
        delay: 300,
      });
    }
  }

  private updateDisplays(): void {
    this.clickPowerText.setText(`Click: ${formatNumber(GameStateManager.getClickPower())}`);
    const rate = GameStateManager.getAutoRate();
    this.autoRateText.setText(rate > 0 ? `Auto: ${formatNumber(rate)}/s` : '');
    this.updateMultiplierDisplay();
  }

  private updateMultiplierDisplay(): void {
    const multipliers = GameStateManager.getActiveMultipliers();
    if (multipliers.length > 0) {
      const totalMulti = multipliers.reduce((acc, m) => acc * m.value, 1);
      const soonestExpire = Math.min(...multipliers.map(m => m.expiresAt));
      const remaining = soonestExpire - Date.now();
      if (remaining > 0) {
        this.multiplierText.setText(
          `${totalMulti.toFixed(1)}x GOLD | ${formatTime(remaining)}`
        ).setAlpha(1);
      } else {
        this.multiplierText.setAlpha(0);
      }
    } else {
      this.multiplierText.setAlpha(0);
    }
  }

  private onTabChange(key: string): void {
    if (this.activeSubScene) {
      this.scene.stop(this.activeSubScene);
      this.activeSubScene = '';
    }

    switch (key) {
      case 'town':
        break;
      case 'shop':
        this.scene.launch(SceneKey.Shop);
        this.activeSubScene = SceneKey.Shop;
        break;
      case 'heroes':
        this.scene.launch(SceneKey.Hero);
        this.activeSubScene = SceneKey.Hero;
        break;
      case 'dungeon':
        this.scene.launch(SceneKey.Dungeon);
        this.activeSubScene = SceneKey.Dungeon;
        break;
      case 'games':
        this.scene.launch(SceneKey.MicroGameSelect);
        this.activeSubScene = SceneKey.MicroGameSelect;
        break;
      case 'prestige':
        this.scene.launch(SceneKey.Prestige);
        this.activeSubScene = SceneKey.Prestige;
        break;
    }
  }

  private onSceneWake(): void {
    this.idleEngine.start();
    this.updateDisplays();

    const offlineMs = this.saveSystem.getOfflineTime();
    if (offlineMs > 60000) {
      const earnings = EconomySystem.getOfflineEarnings(offlineMs);
      if (earnings > 0) {
        GameStateManager.addGold(earnings, 'offline');
        EventBus.emit(GameEvents.TOAST, `Offline earnings: ${formatGold(earnings)}`);
      }
    }
  }
}
