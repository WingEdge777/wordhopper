import Phaser from 'phaser';
import { applyRenderZoom, isMobile } from '../config/display';
import { CANVAS_WIDTH, CANVAS_HEIGHT, Difficulty, SPRITE_KEYS } from '../config/constants';
import { COLORS, FONT_DISPLAY, FONT_BODY } from '../config/colors';
import { DAILY_DIFFICULTY, getUtcChallengeDate } from '../config/daily';
import { addCrispText } from '../config/text';
import { hex, darker } from '../config/utils';
import { playSfx } from '../audio/SoundManager';
import { DailyBoardPanel, DAILY_PANEL_W } from '../ui/DailyBoardPanel';

export class MenuScene extends Phaser.Scene {
  private selectedDifficulty: Difficulty = 'easy';
  private difficultyBtns: Record<Difficulty, Phaser.GameObjects.Container> = {} as Record<Difficulty, Phaser.GameObjects.Container>;
  private gameInputHandler: ((e: KeyboardEvent) => void) | null = null;
  private keyboardHandler: ((event: KeyboardEvent) => void) | null = null;
  private availableDifficulties: Difficulty[] = ['chill', 'easy', 'medium', 'hard'];
  private dailyPanel: DailyBoardPanel | null = null;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    applyRenderZoom(this);
    this.selectedDifficulty = 'easy';
    this.difficultyBtns = {} as Record<Difficulty, Phaser.GameObjects.Container>;
    const width = CANVAS_WIDTH;
    const showDaily = !isMobile();
    const classicColW = 220;
    const colGap = 18;
    // Twin-column block: classic + daily share one centered composition.
    const blockW = showDaily ? classicColW + colGap + DAILY_PANEL_W : classicColW;
    const blockLeft = (width - blockW) / 2;
    const cx = blockLeft + classicColW / 2;
    const dailyX = blockLeft + classicColW + colGap;

    this.add.image(width / 2, CANVAS_HEIGHT / 2, SPRITE_KEYS.BG_SKY)
      .setDisplaySize(width, CANVAS_HEIGHT).setDepth(0);

    const titleBgY = 36;
    const titleBgH = 48;
    const titleW = showDaily ? 220 : 260;
    const titleBg = this.add.graphics();
    titleBg.fillStyle(COLORS.PRIMARY, 1);
    titleBg.fillRoundedRect(cx - titleW / 2, titleBgY, titleW, titleBgH, 14);
    titleBg.fillStyle(darker(COLORS.PRIMARY, 0.15), 1);
    titleBg.fillRoundedRect(cx - titleW / 2 + 2, titleBgY + titleBgH / 2, titleW - 4, titleBgH / 2, 12);
    titleBg.setDepth(4);

    addCrispText(this, cx, titleBgY + titleBgH / 2, 'Word Hopper', {
      fontSize: showDaily ? '30px' : '36px',
      fontFamily: FONT_DISPLAY,
      color: '#FFFFFF',
      fontStyle: 'bold',
      padding: { right: 8, left: 2, top: 2, bottom: 2 },
    }).setOrigin(0.5).setDepth(5);

    const subtitleBgY = titleBgY + titleBgH + 14;
    const subtitleBgH = 24;
    const subtitleW = showDaily ? 220 : 240;
    const subtitleGfx = this.add.graphics();
    subtitleGfx.fillStyle(COLORS.MUTED_DARK, 0.7);
    subtitleGfx.fillRoundedRect(cx - subtitleW / 2, subtitleBgY, subtitleW, subtitleBgH, 12);
    subtitleGfx.setDepth(3);

    addCrispText(this, cx, subtitleBgY + subtitleBgH / 2, 'Type to survive. Jump to thrive.', {
      fontSize: showDaily ? '13px' : '15px',
      fontFamily: FONT_BODY,
      color: hex(COLORS.TEXT_ON_LIGHT),
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(5);

    const liuY = subtitleBgY + subtitleBgH + 36;
    const mound = this.add.graphics();
    mound.fillStyle(COLORS.SECONDARY, 0.15);
    mound.fillEllipse(cx, liuY + 24, 200, 50);
    mound.fillStyle(COLORS.SECONDARY, 0.08);
    mound.fillEllipse(cx + 20, liuY + 20, 160, 35);

    const liu = this.add.sprite(cx, liuY, SPRITE_KEYS.PLAYER_RUN);
    liu.setDisplaySize(64, 74);
    liu.setDepth(5);
    liu.play(SPRITE_KEYS.PLAYER_RUN_ANIM);

    this.tweens.add({
      targets: liu,
      y: liu.y - 5,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const difficulties: { key: Difficulty; label: string; desc: string }[] = isMobile()
      ? [
          { key: 'chill', label: 'CHILL', desc: '3–5 chars, slow' },
          { key: 'easy', label: 'EASY', desc: '3–5 chars' },
        ]
      : [
          { key: 'chill', label: 'CHILL', desc: '3–5 chars, slow' },
          { key: 'easy', label: 'EASY', desc: '3–5 chars' },
          { key: 'medium', label: 'MEDIUM', desc: '6–8 chars' },
          { key: 'hard', label: 'HARD', desc: '8+ chars' },
        ];

    this.availableDifficulties = difficulties.map((d) => d.key);
    if (!this.availableDifficulties.includes(this.selectedDifficulty)) {
      this.selectedDifficulty = 'easy';
    }

    const btnStartY = liuY + 68;
    const btnStepY = 38;

    difficulties.forEach(({ key, label, desc }, i) => {
      const yPos = btnStartY + i * btnStepY;
      const container = this.add.container(cx, yPos);
      container.setDepth(5);

      const bg = this.add.graphics();
      bg.fillStyle(COLORS.MUTED_DARK, 0.7);
      bg.fillRoundedRect(-110, -16, 220, 32, 12);
      container.add(bg);

      const labelText = addCrispText(this, -85, 0, label, {
        fontSize: '15px',
        fontFamily: FONT_BODY,
        color: hex(COLORS.TEXT_ON_LIGHT),
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      container.add(labelText);

      const descText = addCrispText(this, 85, 0, desc, {
        fontSize: '13px',
        fontFamily: FONT_BODY,
        color: hex(COLORS.TEXT_MUTED),
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      container.add(descText);

      container.setSize(220, 32);
      container.setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => {
        playSfx('ui', 0.4);
        if (this.selectedDifficulty === key) {
          this.startGame();
        } else {
          this.selectedDifficulty = key;
          this.updateHighlight();
        }
      });

      this.difficultyBtns[key] = container;
    });

    const promptBgH = 48;
    const promptBgY = btnStartY + difficulties.length * btnStepY + 2;
    const promptBg = this.add.graphics();
    promptBg.fillStyle(COLORS.ACCENT, 0.12);
    promptBg.fillRoundedRect(cx - 110, promptBgY, 220, promptBgH, 12);
    promptBg.setDepth(4);

    const startPrompt = addCrispText(this, cx, promptBgY + 14, '> TYPE + SPACE TO PLAY <', {
      fontSize: '14px',
      fontFamily: FONT_BODY,
      color: hex(COLORS.ACCENT),
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(5);

    this.tweens.add({
      targets: startPrompt,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    const leaderboardPrompt = addCrispText(this, cx, promptBgY + 34, '> LEADERBOARD <', {
      fontSize: '12px',
      fontFamily: FONT_BODY,
      color: hex(COLORS.PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(5).setInteractive({ useHandCursor: true });

    leaderboardPrompt.on('pointerover', () => { this.input.setDefaultCursor('pointer'); });
    leaderboardPrompt.on('pointerout', () => { this.input.setDefaultCursor('default'); });
    leaderboardPrompt.on('pointerdown', () => {
      window.__wordhopper_showLeaderboard?.(this.selectedDifficulty);
    });

    const moveSelection = (delta: -1 | 1): void => {
      const idx = this.availableDifficulties.indexOf(this.selectedDifficulty);
      const next = idx + delta;
      if (next >= 0 && next < this.availableDifficulties.length) {
        this.selectedDifficulty = this.availableDifficulties[next];
        this.updateHighlight();
      }
    };

    this.keyboardHandler = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        moveSelection(-1);
      } else if (event.key === 'ArrowDown') {
        moveSelection(1);
      } else if (event.key === ' ') {
        this.startGame();
      }
    };
    this.input.keyboard?.on('keydown', this.keyboardHandler);

    const gameInput = document.getElementById('game-input') as HTMLInputElement;
    if (gameInput) {
      gameInput.value = '';
      gameInput.focus();
      this.gameInputHandler = (e: KeyboardEvent) => {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          moveSelection(-1);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          moveSelection(1);
        } else if (e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          this.startGame();
        }
      };
      gameInput.addEventListener('keydown', this.gameInputHandler);
    }

    this.updateHighlight();

    if (showDaily) {
      this.dailyPanel = new DailyBoardPanel({
        scene: this,
        x: dailyX,
        y: titleBgY,
        onPlayDaily: () => this.startDaily(),
      });
    }

    if (isMobile()) {
      window.__wordhopper_jump = () => this.startGame();
    }
  }

  private updateHighlight(): void {
    (Object.keys(this.difficultyBtns) as Difficulty[]).forEach((key) => {
      const container = this.difficultyBtns[key];
      const bg = container.getAt(0) as Phaser.GameObjects.Graphics;
      const labelText = container.getAt(1) as Phaser.GameObjects.Text;
      bg.clear();
      if (key === this.selectedDifficulty) {
        bg.fillStyle(COLORS.PRIMARY, 0.15);
        bg.fillRoundedRect(-110, -16, 220, 32, 12);
        bg.lineStyle(2.5, COLORS.PRIMARY, 0.8);
        bg.strokeRoundedRect(-110, -16, 220, 32, 12);
        labelText.setText('> ' + key.toUpperCase());
        labelText.setColor(hex(COLORS.PRIMARY));
      } else {
        bg.fillStyle(COLORS.MUTED_DARK, 0.7);
        bg.fillRoundedRect(-110, -16, 220, 32, 12);
        labelText.setText('  ' + key.toUpperCase());
        labelText.setColor(hex(COLORS.TEXT_ON_LIGHT));
      }
    });
  }

  shutdown(): void {
    this.cleanup();
  }

  private startGame(): void {
    this.cleanup();
    this.scene.start('GameScene', {
      difficulty: this.selectedDifficulty,
      mode: 'classic',
    });
  }

  private startDaily(): void {
    this.cleanup();
    this.scene.start('GameScene', {
      difficulty: DAILY_DIFFICULTY,
      mode: 'daily',
      challengeDate: getUtcChallengeDate(),
    });
  }

  private cleanup(): void {
    this.dailyPanel?.destroy();
    this.dailyPanel = null;
    if (this.keyboardHandler) {
      this.input.keyboard?.off('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
    }
    if (this.gameInputHandler) {
      const gameInput = document.getElementById('game-input') as HTMLInputElement;
      if (gameInput) gameInput.removeEventListener('keydown', this.gameInputHandler);
      this.gameInputHandler = null;
    }
    delete window.__wordhopper_jump;
  }
}
