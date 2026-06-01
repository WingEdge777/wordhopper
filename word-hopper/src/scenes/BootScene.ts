import Phaser from 'phaser';
import { COLORS, FONT_DISPLAY, FONT_BODY } from '../config/colors';
import { colorToHex } from '../utils/PixelArt';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const { width, height } = this.cameras.main;

    const bg = this.add.graphics();
    for (let y = 0; y < height; y++) {
      const t = y / height;
      const r = Math.round(0x0f * (1 - t) + 0x33 * t);
      const g = Math.round(0x17 * (1 - t) + 0x41 * t);
      const b = Math.round(0x2a * (1 - t) + 0x55 * t);
      bg.fillStyle((r << 16) | (g << 8) | b);
      bg.fillRect(0, y, width, 1);
    }

    this.add.text(width / 2, height * 0.3, 'WORD HOPPER', {
      fontSize: '22px',
      fontFamily: FONT_DISPLAY,
      color: colorToHex(COLORS.PRIMARY),
    }).setOrigin(0.5);

    const line = this.add.graphics();
    line.fillStyle(COLORS.GROUND, 1);
    line.fillRect(width / 2 - 60, height * 0.3 + 18, 120, 4);

    const frog = this.add.graphics();
    const fx = width / 2 - 8;
    const fy = height * 0.3 + 30;
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

    const barWidth = width * 0.6;
    const barHeight = 12;
    const barX = (width - barWidth) / 2;
    const barY = height * 0.65;

    this.add.text(width / 2, barY - 20, 'Loading...', {
      fontSize: '12px',
      fontFamily: FONT_BODY,
      color: colorToHex(COLORS.TEXT_SECONDARY),
    }).setOrigin(0.5);

    const barTrack = this.add.graphics();
    barTrack.fillStyle(COLORS.PANEL_DARK, 1);
    barTrack.fillRect(barX, barY, barWidth, barHeight);
    barTrack.lineStyle(1, COLORS.BORDER);
    barTrack.strokeRect(barX, barY, barWidth, barHeight);

    const bar = this.add.graphics();

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(COLORS.PRIMARY, 1);
      bar.fillRect(barX, barY, barWidth * value, barHeight);
    });

    this.load.on('complete', () => {
      bar.destroy();
      barTrack.destroy();
      bg.destroy();
    });
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
