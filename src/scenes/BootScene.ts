import Phaser from 'phaser';
import { applyRenderZoom } from '../config/display';
import { COLORS, FONT_DISPLAY, FONT_BODY } from '../config/colors';
import { CANVAS_WIDTH, CANVAS_HEIGHT, ObstacleType, SPRITE_KEYS } from '../config/constants';
import { addCrispText } from '../config/text';
import { hex, darker, lighter } from '../config/utils';
import { parseShareParams } from './ShareCardScene';

function clayRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r: number, color: number): void {
  g.fillStyle(darker(color, 0.4), 0.12);
  g.fillRoundedRect(x + 3, y + 3, w, h, r);
  g.fillStyle(darker(color, 0.2), 0.08);
  g.fillRoundedRect(x + 1.5, y + 1.5, w, h, r);
  g.fillStyle(color, 1);
  g.fillRoundedRect(x, y, w, h, r);
  g.fillStyle(lighter(color, 0.25), 0.3);
  g.fillRoundedRect(x + 3, y + 3, w - 6, h * 0.4, r / 2);
}

function clayCircle(g: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, color: number): void {
  g.fillStyle(darker(color, 0.4), 0.12);
  g.fillCircle(x + 3, y + 3, radius);
  g.fillStyle(darker(color, 0.2), 0.08);
  g.fillCircle(x + 1.5, y + 1.5, radius);
  g.fillStyle(color, 1);
  g.fillCircle(x, y, radius);
  g.fillStyle(lighter(color, 0.3), 0.25);
  g.fillCircle(x - radius * 0.25, y - radius * 0.3, radius * 0.5);
}

function clayEllipse(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number): void {
  g.fillStyle(darker(color, 0.4), 0.12);
  g.fillEllipse(x + 3, y + 3, w, h);
  g.fillStyle(darker(color, 0.2), 0.08);
  g.fillEllipse(x + 1.5, y + 1.5, w, h);
  g.fillStyle(color, 1);
  g.fillEllipse(x, y, w, h);
  g.fillStyle(lighter(color, 0.3), 0.25);
  g.fillEllipse(x - w * 0.15, y - h * 0.2, w * 0.5, h * 0.45);
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    applyRenderZoom(this);

    const width = CANVAS_WIDTH;
    const height = CANVAS_HEIGHT;

    const bg = this.add.graphics();
    for (let y = 0; y < height; y++) {
      const t = y / height;
      const r = Math.round(0xEC * (1 - t) + 0xD1 * t);
      const g = Math.round(0xFD * (1 - t) + 0xFA * t);
      const b = Math.round(0xF5 * (1 - t) + 0xE5 * t);
      bg.fillStyle((r << 16) | (g << 8) | b);
      bg.fillRect(0, y, width, 1);
    }

    addCrispText(this, width / 2, height * 0.32, 'Word Hopper', {
      fontSize: '40px',
      fontFamily: FONT_DISPLAY,
      color: hex(COLORS.PRIMARY),
      fontStyle: 'bold',
      padding: { right: 8, left: 2, top: 2, bottom: 2 },
    }).setOrigin(0.5);

    const barWidth = width * 0.5;
    const barHeight = 14;
    const barX = (width - barWidth) / 2;
    const barY = height * 0.52;

    addCrispText(this, width / 2, barY - 22, 'Loading...', {
      fontSize: '16px',
      fontFamily: FONT_BODY,
      color: hex(COLORS.TEXT_MUTED),
      fontStyle: 'normal',
    }).setOrigin(0.5);

    const barTrack = this.add.graphics();
    barTrack.fillStyle(COLORS.MUTED_DARK, 0.5);
    barTrack.fillRoundedRect(barX, barY, barWidth, barHeight, 7);
    barTrack.lineStyle(2, COLORS.BORDER, 0.6);
    barTrack.strokeRoundedRect(barX, barY, barWidth, barHeight, 7);

    const bar = this.add.graphics();

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(COLORS.PRIMARY, 1);
      if (value > 0) {
        bar.fillRoundedRect(barX, barY, barWidth * value, barHeight, 7);
      }
    });

    this.load.on('complete', () => {
      bar.destroy();
      barTrack.destroy();
      bg.destroy();
    });
  }

  create(): void {
    this.generateTextures();
    const shareData = parseShareParams();
    if (shareData) {
      this.scene.start('ShareCardScene', shareData);
    } else {
      this.scene.start('MenuScene');
    }
  }

  private generateTextures(): void {
    const g = this.add.graphics();

    this.generateSky(g);
    this.generateGround(g);
    this.generateLiukanshanIdle(g);
    this.generateLiukanshanJump(g);
    this.generateLiukanshanDead(g);
    this.generateObstacles(g);

    g.destroy();
  }

  private generateSky(g: Phaser.GameObjects.Graphics): void {
    g.clear();
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      const t = y / CANVAS_HEIGHT;
      const r = Math.floor(0xEC * (1 - t) + 0xD1 * t);
      const gv = Math.floor(0xFD * (1 - t) + 0xFA * t);
      const b = Math.floor(0xF5 * (1 - t) + 0xE5 * t);
      g.fillStyle((r << 16) | (gv << 8) | b);
      g.fillRect(0, y, CANVAS_WIDTH, 1);
    }
    g.generateTexture(SPRITE_KEYS.BG_SKY, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private generateGround(g: Phaser.GameObjects.Graphics): void {
    g.clear();
    const h = 35;
    g.fillStyle(darker(COLORS.GROUND, 0.2), 0.15);
    g.fillRect(0, 3, CANVAS_WIDTH, h);
    g.fillStyle(COLORS.GROUND, 1);
    g.fillRect(0, 0, CANVAS_WIDTH, h);
    g.fillStyle(COLORS.GROUND_LIGHT, 0.5);
    g.fillRect(0, 0, CANVAS_WIDTH, 4);
    g.generateTexture(SPRITE_KEYS.BG_GROUND, CANVAS_WIDTH, h);
  }

  private generateLiukanshanIdle(g: Phaser.GameObjects.Graphics): void {
    const W = 48, H = 56;
    g.clear();

    clayEllipse(g, W / 2, H - 22, 32, 40, COLORS.PLAYER_BODY);
    clayCircle(g, W / 2, H - 38, 16, COLORS.PLAYER_BODY);

    g.fillStyle(COLORS.PLAYER_EAR, 1);
    g.fillEllipse(W / 2 - 12, H - 50, 8, 14);
    g.fillEllipse(W / 2 + 12, H - 50, 8, 14);
    g.fillStyle(lighter(COLORS.PLAYER_EAR, 0.4), 0.5);
    g.fillEllipse(W / 2 - 13, H - 52, 4, 8);

    g.fillStyle(COLORS.PLAYER_EYE, 1);
    g.fillCircle(W / 2 - 6, H - 40, 2.5);
    g.fillCircle(W / 2 + 6, H - 40, 2.5);

    g.fillStyle(COLORS.PLAYER_NOSE, 1);
    g.fillEllipse(W / 2, H - 34, 3, 2.2);

    g.fillStyle(COLORS.PLAYER_BLUSH, 0.4);
    g.fillEllipse(W / 2 - 13, H - 35, 6, 4);
    g.fillEllipse(W / 2 + 13, H - 35, 6, 4);

    g.fillStyle(COLORS.PLAYER_SCARF, 1);
    g.fillRoundedRect(W / 2 - 14, H - 32, 28, 6, 3);
    g.lineStyle(1.5, darker(COLORS.PLAYER_SCARF, 0.25), 1);
    g.strokeRoundedRect(W / 2 - 14, H - 32, 28, 6, 3);

    g.generateTexture(SPRITE_KEYS.PLAYER_IDLE, W, H);
  }

  private generateLiukanshanJump(g: Phaser.GameObjects.Graphics): void {
    const W = 48, H = 56;
    g.clear();

    clayEllipse(g, W / 2 - 2, H - 24, 28, 36, COLORS.PLAYER_BODY);
    clayCircle(g, W / 2 - 2, H - 38, 15, COLORS.PLAYER_BODY);

    g.fillStyle(COLORS.PLAYER_EAR, 1);
    g.fillEllipse(W / 2 - 14, H - 50, 8, 13);
    g.fillEllipse(W / 2 + 10, H - 50, 8, 13);

    g.fillStyle(COLORS.PLAYER_EYE, 1);
    g.fillCircle(W / 2 - 7, H - 40, 2);
    g.fillCircle(W / 2 + 5, H - 40, 2);

    g.fillStyle(COLORS.PLAYER_NOSE, 1);
    g.fillEllipse(W / 2 - 1, H - 35, 2.5, 1.8);

    g.fillStyle(COLORS.PLAYER_BLUSH, 0.4);
    g.fillEllipse(W / 2 - 14, H - 36, 5, 3.5);

    g.fillStyle(COLORS.PLAYER_SCARF, 1);
    g.fillRoundedRect(W / 2 - 14, H - 33, 28, 6, 3);

    g.generateTexture(SPRITE_KEYS.PLAYER_JUMP, W, H);
  }

  private generateLiukanshanDead(g: Phaser.GameObjects.Graphics): void {
    const W = 48, H = 56;
    g.clear();

    clayEllipse(g, W / 2, H - 30, 34, 30, darker(COLORS.PLAYER_BODY, 0.1));
    clayCircle(g, W / 2, H - 40, 15, darker(COLORS.PLAYER_BODY, 0.08));

    g.fillStyle(darker(COLORS.PLAYER_EAR, 0.1), 1);
    g.fillEllipse(W / 2 - 12, H - 52, 7, 12);
    g.fillEllipse(W / 2 + 12, H - 52, 7, 12);

    g.lineStyle(2.5, COLORS.FOREGROUND, 1);
    g.lineBetween(W / 2 - 9, H - 43, W / 2 - 3, H - 37);
    g.lineBetween(W / 2 - 3, H - 43, W / 2 - 9, H - 37);
    g.lineBetween(W / 2 + 3, H - 43, W / 2 + 9, H - 37);
    g.lineBetween(W / 2 + 9, H - 43, W / 2 + 3, H - 37);

    g.fillStyle(COLORS.PLAYER_NOSE, 1);
    g.fillEllipse(W / 2, H - 35, 2.5, 2);

    g.lineStyle(1, darker(COLORS.FOREGROUND, 0.5), 0.6);
    g.lineBetween(W / 2 - 3, H - 31, W / 2 + 3, H - 31);

    g.fillStyle(COLORS.PLAYER_BLUSH, 0.2);
    g.fillEllipse(W / 2 - 13, H - 36, 5, 3.5);
    g.fillEllipse(W / 2 + 13, H - 36, 5, 3.5);

    g.fillStyle(COLORS.PLAYER_SCARF, 0.6);
    g.fillRoundedRect(W / 2 - 12, H - 34, 24, 5, 3);

    g.generateTexture(SPRITE_KEYS.PLAYER_DEAD, W, H);
  }

  private generateObstacles(g: Phaser.GameObjects.Graphics): void {
    const TW = 56, TH = 100;

    g.clear();
    clayEllipse(g, TW / 2, 14, 50, 28, COLORS.OBS_MUSHROOM_CAP);
    g.fillStyle(COLORS.OBS_MUSHROOM_SPOT, 0.7);
    g.fillEllipse(TW / 2 - 14, 8, 10, 6);
    g.fillEllipse(TW / 2 + 10, 18, 8, 5);
    g.fillEllipse(TW / 2 - 4, 20, 6, 4);
    g.fillStyle(darker(COLORS.OBS_MUSHROOM_STEM, 0.3), 0.12);
    g.fillRoundedRect(TW / 2 - 9 + 2, 28 + 2, 18, TH - 28, 6);
    g.fillStyle(darker(COLORS.OBS_MUSHROOM_STEM, 0.15), 0.1);
    g.fillRoundedRect(TW / 2 - 9 + 1, 28 + 1, 18, TH - 28, 6);
    g.fillStyle(COLORS.OBS_MUSHROOM_STEM, 1);
    g.fillRoundedRect(TW / 2 - 9, 28, 18, TH - 28, 6);

    g.generateTexture(SPRITE_KEYS.OBSTACLE_MUSHROOM, TW, TH);

    g.clear();
    clayEllipse(g, TW / 2, 7, 44, 14, COLORS.OBS_STUMP);
    g.fillStyle(darker(COLORS.OBS_STUMP, 0.2), 0.4);
    g.fillEllipse(TW / 2, 7, 30, 9);
    g.fillStyle(darker(COLORS.OBS_STUMP, 0.3), 0.3);
    g.fillEllipse(TW / 2, 7, 18, 5);
    g.fillStyle(darker(COLORS.OBS_STUMP, 0.4), 0.3);
    g.fillEllipse(TW / 2, 7, 8, 2.5);
    clayRect(g, TW / 2 - 18, 7, 36, TH - 7, 8, COLORS.OBS_STUMP);

    g.generateTexture(SPRITE_KEYS.OBSTACLE_STUMP, TW, TH);

    g.clear();
    g.fillStyle(darker(COLORS.OBS_BUSH, 0.2), 0.12);
    g.fillRoundedRect(TW / 2 - 22 + 2, 12 + 2, 44, TH - 12, 10);
    g.fillStyle(darker(COLORS.OBS_BUSH, 0.1), 0.08);
    g.fillRoundedRect(TW / 2 - 22 + 1, 12 + 1, 44, TH - 12, 10);
    g.fillStyle(COLORS.OBS_BUSH, 1);
    g.fillRoundedRect(TW / 2 - 22, 12, 44, TH - 12, 10);
    clayCircle(g, TW / 2, 16, 16, COLORS.OBS_BUSH);
    clayCircle(g, TW / 2 - 16, 24, 18, COLORS.OBS_BUSH);
    clayCircle(g, TW / 2 + 14, 22, 16, COLORS.OBS_BUSH);
    g.fillStyle(lighter(COLORS.OBS_BUSH, 0.2), 0.4);
    g.fillCircle(TW / 2 - 14, 20, 10);
    g.fillCircle(TW / 2 + 12, 18, 9);
    g.fillStyle(lighter(COLORS.OBS_BUSH, 0.15), 0.3);
    g.fillRoundedRect(TW / 2 - 18, 14, 36, TH * 0.3, 8);

    g.generateTexture(SPRITE_KEYS.OBSTACLE_BUSH, TW, TH);

    g.clear();
    g.fillStyle(COLORS.GROUND_LIGHT, 0.5);
    g.fillRoundedRect(TW / 2 - 8, 18, 16, TH - 18, 6);
    g.fillStyle(COLORS.GROUND_LIGHT, 0.3);
    g.fillRoundedRect(TW / 2 - 12, 40, 10, 16, 4);
    g.fillRoundedRect(TW / 2 + 4, 60, 10, 14, 4);
    g.fillStyle(COLORS.OBS_FLOWERS, 1);
    drawFlower(g, TW / 2, 10, 10, COLORS.OBS_FLOWERS_CENTER);
    drawFlower(g, TW / 2 - 18, 24, 8, COLORS.OBS_FLOWERS_CENTER);
    drawFlower(g, TW / 2 + 16, 20, 8, COLORS.OBS_FLOWERS_CENTER);
    g.lineStyle(3, COLORS.GROUND_LIGHT, 0.8);
    g.lineBetween(TW / 2 - 18, 24 + 8, TW / 2 - 18, TH);
    g.lineBetween(TW / 2 + 16, 20 + 8, TW / 2 + 16, TH);
    g.lineBetween(TW / 2, 10 + 10, TW / 2, TH);

    g.generateTexture(SPRITE_KEYS.OBSTACLE_FLOWERS, TW, TH);
  }
}

function drawFlower(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, centerColor: number): void {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const px = x + Math.cos(a) * r * 0.55;
    const py = y + Math.sin(a) * r * 0.55;
    g.fillStyle(COLORS.OBS_FLOWERS, 1);
    g.fillCircle(px, py, r * 0.4);
  }
  g.fillStyle(centerColor, 1);
  g.fillCircle(x, y, r * 0.32);
}