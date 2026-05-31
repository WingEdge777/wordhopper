import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const { width, height } = this.cameras.main;
    const barWidth = width * 0.6;
    const barHeight = 20;
    const x = (width - barWidth) / 2;
    const y = height / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRect(0, 0, width, height);

    const bar = this.add.graphics();
    const text = this.add.text(width / 2, y - 30, 'Loading...', {
      fontSize: '16px',
      color: '#4ecdc4',
      fontFamily: 'monospace',
    });
    text.setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0x4ecdc4, 1);
      bar.fillRect(x, y, barWidth * value, barHeight);
    });

    this.load.on('complete', () => {
      bar.destroy();
      bg.destroy();
      text.destroy();
    });
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
