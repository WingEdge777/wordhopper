import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { DeathScene } from './scenes/DeathScene';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config/constants';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  parent: document.body,
  backgroundColor: '#0f172a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
    },
  },
  scene: [BootScene, MenuScene, GameScene, DeathScene],
};

new Phaser.Game(config);
