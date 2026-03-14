import Phaser from 'phaser';

export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private callback: () => void;
  private isDisabled: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    callback: () => void,
    options: { fontSize?: number; bgColor?: number; textColor?: string; cornerRadius?: number } = {}
  ) {
    super(scene, x, y);
    const { fontSize = 16, bgColor = 0x4a4a8a, textColor = '#ffffff' } = options;

    this.callback = callback;

    this.bg = scene.add.rectangle(0, 0, width, height, bgColor).setOrigin(0.5);
    this.bg.setStrokeStyle(2, 0xffffff, 0.3);
    this.add(this.bg);

    this.label = scene.add.text(0, 0, text, {
      fontSize: `${fontSize}px`,
      color: textColor,
      fontFamily: 'monospace',
      align: 'center',
    }).setOrigin(0.5);
    this.add(this.label);

    this.setSize(width, height);
    this.setInteractive({ useHandCursor: true })
      .on('pointerdown', this.onDown, this)
      .on('pointerup', this.onUp, this)
      .on('pointerout', this.onOut, this);

    scene.add.existing(this);
  }

  private onDown(): void {
    if (this.isDisabled) return;
    this.setScale(0.95);
    this.bg.setFillStyle(0x6a6aaa);
  }

  private onUp(): void {
    if (this.isDisabled) return;
    this.setScale(1);
    this.bg.setFillStyle(0x4a4a8a);
    this.callback();
  }

  private onOut(): void {
    this.setScale(1);
    this.bg.setFillStyle(this.isDisabled ? 0x333355 : 0x4a4a8a);
  }

  setText(text: string): void {
    this.label.setText(text);
  }

  setDisabled(disabled: boolean): void {
    this.isDisabled = disabled;
    this.bg.setFillStyle(disabled ? 0x333355 : 0x4a4a8a);
    this.label.setAlpha(disabled ? 0.5 : 1);
  }
}
