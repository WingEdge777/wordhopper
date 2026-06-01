import Phaser from 'phaser';
import { COLORS, FONT_DISPLAY, FONT_BODY } from '../config/colors';
import { colorToHex } from '../utils/PixelArt';
import { Difficulty, CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants';

function getBestScore(difficulty: Difficulty): number {
  return parseInt(localStorage.getItem(`word-hopper-best-${difficulty}`) || '0', 10);
}

function setBestScore(difficulty: Difficulty, score: number): void {
  localStorage.setItem(`word-hopper-best-${difficulty}`, score.toString());
}

export interface DeathData {
  score: number;
  wordsTyped: number;
  wpm: number;
  bestWord: string;
  difficulty: Difficulty;
}

export class DeathScene extends Phaser.Scene {
  private difficulty: Difficulty = 'easy';

  constructor() {
    super({ key: 'DeathScene' });
  }

  create(data: DeathData): void {
    this.difficulty = data.difficulty;
    const w = CANVAS_WIDTH;
    const h = CANVAS_HEIGHT;

    const g = this.add.graphics();
    g.fillGradientStyle(COLORS.SKY_TOP, COLORS.SKY_TOP, COLORS.HORIZON, COLORS.HORIZON, 0.4);
    g.fillRect(0, 0, w, h);

    this.add.rectangle(0, 0, w, 3, COLORS.DANGER).setOrigin(0, 0);

    this.add.text(w / 2, 30, 'GAME OVER', {
      fontSize: '16px',
      fontFamily: FONT_DISPLAY,
      color: colorToHex(COLORS.DANGER),
    }).setOrigin(0.5);

    const best = getBestScore(data.difficulty);
    const isNewBest = data.score > best;
    if (isNewBest) setBestScore(data.difficulty, data.score);
    const displayBest = isNewBest ? data.score : best;
    const pct = displayBest > 0 ? Math.min(data.score / displayBest, 1) : 0;

    const scoreCenterX = w / 2;
    const scoreY = 70;

    this.add.text(scoreCenterX - 60, scoreY, data.score.toLocaleString(), {
      fontSize: '26px',
      fontFamily: FONT_BODY,
      color: colorToHex(COLORS.PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(scoreCenterX - 60, scoreY + 22, 'THIS RUN', {
      fontSize: '9px',
      fontFamily: FONT_BODY,
      color: colorToHex(COLORS.TEXT_SECONDARY),
    }).setOrigin(0.5);

    this.add.rectangle(scoreCenterX, scoreY - 8, 1, 48, COLORS.BORDER);

    this.add.text(scoreCenterX + 60, scoreY, displayBest.toLocaleString(), {
      fontSize: '26px',
      fontFamily: FONT_BODY,
      color: colorToHex(COLORS.SECONDARY),
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(scoreCenterX + 60, scoreY + 22, 'BEST', {
      fontSize: '9px',
      fontFamily: FONT_BODY,
      color: colorToHex(COLORS.TEXT_SECONDARY),
    }).setOrigin(0.5);

    if (isNewBest) {
      this.add.text(w / 2, scoreY + 44, '★ NEW BEST ★', {
        fontSize: '10px',
        fontFamily: FONT_DISPLAY,
        color: colorToHex(COLORS.SECONDARY),
      }).setOrigin(0.5);
    }

    const barWidth = w * 0.6;
    const barHeight = 6;
    const barX = (w - barWidth) / 2;
    const barY = scoreY + 68;

    this.add.rectangle(barX, barY, barWidth, barHeight, COLORS.PANEL_DARK)
      .setOrigin(0)
      .setStrokeStyle(1, COLORS.BORDER);

    const fillBar = this.add.rectangle(barX, barY, 0, barHeight, COLORS.PRIMARY).setOrigin(0);
    const bar = fillBar!;

    this.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 600,
      onUpdate: (tween) => {
        const v = tween.getValue() ?? 0;
        bar.width = barWidth * pct * (v / 100);
      },
    });

    this.add.text(w / 2, barY + barHeight + 10, `${Math.round(pct * 100)}% of best`, {
      fontSize: '9px',
      fontFamily: FONT_BODY,
      color: colorToHex(COLORS.TEXT_MUTED),
    }).setOrigin(0.5);

    const cardW = 80;
    const cardH = 40;
    const cardGap = 12;
    const totalCardsWidth = cardW * 3 + cardGap * 2;
    const cardsStartX = (w - totalCardsWidth) / 2;
    const cardsY = barY + 36;

    const cards = [
      { value: data.wordsTyped.toString(), label: 'WORDS', color: COLORS.SUCCESS, fontSize: '16px' },
      { value: data.wpm.toString(), label: 'WPM', color: COLORS.SUCCESS, fontSize: '16px' },
      { value: data.bestWord || '—', label: 'BEST', color: COLORS.SECONDARY, fontSize: '11px' },
    ];

    cards.forEach((card, i) => {
      const cx = cardsStartX + i * (cardW + cardGap);
      this.add.rectangle(cx, cardsY, cardW, cardH, COLORS.PANEL_DARK)
        .setOrigin(0)
        .setStrokeStyle(1, COLORS.BORDER);

      this.add.text(cx + cardW / 2, cardsY + 14, card.value, {
        fontSize: card.fontSize,
        fontFamily: FONT_BODY,
        color: colorToHex(card.color),
      }).setOrigin(0.5);

      this.add.text(cx + cardW / 2, cardsY + 28, card.label, {
        fontSize: '8px',
        fontFamily: FONT_BODY,
        color: colorToHex(COLORS.TEXT_SECONDARY),
      }).setOrigin(0.5);
    });

    this.add.text(w / 2, cardsY + cardH + 14, `▸ ${data.difficulty.toUpperCase()} ◂`, {
      fontSize: '9px',
      fontFamily: FONT_BODY,
      color: colorToHex(COLORS.TEXT_MUTED),
    }).setOrigin(0.5);

    const btnY = cardsY + cardH + 40;

    const retryContainer = this.add.container(w / 2 - 50, btnY);
    const retryBg = this.add.rectangle(0, 0, 80, 28, COLORS.PRIMARY)
      .setStrokeStyle(2, COLORS.PRIMARY);
    const retryLabel = this.add.text(0, 0, 'RETRY', {
      fontSize: '10px',
      fontFamily: FONT_DISPLAY,
      color: colorToHex(COLORS.SKY_TOP),
    }).setOrigin(0.5);
    retryContainer.add([retryBg, retryLabel]);
    retryBg.setInteractive({ useHandCursor: true });
    retryBg.on('pointerdown', () => this.retry());

    const menuContainer = this.add.container(w / 2 + 50, btnY);
    const menuBg = this.add.rectangle(0, 0, 70, 28, COLORS.PANEL_DARK)
      .setStrokeStyle(1, COLORS.BORDER);
    const menuLabel = this.add.text(0, 0, 'MENU', {
      fontSize: '10px',
      fontFamily: FONT_DISPLAY,
      color: colorToHex(COLORS.TEXT_SECONDARY),
    }).setOrigin(0.5);
    menuContainer.add([menuBg, menuLabel]);
    menuBg.setInteractive({ useHandCursor: true });
    menuBg.on('pointerdown', () => this.goToMenu());

    this.add.text(w / 2, btnY + 24, 'or press ENTER', {
      fontSize: '9px',
      fontFamily: FONT_BODY,
      color: colorToHex(COLORS.TEXT_MUTED),
    }).setOrigin(0.5);

    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        this.retry();
      } else if (event.key === 'Escape') {
        this.goToMenu();
      }
    });

    const gameInput = document.getElementById('game-input') as HTMLInputElement;
    if (gameInput) {
      gameInput.focus();
      gameInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.retry();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.goToMenu();
        }
      });
    }
  }

  private retry(): void {
    this.input.keyboard?.off('keydown');
    this.scene.start('GameScene', { difficulty: this.difficulty });
  }

  private goToMenu(): void {
    this.input.keyboard?.off('keydown');
    this.scene.start('MenuScene');
  }
}
