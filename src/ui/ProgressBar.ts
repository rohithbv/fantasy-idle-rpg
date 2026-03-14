import Phaser from 'phaser';

export class ProgressBar extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private fill: Phaser.GameObjects.Rectangle;
  private barWidth: number;
  private barHeight: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    options: { bgColor?: number; fillColor?: number; borderColor?: number } = {}
  ) {
    super(scene, x, y);
    const { bgColor = 0x222244, fillColor = 0x44aa44, borderColor = 0x4a4a8a } = options;

    this.barWidth = width;
    this.barHeight = height;

    this.bg = scene.add.rectangle(0, 0, width, height, bgColor).setOrigin(0, 0.5);
    this.bg.setStrokeStyle(1, borderColor);
    this.add(this.bg);

    this.fill = scene.add.rectangle(0, 0, 0, height - 2, fillColor).setOrigin(0, 0.5);
    this.add(this.fill);

    scene.add.existing(this);
  }

  setProgress(value: number): void {
    const clamped = Phaser.Math.Clamp(value, 0, 1);
    this.fill.width = (this.barWidth - 2) * clamped;
  }

  setFillColor(color: number): void {
    this.fill.setFillStyle(color);
  }
}
