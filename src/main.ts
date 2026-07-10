import Phaser from 'phaser';
import { FONT_BODY, FONT_DISPLAY, FONT_WORD } from './config/colors';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { DeathScene } from './scenes/DeathScene';
import { ShareCardScene } from './scenes/ShareCardScene';
import { applyRenderZoom, getDisplaySize, getRenderSize, isMobile, isIOS, getMobileScreenHeight } from './config/display';
import {
  dismissNicknameHint,
  ensureNickname,
  setNickname,
  shouldShowNicknameHint,
} from './config/nickname';
import { setupLeaderboardOverlay } from './ui/leaderboard';
import { bindSoundGame, setupMuteToggle, unlockAudio, isMuted } from './audio/SoundManager';

export { getDisplaySize, getRenderResolution, getRenderScale, getRenderSize, isMobile, isIOS } from './config/display';

export function createGameConfig(
  parent: HTMLElement,
  viewportWidth = window.innerWidth,
  devicePixelRatio = window.devicePixelRatio || 1
): Phaser.Types.Core.GameConfig {
  const displaySize = getDisplaySize(viewportWidth);
  const renderSize = getRenderSize(displaySize.width, displaySize.height, devicePixelRatio);

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

const mobile = isMobile();
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

function setupNicknameInput(): void {
  const input = document.getElementById('nickname-input') as HTMLInputElement | null;
  const hint = document.getElementById('nickname-hint');
  if (!input) return;

  const { nickname, isNew } = ensureNickname();
  input.value = nickname;

  const hideHint = (): void => {
    if (hint) hint.hidden = true;
    dismissNicknameHint();
  };

  if (isNew && shouldShowNicknameHint() && hint) {
    hint.hidden = false;
    window.setTimeout(hideHint, 4000);
  } else if (hint) {
    hint.hidden = true;
  }

  input.addEventListener('focus', hideHint);
  input.addEventListener('blur', () => {
    input.value = setNickname(input.value);
  });
  input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      input.blur();
    }
  });
}

function resizeGame(game: Phaser.Game): void {
  const displaySize = getDisplaySize();
  const renderSize = getRenderSize(displaySize.width, displaySize.height);

  game.scale.resize(renderSize.width, renderSize.height);

  for (const scene of game.scene.getScenes(true)) {
    applyRenderZoom(scene);
  }
}

if (gameShell) {
  setupNicknameInput();
  setupLeaderboardOverlay();
  setupMuteToggle();

  if (mobile) {
    const blocker = document.getElementById('mobile-blocker');
    if (blocker) blocker.style.display = 'none';
    gameShell.style.height = Math.round(getMobileScreenHeight() * 0.45) + 'px';
  }

  waitForGameFonts().then(() => {
    const game = new Phaser.Game(createGameConfig(gameShell));
    bindSoundGame(game);
    if (game.sound) {
      game.sound.mute = isMuted();
    }

    const unlockOnce = (): void => {
      unlockAudio();
      window.removeEventListener('pointerdown', unlockOnce);
      window.removeEventListener('keydown', unlockOnce);
    };
    window.addEventListener('pointerdown', unlockOnce);
    window.addEventListener('keydown', unlockOnce);

    window.__wordhopper_setGameInputEnabled = (enabled: boolean) => {
      game.input.enabled = enabled;
    };

    if (isIOS()) {
      const iosBar = document.getElementById('ios-input-bar');
      const iosField = document.getElementById('ios-input-field') as HTMLInputElement | null;

      document.body.classList.add('ios-layout');
      if (iosBar && iosField) {
        iosBar.classList.add('active');
        iosField.addEventListener('input', (e: InputEvent) => {
          const ch = e.data;
          if (ch && ch.length === 1) {
            window.__wordhopper_key?.(ch);
          }
          iosField.value = '';
        });
        iosField.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === ' ') {
            e.preventDefault();
            window.__wordhopper_jump?.();
            iosField.value = '';
          }
        });
        const gameCanvas = gameShell.querySelector('canvas');
        if (gameCanvas) {
          gameCanvas.addEventListener('touchstart', () => { iosField.focus(); }, { passive: true });
        }
      }
    }

    if (mobile) {
      const jumpBtn = document.getElementById('jump-btn');

      if (jumpBtn) {
        jumpBtn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          window.__wordhopper_jump?.();
        });
      }

      const pauseBtn = document.getElementById('pause-btn');
      if (pauseBtn) {
        pauseBtn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          window.__wordhopper_togglePause?.();
        });
      }

      let lastOrientation = screen.orientation?.type || '';
      screen.orientation?.addEventListener('change', () => {
        const current = screen.orientation?.type || '';
        if (current !== lastOrientation) {
          lastOrientation = current;
          const h = Math.round(getMobileScreenHeight() * 0.45);
          gameShell.style.height = h + 'px';
          resizeGame(game);
        }
      });
    } else {
      window.addEventListener('resize', () => {
        resizeGame(game);
      });
    }
  });
} else {
  throw new Error('Missing #game-shell container for Phaser game');
}
