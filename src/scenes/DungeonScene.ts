import Phaser from 'phaser';
import { SceneKey } from '../types/enums';
import { GameStateManager } from '../systems/GameStateManager';
import { DungeonSystem, DungeonEnemy } from '../systems/DungeonSystem';
import { CombatSystem, CombatState } from '../systems/CombatSystem';
import { EventBus } from '../systems/EventBus';
import { GameEvents } from '../types/events';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { formatNumber } from '../utils/FormatNumber';
import { HUD_HEIGHT } from '../ui/HUD';

const TOP = HUD_HEIGHT + 4;
const BOTTOM_MARGIN = 70;

export class DungeonScene extends Phaser.Scene {
  private dungeonSystem!: DungeonSystem;
  private combatSystem!: CombatSystem;
  private combatState: CombatState | null = null;
  private currentEnemy: DungeonEnemy | null = null;

  private floorText!: Phaser.GameObjects.Text;
  private enemySprite!: Phaser.GameObjects.Rectangle;
  private enemyNameText!: Phaser.GameObjects.Text;
  private enemyHPBar!: ProgressBar;
  private enemyHPText!: Phaser.GameObjects.Text;
  private bossWarning!: Phaser.GameObjects.Text;

  private partyContainer!: Phaser.GameObjects.Container;
  private partyBars: Map<string, { bar: ProgressBar; nameText: Phaser.GameObjects.Text; sprite: Phaser.GameObjects.Rectangle; containerX: number; containerY: number }> = new Map();

  private combatLog!: Phaser.GameObjects.Text;
  private combatTimer: Phaser.Time.TimerEvent | null = null;
  private autoBattleBtn!: Button;
  private startBattleBtn!: Button;
  private retreatBtn!: Button;

  private resultContainer!: Phaser.GameObjects.Container;
  private inBattle: boolean = false;

  constructor() {
    super({ key: SceneKey.Dungeon });
  }

  create(): void {
    this.dungeonSystem = new DungeonSystem();
    this.combatSystem = new CombatSystem();
    this.combatTimer = null;
    this.inBattle = false;

    const cx = this.scale.width / 2;
    const w = this.scale.width;
    const h = this.scale.height;

    // Full opaque background to cover TownScene
    this.add.rectangle(cx, h / 2, w, h, 0x0f0f1e);
    // Subtle dungeon atmosphere
    this.add.rectangle(cx, h / 2, w, h, 0x110808, 0.4);

    // Title bar area
    const titleY = TOP + 16;
    this.add.text(cx, titleY, 'DUNGEON', {
      fontSize: '20px',
      color: '#ff8844',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Close button
    new Button(this, w - 30, titleY, 40, 28, 'X', () => {
      this.stopCombat();
      this.scene.stop();
    }, { fontSize: 14, bgColor: 0x883333 });

    // Floor display
    const dungeon = GameStateManager.getDungeon();
    const floorY = titleY + 28;
    this.floorText = this.add.text(cx, floorY, `Floor ${dungeon.currentFloor}`, {
      fontSize: '16px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Boss warning
    this.bossWarning = this.add.text(cx, floorY + 20, 'BOSS FLOOR!', {
      fontSize: '13px',
      color: '#ff3333',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    // --- Enemy area (upper section) ---
    const enemyAreaTop = floorY + 40;
    const enemyAreaH = 140;
    this.add.rectangle(cx, enemyAreaTop + enemyAreaH / 2, w - 20, enemyAreaH, 0x161628, 0.7)
      .setStrokeStyle(1, 0x333355);

    const enemyCenterY = enemyAreaTop + enemyAreaH / 2 - 10;
    this.enemySprite = this.add.rectangle(cx, enemyCenterY, 48, 48, 0x666666)
      .setAlpha(0);

    this.enemyNameText = this.add.text(cx, enemyCenterY + 34, '', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.enemyHPBar = new ProgressBar(this, cx - 70, enemyCenterY + 50, 140, 14, {
      fillColor: 0xff4444,
      bgColor: 0x331111,
    });

    this.enemyHPText = this.add.text(cx, enemyCenterY + 50, '', {
      fontSize: '9px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(10);

    // --- Party area (middle section) ---
    const partyAreaTop = enemyAreaTop + enemyAreaH + 10;
    this.partyContainer = this.add.container(0, partyAreaTop);
    this.buildPartyDisplay();

    // --- Combat log (between party and buttons) ---
    const logY = partyAreaTop + 100;
    this.combatLog = this.add.text(cx, logY, '', {
      fontSize: '11px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
      align: 'center',
      wordWrap: { width: w - 40 },
    }).setOrigin(0.5, 0);

    // --- Buttons (bottom area, above margin) ---
    const btnY = h - BOTTOM_MARGIN;
    this.startBattleBtn = new Button(this, cx - 65, btnY, 120, 40, 'Battle!', () => {
      this.startBattle();
    }, { fontSize: 14, bgColor: 0x44aa44 });

    this.autoBattleBtn = new Button(this, cx + 65, btnY, 120, 40,
      dungeon.autoBattle ? 'Auto: ON' : 'Auto: OFF', () => {
        this.toggleAutoBattle();
      }, { fontSize: 12, bgColor: dungeon.autoBattle ? 0x4488cc : 0x4a4a6a });

    this.retreatBtn = new Button(this, cx, btnY, 120, 40, 'Retreat', () => {
      this.stopCombat();
      this.resetBattleUI();
    }, { fontSize: 14, bgColor: 0x883333 });
    this.retreatBtn.setVisible(false);

    // Result overlay container
    this.resultContainer = this.add.container(cx, h / 2).setVisible(false).setDepth(500);

    this.updateBossWarning();

    if (dungeon.autoBattle) {
      this.time.delayedCall(500, () => this.startBattle());
    }
  }

  private buildPartyDisplay(): void {
    this.partyContainer.removeAll(true);
    this.partyBars.clear();

    const party = GameStateManager.getPartyHeroes();
    const w = this.scale.width;

    if (party.length === 0) {
      const noParty = this.add.text(w / 2, 20, 'No heroes in party!', {
        fontSize: '12px',
        color: '#ff6666',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.partyContainer.add(noParty);
      return;
    }

    const totalPadding = 20;
    const gap = 8;
    const availW = w - totalPadding;
    const cardW = Math.min(120, (availW - gap * (party.length - 1)) / party.length);

    party.forEach((hero, i) => {
      const hx = totalPadding / 2 + i * (cardW + gap) + cardW / 2;

      const bg = this.add.rectangle(hx, 35, cardW, 65, 0x16213e, 0.85)
        .setStrokeStyle(1, 0x4a4a8a);
      this.partyContainer.add(bg);

      const heroColor = hero.id === 'warrior' ? 0xcc3333
        : hero.id === 'mage' ? 0x5555ee
        : hero.id === 'ranger' ? 0x33aa33
        : hero.id === 'cleric' ? 0xeeee33
        : 0x9933cc;
      const sprite = this.add.rectangle(hx, 18, 28, 28, heroColor)
        .setStrokeStyle(1, 0xffffff, 0.3);
      this.partyContainer.add(sprite);

      const name = this.add.text(hx, 38, hero.name, {
        fontSize: '9px',
        color: '#cccccc',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.partyContainer.add(name);

      const barX = hx - cardW / 2 + 6;
      const bar = new ProgressBar(this, barX, 52, cardW - 12, 8, {
        fillColor: 0x44aa44,
        bgColor: 0x222211,
      });
      bar.setProgress(1);
      this.partyContainer.add(bar);

      this.partyBars.set(hero.id, { bar, nameText: name, sprite, containerX: hx, containerY: 18 });
    });
  }

  private startBattle(): void {
    if (this.inBattle) return;

    const party = GameStateManager.getPartyHeroes();
    if (party.length === 0) {
      this.combatLog.setText('You need heroes in your party!');
      return;
    }

    const dungeon = GameStateManager.getDungeon();
    this.currentEnemy = this.dungeonSystem.generateEnemy(dungeon.currentFloor);
    this.combatState = this.combatSystem.initCombat(this.currentEnemy);
    this.inBattle = true;

    // Show enemy
    const enemyColor = this.currentEnemy.definition.color ?? 0x666666;
    this.enemySprite.setFillStyle(enemyColor).setAlpha(1);
    this.enemyNameText.setText(
      this.currentEnemy.isBoss
        ? `[BOSS] ${this.currentEnemy.definition.name}`
        : this.currentEnemy.definition.name
    );
    this.updateEnemyHP();
    this.updatePartyHP();

    this.startBattleBtn.setVisible(false);
    this.autoBattleBtn.setVisible(false);
    this.retreatBtn.setVisible(true);
    this.combatLog.setText('Battle started!');

    this.combatTimer = this.time.addEvent({
      delay: 1500,
      loop: true,
      callback: () => this.processCombatTurn(),
    });
  }

  private processCombatTurn(): void {
    if (!this.combatState || this.combatState.isOver) return;

    const result = this.combatSystem.processTurn(this.combatState);
    if (result) {
      if (result.target === 'enemy') {
        this.tweens.add({
          targets: this.enemySprite,
          fillColor: 0xff0000,
          duration: 100,
          yoyo: true,
        });
        this.showDamageNumber(this.enemySprite.x, this.enemySprite.y - 30, result.damage, '#ffaa44');
        const heroName = GameStateManager.getHero(result.attacker)?.name ?? 'Hero';
        this.combatLog.setText(`${heroName} deals ${result.damage} damage!`);
      } else {
        const heroBar = this.partyBars.get(result.target);
        if (heroBar) {
          this.tweens.add({
            targets: heroBar.sprite,
            fillColor: 0xff0000,
            duration: 100,
            yoyo: true,
          });
          // Calculate the world y position of the sprite inside the party container
          const spriteWorldY = this.partyContainer.y + heroBar.containerY;
          this.showDamageNumber(heroBar.containerX, spriteWorldY - 10, result.damage, '#ff4444');
        }
        const heroName = GameStateManager.getHero(result.target)?.name ?? 'Hero';
        this.combatLog.setText(`Enemy deals ${result.damage} to ${heroName}!`);
      }

      this.updateEnemyHP();
      this.updatePartyHP();
    }

    if (this.combatState.isOver) {
      this.stopCombat();
      if (this.combatState.victory) {
        this.onVictory();
      } else {
        this.onDefeat();
      }
    }
  }

  private showDamageNumber(x: number, y: number, damage: number, color: string): void {
    const dmgText = this.add.text(x, y, `-${damage}`, {
      fontSize: '16px',
      color,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: dmgText,
      y: y - 40,
      alpha: 0,
      duration: 700,
      onComplete: () => dmgText.destroy(),
    });
  }

  private updateEnemyHP(): void {
    if (!this.combatState || !this.currentEnemy) return;
    const hp = this.combatState.enemy.hp;
    const maxHP = this.combatState.enemy.maxHP;
    this.enemyHPBar.setProgress(hp / maxHP);
    this.enemyHPText.setText(`${formatNumber(hp)} / ${formatNumber(maxHP)}`);

    if (hp / maxHP < 0.3) this.enemyHPBar.setFillColor(0xff2222);
    else if (hp / maxHP < 0.6) this.enemyHPBar.setFillColor(0xffaa22);
    else this.enemyHPBar.setFillColor(0xff4444);
  }

  private updatePartyHP(): void {
    if (!this.combatState) return;
    for (const [heroId, ui] of this.partyBars) {
      const hp = this.combatState.partyHP[heroId] ?? 0;
      const maxHP = this.combatState.partyMaxHP[heroId] ?? 1;
      ui.bar.setProgress(hp / maxHP);

      if (hp <= 0) {
        ui.sprite.setAlpha(0.3);
        ui.bar.setFillColor(0x666666);
      } else if (hp / maxHP < 0.3) {
        ui.bar.setFillColor(0xff2222);
      } else {
        ui.bar.setFillColor(0x44aa44);
      }
    }
  }

  private onVictory(): void {
    if (!this.currentEnemy) return;

    this.dungeonSystem.onEnemyDefeated(this.currentEnemy);
    this.resultContainer.removeAll(true);
    this.resultContainer.setVisible(true);

    const rw = this.scale.width - 40;
    const rh = 180;

    const overlay = this.add.rectangle(0, 0, rw, rh, 0x0a2a0a, 0.95)
      .setStrokeStyle(2, 0x44aa44);
    this.resultContainer.add(overlay);

    const victoryText = this.add.text(0, -55, 'VICTORY!', {
      fontSize: '22px',
      color: '#44ff44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.resultContainer.add(victoryText);

    const rewardsText = this.add.text(0, -15,
      `Gold: +${formatNumber(this.currentEnemy.goldReward)}\nXP: +${formatNumber(this.currentEnemy.xpReward)}`, {
        fontSize: '14px',
        color: '#ffdd44',
        fontFamily: 'monospace',
        align: 'center',
      }).setOrigin(0.5);
    this.resultContainer.add(rewardsText);

    const dungeon = GameStateManager.getDungeon();
    const floorAdvText = this.add.text(0, 25, `Advancing to Floor ${dungeon.currentFloor}`, {
      fontSize: '11px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.resultContainer.add(floorAdvText);

    // Continue button - added to resultContainer
    const continueBtn = this.add.rectangle(0, 60, 120, 36, 0x44aa44)
      .setStrokeStyle(1, 0xffffff, 0.3)
      .setInteractive({ useHandCursor: true });
    this.resultContainer.add(continueBtn);

    const continueLbl = this.add.text(0, 60, 'Continue', {
      fontSize: '13px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.resultContainer.add(continueLbl);

    continueBtn.on('pointerdown', () => {
      this.resultContainer.setVisible(false);
      this.resetBattleUI();
      this.floorText.setText(`Floor ${dungeon.currentFloor}`);
      this.updateBossWarning();
      if (dungeon.autoBattle) {
        this.time.delayedCall(500, () => this.startBattle());
      }
    });
  }

  private onDefeat(): void {
    this.resultContainer.removeAll(true);
    this.resultContainer.setVisible(true);

    const rw = this.scale.width - 40;
    const rh = 160;

    const overlay = this.add.rectangle(0, 0, rw, rh, 0x2a0a0a, 0.95)
      .setStrokeStyle(2, 0xaa4444);
    this.resultContainer.add(overlay);

    const defeatText = this.add.text(0, -45, 'DEFEAT', {
      fontSize: '22px',
      color: '#ff4444',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.resultContainer.add(defeatText);

    const msgText = this.add.text(0, -10, 'Your party has fallen...', {
      fontSize: '13px',
      color: '#ccaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.resultContainer.add(msgText);

    // Retry button - in container
    const retryBg = this.add.rectangle(-60, 40, 100, 34, 0xaaaa44)
      .setStrokeStyle(1, 0xffffff, 0.3)
      .setInteractive({ useHandCursor: true });
    this.resultContainer.add(retryBg);
    const retryLbl = this.add.text(-60, 40, 'Retry', {
      fontSize: '13px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.resultContainer.add(retryLbl);
    retryBg.on('pointerdown', () => {
      this.resultContainer.setVisible(false);
      this.resetBattleUI();
      this.startBattle();
    });

    // Retreat button - in container
    const retreatBg = this.add.rectangle(60, 40, 100, 34, 0x883333)
      .setStrokeStyle(1, 0xffffff, 0.3)
      .setInteractive({ useHandCursor: true });
    this.resultContainer.add(retreatBg);
    const retreatLbl = this.add.text(60, 40, 'Retreat', {
      fontSize: '13px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.resultContainer.add(retreatLbl);
    retreatBg.on('pointerdown', () => {
      this.resultContainer.setVisible(false);
      this.resetBattleUI();
    });
  }

  private stopCombat(): void {
    if (this.combatTimer) {
      this.combatTimer.destroy();
      this.combatTimer = null;
    }
    this.inBattle = false;
  }

  private resetBattleUI(): void {
    this.enemySprite.setAlpha(0);
    this.enemyNameText.setText('');
    this.enemyHPText.setText('');
    this.enemyHPBar.setProgress(0);
    this.combatLog.setText('');

    this.startBattleBtn.setVisible(true);
    this.autoBattleBtn.setVisible(true);
    this.retreatBtn.setVisible(false);

    for (const [, ui] of this.partyBars) {
      ui.sprite.setAlpha(1);
      ui.bar.setProgress(1);
      ui.bar.setFillColor(0x44aa44);
    }
    this.buildPartyDisplay();
  }

  private toggleAutoBattle(): void {
    const dungeon = GameStateManager.getDungeon();
    (dungeon as { autoBattle: boolean }).autoBattle = !dungeon.autoBattle;
    this.autoBattleBtn.setText(dungeon.autoBattle ? 'Auto: ON' : 'Auto: OFF');
  }

  private updateBossWarning(): void {
    const dungeon = GameStateManager.getDungeon();
    const isBoss = dungeon.currentFloor % 10 === 0;
    this.bossWarning.setAlpha(isBoss ? 1 : 0);
    if (isBoss) {
      this.tweens.add({
        targets: this.bossWarning,
        alpha: 0.3,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }
  }
}
