import Phaser from 'phaser';
import { SceneKey, MicroGameType } from '../../types/enums';
import { MicroGameManager } from '../../systems/MicroGameManager';
import { MicroGameResult } from '../../models/MicroGameResult';
import { Button } from '../../ui/Button';
import { formatNumber } from '../../utils/FormatNumber';
import { BALANCE } from '../../data/balancing';

const COLORS = ['red', 'blue', 'green', 'yellow'];
const COLOR_HEX = [0xff3333, 0x3333ff, 0x33ff33, 0xffff33];

export class SimonSaysScene extends Phaser.Scene {
  private sequence: number[] = [];
  private playerIndex: number = 0;
  private round: number = 0;
  private score: number = 0;
  private isPlaying: boolean = false;
  private isShowingSequence: boolean = false;
  private gameOver: boolean = false;
  private microGameManager!: MicroGameManager;

  private runeButtons: Phaser.GameObjects.Image[] = [];
  private runeHighlights: Phaser.GameObjects.Image[] = [];
  private roundText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SceneKey.SimonSays });
  }

  create(): void {
    this.microGameManager = new MicroGameManager();
    this.sequence = [];
    this.playerIndex = 0;
    this.round = 0;
    this.score = 0;
    this.isPlaying = false;
    this.isShowingSequence = false;
    this.gameOver = false;
    this.runeButtons = [];
    this.runeHighlights = [];

    const cx = this.scale.width / 2;
    const w = this.scale.width;

    // Background
    this.add.rectangle(cx, this.scale.height / 2, w, this.scale.height, 0x0a0a2a);

    // Title
    this.add.text(cx, 48, 'SIMON SAYS', {
      fontSize: '18px',
      color: '#44ff44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Round
    this.roundText = this.add.text(20, 70, 'Round: 0', {
      fontSize: '14px',
      color: '#88aaff',
      fontFamily: 'monospace',
    });

    // Score
    this.scoreText = this.add.text(w - 20, 70, 'Score: 0', {
      fontSize: '14px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(1, 0);

    // Status
    this.statusText = this.add.text(cx, 85, 'Watch the pattern...', {
      fontSize: '14px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Create rune buttons in diamond pattern
    const centerY = this.scale.height / 2 - 20;
    const spacing = 100;

    const positions = [
      { x: cx, y: centerY - spacing },      // Top (red)
      { x: cx + spacing, y: centerY },       // Right (blue)
      { x: cx, y: centerY + spacing },       // Bottom (green)
      { x: cx - spacing, y: centerY },       // Left (yellow)
    ];

    for (let i = 0; i < 4; i++) {
      const pos = positions[i];
      const colorName = COLORS[i];

      // Normal button
      const btn = this.add.image(pos.x, pos.y, `simon_${colorName}`)
        .setDisplaySize(80, 80)
        .setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        if (!this.isShowingSequence && this.isPlaying && !this.gameOver) {
          this.handlePlayerInput(i);
        }
      });

      // Highlight (for sequence display)
      const highlight = this.add.image(pos.x, pos.y, `simon_${colorName}_lit`)
        .setDisplaySize(80, 80)
        .setAlpha(0);

      this.runeButtons.push(btn);
      this.runeHighlights.push(highlight);

      // Label
      this.add.text(pos.x, pos.y + 50, colorName.charAt(0).toUpperCase() + colorName.slice(1), {
        fontSize: '10px',
        color: '#888888',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    }

    // Center circle decoration
    this.add.circle(cx, centerY, 30, 0x1a1a3e, 1)
      .setStrokeStyle(2, 0x4a4a8a);
    this.add.text(cx, centerY, '?', {
      fontSize: '24px',
      color: '#666688',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Start game after brief delay
    this.time.delayedCall(1000, () => {
      this.startNewRound();
    });
  }

  private startNewRound(): void {
    this.round++;
    this.roundText.setText(`Round: ${this.round}`);
    this.playerIndex = 0;
    this.isPlaying = false;
    this.isShowingSequence = true;
    this.statusText.setText('Watch the pattern...');

    // Add new elements to sequence
    const toAdd = this.round === 1 ? BALANCE.SIMON_START_SEQUENCE : 1;
    for (let i = 0; i < toAdd; i++) {
      this.sequence.push(Phaser.Math.Between(0, 3));
    }

    // Show sequence
    this.playSequence();
  }

  private playSequence(): void {
    const speed = Math.max(
      BALANCE.SIMON_SPEED_MIN_MS,
      BALANCE.SIMON_SPEED_BASE_MS - (this.round - 1) * BALANCE.SIMON_SPEED_DECREASE_MS
    );

    let delay = 500;
    for (let i = 0; i < this.sequence.length; i++) {
      const idx = this.sequence[i];
      this.time.delayedCall(delay, () => {
        this.flashButton(idx, speed * 0.6);
      });
      delay += speed;
    }

    // After sequence is shown, enable player input
    this.time.delayedCall(delay + 200, () => {
      this.isShowingSequence = false;
      this.isPlaying = true;
      this.statusText.setText('Your turn! Repeat the pattern.');
      this.statusText.setColor('#ffdd44');
    });
  }

  private flashButton(index: number, duration: number): void {
    const highlight = this.runeHighlights[index];
    const btn = this.runeButtons[index];

    highlight.setAlpha(1);
    btn.setScale(1.1);

    this.time.delayedCall(duration, () => {
      highlight.setAlpha(0);
      btn.setScale(1);
    });
  }

  private handlePlayerInput(index: number): void {
    // Flash the button the player pressed
    this.flashButton(index, 200);

    if (this.sequence[this.playerIndex] === index) {
      // Correct!
      this.playerIndex++;

      if (this.playerIndex >= this.sequence.length) {
        // Completed the sequence
        this.score = this.round;
        this.scoreText.setText(`Score: ${this.score}`);
        this.statusText.setText('Correct! Next round...');
        this.statusText.setColor('#44ff44');
        this.isPlaying = false;

        this.time.delayedCall(1000, () => {
          this.startNewRound();
        });
      }
    } else {
      // Wrong!
      this.onFail();
    }
  }

  private onFail(): void {
    this.gameOver = true;
    this.isPlaying = false;

    // Flash all red
    for (let i = 0; i < 4; i++) {
      this.runeButtons[i].setTint(0xff0000);
    }

    this.statusText.setText('Wrong! Game Over.');
    this.statusText.setColor('#ff4444');

    // Show the correct button briefly
    const correctIdx = this.sequence[this.playerIndex];
    this.time.delayedCall(500, () => {
      for (let i = 0; i < 4; i++) {
        this.runeButtons[i].clearTint();
      }
      this.flashButton(correctIdx, 800);

      this.time.delayedCall(1500, () => {
        this.endGame();
      });
    });
  }

  private endGame(): void {
    const result: MicroGameResult = {
      type: MicroGameType.SimonSays,
      score: this.score,
      won: this.score > 0,
      bonusGold: 0,
      multiplier: 1,
      multiplierDuration: 0,
    };

    const rewards = this.microGameManager.processResult(result);

    // Show results
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    const overlay = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.7)
      .setDepth(500).setInteractive();

    const panel = this.add.rectangle(cx, cy, 280, 280, 0x1a1a3e, 0.95)
      .setStrokeStyle(2, 0x44ff44).setDepth(501);

    this.add.text(cx, cy - 100, 'GAME OVER', {
      fontSize: '22px',
      color: '#44ff44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(502);

    this.add.text(cx, cy - 60, `Rounds: ${this.score}`, {
      fontSize: '18px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(502);

    this.add.text(cx, cy - 30, `Sequence Length: ${this.sequence.length}`, {
      fontSize: '12px',
      color: '#88aaff',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(502);

    this.add.text(cx, cy, `Gold Bonus: +${formatNumber(rewards.bonusGold)}`, {
      fontSize: '13px',
      color: '#ffdd44',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(502);

    this.add.text(cx, cy + 25, `Multiplier: ${rewards.multiplier}x`, {
      fontSize: '13px',
      color: '#ff88ff',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(502);

    this.add.text(cx, cy + 50, `Duration: ${Math.floor(rewards.duration / 1000)}s`, {
      fontSize: '11px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(502);

    const backBtn = new Button(this, cx, cy + 100, 140, 40, 'Back', () => {
      this.scene.stop();
      this.scene.launch(SceneKey.MicroGameSelect);
    }, { fontSize: 14, bgColor: 0x4a4a8a });
    backBtn.setDepth(502);
  }
}
