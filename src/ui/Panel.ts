import Phaser from 'phaser';

export class Panel extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    options: { bgColor?: number; alpha?: number; borderColor?: number; borderWidth?: number } = {}
  ) {
    super(scene, x, y);
    const { bgColor = 0x16213e, alpha = 0.9, borderColor = 0x4a4a8a, borderWidth = 2 } = options;

    this.bg = scene.add.rectangle(0, 0, width, height, bgColor, alpha).setOrigin(0.5);
    this.bg.setStrokeStyle(borderWidth, borderColor);
    this.add(this.bg);

    scene.add.existing(this);
  }

  resize(width: number, height: number): void {
    this.bg.setSize(width, height);
  }
}
