import Phaser from 'phaser';
import { gameConfig } from './config';
import { preventZoom } from './utils/MobileUtils';

preventZoom();

const game = new Phaser.Game(gameConfig);

// Handle resize
window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});
