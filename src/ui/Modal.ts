import Phaser from 'phaser';
import { Button } from './Button';
import { Panel } from './Panel';

export class Modal extends Phaser.GameObjects.Container {
  private overlay: Phaser.GameObjects.Rectangle;
  private panel: Panel;

  constructor(
    scene: Phaser.Scene,
    width: number,
    height: number,
    title: string,
    body: string,
    buttons: { text: string; callback: () => void }[]
  ) {
    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2;
    super(scene, cx, cy);

    this.overlay = scene.add.rectangle(0, 0, scene.scale.width * 2, scene.scale.height * 2, 0x000000, 0.6);
    this.overlay.setInteractive(); // blocks clicks behind
    this.add(this.overlay);

    this.panel = new Panel(scene, 0, 0, width, height, { bgColor: 0x1a1a3e });
    this.add(this.panel);

    const titleText = scene.add.text(0, -height / 2 + 30, title, {
      fontSize: '20px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(titleText);

    const bodyText = scene.add.text(0, -20, body, {
      fontSize: '14px',
      color: '#cccccc',
      fontFamily: 'monospace',
      wordWrap: { width: width - 40 },
      align: 'center',
    }).setOrigin(0.5);
    this.add(bodyText);

    const btnY = height / 2 - 40;
    const btnSpacing = width / (buttons.length + 1);
    buttons.forEach((b, i) => {
      const bx = -width / 2 + btnSpacing * (i + 1);
      new Button(scene, bx, btnY, 100, 36, b.text, b.callback, { fontSize: 14 });
      // Button adds itself to scene, we need to move it into our container
    });

    this.setDepth(1000);
    scene.add.existing(this);
  }

  close(): void {
    this.destroy();
  }
}
