import Phaser from 'phaser';
import { SceneKey } from '../types/enums';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.Boot });
  }

  create(): void {
    // Generate loading bar background texture
    const barBg = this.make.graphics({ x: 0, y: 0 });
    barBg.fillStyle(0x222244, 1);
    barBg.fillRoundedRect(0, 0, 300, 30, 8);
    barBg.lineStyle(2, 0x4a4a8a, 1);
    barBg.strokeRoundedRect(0, 0, 300, 30, 8);
    barBg.generateTexture('loading_bar_bg', 300, 30);
    barBg.destroy();

    // Generate loading bar fill texture
    const barFill = this.make.graphics({ x: 0, y: 0 });
    barFill.fillStyle(0x44aaff, 1);
    barFill.fillRoundedRect(0, 0, 296, 26, 6);
    barFill.generateTexture('loading_bar_fill', 296, 26);
    barFill.destroy();

    // Generate simple logo/title graphic
    const logo = this.make.graphics({ x: 0, y: 0 });
    // Shield shape background
    logo.fillStyle(0x2a1a4e, 1);
    logo.fillRoundedRect(0, 0, 200, 80, 12);
    logo.lineStyle(3, 0xffdd44, 1);
    logo.strokeRoundedRect(0, 0, 200, 80, 12);
    // Decorative sword line
    logo.lineStyle(2, 0xccaa33, 0.8);
    logo.lineBetween(100, 10, 100, 70);
    logo.lineBetween(80, 25, 120, 25);
    // Corner gems
    logo.fillStyle(0xff4444, 1);
    logo.fillCircle(20, 20, 5);
    logo.fillStyle(0x4444ff, 1);
    logo.fillCircle(180, 20, 5);
    logo.fillStyle(0x44ff44, 1);
    logo.fillCircle(20, 60, 5);
    logo.fillStyle(0xffff44, 1);
    logo.fillCircle(180, 60, 5);
    logo.generateTexture('logo', 200, 80);
    logo.destroy();

    this.scene.start(SceneKey.Preload);
  }
}
