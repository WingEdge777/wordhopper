import Phaser from 'phaser';
import { FONT_BODY, FONT_DISPLAY, FONT_WORD } from './config/colors';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { DeathScene } from './scenes/DeathScene';
import { ShareCardScene } from './scenes/ShareCardScene';
import { applyRenderZoom, getDisplaySize, getRenderSize } from './config/display';

export { getDisplaySize, getRenderResolution, getRenderSize } from './config/display';

export function createGameConfig(
  parent: HTMLElement,
  viewportWidth = window.innerWidth,
  devicePixelRatio = window.devicePixelRatio || 1
): Phaser.Types.Core.GameConfig {
  const displaySize = getDisplaySize(viewportWidth);
  const renderSize = getRenderSize(displaySize.width, devicePixelRatio);

  return {
    type: Phaser.AUTO,
    width: renderSize.width,
    height: renderSize.height,
    parent,
    backgroundColor: '#ECFDF5',
    roundPixels: true,
    autoRound: false,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: renderSize.width,
      height: renderSize.height,
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

async function waitForGameFonts(): Promise<void> {
  if (!('fonts' in document) || typeof document.fonts.load !== 'function') {
    return;
  }

  await document.fonts.ready;

  await Promise.allSettled([
    document.fonts.load(`700 40px ${FONT_DISPLAY}`),
    document.fonts.load(`700 18px ${FONT_BODY}`),
    document.fonts.load(`400 18px ${FONT_BODY}`),
    document.fonts.load(`700 20px ${FONT_WORD}`),
  ]);
}

function resizeGame(game: Phaser.Game): void {
  const renderSize = getRenderSize(getDisplaySize().width);

  game.scale.resize(renderSize.width, renderSize.height);

  for (const scene of game.scene.getScenes(true)) {
    applyRenderZoom(scene);
  }
}

if (isMobile) {
  document.getElementById('mobile-blocker')!.style.display = 'flex';
} else if (gameShell) {
  waitForGameFonts().then(() => {
    const game = new Phaser.Game(createGameConfig(gameShell));

    window.addEventListener('resize', () => {
      resizeGame(game);
    });
  });
} else {
  throw new Error('Missing #game-shell container for Phaser game');
}
