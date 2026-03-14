import Phaser from 'phaser';
import { SceneKey } from '../types/enums';
import { GameStateManager } from '../systems/GameStateManager';
import { SaveSystem } from '../systems/SaveSystem';
import { AudioManager } from '../systems/AudioManager';
import { EventBus } from '../systems/EventBus';
import { GameEvents } from '../types/events';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { HUD_HEIGHT } from '../ui/HUD';

const TOP = HUD_HEIGHT + 4;

export class SettingsScene extends Phaser.Scene {
  private saveSystem!: SaveSystem;
  private musicVolText!: Phaser.GameObjects.Text;
  private sfxVolText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SceneKey.Settings });
  }

  create(): void {
    this.saveSystem = new SaveSystem();

    const cx = this.scale.width / 2;
    const w = this.scale.width;
    const h = this.scale.height;

    // Full opaque background
    this.add.rectangle(cx, h / 2, w, h, 0x0f1123);

    const titleY = TOP + 16;
    this.add.text(cx, titleY, 'SETTINGS', {
      fontSize: '20px',
      color: '#ffdd44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    new Button(this, 40, titleY, 60, 28, 'Back', () => {
      this.goBack();
    }, { fontSize: 12 });

    const settings = GameStateManager.getState().settings;
    let yOff = titleY + 40;

    // Music Volume
    this.add.text(cx, yOff, 'Music Volume', {
      fontSize: '13px', color: '#cccccc', fontFamily: 'monospace',
    }).setOrigin(0.5);
    yOff += 28;

    new Button(this, cx - 70, yOff, 44, 34, '-', () => {
      const vol = Math.max(0, GameStateManager.getState().settings.musicVolume - 0.1);
      AudioManager.setMusicVolume(Math.round(vol * 10) / 10);
      this.updateVolumeDisplays();
    }, { fontSize: 18, bgColor: 0x4a4a8a });

    this.musicVolText = this.add.text(cx, yOff, `${Math.round(settings.musicVolume * 100)}%`, {
      fontSize: '15px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    new Button(this, cx + 70, yOff, 44, 34, '+', () => {
      const vol = Math.min(1, GameStateManager.getState().settings.musicVolume + 0.1);
      AudioManager.setMusicVolume(Math.round(vol * 10) / 10);
      this.updateVolumeDisplays();
    }, { fontSize: 18, bgColor: 0x4a4a8a });

    yOff += 40;

    const musicMuteBtn = new Button(this, cx, yOff, 170, 34,
      settings.musicMuted ? 'Music: MUTED' : 'Music: ON', () => {
        AudioManager.toggleMusic();
        musicMuteBtn.setText(GameStateManager.getState().settings.musicMuted ? 'Music: MUTED' : 'Music: ON');
      }, { fontSize: 12, bgColor: settings.musicMuted ? 0x883333 : 0x338833 });

    yOff += 50;

    // SFX Volume
    this.add.text(cx, yOff, 'SFX Volume', {
      fontSize: '13px', color: '#cccccc', fontFamily: 'monospace',
    }).setOrigin(0.5);
    yOff += 28;

    new Button(this, cx - 70, yOff, 44, 34, '-', () => {
      const vol = Math.max(0, GameStateManager.getState().settings.sfxVolume - 0.1);
      AudioManager.setSFXVolume(Math.round(vol * 10) / 10);
      this.updateVolumeDisplays();
    }, { fontSize: 18, bgColor: 0x4a4a8a });

    this.sfxVolText = this.add.text(cx, yOff, `${Math.round(settings.sfxVolume * 100)}%`, {
      fontSize: '15px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    new Button(this, cx + 70, yOff, 44, 34, '+', () => {
      const vol = Math.min(1, GameStateManager.getState().settings.sfxVolume + 0.1);
      AudioManager.setSFXVolume(Math.round(vol * 10) / 10);
      this.updateVolumeDisplays();
    }, { fontSize: 18, bgColor: 0x4a4a8a });

    yOff += 40;

    const sfxMuteBtn = new Button(this, cx, yOff, 170, 34,
      settings.sfxMuted ? 'SFX: MUTED' : 'SFX: ON', () => {
        AudioManager.toggleSFX();
        sfxMuteBtn.setText(GameStateManager.getState().settings.sfxMuted ? 'SFX: MUTED' : 'SFX: ON');
      }, { fontSize: 12, bgColor: settings.sfxMuted ? 0x883333 : 0x338833 });

    yOff += 60;

    new Button(this, cx, yOff, 190, 40, 'Save Game', () => {
      this.saveSystem.save();
      EventBus.emit(GameEvents.TOAST, 'Game saved!');
    }, { fontSize: 14, bgColor: 0x44aa44 });

    yOff += 55;

    new Button(this, cx, yOff, 190, 40, 'Delete Save', () => {
      this.showDeleteConfirmation();
    }, { fontSize: 14, bgColor: 0x883333 });

    yOff += 65;

    this.add.text(cx, yOff, 'Fantasy Idle RPG v1.0.0', {
      fontSize: '11px', color: '#444466', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add.text(cx, yOff + 18, 'Built with Phaser 3', {
      fontSize: '10px', color: '#333344', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  private updateVolumeDisplays(): void {
    const settings = GameStateManager.getState().settings;
    this.musicVolText.setText(`${Math.round(settings.musicVolume * 100)}%`);
    this.sfxVolText.setText(`${Math.round(settings.sfxVolume * 100)}%`);
  }

  private showDeleteConfirmation(): void {
    let modalRef: Modal | null = null;
    modalRef = new Modal(this, 280, 180, 'Delete Save?',
      'Permanently delete all progress.\nThis cannot be undone!',
      [
        { text: 'Cancel', callback: () => modalRef?.close() },
        {
          text: 'Delete',
          callback: () => {
            modalRef?.close();
            this.saveSystem.deleteSave();
            EventBus.emit(GameEvents.TOAST, 'Save data deleted.');
            this.scene.stop(SceneKey.HUD);
            this.scene.stop(SceneKey.Town);
            this.scene.start(SceneKey.MainMenu);
          },
        },
      ]
    );
  }

  private goBack(): void {
    if (this.scene.isActive(SceneKey.Town)) {
      this.scene.stop();
    } else {
      this.scene.start(SceneKey.MainMenu);
    }
  }
}
