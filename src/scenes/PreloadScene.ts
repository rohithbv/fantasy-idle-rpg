import Phaser from 'phaser';
import { SceneKey, HeroClass, EnemyType } from '../types/enums';
import { HEROES } from '../data/heroes';
import { ENEMIES } from '../data/enemies';

export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Image;
  private progressFill!: Phaser.GameObjects.Image;
  private progressMask!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SceneKey.Preload });
  }

  create(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    // Show logo
    this.add.image(cx, cy - 100, 'logo').setOrigin(0.5);

    this.add.text(cx, cy - 40, 'Fantasy Idle RPG', {
      fontSize: '22px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Loading bar
    this.progressBar = this.add.image(cx, cy + 30, 'loading_bar_bg').setOrigin(0.5);
    this.progressFill = this.add.image(cx - 148, cy + 30, 'loading_bar_fill').setOrigin(0, 0.5);

    this.progressMask = this.make.graphics({});
    this.progressMask.fillStyle(0xffffff);
    this.progressMask.fillRect(cx - 148, cy + 17, 0, 26);
    this.progressFill.setMask(this.progressMask.createGeometryMask());

    this.loadingText = this.add.text(cx, cy + 60, 'Generating assets...', {
      fontSize: '12px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Generate all assets with simulated progress
    const tasks = this.getGenerationTasks();
    let taskIndex = 0;

    this.time.addEvent({
      delay: 30,
      repeat: tasks.length - 1,
      callback: () => {
        tasks[taskIndex]();
        taskIndex++;
        const progress = taskIndex / tasks.length;
        this.updateProgress(progress);
        if (taskIndex >= tasks.length) {
          this.loadingText.setText('Done!');
          this.time.delayedCall(300, () => {
            this.scene.start(SceneKey.MainMenu);
          });
        }
      },
    });
  }

  private updateProgress(value: number): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    this.progressMask.clear();
    this.progressMask.fillStyle(0xffffff);
    this.progressMask.fillRect(cx - 148, cy + 17, 296 * value, 26);
    this.loadingText.setText(`Loading... ${Math.floor(value * 100)}%`);
  }

  private getGenerationTasks(): (() => void)[] {
    const tasks: (() => void)[] = [];

    // Hero sprites: colored rectangles with class initials
    const classInitials: Record<HeroClass, string> = {
      [HeroClass.Warrior]: 'W',
      [HeroClass.Mage]: 'M',
      [HeroClass.Ranger]: 'R',
      [HeroClass.Cleric]: 'C',
      [HeroClass.Thief]: 'T',
    };

    for (const hero of HEROES) {
      tasks.push(() => {
        const g = this.make.graphics({});
        g.fillStyle(hero.color, 1);
        g.fillRoundedRect(0, 0, 48, 48, 6);
        g.lineStyle(2, 0xffffff, 0.5);
        g.strokeRoundedRect(0, 0, 48, 48, 6);
        // Add darker inner area for body
        g.fillStyle(Phaser.Display.Color.IntegerToColor(hero.color).darken(30).color, 1);
        g.fillRect(14, 8, 20, 24);
        // Head circle
        g.fillStyle(0xffccaa, 1);
        g.fillCircle(24, 12, 8);
        g.generateTexture(`hero_${hero.id}`, 48, 48);
        g.destroy();

        // Also make a text-based version with initials
        const gi = this.make.graphics({});
        gi.fillStyle(hero.color, 1);
        gi.fillRoundedRect(0, 0, 48, 48, 8);
        gi.lineStyle(2, 0xffffff, 0.6);
        gi.strokeRoundedRect(0, 0, 48, 48, 8);
        gi.generateTexture(`hero_icon_${hero.id}`, 48, 48);
        gi.destroy();
      });
    }

    // Enemy sprites
    for (const enemy of ENEMIES) {
      tasks.push(() => {
        const g = this.make.graphics({});
        g.fillStyle(enemy.color, 1);
        if (enemy.type === EnemyType.Boss) {
          // Boss: larger, diamond shape inside
          g.fillRoundedRect(0, 0, 48, 48, 4);
          g.lineStyle(2, 0xff0000, 0.8);
          g.strokeRoundedRect(0, 0, 48, 48, 4);
          g.fillStyle(Phaser.Display.Color.IntegerToColor(enemy.color).darken(20).color, 1);
          g.fillTriangle(24, 4, 44, 24, 24, 44);
          g.fillTriangle(24, 4, 4, 24, 24, 44);
        } else if (enemy.type === EnemyType.Elite) {
          g.fillRoundedRect(0, 0, 48, 48, 4);
          g.lineStyle(2, 0xffaa00, 0.7);
          g.strokeRoundedRect(0, 0, 48, 48, 4);
          g.fillStyle(0x000000, 0.3);
          g.fillCircle(18, 18, 4);
          g.fillCircle(30, 18, 4);
        } else {
          g.fillRoundedRect(0, 0, 48, 48, 6);
          g.lineStyle(1, 0xffffff, 0.3);
          g.strokeRoundedRect(0, 0, 48, 48, 6);
          g.fillStyle(0x000000, 0.3);
          g.fillCircle(18, 18, 3);
          g.fillCircle(30, 18, 3);
        }
        g.generateTexture(`enemy_${enemy.id}`, 48, 48);
        g.destroy();
      });
    }

    // UI element textures

    // Button textures
    tasks.push(() => {
      const g = this.make.graphics({});
      g.fillStyle(0x4a4a8a, 1);
      g.fillRoundedRect(0, 0, 160, 44, 8);
      g.lineStyle(2, 0x6a6aaa, 1);
      g.strokeRoundedRect(0, 0, 160, 44, 8);
      g.generateTexture('btn_normal', 160, 44);
      g.destroy();
    });

    tasks.push(() => {
      const g = this.make.graphics({});
      g.fillStyle(0x333355, 1);
      g.fillRoundedRect(0, 0, 160, 44, 8);
      g.lineStyle(2, 0x4a4a6a, 1);
      g.strokeRoundedRect(0, 0, 160, 44, 8);
      g.generateTexture('btn_disabled', 160, 44);
      g.destroy();
    });

    // Panel background
    tasks.push(() => {
      const g = this.make.graphics({});
      g.fillStyle(0x16213e, 0.95);
      g.fillRoundedRect(0, 0, 360, 200, 10);
      g.lineStyle(2, 0x4a4a8a, 1);
      g.strokeRoundedRect(0, 0, 360, 200, 10);
      g.generateTexture('panel_bg', 360, 200);
      g.destroy();
    });

    // Icon: gold coin
    tasks.push(() => {
      const g = this.make.graphics({});
      g.fillStyle(0xffdd44, 1);
      g.fillCircle(12, 12, 12);
      g.lineStyle(2, 0xcc9900, 1);
      g.strokeCircle(12, 12, 12);
      g.fillStyle(0xcc9900, 1);
      g.fillCircle(12, 12, 6);
      g.fillStyle(0xffdd44, 1);
      g.fillCircle(12, 12, 4);
      g.generateTexture('icon_gold', 24, 24);
      g.destroy();
    });

    // Icon: sword
    tasks.push(() => {
      const g = this.make.graphics({});
      g.fillStyle(0xcccccc, 1);
      g.fillRect(10, 0, 4, 20);
      g.fillStyle(0x886633, 1);
      g.fillRect(6, 16, 12, 4);
      g.fillRect(10, 18, 4, 6);
      g.generateTexture('icon_sword', 24, 24);
      g.destroy();
    });

    // Icon: shield
    tasks.push(() => {
      const g = this.make.graphics({});
      g.fillStyle(0x4488cc, 1);
      g.fillRoundedRect(2, 0, 20, 22, 4);
      g.lineStyle(2, 0x3366aa, 1);
      g.strokeRoundedRect(2, 0, 20, 22, 4);
      g.fillStyle(0xffdd44, 1);
      g.fillTriangle(12, 6, 8, 16, 16, 16);
      g.generateTexture('icon_shield', 24, 24);
      g.destroy();
    });

    // Icon: heart
    tasks.push(() => {
      const g = this.make.graphics({});
      g.fillStyle(0xff4444, 1);
      g.fillCircle(8, 8, 6);
      g.fillCircle(16, 8, 6);
      g.fillTriangle(2, 10, 22, 10, 12, 22);
      g.generateTexture('icon_heart', 24, 24);
      g.destroy();
    });

    // Icon: soul shard (purple gem)
    tasks.push(() => {
      const g = this.make.graphics({});
      g.fillStyle(0xaa44ff, 1);
      g.fillTriangle(12, 0, 0, 14, 24, 14);
      g.fillTriangle(0, 14, 24, 14, 12, 24);
      g.lineStyle(1, 0xcc66ff, 1);
      g.strokeTriangle(12, 0, 0, 14, 24, 14);
      g.generateTexture('icon_shard', 24, 24);
      g.destroy();
    });

    // Gem sprites for Match-3 (6 colors, 40x40)
    const gemColors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff];
    const gemNames = ['red', 'green', 'blue', 'yellow', 'purple', 'cyan'];
    for (let i = 0; i < gemColors.length; i++) {
      tasks.push(() => {
        const g = this.make.graphics({});
        g.fillStyle(gemColors[i], 1);
        g.fillCircle(20, 20, 16);
        g.lineStyle(2, 0xffffff, 0.4);
        g.strokeCircle(20, 20, 16);
        // Highlight
        g.fillStyle(0xffffff, 0.3);
        g.fillCircle(15, 15, 6);
        g.generateTexture(`gem_${gemNames[i]}`, 40, 40);
        g.destroy();
      });
    }

    // Card back for Memory Match
    tasks.push(() => {
      const g = this.make.graphics({});
      g.fillStyle(0x2a2a5e, 1);
      g.fillRoundedRect(0, 0, 60, 80, 6);
      g.lineStyle(2, 0x6666aa, 1);
      g.strokeRoundedRect(0, 0, 60, 80, 6);
      // Pattern
      g.fillStyle(0x4444aa, 0.5);
      g.fillTriangle(30, 20, 18, 50, 42, 50);
      g.fillTriangle(30, 55, 18, 30, 42, 30);
      g.generateTexture('card_back', 60, 80);
      g.destroy();
    });

    // Card fronts - 8 unique symbols
    const cardSymbols = [
      { name: 'star', color: 0xffdd44 },
      { name: 'circle', color: 0xff4444 },
      { name: 'diamond', color: 0x44aaff },
      { name: 'triangle', color: 0x44ff44 },
      { name: 'cross', color: 0xff44ff },
      { name: 'square', color: 0xffaa44 },
      { name: 'moon', color: 0xaaaaff },
      { name: 'bolt', color: 0xffff44 },
    ];

    for (const sym of cardSymbols) {
      tasks.push(() => {
        const g = this.make.graphics({});
        g.fillStyle(0x1a1a3e, 1);
        g.fillRoundedRect(0, 0, 60, 80, 6);
        g.lineStyle(2, sym.color, 0.8);
        g.strokeRoundedRect(0, 0, 60, 80, 6);

        g.fillStyle(sym.color, 1);
        switch (sym.name) {
          case 'star':
            g.fillTriangle(30, 22, 20, 50, 40, 50);
            g.fillTriangle(30, 58, 20, 34, 40, 34);
            break;
          case 'circle':
            g.fillCircle(30, 40, 15);
            break;
          case 'diamond':
            g.fillTriangle(30, 20, 15, 40, 45, 40);
            g.fillTriangle(15, 40, 45, 40, 30, 60);
            break;
          case 'triangle':
            g.fillTriangle(30, 20, 12, 58, 48, 58);
            break;
          case 'cross':
            g.fillRect(24, 22, 12, 36);
            g.fillRect(14, 32, 32, 12);
            break;
          case 'square':
            g.fillRect(16, 28, 28, 28);
            break;
          case 'moon':
            g.fillCircle(30, 40, 15);
            g.fillStyle(0x1a1a3e, 1);
            g.fillCircle(38, 35, 13);
            break;
          case 'bolt':
            g.fillTriangle(34, 18, 20, 42, 30, 42);
            g.fillTriangle(26, 38, 40, 38, 26, 62);
            break;
        }
        g.generateTexture(`card_${sym.name}`, 60, 80);
        g.destroy();
      });
    }

    // Simon Says colored circles (4 colors)
    const simonColors = [
      { name: 'red', color: 0xff3333, highlight: 0xff8888 },
      { name: 'blue', color: 0x3333ff, highlight: 0x8888ff },
      { name: 'green', color: 0x33ff33, highlight: 0x88ff88 },
      { name: 'yellow', color: 0xffff33, highlight: 0xffff88 },
    ];

    for (const sc of simonColors) {
      tasks.push(() => {
        const g = this.make.graphics({});
        g.fillStyle(sc.color, 1);
        g.fillCircle(40, 40, 36);
        g.lineStyle(3, 0xffffff, 0.3);
        g.strokeCircle(40, 40, 36);
        g.fillStyle(0xffffff, 0.15);
        g.fillCircle(32, 32, 12);
        g.generateTexture(`simon_${sc.name}`, 80, 80);
        g.destroy();
      });
      tasks.push(() => {
        const g = this.make.graphics({});
        g.fillStyle(sc.highlight, 1);
        g.fillCircle(40, 40, 36);
        g.lineStyle(3, 0xffffff, 0.6);
        g.strokeCircle(40, 40, 36);
        g.fillStyle(0xffffff, 0.3);
        g.fillCircle(32, 32, 14);
        g.generateTexture(`simon_${sc.name}_lit`, 80, 80);
        g.destroy();
      });
    }

    // Background gradient texture
    tasks.push(() => {
      const g = this.make.graphics({});
      for (let y = 0; y < 200; y++) {
        const t = y / 200;
        const r = Math.floor(26 * (1 - t) + 10 * t);
        const gr = Math.floor(26 * (1 - t) + 15 * t);
        const b = Math.floor(46 * (1 - t) + 40 * t);
        g.fillStyle(Phaser.Display.Color.GetColor(r, gr, b), 1);
        g.fillRect(0, y, 400, 1);
      }
      g.generateTexture('bg_gradient', 400, 200);
      g.destroy();
    });

    // Town background buildings
    tasks.push(() => {
      const g = this.make.graphics({});
      // Sky
      for (let y = 0; y < 400; y++) {
        const t = y / 400;
        const r = Math.floor(20 + 10 * t);
        const gr = Math.floor(15 + 20 * t);
        const b = Math.floor(50 - 10 * t);
        g.fillStyle(Phaser.Display.Color.GetColor(r, gr, b), 1);
        g.fillRect(0, y, 400, 1);
      }
      // Ground
      g.fillStyle(0x2a3a2a, 1);
      g.fillRect(0, 340, 400, 60);
      // Buildings
      g.fillStyle(0x1a2040, 1);
      g.fillRect(20, 240, 60, 100);
      g.fillStyle(0x1a2540, 1);
      g.fillRect(100, 200, 80, 140);
      g.fillStyle(0x1a2040, 1);
      g.fillRect(200, 260, 50, 80);
      g.fillStyle(0x1a2540, 1);
      g.fillRect(270, 220, 70, 120);
      g.fillStyle(0x1a2040, 1);
      g.fillRect(350, 250, 50, 90);
      // Windows (yellow glows)
      g.fillStyle(0xffdd44, 0.6);
      g.fillRect(35, 260, 10, 10);
      g.fillRect(55, 260, 10, 10);
      g.fillRect(35, 290, 10, 10);
      g.fillRect(120, 220, 10, 10);
      g.fillRect(150, 220, 10, 10);
      g.fillRect(120, 250, 10, 10);
      g.fillRect(150, 250, 10, 10);
      g.fillRect(120, 280, 10, 10);
      g.fillRect(285, 240, 10, 10);
      g.fillRect(315, 240, 10, 10);
      g.fillRect(285, 270, 10, 10);
      // Roofs
      g.fillStyle(0x3a2020, 1);
      g.fillTriangle(15, 240, 85, 240, 50, 210);
      g.fillTriangle(95, 200, 185, 200, 140, 165);
      g.fillTriangle(265, 220, 345, 220, 305, 185);
      // Stars
      g.fillStyle(0xffffff, 0.7);
      for (let i = 0; i < 15; i++) {
        const sx = 10 + (i * 97) % 380;
        const sy = 10 + (i * 43) % 150;
        g.fillCircle(sx, sy, 1);
      }
      g.generateTexture('town_bg', 400, 400);
      g.destroy();
    });

    // Dungeon background
    tasks.push(() => {
      const g = this.make.graphics({});
      g.fillStyle(0x0a0a1a, 1);
      g.fillRect(0, 0, 400, 400);
      // Stone walls
      g.fillStyle(0x222233, 1);
      g.fillRect(0, 0, 400, 60);
      g.fillRect(0, 340, 400, 60);
      g.fillRect(0, 0, 40, 400);
      g.fillRect(360, 0, 40, 400);
      // Brick lines
      g.lineStyle(1, 0x333344, 0.4);
      for (let y = 0; y < 400; y += 20) {
        g.lineBetween(0, y, 400, y);
      }
      for (let x = 0; x < 400; x += 30) {
        g.lineBetween(x, 0, x, 60);
        g.lineBetween(x, 340, x, 400);
      }
      // Torches
      g.fillStyle(0xff6633, 0.8);
      g.fillCircle(60, 40, 8);
      g.fillCircle(340, 40, 8);
      g.fillStyle(0xffaa44, 0.5);
      g.fillCircle(60, 38, 5);
      g.fillCircle(340, 38, 5);
      g.generateTexture('dungeon_bg', 400, 400);
      g.destroy();
    });

    // Tap circle effect
    tasks.push(() => {
      const g = this.make.graphics({});
      g.fillStyle(0xffdd44, 0.3);
      g.fillCircle(30, 30, 30);
      g.lineStyle(2, 0xffdd44, 0.6);
      g.strokeCircle(30, 30, 30);
      g.generateTexture('tap_effect', 60, 60);
      g.destroy();
    });

    return tasks;
  }
}
