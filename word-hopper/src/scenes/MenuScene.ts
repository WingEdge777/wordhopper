import Phaser from 'phaser';
import { Difficulty } from '../config/constants';

export class MenuScene extends Phaser.Scene {
  private selectedDifficulty: Difficulty = 'easy';
  private difficultyTexts: Record<Difficulty, Phaser.GameObjects.Text> = {} as any;
  private startText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'MenuScene' });
  }

  private started = false;

  create(): void {
    const { width, height } = this.cameras.main;

    this.input.setTopOnly(true);

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0f0f23);
    bg.setInteractive({ useHandCursor: false });

    this.add.text(width / 2, height * 0.18, 'WORD HOPPER', {
      fontSize: '44px',
      color: '#4ecdc4',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.33, 'Type to survive. Jump to thrive.', {
      fontSize: '16px',
      color: '#86868b',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const difficulties: { key: Difficulty; label: string; color: string; desc: string }[] = [
      { key: 'easy', label: 'EASY', color: '#2ecc71', desc: '3-5 chars' },
      { key: 'medium', label: 'MEDIUM', color: '#ffd93d', desc: '6-10 chars' },
      { key: 'hard', label: 'HARD', color: '#e74c3c', desc: '10+ chars' },
    ];

    difficulties.forEach(({ key, label, color, desc }, i) => {
      const yPos = height * 0.48 + i * 52;

      const btn = this.add.rectangle(width / 2, yPos, 260, 42, 0x1a1a2e);
      btn.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color);
      btn.setInteractive({ useHandCursor: true });

      const text = this.add.text(width / 2 - 50, yPos, label, {
        fontSize: '20px',
        color,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      const descText = this.add.text(width / 2 + 60, yPos, desc, {
        fontSize: '14px',
        color: '#86868b',
        fontFamily: 'monospace',
      }).setOrigin(0, 0.5);

      btn.on('pointerdown', () => {
        this.selectedDifficulty = key;
        this.updateHighlight();
      });

      this.difficultyTexts[key] = text;
    });

    this.startText = this.add.text(width / 2, height * 0.8, 'ENTER or Click to START', {
      fontSize: '18px',
      color: '#4ecdc4',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.startText.on('pointerup', () => {
      this.startGame();
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      this.startGame();
    });

    this.updateHighlight();
  }

  private updateHighlight(): void {
    (Object.keys(this.difficultyTexts) as Difficulty[]).forEach((key) => {
      const text = this.difficultyTexts[key];
      if (key === this.selectedDifficulty) {
        text.setAlpha(1);
        text.setFontSize(22);
      } else {
        text.setAlpha(0.4);
        text.setFontSize(20);
      }
    });
  }

  private startGame(): void {
    if (this.started) return;
    this.started = true;
    this.scene.start('GameScene', { difficulty: this.selectedDifficulty });
  }
}
