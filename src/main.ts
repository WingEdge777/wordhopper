import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { DeathScene } from './scenes/DeathScene';
import { ShareCardScene } from './scenes/ShareCardScene';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config/constants';

const MAX_RENDER_RESOLUTION = 2;

export function getRenderResolution(devicePixelRatio = window.devicePixelRatio || 1): number {
  return Math.min(Math.max(devicePixelRatio, 1), MAX_RENDER_RESOLUTION);
}

export function createGameConfig(
  parent: HTMLElement,
  devicePixelRatio = window.devicePixelRatio || 1
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    parent,
    backgroundColor: '#ECFDF5',
    roundPixels: true,
    autoRound: false,
    resolution: getRenderResolution(devicePixelRatio),
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
      },
    },
    render: {
      antialias: true,
      antialiasGL: true,
    },
    scene: [BootScene, MenuScene, GameScene, DeathScene, ShareCardScene],
  };
}

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
const gameShell = document.getElementById('game-shell');

if (isMobile) {
  document.getElementById('mobile-blocker')!.style.display = 'flex';
} else if (gameShell) {
  document.fonts.ready.then(() => {
    new Phaser.Game(createGameConfig(gameShell));
  });
} else {
  throw new Error('Missing #game-shell container for Phaser game');
}
