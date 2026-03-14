import Phaser from 'phaser';

export class ToastNotification {
  static show(scene: Phaser.Scene, message: string, duration: number = 2000): void {
    const cx = scene.scale.width / 2;
    const y = scene.scale.height - 100;

    const bg = scene.add.rectangle(cx, y, message.length * 9 + 40, 36, 0x222244, 0.9)
      .setStrokeStyle(1, 0x4a4a8a)
      .setDepth(950);

    const text = scene.add.text(cx, y, message, {
      fontSize: '13px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(951);

    scene.tweens.add({
      targets: [bg, text],
      alpha: 0,
      y: y - 30,
      delay: duration,
      duration: 500,
      onComplete: () => {
        bg.destroy();
        text.destroy();
      },
    });
  }
}
