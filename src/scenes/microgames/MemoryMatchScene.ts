import Phaser from 'phaser';
import { SceneKey, MicroGameType } from '../../types/enums';
import { MicroGameManager } from '../../systems/MicroGameManager';
import { MicroGameResult } from '../../models/MicroGameResult';
import { Button } from '../../ui/Button';
import { formatNumber } from '../../utils/FormatNumber';

const CARD_SYMBOLS = ['star', 'circle', 'diamond', 'triangle', 'cross', 'square'];
const CARD_W = 60;
const CARD_H = 80;
const GRID_COLS = 4;
const GRID_ROWS = 3;
const FLIP_DURATION = 200;
const MISMATCH_DELAY = 1000;

interface CardCell {
  symbolIndex: number;
  sprite: Phaser.GameObjects.Image;
  faceUp: boolean;
  matched: boolean;
  row: number;
  col: number;
}

export class MemoryMatchScene extends Phaser.Scene {
  private cards: CardCell[] = [];
  private flippedCards: CardCell[] = [];
  private score: number = 0;
  private matchesFound: number = 0;
  private totalPairs: number = 0;
  private timeLeft: number = 90;
  private isProcessing: boolean = false;
  private gameOver: boolean = false;
  private microGameManager!: MicroGameManager;

  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private matchesText!: Phaser.GameObjects.Text;
  private gridContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: SceneKey.MemoryMatch });
  }

  create(): void {
    this.microGameManager = new MicroGameManager();
    this.score = 0;
    this.matchesFound = 0;
    this.totalPairs = (GRID_COLS * GRID_ROWS) / 2;
    this.timeLeft = 90;
    this.isProcessing = false;
    this.gameOver = false;
    this.cards = [];
    this.flippedCards = [];

    const cx = this.scale.width / 2;
    const w = this.scale.width;

    // Background
    this.add.rectangle(cx, this.scale.height / 2, w, this.scale.height, 0x0a0a2a);

    // Title
    this.add.text(cx, 48, 'MEMORY MATCH', {
      fontSize: '18px',
      color: '#aa44ff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Score
    this.scoreText = this.add.text(20, 68, 'Score: 0', {
      fontSize: '14px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });

    // Timer
    this.timeText = this.add.text(w - 20, 68, '90s', {
      fontSize: '14px',
      color: '#ff8888',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(1, 0);

    // Matches counter
    this.matchesText = this.add.text(cx, 68, '0/6', {
      fontSize: '14px',
      color: '#88aaff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Grid container
    const gridW = GRID_COLS * (CARD_W + 10);
    const gridH = GRID_ROWS * (CARD_H + 10);
    const gridX = (w - gridW) / 2 + CARD_W / 2 + 5;
    const gridY = Math.max(95, (this.scale.height - gridH) / 2 + CARD_H / 2);
    this.gridContainer = this.add.container(0, 0);

    // Create card pairs
    const symbolIndices: number[] = [];
    for (let i = 0; i < this.totalPairs; i++) {
      symbolIndices.push(i % CARD_SYMBOLS.length);
      symbolIndices.push(i % CARD_SYMBOLS.length);
    }

    // Shuffle
    for (let i = symbolIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [symbolIndices[i], symbolIndices[j]] = [symbolIndices[j], symbolIndices[i]];
    }

    // Place cards
    let idx = 0;
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const x = gridX + col * (CARD_W + 10);
        const y = gridY + row * (CARD_H + 10);

        const sprite = this.add.image(x, y, 'card_back')
          .setDisplaySize(CARD_W, CARD_H)
          .setInteractive({ useHandCursor: true });

        this.gridContainer.add(sprite);

        const card: CardCell = {
          symbolIndex: symbolIndices[idx],
          sprite,
          faceUp: false,
          matched: false,
          row,
          col,
        };

        sprite.on('pointerdown', () => {
          if (!this.isProcessing && !this.gameOver && !card.faceUp && !card.matched) {
            this.flipCard(card);
          }
        });

        this.cards.push(card);
        idx++;
      }
    }

    // Brief reveal at start
    this.revealAllBriefly();

    // Timer
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.gameOver) return;
        this.timeLeft--;
        this.timeText.setText(`${this.timeLeft}s`);
        if (this.timeLeft <= 10) {
          this.timeText.setColor('#ff3333');
        }
        if (this.timeLeft <= 0) {
          this.endGame(false);
        }
      },
    });
  }

  private revealAllBriefly(): void {
    this.isProcessing = true;

    // Show all cards for 2 seconds
    for (const card of this.cards) {
      card.sprite.setTexture(`card_${CARD_SYMBOLS[card.symbolIndex]}`);
      card.sprite.setDisplaySize(CARD_W, CARD_H);
    }

    this.time.delayedCall(2000, () => {
      for (const card of this.cards) {
        card.sprite.setTexture('card_back');
        card.sprite.setDisplaySize(CARD_W, CARD_H);
        card.faceUp = false;
      }
      this.isProcessing = false;
    });
  }

  private flipCard(card: CardCell): void {
    if (this.flippedCards.length >= 2) return;

    card.faceUp = true;

    // Flip animation
    this.tweens.add({
      targets: card.sprite,
      scaleX: 0,
      duration: FLIP_DURATION / 2,
      onComplete: () => {
        card.sprite.setTexture(`card_${CARD_SYMBOLS[card.symbolIndex]}`);
        card.sprite.setDisplaySize(CARD_W, CARD_H);
        this.tweens.add({
          targets: card.sprite,
          scaleX: 1,
          duration: FLIP_DURATION / 2,
        });
      },
    });

    this.flippedCards.push(card);

    if (this.flippedCards.length === 2) {
      this.isProcessing = true;
      this.checkMatch();
    }
  }

  private checkMatch(): void {
    const [card1, card2] = this.flippedCards;

    if (card1.symbolIndex === card2.symbolIndex) {
      // Match!
      this.score += 100;
      this.matchesFound++;
      card1.matched = true;
      card2.matched = true;

      this.scoreText.setText(`Score: ${formatNumber(this.score)}`);
      this.matchesText.setText(`${this.matchesFound}/${this.totalPairs}`);

      // Success animation
      this.tweens.add({
        targets: [card1.sprite, card2.sprite],
        alpha: 0.6,
        duration: 300,
        onComplete: () => {
          this.flippedCards = [];
          this.isProcessing = false;

          if (this.matchesFound >= this.totalPairs) {
            this.endGame(true);
          }
        },
      });
    } else {
      // Mismatch
      this.score = Math.max(0, this.score - 10);
      this.scoreText.setText(`Score: ${formatNumber(this.score)}`);

      // Flash red
      card1.sprite.setTint(0xff4444);
      card2.sprite.setTint(0xff4444);

      this.time.delayedCall(MISMATCH_DELAY, () => {
        card1.sprite.clearTint();
        card2.sprite.clearTint();

        // Flip back animation
        const flipBack = (card: CardCell) => {
          this.tweens.add({
            targets: card.sprite,
            scaleX: 0,
            duration: FLIP_DURATION / 2,
            onComplete: () => {
              card.sprite.setTexture('card_back');
              card.sprite.setDisplaySize(CARD_W, CARD_H);
              card.faceUp = false;
              this.tweens.add({
                targets: card.sprite,
                scaleX: 1,
                duration: FLIP_DURATION / 2,
              });
            },
          });
        };

        flipBack(card1);
        flipBack(card2);

        this.time.delayedCall(FLIP_DURATION + 50, () => {
          this.flippedCards = [];
          this.isProcessing = false;
        });
      });
    }
  }

  private endGame(won: boolean): void {
    this.gameOver = true;
    this.isProcessing = true;

    // Time bonus if won
    if (won) {
      this.score += this.timeLeft * 5;
    }

    const result: MicroGameResult = {
      type: MicroGameType.MemoryMatch,
      score: this.score,
      won,
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
      .setStrokeStyle(2, 0xaa44ff).setDepth(501);

    this.add.text(cx, cy - 100, won ? 'ALL MATCHED!' : 'TIME UP!', {
      fontSize: '22px',
      color: won ? '#44ff44' : '#ff4444',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(502);

    this.add.text(cx, cy - 60, `Score: ${formatNumber(this.score)}`, {
      fontSize: '16px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(502);

    this.add.text(cx, cy - 30, `Pairs: ${this.matchesFound}/${this.totalPairs}`, {
      fontSize: '13px',
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
