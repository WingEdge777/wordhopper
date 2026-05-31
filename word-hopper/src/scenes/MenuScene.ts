import Phaser from 'phaser';
import { Difficulty } from '../config/constants';

export class MenuScene extends Phaser.Scene {
  private selectedDifficulty: Difficulty = 'easy';
  private difficultyTexts: Record<Difficulty, Phaser.GameObjects.Text> = {} as any;
  private startText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.add.text(width / 2, height * 0.2, 'WORD HOPPER', {
      fontSize: '40px',
      color: '#4ecdc4',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.35, 'Type to survive. Jump to thrive.', {
      fontSize: '14px',
      color: '#86868b',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const difficulties: { key: Difficulty; label: string; color: string }[] = [
      { key: 'easy', label: 'Easy (3-5)', color: '#2ecc71' },
      { key: 'medium', label: 'Medium (6-10)', color: '#ffd93d' },
      { key: 'hard', label: 'Hard (10+)', color: '#e74c3c' },
    ];

    difficulties.forEach(({ key, label, color }, i) => {
      const text = this.add.text(width / 2, height * 0.5 + i * 40, label, {
        fontSize: '20px',
        color,
        fontFamily: 'monospace',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      text.on('pointerdown', () => {
        this.selectedDifficulty = key;
        this.updateHighlight();
      });

      this.difficultyTexts[key] = text;
    });

    this.startText = this.add.text(width / 2, height * 0.78, 'Press SPACE or click to START', {
      fontSize: '16px',
      color: '#86868b',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.startText.on('pointerdown', () => {
      this.startGame();
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      this.startGame();
    });

    this.updateHighlight();
  }

  private updateHighlight(): void {
    (Object.keys(this.difficultyTexts) as Difficulty[]).forEach((key) => {
      const text = this.difficultyTexts[key];
      if (key === this.selectedDifficulty) {
        text.setAlpha(1);
        text.setFontSize(24);
      } else {
        text.setAlpha(0.4);
        text.setFontSize(20);
      }
    });
  }

  private startGame(): void {
    this.scene.start('GameScene', { difficulty: this.selectedDifficulty });
  }
}
