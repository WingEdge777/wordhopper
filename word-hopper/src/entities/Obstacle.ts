import Phaser from 'phaser';
import {
  CANVAS_HEIGHT,
  GROUND_Y,
  PIXEL_SIZE,
  PlantType,
  ObstacleLayout,
} from '../config/constants';
import { COLORS, FONT_BODY } from '../config/colors';
import { drawPixelRect, drawPixel, colorToHex } from '../utils/PixelArt';

export interface ObstacleConfig {
  layout: ObstacleLayout;
  plantType: PlantType;
  gapY: number;
  gapHeight: number;
  x: number;
  word1: string;
  word1Y: number;
  word2: string;
  word2Y: number;
}

export class Obstacle {
  private upperGfx: Phaser.GameObjects.Graphics | null = null;
  private lowerGfx: Phaser.GameObjects.Graphics | null = null;
  private word1Text: Phaser.GameObjects.Text;
  private word2Text: Phaser.GameObjects.Text | null = null;
  private config: ObstacleConfig;
  private scrollSpeed: number;
  private active = true;

  constructor(scene: Phaser.Scene, config: ObstacleConfig, scrollSpeed: number) {
    this.config = config;
    this.scrollSpeed = scrollSpeed;

    if (config.layout !== ObstacleLayout.LowerOnly) {
      const upperHeight = config.gapY - config.gapHeight / 2;
      const gridHeight = Math.floor(upperHeight / PIXEL_SIZE);
      this.upperGfx = scene.add.graphics();
      this.upperGfx.x = config.x;
      this.drawPlant(this.upperGfx, 0, true, gridHeight);
    }

    if (config.layout !== ObstacleLayout.UpperOnly) {
      const lowerTop = config.gapY + config.gapHeight / 2;
      const lowerHeight = GROUND_Y - lowerTop;
      const gridStartY = Math.floor(lowerTop / PIXEL_SIZE);
      const gridHeight = Math.floor(lowerHeight / PIXEL_SIZE);
      this.lowerGfx = scene.add.graphics();
      this.lowerGfx.x = config.x;
      this.drawPlant(this.lowerGfx, gridStartY, false, gridHeight);
    }

    this.word1Text = scene.add.text(config.x, config.word1Y, config.word1, {
      fontSize: '18px',
      color: colorToHex(COLORS.PRIMARY),
      fontFamily: FONT_BODY,
      fontStyle: 'bold',
    });
    this.word1Text.setOrigin(0.5);

    if (config.word2) {
      this.word2Text = scene.add.text(config.x, config.word2Y, config.word2, {
        fontSize: '18px',
        color: colorToHex(COLORS.SECONDARY),
        fontFamily: FONT_BODY,
        fontStyle: 'bold',
      });
      this.word2Text.setOrigin(0.5);
    }
  }

  update(dt: number): void {
    const dx = this.scrollSpeed * dt;
    this.config.x -= dx;

    if (this.upperGfx) this.upperGfx.x -= dx;
    if (this.lowerGfx) this.lowerGfx.x -= dx;
    this.word1Text.x -= dx;
    if (this.word2Text) this.word2Text.x -= dx;

    if (this.config.x < -50) {
      this.active = false;
    }
  }

  getX(): number {
    return this.config.x;
  }

  isActive(): boolean {
    return this.active;
  }

  getConfig(): ObstacleConfig {
    return this.config;
  }

  highlightWord(wordIndex: 1 | 2, charIndex: number): void {
    const text = wordIndex === 1 ? this.word1Text : this.word2Text;
    if (!text) return;

    const word = wordIndex === 1 ? this.config.word1 : this.config.word2;
    const green = word.slice(0, charIndex);
    const rest = word.slice(charIndex);
    text.setText(`${green}|${rest}`);
    text.setColor(colorToHex(COLORS.SUCCESS));
  }

  flashWrong(wordIndex: 1 | 2): void {
    const text = wordIndex === 1 ? this.word1Text : this.word2Text;
    if (!text) return;
    text.setColor(colorToHex(COLORS.DANGER));
  }

  fadeUnselected(keepWordIndex: 1 | 2): void {
    const fadeText = keepWordIndex === 1 ? this.word2Text : this.word1Text;
    if (fadeText) fadeText.setAlpha(0.2);
  }

  clearWords(): void {
    this.word1Text.destroy();
    if (this.word2Text) this.word2Text.destroy();
  }

  destroy(): void {
    if (this.upperGfx) this.upperGfx.destroy();
    if (this.lowerGfx) this.lowerGfx.destroy();
    if (this.word1Text && this.word1Text.active) this.word1Text.destroy();
    if (this.word2Text && this.word2Text.active) this.word2Text.destroy();
  }

  getUpperBounds(): Phaser.Geom.Rectangle | null {
    if (!this.upperGfx) return null;
    const w = 30, h = this.config.gapY - this.config.gapHeight / 2;
    return new Phaser.Geom.Rectangle(this.config.x - w / 2, 0, w, h);
  }

  getLowerBounds(): Phaser.Geom.Rectangle | null {
    if (!this.lowerGfx) return null;
    const lowerTop = this.config.gapY + this.config.gapHeight / 2;
    const w = 30;
    const h = CANVAS_HEIGHT - lowerTop;
    return new Phaser.Geom.Rectangle(this.config.x - w / 2, lowerTop, w, h);
  }

  private drawPlant(g: Phaser.GameObjects.Graphics, startY: number, isUpper: boolean, height: number): void {
    if (height <= 0) return;
    switch (this.config.plantType) {
      case PlantType.Cactus:
        this.drawCactus(g, startY, isUpper, height);
        break;
      case PlantType.Bramble:
        this.drawBramble(g, startY, isUpper, height);
        break;
      case PlantType.Mushroom:
        this.drawMushroom(g, startY, isUpper, height);
        break;
      case PlantType.VenusFlytrap:
        this.drawVenusFlytrap(g, startY, isUpper, height);
        break;
      case PlantType.TreeStump:
        this.drawTreeStump(g, startY, isUpper, height);
        break;
      case PlantType.HangingVines:
        this.drawHangingVines(g, startY, isUpper, height);
        break;
    }
  }

  private drawCactus(g: Phaser.GameObjects.Graphics, startY: number, isUpper: boolean, height: number): void {
    drawPixelRect(g, -1, startY, 3, height, COLORS.PLANT_CACTUS);

    drawPixelRect(g, -1, startY, 3, 1, COLORS.PLANT_CACTUS_LIGHT);
    drawPixelRect(g, -1, startY + height - 1, 3, 1, COLORS.PLANT_CACTUS_LIGHT);

    for (let row = startY + 2; row < startY + height - 1; row += 4) {
      drawPixel(g, -2, row, COLORS.PLANT_CACTUS_DARK);
      drawPixel(g, 2, row, COLORS.PLANT_CACTUS_DARK);
    }

    if (height > 6) {
      const leftArmRow = startY + Math.floor(height * 0.3);
      if (leftArmRow > startY) {
        drawPixelRect(g, -4, leftArmRow, 3, 1, COLORS.PLANT_CACTUS);
        drawPixel(g, -4, leftArmRow - 1, COLORS.PLANT_CACTUS_LIGHT);
      }
      const rightArmRow = startY + Math.floor(height * 0.6);
      if (rightArmRow > startY) {
        drawPixelRect(g, 2, rightArmRow, 3, 1, COLORS.PLANT_CACTUS);
        drawPixel(g, 4, rightArmRow - 1, COLORS.PLANT_CACTUS_LIGHT);
      }
    }
  }

  private drawBramble(g: Phaser.GameObjects.Graphics, startY: number, isUpper: boolean, height: number): void {
    for (let row = 0; row < height; row++) {
      const offset = (Math.floor(row / 2) % 2 === 0) ? 0 : 1;
      const x = -6 + offset;
      drawPixelRect(g, x, startY + row, 12, 1, COLORS.PLANT_BRAMBLE);
      if (row % 3 === 0) {
        drawPixel(g, x - 1, startY + row, COLORS.PLANT_BRAMBLE_THORN);
        drawPixel(g, x + 12, startY + row, COLORS.PLANT_BRAMBLE_THORN);
      }
    }
  }

  private drawMushroom(g: Phaser.GameObjects.Graphics, startY: number, isUpper: boolean, height: number): void {
    const capRows = Math.min(4, Math.max(1, Math.floor(height * 0.3)));
    const stemHeight = height - capRows;
    const stemWidth = 4;
    const domeProfile = [3, 5, 7, 7];

    if (!isUpper) {
      for (let i = 0; i < capRows; i++) {
        const w = domeProfile[i];
        drawPixelRect(g, -Math.floor(w / 2), startY + i, w, 1, COLORS.PLANT_MUSHROOM_CAP);
      }
      if (capRows >= 3) {
        const spotRow = startY + capRows - 2;
        drawPixel(g, -2, spotRow, COLORS.PLANT_MUSHROOM_SPOT);
        drawPixel(g, 2, spotRow, COLORS.PLANT_MUSHROOM_SPOT);
      }
      drawPixelRect(g, -Math.floor(stemWidth / 2), startY + capRows, stemWidth, stemHeight, COLORS.PLANT_MUSHROOM_STEM);
    } else {
      const capStartY = startY + height - capRows;
      for (let i = 0; i < capRows; i++) {
        const w = domeProfile[capRows - 1 - i];
        drawPixelRect(g, -Math.floor(w / 2), capStartY + i, w, 1, COLORS.PLANT_MUSHROOM_CAP);
      }
      if (capRows >= 3) {
        const spotRow = capStartY + 1;
        drawPixel(g, -2, spotRow, COLORS.PLANT_MUSHROOM_SPOT);
        drawPixel(g, 2, spotRow, COLORS.PLANT_MUSHROOM_SPOT);
      }
      drawPixelRect(g, -Math.floor(stemWidth / 2), startY, stemWidth, stemHeight, COLORS.PLANT_MUSHROOM_STEM);
    }
  }

  private drawVenusFlytrap(g: Phaser.GameObjects.Graphics, startY: number, isUpper: boolean, height: number): void {
    const jawRows = Math.max(4, Math.floor(height * 0.25));
    const stemHeight = height - jawRows;
    const stemWidth = 4;

    if (!isUpper) {
      drawPixelRect(g, -Math.floor(stemWidth / 2), startY + jawRows, stemWidth, stemHeight, COLORS.PLANT_FLYTRAP_STEM);
      const halfJaw = Math.floor(jawRows / 2);
      drawPixelRect(g, -4, startY, 8, halfJaw, COLORS.PLANT_FLYTRAP);
      drawPixelRect(g, -3, startY + halfJaw - 1, 6, 2, COLORS.PLANT_FLYTRAP_MOUTH);
      drawPixelRect(g, -4, startY + halfJaw + 1, 8, jawRows - halfJaw - 1, COLORS.PLANT_FLYTRAP);
      for (let tx = -3; tx <= 3; tx += 2) {
        drawPixel(g, tx, startY + halfJaw - 1, 0xffffff);
      }
      for (let tx = -2; tx <= 2; tx += 2) {
        drawPixel(g, tx, startY + halfJaw, 0xffffff);
      }
    } else {
      drawPixelRect(g, -Math.floor(stemWidth / 2), startY, stemWidth, stemHeight, COLORS.PLANT_FLYTRAP_STEM);
      const jawStartY = startY + stemHeight;
      const halfJaw = Math.floor(jawRows / 2);
      drawPixelRect(g, -4, jawStartY, 8, halfJaw, COLORS.PLANT_FLYTRAP);
      drawPixelRect(g, -3, jawStartY + halfJaw - 1, 6, 2, COLORS.PLANT_FLYTRAP_MOUTH);
      drawPixelRect(g, -4, jawStartY + halfJaw + 1, 8, jawRows - halfJaw - 1, COLORS.PLANT_FLYTRAP);
      for (let tx = -3; tx <= 3; tx += 2) {
        drawPixel(g, tx, jawStartY + halfJaw - 1, 0xffffff);
      }
      for (let tx = -2; tx <= 2; tx += 2) {
        drawPixel(g, tx, jawStartY + halfJaw, 0xffffff);
      }
    }
  }

  private drawTreeStump(g: Phaser.GameObjects.Graphics, startY: number, isUpper: boolean, height: number): void {
    drawPixelRect(g, -5, startY, 10, height, COLORS.PLANT_STUMP);
    if (!isUpper) {
      drawPixelRect(g, -5, startY, 10, 2, COLORS.PLANT_STUMP_RING);
      drawPixelRect(g, -3, startY, 6, 2, COLORS.PLANT_STUMP);
      drawPixelRect(g, -5, startY + height - 1, 10, 1, COLORS.PLANT_STUMP_HIGHLIGHT);
    } else {
      drawPixelRect(g, -5, startY + height - 2, 10, 2, COLORS.PLANT_STUMP_RING);
      drawPixelRect(g, -3, startY + height - 2, 6, 2, COLORS.PLANT_STUMP);
      drawPixelRect(g, -5, startY, 10, 1, COLORS.PLANT_STUMP_HIGHLIGHT);
    }
  }

  private drawHangingVines(g: Phaser.GameObjects.Graphics, startY: number, isUpper: boolean, height: number): void {
    if (isUpper) {
      drawPixelRect(g, -5, startY, 10, 2, COLORS.PLANT_VINES);
      const lengths = [
        Math.floor(height * 0.5),
        Math.floor(height * 0.8),
        Math.floor(height * 0.6),
      ];
      const xPositions = [-3, 0, 3];
      for (let i = 0; i < 3; i++) {
        const len = lengths[i];
        const x = xPositions[i];
        if (len > 3) {
          drawPixelRect(g, x, startY + 2, 1, len - 3, COLORS.PLANT_VINES);
        }
        drawPixelRect(g, x - 1, startY + len - 1, 3, 1, COLORS.PLANT_VINES_LEAF);
      }
    } else {
      drawPixelRect(g, -5, startY + height - 2, 10, 2, COLORS.PLANT_VINES);
      const lengths = [
        Math.floor(height * 0.5),
        Math.floor(height * 0.8),
        Math.floor(height * 0.6),
      ];
      const xPositions = [-3, 0, 3];
      for (let i = 0; i < 3; i++) {
        const len = lengths[i];
        const x = xPositions[i];
        if (len > 3) {
          drawPixelRect(g, x, startY + height - 2 - len + 3, 1, len - 3, COLORS.PLANT_VINES);
        }
        drawPixelRect(g, x - 1, startY + height - 2 - len, 3, 1, COLORS.PLANT_VINES_LEAF);
      }
    }
  }
}
