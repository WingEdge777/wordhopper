import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config/constants';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  parent: document.body,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
    },
  },
  scene: [BootScene],
};

new Phaser.Game(config);
