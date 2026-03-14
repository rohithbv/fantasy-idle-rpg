import Phaser from 'phaser';

export class ScrollableList extends Phaser.GameObjects.Container {
  private scrollMask!: Phaser.Display.Masks.GeometryMask;
  private contentContainer: Phaser.GameObjects.Container;
  private viewHeight: number;
  private contentHeight: number = 0;
  private scrollY: number = 0;
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private dragStartScroll: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);
    this.viewHeight = height;

    this.contentContainer = scene.add.container(0, 0);
    this.add(this.contentContainer);

    const shape = scene.make.graphics({});
    shape.fillRect(x, y, width, height);
    this.scrollMask = shape.createGeometryMask();
    this.contentContainer.setMask(this.scrollMask);

    const hitArea = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.01);
    hitArea.setInteractive();
    this.add(hitArea);

    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.dragStartY = pointer.y;
      this.dragStartScroll = this.scrollY;
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;
      const dy = pointer.y - this.dragStartY;
      this.scrollTo(this.dragStartScroll - dy);
    });

    scene.input.on('pointerup', () => {
      this.isDragging = false;
    });

    scene.add.existing(this);
  }

  addItem(item: Phaser.GameObjects.GameObject): void {
    this.contentContainer.add(item);
  }

  setContentHeight(height: number): void {
    this.contentHeight = height;
  }

  scrollTo(y: number): void {
    const maxScroll = Math.max(0, this.contentHeight - this.viewHeight);
    this.scrollY = Phaser.Math.Clamp(y, 0, maxScroll);
    this.contentContainer.y = -this.scrollY;
  }

  clearItems(): void {
    this.contentContainer.removeAll(true);
    this.scrollY = 0;
    this.contentContainer.y = 0;
  }
}
