import Phaser from 'phaser';

export class NumberPopup {
  static show(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    options: { color?: string; fontSize?: number; duration?: number; isCrit?: boolean } = {}
  ): void {
    const { color = '#ffdd44', fontSize = 18, duration = 800, isCrit = false } = options;

    const size = isCrit ? fontSize * 1.5 : fontSize;
    const popup = scene.add.text(x, y, text, {
      fontSize: `${size}px`,
      color: isCrit ? '#ff4444' : color,
      fontFamily: 'monospace',
      fontStyle: isCrit ? 'bold' : 'normal',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(800);

    scene.tweens.add({
      targets: popup,
      y: y - 60,
      alpha: 0,
      scale: isCrit ? 1.3 : 1,
      duration,
      ease: 'Power2',
      onComplete: () => popup.destroy(),
    });
  }
}
