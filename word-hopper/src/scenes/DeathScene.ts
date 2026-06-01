import Phaser from 'phaser';
import { Difficulty } from '../config/constants';

export interface DeathData {
  score: number;
  wordsTyped: number;
  wpm: number;
  bestWord: string;
  difficulty: Difficulty;
}

export class DeathScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DeathScene' });
  }

  create(data: DeathData): void {
    const { width, height } = this.cameras.main;

    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

    this.add.text(width / 2, height * 0.15, 'GAME OVER', {
      fontSize: '36px',
      color: '#e74c3c',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const stats = [
      `Score: ${data.score.toLocaleString()}`,
      `Words Typed: ${data.wordsTyped}`,
      `WPM: ${data.wpm}`,
      `Best Word: ${data.bestWord || '—'}`,
      `Difficulty: ${data.difficulty}`,
    ];

    stats.forEach((line, i) => {
      this.add.text(width / 2, height * 0.35 + i * 32, line, {
        fontSize: '18px',
        color: '#f5f5f7',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    });

    const restartText = this.add.text(width / 2, height * 0.82, 'Press ENTER to restart', {
      fontSize: '16px',
      color: '#86868b',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        this.input.keyboard?.off('keydown');
        this.scene.start('MenuScene');
      }
    });
  }
}
