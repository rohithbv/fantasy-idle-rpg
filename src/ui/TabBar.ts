import Phaser from 'phaser';

export interface TabConfig {
  key: string;
  label: string;
  icon?: string;
}

export class TabBar extends Phaser.GameObjects.Container {
  private tabs: Phaser.GameObjects.Container[] = [];
  private activeTab: string = '';
  private onTabChange: (key: string) => void;

  constructor(
    scene: Phaser.Scene,
    tabConfigs: TabConfig[],
    onTabChange: (key: string) => void
  ) {
    const y = scene.scale.height - 40;
    super(scene, 0, y);
    this.onTabChange = onTabChange;

    const totalWidth = scene.scale.width;
    const tabWidth = totalWidth / tabConfigs.length;

    // Background
    const bg = scene.add.rectangle(totalWidth / 2, 0, totalWidth, 60, 0x0f1123, 0.95);
    bg.setStrokeStyle(1, 0x4a4a8a, 0.5);
    this.add(bg);

    tabConfigs.forEach((config, i) => {
      const tx = tabWidth * i + tabWidth / 2;
      const tab = scene.add.container(tx, 0);

      const hitArea = scene.add.rectangle(0, 0, tabWidth - 4, 56, 0x000000, 0.01);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => this.selectTab(config.key));
      tab.add(hitArea);

      const label = scene.add.text(0, 8, config.label, {
        fontSize: '11px',
        color: '#888888',
        fontFamily: 'monospace',
      }).setOrigin(0.5).setName('label');
      tab.add(label);

      const indicator = scene.add.rectangle(0, -25, tabWidth - 20, 3, 0xffdd44, 0)
        .setName('indicator');
      tab.add(indicator);

      tab.setData('key', config.key);
      this.tabs.push(tab);
      this.add(tab);
    });

    this.setDepth(900);
    scene.add.existing(this);
  }

  selectTab(key: string): void {
    this.activeTab = key;
    this.tabs.forEach(tab => {
      const isActive = tab.getData('key') === key;
      const label = tab.getByName('label') as Phaser.GameObjects.Text;
      const indicator = tab.getByName('indicator') as Phaser.GameObjects.Rectangle;
      if (label) label.setColor(isActive ? '#ffdd44' : '#888888');
      if (indicator) indicator.setAlpha(isActive ? 1 : 0);
    });
    this.onTabChange(key);
  }

  getActiveTab(): string {
    return this.activeTab;
  }
}
