import Phaser from 'phaser';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  GAP_MIN,
  GAP_MAX,
  SINGLE_OBSTACLE_CHANCE,
  PlantType,
  ObstacleLayout,
} from '../config/constants';

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
  private upperRect: Phaser.GameObjects.Rectangle | null = null;
  private lowerRect: Phaser.GameObjects.Rectangle | null = null;
  private word1Text: Phaser.GameObjects.Text;
  private word2Text: Phaser.GameObjects.Text | null = null;
  private config: ObstacleConfig;
  private scrollSpeed: number;
  private active = true;

  constructor(scene: Phaser.Scene, config: ObstacleConfig, scrollSpeed: number) {
    this.config = config;
    this.scrollSpeed = scrollSpeed;

    const plantColor = this.getPlantColor(config.plantType);

    if (config.layout !== ObstacleLayout.LowerOnly) {
      const upperHeight = config.gapY - config.gapHeight / 2;
      this.upperRect = scene.add.rectangle(
        config.x,
        upperHeight / 2,
        30,
        upperHeight,
        plantColor
      );
    }

    if (config.layout !== ObstacleLayout.UpperOnly) {
      const lowerTop = config.gapY + config.gapHeight / 2;
      const lowerHeight = CANVAS_HEIGHT - lowerTop;
      this.lowerRect = scene.add.rectangle(
        config.x,
        lowerTop + lowerHeight / 2 - 35,
        30,
        lowerHeight,
        plantColor
      );
    }

    this.word1Text = scene.add.text(config.x, config.word1Y, config.word1, {
      fontSize: '18px',
      color: '#4ecdc4',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    this.word1Text.setOrigin(0.5);

    if (config.word2) {
      this.word2Text = scene.add.text(config.x, config.word2Y, config.word2, {
        fontSize: '18px',
        color: '#ffd93d',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      });
      this.word2Text.setOrigin(0.5);
    }
  }

  update(dt: number): void {
    const dx = this.scrollSpeed * dt;
    this.config.x -= dx;

    if (this.upperRect) this.upperRect.x -= dx;
    if (this.lowerRect) this.lowerRect.x -= dx;
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
    text.setColor('#2ecc71');
  }

  flashWrong(wordIndex: 1 | 2): void {
    const text = wordIndex === 1 ? this.word1Text : this.word2Text;
    if (!text) return;
    text.setColor('#e74c3c');
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
    if (this.upperRect) this.upperRect.destroy();
    if (this.lowerRect) this.lowerRect.destroy();
    if (this.word1Text && this.word1Text.active) this.word1Text.destroy();
    if (this.word2Text && this.word2Text.active) this.word2Text.destroy();
  }

  getUpperBounds(): Phaser.Geom.Rectangle | null {
    if (!this.upperRect) return null;
    const w = 30, h = this.config.gapY - this.config.gapHeight / 2;
    return new Phaser.Geom.Rectangle(this.config.x - w / 2, 0, w, h);
  }

  getLowerBounds(): Phaser.Geom.Rectangle | null {
    if (!this.lowerRect) return null;
    const lowerTop = this.config.gapY + this.config.gapHeight / 2;
    const w = 30;
    const h = CANVAS_HEIGHT - lowerTop;
    return new Phaser.Geom.Rectangle(this.config.x - w / 2, lowerTop, w, h);
  }

  private getPlantColor(type: PlantType): number {
    const colors: Record<PlantType, number> = {
      [PlantType.Cactus]: 0x2ecc71,
      [PlantType.Bramble]: 0x2d5016,
      [PlantType.Mushroom]: 0xe17055,
      [PlantType.VenusFlytrap]: 0x27ae60,
      [PlantType.TreeStump]: 0x8b4513,
      [PlantType.HangingVines]: 0x6ab04c,
    };
    return colors[type];
  }
}
