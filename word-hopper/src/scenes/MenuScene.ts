import Phaser from 'phaser';
import { Difficulty } from '../config/constants';
import { COLORS, FONT_DISPLAY, FONT_BODY } from '../config/colors';
import { colorToHex } from '../utils/PixelArt';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants';

export class MenuScene extends Phaser.Scene {
  private selectedDifficulty: Difficulty = 'easy';
  private difficultyBtns: Record<Difficulty, Phaser.GameObjects.Container> = {} as any;
  private gameInputHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.selectedDifficulty = 'easy';
    this.difficultyBtns = {} as any;

    const { width, height } = this.cameras.main;

    const skyGfx = this.add.graphics();
    for (let y = 0; y < height; y++) {
      const t = y / height;
      const r = Math.round(0x0f * (1 - t) + 0x33 * t);
      const g = Math.round(0x17 * (1 - t) + 0x41 * t);
      const b = Math.round(0x2a * (1 - t) + 0x55 * t);
      skyGfx.fillStyle((r << 16) | (g << 8) | b);
      skyGfx.fillRect(0, y, width, 1);
    }

    const starsGfx = this.add.graphics();
    for (let i = 0; i < 15; i++) {
      starsGfx.fillStyle(COLORS.STAR, 1);
      const sx = Math.random() * width;
      const sy = Math.random() * height * 0.5;
      starsGfx.fillRect(sx, sy, 2, 2);
    }

    const moonX = width - 50;
    const moonY = 50;
    const moonGlow = this.add.graphics();
    moonGlow.fillStyle(COLORS.MOON, 0.15);
    moonGlow.fillCircle(moonX, moonY, 22);
    moonGlow.fillStyle(COLORS.MOON, 1);
    moonGlow.fillCircle(moonX, moonY, 10);

    this.add.text(width / 2, height * 0.12, 'WORD HOPPER', {
      fontSize: '22px',
      fontFamily: FONT_DISPLAY,
      color: colorToHex(COLORS.PRIMARY),
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.22, 'Type to survive. Jump to thrive.', {
      fontSize: '14px',
      fontFamily: FONT_BODY,
      color: colorToHex(COLORS.TEXT_SECONDARY),
    }).setOrigin(0.5);

    const frog = this.add.graphics();
    const fx = width / 2 - 8;
    const fy = height * 0.30;
    const p = 2;
    frog.fillStyle(COLORS.FROG_BODY);
    frog.fillRect(fx + p, fy, p * 3, p * 2);
    frog.fillRect(fx, fy + p, p * 5, p * 2);
    frog.fillStyle(COLORS.FROG_EYE);
    frog.fillRect(fx + p, fy, p, p);
    frog.fillRect(fx + p * 3, fy, p, p);
    frog.fillStyle(COLORS.FROG_CHEEK);
    frog.fillRect(fx, fy + p * 2, p, p);
    frog.fillRect(fx + p * 4, fy + p * 2, p, p);
    frog.fillStyle(COLORS.FROG_LEG);
    frog.fillRect(fx - p, fy + p * 3, p, p * 2);
    frog.fillRect(fx + p * 5, fy + p * 3, p, p * 2);
    frog.fillStyle(COLORS.FROG_BODY);
    frog.fillRect(fx + p, fy + p * 4, p * 3, p);

    this.tweens.add({
      targets: frog,
      y: -3,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const difficulties: { key: Difficulty; label: string; accent: number; desc: string }[] = [
      { key: 'easy', label: 'EASY', accent: COLORS.SUCCESS, desc: '3-5 chars' },
      { key: 'medium', label: 'MEDIUM', accent: COLORS.SECONDARY, desc: '6-10 chars' },
      { key: 'hard', label: 'HARD', accent: COLORS.DANGER, desc: '10+ chars' },
    ];

    difficulties.forEach(({ key, label, accent, desc }, i) => {
      const yPos = height * 0.44 + i * 44;

      const container = this.add.container(width / 2, yPos);

      const bg = this.add.rectangle(0, 0, 200, 32, COLORS.PANEL_DARK);
      bg.setStrokeStyle(1, COLORS.BORDER);

      const labelText = this.add.text(-20, 0, label, {
        fontSize: '12px',
        fontFamily: FONT_DISPLAY,
        color: colorToHex(accent),
      }).setOrigin(0, 0.5);

      const descText = this.add.text(70, 0, desc, {
        fontSize: '14px',
        fontFamily: FONT_BODY,
        color: colorToHex(COLORS.TEXT_MUTED),
      }).setOrigin(0, 0.5);

      container.add([bg, labelText, descText]);
      container.setSize(200, 32);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerdown', () => {
        this.selectedDifficulty = key;
        this.updateHighlight();
      });

      this.difficultyBtns[key] = container;
    });

    const startPrompt = this.add.text(width / 2, height * 0.85, '▸ PRESS ENTER TO START ◂', {
      fontSize: '12px',
      fontFamily: FONT_BODY,
      color: colorToHex(COLORS.MOON),
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startPrompt,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        this.startGame();
      }
    });

    const gameInput = document.getElementById('game-input') as HTMLInputElement;
    if (gameInput) {
      gameInput.value = '';
      gameInput.focus();
      this.gameInputHandler = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          this.startGame();
        }
      };
      gameInput.addEventListener('keydown', this.gameInputHandler);
    }

    this.updateHighlight();
  }

  private updateHighlight(): void {
    const accentMap: Record<Difficulty, number> = {
      easy: COLORS.SUCCESS,
      medium: COLORS.SECONDARY,
      hard: COLORS.DANGER,
    };
    (Object.keys(this.difficultyBtns) as Difficulty[]).forEach((key) => {
      const container = this.difficultyBtns[key];
      const bg = container.getAt(0) as Phaser.GameObjects.Rectangle;
      const labelText = container.getAt(1) as Phaser.GameObjects.Text;
      const accent = accentMap[key];
      if (key === this.selectedDifficulty) {
        container.setAlpha(1);
        bg.setFillStyle(COLORS.BORDER_ACCENT, 1);
        bg.setStrokeStyle(2, accent);
        labelText.setText('▶ ' + key.toUpperCase());
        labelText.setColor(colorToHex(accent));
      } else {
        container.setAlpha(0.6);
        bg.setFillStyle(COLORS.PANEL_DARK, 1);
        bg.setStrokeStyle(1, COLORS.BORDER);
        labelText.setText(key.toUpperCase());
        labelText.setColor(colorToHex(accent));
      }
    });
  }

  private startGame(): void {
    if (this.gameInputHandler) {
      const gameInput = document.getElementById('game-input') as HTMLInputElement;
      if (gameInput) gameInput.removeEventListener('keydown', this.gameInputHandler);
    }
    this.input.keyboard?.off('keydown');
    this.scene.start('GameScene', { difficulty: this.selectedDifficulty });
  }
}
