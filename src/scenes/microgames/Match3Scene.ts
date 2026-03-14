import Phaser from 'phaser';
import { SceneKey, MicroGameType } from '../../types/enums';
import { MicroGameManager } from '../../systems/MicroGameManager';
import { MicroGameResult } from '../../models/MicroGameResult';
import { Button } from '../../ui/Button';
import { formatNumber } from '../../utils/FormatNumber';
import { BALANCE } from '../../data/balancing';

const GEM_COLORS = ['red', 'green', 'blue', 'yellow', 'purple', 'cyan'];
const GEM_SIZE = 40;
const GRID_COLS = 8;
const GRID_ROWS = 8;
const SWAP_DURATION = 200;
const FALL_DURATION = 150;
const MATCH_DELAY = 200;

interface GemCell {
  type: number;
  sprite: Phaser.GameObjects.Image;
  row: number;
  col: number;
}

export class Match3Scene extends Phaser.Scene {
  private grid: (GemCell | null)[][] = [];
  private selectedGem: GemCell | null = null;
  private score: number = 0;
  private chainMultiplier: number = 1;
  private timeLeft: number = 90;
  private isProcessing: boolean = false;
  private gameOver: boolean = false;
  private microGameManager!: MicroGameManager;

  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private chainText!: Phaser.GameObjects.Text;
  private gridContainer!: Phaser.GameObjects.Container;
  private selectionIndicator!: Phaser.GameObjects.Rectangle;

  private gridOffsetX: number = 0;
  private gridOffsetY: number = 0;

  constructor() {
    super({ key: SceneKey.Match3 });
  }

  create(): void {
    this.microGameManager = new MicroGameManager();
    this.score = 0;
    this.chainMultiplier = 1;
    this.timeLeft = 90;
    this.isProcessing = false;
    this.gameOver = false;
    this.selectedGem = null;
    this.grid = [];

    const cx = this.scale.width / 2;
    const w = this.scale.width;

    // Background
    this.add.rectangle(cx, this.scale.height / 2, w, this.scale.height, 0x0a0a2a);

    // Title
    this.add.text(cx, 48, 'MATCH-3', {
      fontSize: '18px',
      color: '#44aaff',
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

    // Chain multiplier
    this.chainText = this.add.text(cx, 68, '', {
      fontSize: '14px',
      color: '#ff88ff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Grid container
    this.gridOffsetX = (w - GRID_COLS * GEM_SIZE) / 2;
    this.gridOffsetY = 95;
    this.gridContainer = this.add.container(this.gridOffsetX, this.gridOffsetY);

    // Selection indicator
    this.selectionIndicator = this.add.rectangle(0, 0, GEM_SIZE + 4, GEM_SIZE + 4, 0xffffff, 0)
      .setStrokeStyle(3, 0xffffff).setVisible(false).setDepth(100);
    this.gridContainer.add(this.selectionIndicator);

    // Initialize grid
    this.initGrid();

    // Remove initial matches
    this.removeInitialMatches();

    // Input
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isProcessing || this.gameOver) return;
      this.handleClick(pointer);
    });

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
          this.endGame();
        }
      },
    });
  }

  private initGrid(): void {
    this.grid = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      this.grid[row] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        const type = Phaser.Math.Between(0, GEM_COLORS.length - 1);
        const sprite = this.add.image(
          col * GEM_SIZE + GEM_SIZE / 2,
          row * GEM_SIZE + GEM_SIZE / 2,
          `gem_${GEM_COLORS[type]}`
        ).setDisplaySize(GEM_SIZE - 4, GEM_SIZE - 4);
        this.gridContainer.add(sprite);

        this.grid[row][col] = { type, sprite, row, col };
      }
    }
  }

  private removeInitialMatches(): void {
    let hasMatches = true;
    while (hasMatches) {
      const matches = this.findAllMatches();
      if (matches.length === 0) {
        hasMatches = false;
      } else {
        for (const pos of matches) {
          const cell = this.grid[pos.row][pos.col];
          if (cell) {
            // Replace with a non-matching type
            let newType = Phaser.Math.Between(0, GEM_COLORS.length - 1);
            let attempts = 0;
            while (this.wouldMatch(pos.row, pos.col, newType) && attempts < 20) {
              newType = Phaser.Math.Between(0, GEM_COLORS.length - 1);
              attempts++;
            }
            cell.type = newType;
            cell.sprite.setTexture(`gem_${GEM_COLORS[newType]}`);
          }
        }
      }
    }
  }

  private wouldMatch(row: number, col: number, type: number): boolean {
    // Check horizontal
    let hCount = 1;
    if (col >= 2) {
      const left1 = this.grid[row]?.[col - 1];
      const left2 = this.grid[row]?.[col - 2];
      if (left1 && left2 && left1.type === type && left2.type === type) hCount = 3;
    }
    // Check vertical
    let vCount = 1;
    if (row >= 2) {
      const up1 = this.grid[row - 1]?.[col];
      const up2 = this.grid[row - 2]?.[col];
      if (up1 && up2 && up1.type === type && up2.type === type) vCount = 3;
    }
    return hCount >= 3 || vCount >= 3;
  }

  private handleClick(pointer: Phaser.Input.Pointer): void {
    const localX = pointer.x - this.gridOffsetX;
    const localY = pointer.y - this.gridOffsetY;

    const col = Math.floor(localX / GEM_SIZE);
    const row = Math.floor(localY / GEM_SIZE);

    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return;

    const cell = this.grid[row][col];
    if (!cell) return;

    if (!this.selectedGem) {
      // Select this gem
      this.selectedGem = cell;
      this.selectionIndicator.setPosition(
        col * GEM_SIZE + GEM_SIZE / 2,
        row * GEM_SIZE + GEM_SIZE / 2
      ).setVisible(true);
    } else {
      // Check if adjacent
      const dr = Math.abs(this.selectedGem.row - row);
      const dc = Math.abs(this.selectedGem.col - col);

      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        // Swap
        this.trySwap(this.selectedGem, cell);
      }

      this.selectedGem = null;
      this.selectionIndicator.setVisible(false);
    }
  }

  private trySwap(a: GemCell, b: GemCell): void {
    this.isProcessing = true;

    // Animate swap
    const ax = a.col * GEM_SIZE + GEM_SIZE / 2;
    const ay = a.row * GEM_SIZE + GEM_SIZE / 2;
    const bx = b.col * GEM_SIZE + GEM_SIZE / 2;
    const by = b.row * GEM_SIZE + GEM_SIZE / 2;

    // Swap in grid
    this.grid[a.row][a.col] = b;
    this.grid[b.row][b.col] = a;

    const tempRow = a.row;
    const tempCol = a.col;
    a.row = b.row;
    a.col = b.col;
    b.row = tempRow;
    b.col = tempCol;

    this.tweens.add({
      targets: a.sprite,
      x: bx,
      y: by,
      duration: SWAP_DURATION,
    });

    this.tweens.add({
      targets: b.sprite,
      x: ax,
      y: ay,
      duration: SWAP_DURATION,
      onComplete: () => {
        const matches = this.findAllMatches();
        if (matches.length === 0) {
          // Swap back
          this.grid[a.row][a.col] = b;
          this.grid[b.row][b.col] = a;

          const tr = a.row;
          const tc = a.col;
          a.row = b.row;
          a.col = b.col;
          b.row = tr;
          b.col = tc;

          this.tweens.add({ targets: a.sprite, x: ax, y: ay, duration: SWAP_DURATION });
          this.tweens.add({
            targets: b.sprite, x: bx, y: by, duration: SWAP_DURATION,
            onComplete: () => { this.isProcessing = false; },
          });
        } else {
          this.chainMultiplier = 1;
          this.processMatches();
        }
      },
    });
  }

  private findAllMatches(): { row: number; col: number }[] {
    const matched = new Set<string>();

    // Horizontal matches
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col <= GRID_COLS - 3; col++) {
        const a = this.grid[row][col];
        const b = this.grid[row][col + 1];
        const c = this.grid[row][col + 2];
        if (a && b && c && a.type === b.type && b.type === c.type) {
          matched.add(`${row},${col}`);
          matched.add(`${row},${col + 1}`);
          matched.add(`${row},${col + 2}`);
          // Extend
          for (let k = col + 3; k < GRID_COLS; k++) {
            const d = this.grid[row][k];
            if (d && d.type === a.type) {
              matched.add(`${row},${k}`);
            } else break;
          }
        }
      }
    }

    // Vertical matches
    for (let col = 0; col < GRID_COLS; col++) {
      for (let row = 0; row <= GRID_ROWS - 3; row++) {
        const a = this.grid[row][col];
        const b = this.grid[row + 1]?.[col];
        const c = this.grid[row + 2]?.[col];
        if (a && b && c && a.type === b.type && b.type === c.type) {
          matched.add(`${row},${col}`);
          matched.add(`${row + 1},${col}`);
          matched.add(`${row + 2},${col}`);
          for (let k = row + 3; k < GRID_ROWS; k++) {
            const d = this.grid[k]?.[col];
            if (d && d.type === a.type) {
              matched.add(`${k},${col}`);
            } else break;
          }
        }
      }
    }

    return Array.from(matched).map(s => {
      const [r, c] = s.split(',').map(Number);
      return { row: r, col: c };
    });
  }

  private processMatches(): void {
    const matches = this.findAllMatches();
    if (matches.length === 0) {
      this.chainMultiplier = 1;
      this.chainText.setText('');
      this.isProcessing = false;
      return;
    }

    // Score
    const points = matches.length * 10 * this.chainMultiplier;
    this.score += Math.floor(points);
    this.scoreText.setText(`Score: ${formatNumber(this.score)}`);

    if (this.chainMultiplier > 1) {
      this.chainText.setText(`Chain x${this.chainMultiplier}!`);
    }

    // Remove matched gems with animation
    for (const pos of matches) {
      const cell = this.grid[pos.row][pos.col];
      if (cell) {
        this.tweens.add({
          targets: cell.sprite,
          scaleX: 0,
          scaleY: 0,
          alpha: 0,
          duration: MATCH_DELAY,
          onComplete: () => cell.sprite.destroy(),
        });
        this.grid[pos.row][pos.col] = null;
      }
    }

    // After removal animation, make gems fall and spawn new ones
    this.time.delayedCall(MATCH_DELAY + 50, () => {
      this.dropGems();
      this.spawnNewGems();
      this.chainMultiplier++;

      // Check for new matches after settling
      this.time.delayedCall(FALL_DURATION + 100, () => {
        this.processMatches();
      });
    });
  }

  private dropGems(): void {
    for (let col = 0; col < GRID_COLS; col++) {
      let writeRow = GRID_ROWS - 1;
      for (let row = GRID_ROWS - 1; row >= 0; row--) {
        if (this.grid[row][col] !== null) {
          if (row !== writeRow) {
            const cell = this.grid[row][col]!;
            this.grid[writeRow][col] = cell;
            this.grid[row][col] = null;
            cell.row = writeRow;
            cell.col = col;

            this.tweens.add({
              targets: cell.sprite,
              y: writeRow * GEM_SIZE + GEM_SIZE / 2,
              duration: FALL_DURATION,
              ease: 'Bounce.easeOut',
            });
          }
          writeRow--;
        }
      }
    }
  }

  private spawnNewGems(): void {
    for (let col = 0; col < GRID_COLS; col++) {
      let spawnY = -1;
      for (let row = GRID_ROWS - 1; row >= 0; row--) {
        if (this.grid[row][col] === null) {
          const type = Phaser.Math.Between(0, GEM_COLORS.length - 1);
          const sprite = this.add.image(
            col * GEM_SIZE + GEM_SIZE / 2,
            spawnY * GEM_SIZE + GEM_SIZE / 2,
            `gem_${GEM_COLORS[type]}`
          ).setDisplaySize(GEM_SIZE - 4, GEM_SIZE - 4);
          this.gridContainer.add(sprite);

          const cell: GemCell = { type, sprite, row, col };
          this.grid[row][col] = cell;

          this.tweens.add({
            targets: sprite,
            y: row * GEM_SIZE + GEM_SIZE / 2,
            duration: FALL_DURATION,
            ease: 'Bounce.easeOut',
          });

          spawnY--;
        }
      }
    }
  }

  private endGame(): void {
    this.gameOver = true;
    this.isProcessing = true;

    const result: MicroGameResult = {
      type: MicroGameType.Match3,
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

    const panel = this.add.rectangle(cx, cy, 280, 250, 0x1a1a3e, 0.95)
      .setStrokeStyle(2, 0x44aaff).setDepth(501);

    this.add.text(cx, cy - 90, 'GAME OVER', {
      fontSize: '22px',
      color: '#44aaff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(502);

    this.add.text(cx, cy - 50, `Score: ${formatNumber(this.score)}`, {
      fontSize: '16px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(502);

    this.add.text(cx, cy - 20, `Gold Bonus: +${formatNumber(rewards.bonusGold)}`, {
      fontSize: '13px',
      color: '#ffdd44',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(502);

    this.add.text(cx, cy + 5, `Multiplier: ${rewards.multiplier}x`, {
      fontSize: '13px',
      color: '#ff88ff',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(502);

    this.add.text(cx, cy + 30, `Duration: ${Math.floor(rewards.duration / 1000)}s`, {
      fontSize: '11px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(502);

    const backBtn = new Button(this, cx, cy + 80, 140, 40, 'Back', () => {
      this.scene.stop();
      this.scene.launch(SceneKey.MicroGameSelect);
    }, { fontSize: 14, bgColor: 0x4a4a8a });
    backBtn.setDepth(502);
  }
}
