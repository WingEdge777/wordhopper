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
  private classicDifficultyText: Phaser.GameObjects.Text | null = null;

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

    // Layout constants — content block is vertically centered for equal top/bottom margins.
    const titleBgH = 48;
    const subtitleGap = 14;
    const subtitleBgH = 24;
    const liuGap = 28;
    const btnGap = 54;
    const btnStepY = 34;
    const rowW = 220;
    const rowH = 32;
    const rowGap = 6;
    const footerTopGap = 6;
    const footerRows = 3;
    const contentH =
      titleBgH + subtitleGap + subtitleBgH + liuGap + btnGap
      + difficulties.length * btnStepY + footerTopGap
      + footerRows * rowH + (footerRows - 1) * rowGap;
    const titleBgY = Math.round((CANVAS_HEIGHT - contentH) / 2);

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

    const subtitleBgY = titleBgY + titleBgH + subtitleGap;
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

    const liuY = subtitleBgY + subtitleBgH + liuGap;
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

    const btnStartY = liuY + btnGap;
    // Shared columns for all menu rows (label left / meta right).
    const COL_LABEL_X = -82;
    const COL_CARET_X = -96;
    const COL_META_X = 96;

    difficulties.forEach(({ key, label, desc }, i) => {
      const yPos = btnStartY + i * btnStepY;
      const container = this.add.container(cx, yPos);
      container.setDepth(5);

      const bg = this.add.graphics();
      bg.fillStyle(COLORS.MUTED_DARK, 0.7);
      bg.fillRoundedRect(-rowW / 2, -rowH / 2, rowW, rowH, 12);
      container.add(bg);

      const caret = addCrispText(this, COL_CARET_X, 0, '>', {
        fontSize: '15px',
        fontFamily: FONT_BODY,
        color: hex(COLORS.PRIMARY),
        fontStyle: 'bold',
      }).setOrigin(0.5, 0.5).setVisible(false);
      container.add(caret);

      const labelText = addCrispText(this, COL_LABEL_X, 0, label, {
        fontSize: '15px',
        fontFamily: FONT_BODY,
        color: hex(COLORS.TEXT_ON_LIGHT),
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      container.add(labelText);

      const descText = addCrispText(this, COL_META_X, 0, desc, {
        fontSize: '13px',
        fontFamily: FONT_BODY,
        color: hex(COLORS.TEXT_MUTED),
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      container.add(descText);

      container.setSize(rowW, rowH);
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

    let rowY = btnStartY + difficulties.length * btnStepY + footerTopGap;

    // Row 1: Daily challenge hook — accent treatment so it reads as a CTA, not a difficulty row.
    const dailyBg = this.add.graphics();
    dailyBg.fillStyle(COLORS.ACCENT, 0.16);
    dailyBg.fillRoundedRect(cx - rowW / 2, rowY, rowW, rowH, 12);
    dailyBg.lineStyle(2, COLORS.ACCENT, 0.75);
    dailyBg.strokeRoundedRect(cx - rowW / 2, rowY, rowW, rowH, 12);
    dailyBg.setDepth(4);

    addCrispText(this, cx + COL_LABEL_X, rowY + rowH / 2, 'DAILY', {
      fontSize: '15px',
      fontFamily: FONT_BODY,
      color: hex(COLORS.ACCENT),
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(5);

    this.dailySummaryText = addCrispText(this, cx + 42, rowY + rowH / 2, '…', {
      fontSize: '13px',
      fontFamily: FONT_BODY,
      color: hex(COLORS.TEXT_ON_LIGHT),
      fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(5);

    const playPillW = 50;
    const playPillH = 22;
    const playPillX = cx + COL_META_X - playPillW;
    const playPillY = rowY + (rowH - playPillH) / 2;
    const playPill = this.add.graphics();
    playPill.fillStyle(COLORS.ACCENT, 1);
    playPill.fillRoundedRect(playPillX, playPillY, playPillW, playPillH, 8);
    playPill.setDepth(5);

    const dailyPlay = addCrispText(this, playPillX + playPillW / 2, rowY + rowH / 2, 'PLAY', {
      fontSize: '12px',
      fontFamily: FONT_BODY,
      color: '#FFFFFF',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(6);

    const dailyHit = this.add.rectangle(cx, rowY + rowH / 2, rowW, rowH, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(7);
    dailyHit.on('pointerover', () => { this.input.setDefaultCursor('pointer'); });
    dailyHit.on('pointerout', () => { this.input.setDefaultCursor('default'); });
    dailyHit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      playSfx('ui', 0.35);
      const localX = pointer.worldX - (cx - rowW / 2);
      if (localX > rowW - playPillW - 10) {
        this.startDaily();
      } else {
        window.__wordhopper_showLeaderboard?.('daily');
      }
    });

    this.tweens.add({
      targets: [playPill, dailyPlay],
      alpha: 0.72,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    void prefetchDailyLeaderboard();
    void this.refreshDailyStrip();

    // Row 2: Classic — same CTA shape as Daily (label + meta + PLAY pill).
    rowY += rowH + rowGap;
    const classicBg = this.add.graphics();
    classicBg.fillStyle(COLORS.PRIMARY, 0.12);
    classicBg.fillRoundedRect(cx - rowW / 2, rowY, rowW, rowH, 12);
    classicBg.lineStyle(2, COLORS.PRIMARY, 0.55);
    classicBg.strokeRoundedRect(cx - rowW / 2, rowY, rowW, rowH, 12);
    classicBg.setDepth(4);

    addCrispText(this, cx + COL_LABEL_X, rowY + rowH / 2, 'CLASSIC', {
      fontSize: '15px',
      fontFamily: FONT_BODY,
      color: hex(COLORS.PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(5);

    this.classicDifficultyText = addCrispText(
      this,
      cx + 42,
      rowY + rowH / 2,
      this.selectedDifficulty.toUpperCase(),
      {
        fontSize: '13px',
        fontFamily: FONT_BODY,
        color: hex(COLORS.TEXT_ON_LIGHT),
        fontStyle: 'bold',
      },
    ).setOrigin(1, 0.5).setDepth(5);

    const classicPillX = cx + COL_META_X - playPillW;
    const classicPillY = rowY + (rowH - playPillH) / 2;
    const classicPill = this.add.graphics();
    classicPill.fillStyle(COLORS.PRIMARY, 1);
    classicPill.fillRoundedRect(classicPillX, classicPillY, playPillW, playPillH, 8);
    classicPill.setDepth(5);

    const classicPlay = addCrispText(this, classicPillX + playPillW / 2, rowY + rowH / 2, 'PLAY', {
      fontSize: '12px',
      fontFamily: FONT_BODY,
      color: '#FFFFFF',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(6);

    const classicHit = this.add.rectangle(cx, rowY + rowH / 2, rowW, rowH, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(7);
    classicHit.on('pointerover', () => { this.input.setDefaultCursor('pointer'); });
    classicHit.on('pointerout', () => { this.input.setDefaultCursor('default'); });
    classicHit.on('pointerdown', () => {
      playSfx('ui', 0.35);
      this.startGame();
    });

    this.tweens.add({
      targets: [classicPill, classicPlay],
      alpha: 0.72,
      duration: 900,
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
    try {
      const data = await fetchDailyLeaderboard(getUtcChallengeDate());
      if (!this.dailySummaryText.active) return;
      const top = data.entries[0];
      this.dailySummaryText.setText(top ? `Beat ${top.score}` : 'Be first');
    } catch {
      if (!this.dailySummaryText?.active) return;
      this.dailySummaryText.setText('Today');
    }
  }

  private updateHighlight(): void {
    const rowW = 220;
    const rowH = 32;
    (Object.keys(this.difficultyBtns) as Difficulty[]).forEach((key) => {
      const container = this.difficultyBtns[key];
      const bg = container.getAt(0) as Phaser.GameObjects.Graphics;
      const caret = container.getAt(1) as Phaser.GameObjects.Text;
      const labelText = container.getAt(2) as Phaser.GameObjects.Text;
      bg.clear();
      if (key === this.selectedDifficulty) {
        bg.fillStyle(COLORS.PRIMARY, 0.15);
        bg.fillRoundedRect(-rowW / 2, -rowH / 2, rowW, rowH, 12);
        bg.lineStyle(2.5, COLORS.PRIMARY, 0.8);
        bg.strokeRoundedRect(-rowW / 2, -rowH / 2, rowW, rowH, 12);
        caret.setVisible(true);
        labelText.setColor(hex(COLORS.PRIMARY));
      } else {
        bg.fillStyle(COLORS.MUTED_DARK, 0.7);
        bg.fillRoundedRect(-rowW / 2, -rowH / 2, rowW, rowH, 12);
        caret.setVisible(false);
        labelText.setColor(hex(COLORS.TEXT_ON_LIGHT));
      }
    });
    this.classicDifficultyText?.setText(this.selectedDifficulty.toUpperCase());
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
    this.classicDifficultyText = null;
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
