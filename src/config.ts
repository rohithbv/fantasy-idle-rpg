import Phaser from 'phaser';
import { SceneKey } from './types/enums';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { TownScene } from './scenes/TownScene';
import { ShopScene } from './scenes/ShopScene';
import { HeroScene } from './scenes/HeroScene';
import { DungeonScene } from './scenes/DungeonScene';
import { MicroGameSelectScene } from './scenes/MicroGameSelectScene';
import { Match3Scene } from './scenes/microgames/Match3Scene';
import { MemoryMatchScene } from './scenes/microgames/MemoryMatchScene';
import { SimonSaysScene } from './scenes/microgames/SimonSaysScene';
import { PrestigeScene } from './scenes/PrestigeScene';
import { SettingsScene } from './scenes/SettingsScene';
import { HUDScene } from './ui/HUD';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 390,
    height: 844,
    min: {
      width: 320,
      height: 480,
    },
    max: {
      width: 480,
      height: 1024,
    },
  },
  backgroundColor: '#1a1a2e',
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
  },
  input: {
    activePointers: 3,
  },
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    TownScene,
    ShopScene,
    HeroScene,
    DungeonScene,
    MicroGameSelectScene,
    Match3Scene,
    MemoryMatchScene,
    SimonSaysScene,
    PrestigeScene,
    SettingsScene,
    HUDScene,
  ],
};
