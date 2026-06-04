import Phaser from 'phaser';
import {
  CANVAS_HEIGHT,
  GROUND_Y,
  ObstacleType,
  ObstacleLayout,
  OBSTACLE_SPRITES,
} from '../config/constants';
import { COLORS, FONT_WORD } from '../config/colors';

export interface ObstacleConfig {
  layout: ObstacleLayout;
  obstacleType: ObstacleType;
  gapY: number;
  gapHeight: number;
  x: number;
  word1: string;
  word1Y: number;
  word2: string;
  word2Y: number;
}

export class Obstacle {
  private upperSp: Phaser.Physics.Arcade.Sprite | null = null;
  private lowerSp: Phaser.Physics.Arcade.Sprite | null = null;
  private word1Text: Phaser.GameObjects.Text;
  private word2Text: Phaser.GameObjects.Text | null = null;
  private config: ObstacleConfig;
  private scrollSpeed: number;
  private active = true;

  constructor(scene: Phaser.Scene, config: ObstacleConfig, scrollSpeed: number) {
    this.config = config;
    this.scrollSpeed = scrollSpeed;
    const textureKey = OBSTACLE_SPRITES[config.obstacleType];

    if (config.layout !== ObstacleLayout.LowerOnly) {
      const upperHeight = config.gapY - config.gapHeight / 2;
      this.upperSp = scene.physics.add.sprite(config.x, 0, textureKey);
      this.upperSp.setOrigin(0.5, 0);
      this.upperSp.setDisplaySize(40, upperHeight);
      this.upperSp.setFlipY(true);
      this.upperSp.body!.immovable = true;
    }

    if (config.layout !== ObstacleLayout.UpperOnly) {
      const lowerTop = config.gapY + config.gapHeight / 2;
      this.lowerSp = scene.physics.add.sprite(config.x, lowerTop, textureKey);
      this.lowerSp.setOrigin(0.5, 0);
      this.lowerSp.setDisplaySize(40, GROUND_Y - lowerTop);
      this.lowerSp.body!.immovable = true;
    }

    const primaryColor = `#${COLORS.TEXT_ON_LIGHT.toString(16).padStart(6, '0')}`;
    const secondaryColor = `#${COLORS.TEXT_MUTED.toString(16).padStart(6, '0')}`;

    this.word1Text = scene.add.text(config.x, config.word1Y, config.word1, {
      fontSize: '20px',
      color: primaryColor,
      fontFamily: FONT_WORD,
      fontStyle: 'bold',
      stroke: '#FFFDF5',
      strokeThickness: 3,
    });
    this.word1Text.setOrigin(0.5);
    this.word1Text.setDepth(15);

    if (config.word2) {
      this.word2Text = scene.add.text(config.x, config.word2Y, config.word2, {
        fontSize: '20px',
        color: secondaryColor,
        fontFamily: FONT_WORD,
        fontStyle: 'bold',
        stroke: '#FFFDF5',
        strokeThickness: 3,
      });
      this.word2Text.setOrigin(0.5);
      this.word2Text.setDepth(15);
    }
  }

  update(dt: number): void {
    const dx = this.scrollSpeed * dt;
    this.config.x -= dx;

    if (this.upperSp) this.upperSp.x -= dx;
    if (this.lowerSp) this.lowerSp.x -= dx;
    if (this.word1Text && this.word1Text.active) this.word1Text.x -= dx;
    if (this.word2Text && this.word2Text.active) this.word2Text.x -= dx;

    if (this.config.x < -80) {
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

  getSprites(): Phaser.Physics.Arcade.Sprite[] {
    const sprites: Phaser.Physics.Arcade.Sprite[] = [];
    if (this.upperSp) sprites.push(this.upperSp);
    if (this.lowerSp) sprites.push(this.lowerSp);
    return sprites;
  }

  highlightWord(_wordIndex: 1 | 2, charIndex: number): void {
    const word = _wordIndex === 1 ? this.config.word1 : this.config.word2;
    const text = _wordIndex === 1 ? this.word1Text : this.word2Text;
    if (!text || !word) return;

    const green = word.slice(0, charIndex);
    const rest = word.slice(charIndex);
    text.setText(`${green}|${rest}`);
    const greenColor = '#4ade80';
    text.setColor(greenColor);
  }

  flashWrong(_wordIndex: 1 | 2): void {
    const text = _wordIndex === 1 ? this.word1Text : this.word2Text;
    if (!text) return;
    text.setColor('#ef4444');
  }

  fadeUnselected(keepWordIndex: 1 | 2): void {
    const fadeText = keepWordIndex === 1 ? this.word2Text : this.word1Text;
    if (fadeText) fadeText.setAlpha(0.2);
  }

  clearWords(): void {
    if (this.word1Text && this.word1Text.active) this.word1Text.destroy();
    if (this.word2Text && this.word2Text.active) this.word2Text.destroy();
  }

  destroy(): void {
    if (this.upperSp) this.upperSp.destroy();
    if (this.lowerSp) this.lowerSp.destroy();
    if (this.word1Text && this.word1Text.active) this.word1Text.destroy();
    if (this.word2Text && this.word2Text.active) this.word2Text.destroy();
  }
}