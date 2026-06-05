import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { DeathScene } from './scenes/DeathScene';
import { ShareCardScene } from './scenes/ShareCardScene';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config/constants';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  parent: document.body,
  backgroundColor: '#ECFDF5',
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
    },
  },
  render: {
    antialias: true,
    antialiasGL: true
  },
  scene: [BootScene, MenuScene, GameScene, DeathScene, ShareCardScene],
};

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

if (isMobile) {
  document.getElementById('mobile-blocker')!.style.display = 'flex';
} else {
  document.fonts.ready.then(() => {
    new Phaser.Game(config);
  });
}
