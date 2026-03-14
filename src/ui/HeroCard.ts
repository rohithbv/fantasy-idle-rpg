import Phaser from 'phaser';
import { HeroState } from '../models/GameState';
import { Panel } from './Panel';

export class HeroCard extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, hero: HeroState, width: number = 160, height: number = 200) {
    super(scene, x, y);

    const bg = scene.add.rectangle(0, 0, width, height, 0x1a1a3e, 0.9)
      .setStrokeStyle(2, hero.inParty ? 0xffdd44 : 0x4a4a8a);
    this.add(bg);

    // Hero icon placeholder
    const icon = scene.add.rectangle(0, -50, 48, 48, 0x4a4a8a)
      .setStrokeStyle(1, 0xffffff, 0.3);
    this.add(icon);

    const nameText = scene.add.text(0, -15, hero.name, {
      fontSize: '14px', color: '#ffdd44', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(nameText);

    const classText = scene.add.text(0, 5, hero.classType, {
      fontSize: '11px', color: '#aaaacc', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add(classText);

    const levelText = scene.add.text(0, 25, `Lv. ${hero.level}`, {
      fontSize: '12px', color: '#88ff88', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add(levelText);

    const statsText = scene.add.text(0, 50, `HP:${hero.baseHP} ATK:${hero.baseATK} DEF:${hero.baseDEF}`, {
      fontSize: '9px', color: '#999999', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add(statsText);

    const statusText = scene.add.text(0, 75, hero.inParty ? 'IN PARTY' : 'RESERVE', {
      fontSize: '10px', color: hero.inParty ? '#44ff44' : '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add(statusText);

    scene.add.existing(this);
  }
}
