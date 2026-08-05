import Phaser from 'phaser';
import { applyRenderZoom, isMobile } from '../config/display';
import { CANVAS_WIDTH, CANVAS_HEIGHT, Difficulty, SPRITE_KEYS } from '../config/constants';
import { COLORS, FONT_DISPLAY, FONT_BODY } from '../config/colors';
import { DAILY_DIFFICULTY, getUtcChallengeDate } from '../config/daily';
import { addCrispText } from '../config/text';
import { hex, darker } from '../config/utils';
import { fetchDailyLeaderboard, prefetchDailyLeaderboard } from '../api/daily';
import { playSfx } from '../audio/SoundManager';

export class MenuScene extends Phaser.Scene {
  private selectedDifficulty: Difficulty = 'easy';
  private difficultyBtns: Record<Difficulty, Phaser.GameObjects.Container> = {} as Record<Difficulty, Phaser.GameObjects.Container>;
  private gameInputHandler: ((e: KeyboardEvent) => void) | null = null;
  private keyboardHandler: ((event: KeyboardEvent) => void) | null = null;
  private availableDifficulties: Difficulty[] = ['chill', 'easy', 'medium', 'hard'];
  private dailySummaryText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    applyRenderZoom(this);
    this.selectedDifficulty = 'easy';
    this.difficultyBtns = {} as Record<Difficulty, Phaser.GameObjects.Container>;
    const width = CANVAS_WIDTH;
    const cx = width / 2;

    this.add.image(cx, CANVAS_HEIGHT / 2, SPRITE_KEYS.BG_SKY)
      .setDisplaySize(width, CANVAS_HEIGHT).setDepth(0);

    const titleBgY = 36;
    const titleBgH = 48;
    const titleBg = this.add.graphics();
    titleBg.fillStyle(COLORS.PRIMARY, 1);
    titleBg.fillRoundedRect(cx - 130, titleBgY, 260, titleBgH, 14);
    titleBg.fillStyle(darker(COLORS.PRIMARY, 0.15), 1);
    titleBg.fillRoundedRect(cx - 128, titleBgY + titleBgH / 2, 256, titleBgH / 2, 12);
    titleBg.setDepth(4);

    addCrispText(this, cx, titleBgY + titleBgH / 2, 'Word Hopper', {
      fontSize: '36px',
      fontFamily: FONT_DISPLAY,
      color: '#FFFFFF',
      fontStyle: 'bold',
      padding: { right: 8, left: 2, top: 2, bottom: 2 },
    }).setOrigin(0.5).setDepth(5);

    const subtitleBgY = titleBgY + titleBgH + 14;
    const subtitleBgH = 24;
    const subtitleGfx = this.add.graphics();
    subtitleGfx.fillStyle(COLORS.MUTED_DARK, 0.7);
    subtitleGfx.fillRoundedRect(cx - 120, subtitleBgY, 240, subtitleBgH, 12);
    subtitleGfx.setDepth(3);

    addCrispText(this, cx, subtitleBgY + subtitleBgH / 2, 'Type to survive. Jump to thrive.', {
      fontSize: '15px',
      fontFamily: FONT_BODY,
      color: hex(COLORS.TEXT_ON_LIGHT),
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(5);

    const liuY = subtitleBgY + subtitleBgH + 28;
    const mound = this.add.graphics();
    mound.fillStyle(COLORS.SECONDARY, 0.15);
    mound.fillEllipse(cx, liuY + 24, 180, 44);
    mound.fillStyle(COLORS.SECONDARY, 0.08);
    mound.fillEllipse(cx + 18, liuY + 18, 140, 30);

    const liu = this.add.sprite(cx, liuY, SPRITE_KEYS.PLAYER_RUN);
    liu.setDisplaySize(56, 64);
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

    const btnStartY = liuY + 54;
    const btnStepY = 32;

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

    const rowW = 220;
    const rowH = 30;
    const rowGap = 5;
    let rowY = btnStartY + difficulties.length * btnStepY + 6;

    // Row 1: Daily — same layout language as difficulty rows.
    const dailyBg = this.add.graphics();
    dailyBg.fillStyle(COLORS.MUTED_DARK, 0.7);
    dailyBg.fillRoundedRect(cx - rowW / 2, rowY, rowW, rowH, 12);
    dailyBg.setDepth(4);

    addCrispText(this, cx - 85, rowY + rowH / 2, 'DAILY', {
      fontSize: '15px',
      fontFamily: FONT_BODY,
      color: hex(COLORS.TEXT_ON_LIGHT),
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(5);

    this.dailySummaryText = addCrispText(this, cx + 52, rowY + rowH / 2, '…', {
      fontSize: '12px',
      fontFamily: FONT_BODY,
      color: hex(COLORS.TEXT_MUTED),
      fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(5);

    const dailyPlay = addCrispText(this, cx + 85, rowY + rowH / 2, 'PLAY', {
      fontSize: '12px',
      fontFamily: FONT_BODY,
      color: hex(COLORS.ACCENT),
      fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(5);

    const dailyHit = this.add.rectangle(cx, rowY + rowH / 2, rowW, rowH, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(6);
    dailyHit.on('pointerover', () => { this.input.setDefaultCursor('pointer'); });
    dailyHit.on('pointerout', () => { this.input.setDefaultCursor('default'); });
    dailyHit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      playSfx('ui', 0.35);
      const localX = pointer.worldX - (cx - rowW / 2);
      if (localX > 155) {
        this.startDaily();
      } else {
        window.__wordhopper_showLeaderboard?.('daily');
      }
    });

    this.tweens.add({
      targets: dailyPlay,
      alpha: 0.4,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    void prefetchDailyLeaderboard();
    void this.refreshDailyStrip();

    // Row 2: classic play prompt
    rowY += rowH + rowGap;
    const playBg = this.add.graphics();
    playBg.fillStyle(COLORS.ACCENT, 0.12);
    playBg.fillRoundedRect(cx - rowW / 2, rowY, rowW, rowH, 12);
    playBg.setDepth(4);

    const startPrompt = addCrispText(this, cx, rowY + rowH / 2, '> TYPE + SPACE TO PLAY <', {
      fontSize: '13px',
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

    // Row 3: leaderboard
    rowY += rowH + rowGap;
    const lbBg = this.add.graphics();
    lbBg.fillStyle(COLORS.MUTED_DARK, 0.7);
    lbBg.fillRoundedRect(cx - rowW / 2, rowY, rowW, rowH, 12);
    lbBg.setDepth(4);

    const leaderboardPrompt = addCrispText(this, cx, rowY + rowH / 2, '> LEADERBOARD <', {
      fontSize: '13px',
      fontFamily: FONT_BODY,
      color: hex(COLORS.PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(5).setInteractive({ useHandCursor: true });

    leaderboardPrompt.on('pointerover', () => { this.input.setDefaultCursor('pointer'); });
    leaderboardPrompt.on('pointerout', () => { this.input.setDefaultCursor('default'); });
    leaderboardPrompt.on('pointerdown', () => {
      playSfx('ui', 0.35);
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

    if (isMobile()) {
      window.__wordhopper_jump = () => this.startGame();
    }
  }

  private async refreshDailyStrip(): Promise<void> {
    if (!this.dailySummaryText) return;
    const dateShort = getUtcChallengeDate().slice(5);
    try {
      const data = await fetchDailyLeaderboard(getUtcChallengeDate());
      if (!this.dailySummaryText.active) return;
      const top = data.entries[0];
      this.dailySummaryText.setText(
        top ? `${dateShort} · ${top.score}` : dateShort,
      );
    } catch {
      if (!this.dailySummaryText?.active) return;
      this.dailySummaryText.setText(dateShort);
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
    this.dailySummaryText = null;
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
