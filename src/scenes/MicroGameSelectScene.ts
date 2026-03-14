import Phaser from 'phaser';
import { SceneKey, MicroGameType } from '../types/enums';
import { MicroGameManager } from '../systems/MicroGameManager';
import { GameStateManager } from '../systems/GameStateManager';
import { Button } from '../ui/Button';
import { formatNumber, formatTime } from '../utils/FormatNumber';
import { HUD_HEIGHT } from '../ui/HUD';

const TOP = HUD_HEIGHT + 4;

export class MicroGameSelectScene extends Phaser.Scene {
  private microGameManager!: MicroGameManager;
  private cooldownTexts: Map<string, Phaser.GameObjects.Text> = new Map();

  constructor() {
    super({ key: SceneKey.MicroGameSelect });
  }

  create(): void {
    this.microGameManager = new MicroGameManager();
    const cx = this.scale.width / 2;
    const w = this.scale.width;
    const h = this.scale.height;

    // Full opaque background
    this.add.rectangle(cx, h / 2, w, h, 0x0f1123);

    const titleY = TOP + 16;
    this.add.text(cx, titleY, 'MINI-GAMES', {
      fontSize: '20px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    new Button(this, w - 30, titleY, 40, 28, 'X', () => {
      this.scene.stop();
    }, { fontSize: 14, bgColor: 0x883333 });

    this.add.text(cx, titleY + 24, 'Win gold & multipliers!', {
      fontSize: '11px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const dailyFeatured = this.microGameManager.getDailyFeatured();

    const games = [
      { type: MicroGameType.Match3, name: 'Match-3', description: 'Swap gems to make\nmatches of 3+!', sceneKey: SceneKey.Match3, color: 0x44aaff },
      { type: MicroGameType.MemoryMatch, name: 'Memory Match', description: 'Flip cards and find\nmatching pairs!', sceneKey: SceneKey.MemoryMatch, color: 0xaa44ff },
      { type: MicroGameType.SimonSays, name: 'Simon Says', description: 'Remember & repeat\nthe pattern!', sceneKey: SceneKey.SimonSays, color: 0x44ff44 },
    ];

    const mgState = GameStateManager.getMicroGameState();
    const cardStartY = titleY + 55;
    const availH = h - cardStartY - 20;
    const cardH = Math.min(140, (availH - 20) / games.length);
    const cardGap = (availH - cardH * games.length) / (games.length + 1);

    games.forEach((game, i) => {
      const cardY = cardStartY + cardGap * (i + 1) + cardH * i + cardH / 2;

      this.add.rectangle(cx, cardY, w - 24, cardH, 0x16213e, 0.9)
        .setStrokeStyle(2, game.color, 0.7);

      if (game.type === dailyFeatured) {
        const badge = this.add.text(w - 55, cardY - cardH / 2 + 10, 'DAILY 2x', {
          fontSize: '8px',
          color: '#ffdd44',
          fontFamily: 'monospace',
          fontStyle: 'bold',
          backgroundColor: '#443300',
          padding: { x: 3, y: 1 },
        }).setOrigin(0.5);

        this.tweens.add({
          targets: badge,
          scaleX: 1.1, scaleY: 1.1,
          duration: 800, yoyo: true, repeat: -1,
        });
      }

      this.add.text(16, cardY - 28, game.name, {
        fontSize: '14px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      });

      this.add.text(16, cardY - 8, game.description, {
        fontSize: '9px', color: '#aaaaaa', fontFamily: 'monospace',
      });

      const highScore = mgState.highScores[game.type] ?? 0;
      this.add.text(16, cardY + 22, `Best: ${formatNumber(highScore)}`, {
        fontSize: '10px', color: '#88aacc', fontFamily: 'monospace',
      });

      const canPlay = this.microGameManager.canPlay(game.type);
      const cooldown = this.microGameManager.getCooldownRemaining(game.type);

      const cooldownText = this.add.text(w - 70, cardY + 30, '', {
        fontSize: '9px', color: '#ff8888', fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.cooldownTexts.set(game.type, cooldownText);
      if (!canPlay) cooldownText.setText(formatTime(cooldown));

      new Button(this, w - 70, cardY - 5, 90, 36,
        canPlay ? 'PLAY' : 'Cooldown', () => {
          if (this.microGameManager.canPlay(game.type)) {
            this.scene.stop();
            this.scene.launch(game.sceneKey);
          }
        }, { fontSize: 13, bgColor: canPlay ? game.color : 0x333355 })
        .setDisabled(!canPlay);
    });

    this.time.addEvent({
      delay: 1000, loop: true,
      callback: () => this.updateCooldowns(),
    });
  }

  private updateCooldowns(): void {
    for (const gameType of Object.values(MicroGameType)) {
      const cooldown = this.microGameManager.getCooldownRemaining(gameType);
      const text = this.cooldownTexts.get(gameType);
      if (text) {
        text.setText(cooldown > 0 ? formatTime(cooldown) : 'Ready!');
        text.setColor(cooldown > 0 ? '#ff8888' : '#44ff44');
      }
    }
  }
}
