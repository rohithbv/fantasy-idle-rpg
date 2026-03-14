import { GameStateManager } from './GameStateManager';

class AudioManagerImpl {
  private scene: Phaser.Scene | null = null;
  private currentBGM: Phaser.Sound.BaseSound | null = null;

  init(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  playBGM(key: string): void {
    if (!this.scene) return;
    const settings = GameStateManager.getState().settings;
    if (settings.musicMuted) return;

    if (this.currentBGM) {
      this.currentBGM.stop();
    }

    if (this.scene.cache.audio.exists(key)) {
      this.currentBGM = this.scene.sound.add(key, {
        volume: settings.musicVolume,
        loop: true,
      });
      this.currentBGM.play();
    }
  }

  stopBGM(): void {
    if (this.currentBGM) {
      this.currentBGM.stop();
      this.currentBGM = null;
    }
  }

  playSFX(key: string): void {
    if (!this.scene) return;
    const settings = GameStateManager.getState().settings;
    if (settings.sfxMuted) return;

    if (this.scene.cache.audio.exists(key)) {
      this.scene.sound.play(key, { volume: settings.sfxVolume });
    }
  }

  setMusicVolume(vol: number): void {
    const state = GameStateManager.getState();
    (state.settings as { musicVolume: number }).musicVolume = vol;
    if (this.currentBGM && 'setVolume' in this.currentBGM) {
      (this.currentBGM as Phaser.Sound.WebAudioSound).setVolume(vol);
    }
  }

  setSFXVolume(vol: number): void {
    const state = GameStateManager.getState();
    (state.settings as { sfxVolume: number }).sfxVolume = vol;
  }

  toggleMusic(): void {
    const state = GameStateManager.getState();
    (state.settings as { musicMuted: boolean }).musicMuted = !state.settings.musicMuted;
    if (state.settings.musicMuted) {
      this.stopBGM();
    }
  }

  toggleSFX(): void {
    const state = GameStateManager.getState();
    (state.settings as { sfxMuted: boolean }).sfxMuted = !state.settings.sfxMuted;
  }
}

export const AudioManager = new AudioManagerImpl();
