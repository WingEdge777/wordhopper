import Phaser from 'phaser';
import { Difficulty } from '../config/constants';

export class MenuScene extends Phaser.Scene {
  private selectedDifficulty: Difficulty = 'easy';
  private difficultyBtns: Record<Difficulty, Phaser.GameObjects.Container> = {} as any;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.selectedDifficulty = 'easy';
    this.difficultyBtns = {} as any;

    const { width, height } = this.cameras.main;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0f0f23);

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

      const container = this.add.container(width / 2, yPos);

      const bg = this.add.rectangle(0, 0, 260, 42, 0x1a1a2e);
      bg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color);

      const labelText = this.add.text(-50, 0, label, {
        fontSize: '20px',
        color,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      const descText = this.add.text(60, 0, desc, {
        fontSize: '14px',
        color: '#86868b',
        fontFamily: 'monospace',
      }).setOrigin(0, 0.5);

      container.add([bg, labelText, descText]);
      container.setSize(260, 42);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerdown', () => {
        this.selectedDifficulty = key;
        this.updateHighlight();
      });

      this.difficultyBtns[key] = container;
    });

    const startContainer = this.add.container(width / 2, height * 0.8);

    const startBg = this.add.rectangle(0, 0, 300, 50, 0x4ecdc4, 0.15);
    startBg.setStrokeStyle(2, 0x4ecdc4);

    const startLabel = this.add.text(0, 0, 'Click or ENTER to START', {
      fontSize: '18px',
      color: '#4ecdc4',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    startContainer.add([startBg, startLabel]);
    startContainer.setSize(300, 50);
    startContainer.setInteractive({ useHandCursor: true });

    startContainer.on('pointerdown', () => {
      this.startGame();
    });

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        this.startGame();
      }
    });

    this.updateHighlight();
  }

  private updateHighlight(): void {
    const colors: Record<Difficulty, number> = {
      easy: 0x2ecc71,
      medium: 0xffd93d,
      hard: 0xe74c3c,
    };
    (Object.keys(this.difficultyBtns) as Difficulty[]).forEach((key) => {
      const container = this.difficultyBtns[key];
      const bg = container.getAt(0) as Phaser.GameObjects.Rectangle;
      if (key === this.selectedDifficulty) {
        container.setAlpha(1);
        bg.setFillStyle(colors[key], 0.3);
      } else {
        container.setAlpha(0.5);
        bg.setFillStyle(0x1a1a2e, 1);
      }
    });
  }

  private startGame(): void {
    this.input.keyboard?.off('keydown');
    this.scene.start('GameScene', { difficulty: this.selectedDifficulty });
  }
}
