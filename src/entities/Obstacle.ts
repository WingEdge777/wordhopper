import Phaser from 'phaser';
import {
  GROUND_Y,
  ObstacleType,
  ObstacleLayout,
  OBSTACLE_SPRITES,
  OBSTACLE_BODY_WIDTH,
  OBSTACLE_VISUAL_WIDTH,
} from '../config/constants';
import { COLORS, FONT_WORD } from '../config/colors';
import { hex } from '../config/utils';

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
  private upperSp: Phaser.GameObjects.Sprite | null = null;
  private lowerSp: Phaser.GameObjects.Sprite | null = null;
  private upperRect: Phaser.Geom.Rectangle | null = null;
  private lowerRect: Phaser.Geom.Rectangle | null = null;
  private word1Typed: Phaser.GameObjects.Text | null = null;
  private word1Untyped: Phaser.GameObjects.Text | null = null;
  private word2Typed: Phaser.GameObjects.Text | null = null;
  private word2Untyped: Phaser.GameObjects.Text | null = null;
  private config: ObstacleConfig;
  private active = true;

  constructor(scene: Phaser.Scene, config: ObstacleConfig, _scrollSpeed: number) {
    this.config = config;
    const textureKey = OBSTACLE_SPRITES[config.obstacleType];

    if (config.layout !== ObstacleLayout.LowerOnly) {
      const upperHeight = config.gapY - config.gapHeight / 2;

      this.upperSp = scene.add.sprite(config.x, 0, textureKey);
      this.upperSp.setOrigin(0.5, 0);
      this.upperSp.setDisplaySize(OBSTACLE_VISUAL_WIDTH, upperHeight);
      this.upperSp.setFlipY(true);
      this.upperSp.setDepth(3);

      this.upperRect = new Phaser.Geom.Rectangle(
        config.x - OBSTACLE_BODY_WIDTH / 2,
        0,
        OBSTACLE_BODY_WIDTH,
        upperHeight
      );
    }

    if (config.layout !== ObstacleLayout.UpperOnly) {
      const lowerTop = config.gapY + config.gapHeight / 2;
      const lowerHeight = GROUND_Y - lowerTop;

      this.lowerSp = scene.add.sprite(config.x, lowerTop, textureKey);
      this.lowerSp.setOrigin(0.5, 0);
      this.lowerSp.setDisplaySize(OBSTACLE_VISUAL_WIDTH, lowerHeight);
      this.lowerSp.setDepth(3);

      this.lowerRect = new Phaser.Geom.Rectangle(
        config.x - OBSTACLE_BODY_WIDTH / 2,
        lowerTop,
        OBSTACLE_BODY_WIDTH,
        lowerHeight
      );
    }

    const primaryColor = hex(COLORS.TEXT_ON_LIGHT);
    const secondaryColor = hex(COLORS.TEXT_MUTED);

    const wordStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '20px',
      fontFamily: FONT_WORD,
      fontStyle: 'bold',
      stroke: '#FFFDF5',
      strokeThickness: 3,
    };

    const word1Full = config.word1;
    this.word1Untyped = scene.add.text(config.x, config.word1Y, word1Full, {
      ...wordStyle,
      color: primaryColor,
    });
    this.word1Untyped.setOrigin(0.5);
    this.word1Untyped.setDepth(15);

    this.word1Typed = scene.add.text(config.x, config.word1Y, '', {
      ...wordStyle,
      color: '#4ade80',
    });
    this.word1Typed.setOrigin(0.5);
    this.word1Typed.setDepth(15);

    if (config.word2) {
      this.word2Untyped = scene.add.text(config.x, config.word2Y, config.word2, {
        ...wordStyle,
        color: secondaryColor,
      });
      this.word2Untyped.setOrigin(0.5);
      this.word2Untyped.setDepth(15);

      this.word2Typed = scene.add.text(config.x, config.word2Y, '', {
        ...wordStyle,
        color: '#4ade80',
      });
      this.word2Typed.setOrigin(0.5);
      this.word2Typed.setDepth(15);
    }
  }

  update(dt: number, currentSpeed: number): void {
    const dx = currentSpeed * dt;
    this.config.x -= dx;

    if (this.upperSp) this.upperSp.x -= dx;
    if (this.lowerSp) this.lowerSp.x -= dx;
    if (this.upperRect) this.upperRect.x -= dx;
    if (this.lowerRect) this.lowerRect.x -= dx;
    if (this.word1Untyped?.active) this.word1Untyped.x -= dx;
    if (this.word1Typed?.active) this.word1Typed.x -= dx;
    if (this.word2Untyped?.active) this.word2Untyped.x -= dx;
    if (this.word2Typed?.active) this.word2Typed.x -= dx;

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

  getRects(): Phaser.Geom.Rectangle[] {
    const list: Phaser.Geom.Rectangle[] = [];
    if (this.upperRect) list.push(this.upperRect);
    if (this.lowerRect) list.push(this.lowerRect);
    return list;
  }

  highlightWord(_wordIndex: 1 | 2, charIndex: number): void {
    const word = _wordIndex === 1 ? this.config.word1 : this.config.word2;
    const untyped = _wordIndex === 1 ? this.word1Untyped : this.word2Untyped;
    const typed = _wordIndex === 1 ? this.word1Typed : this.word2Typed;
    if (!untyped || !typed || !word) return;

    const green = word.slice(0, charIndex);
    const rest = word.slice(charIndex);
    typed.setText(green);
    untyped.setText(rest);
    const fullWidth = typed.width + untyped.width;
    typed.x = this.config.x - fullWidth / 2 + typed.width / 2;
    untyped.x = this.config.x - fullWidth / 2 + typed.width + untyped.width / 2;
  }

  flashWrong(_wordIndex: 1 | 2): void {
    const untyped = _wordIndex === 1 ? this.word1Untyped : this.word2Untyped;
    const typed = _wordIndex === 1 ? this.word1Typed : this.word2Typed;
    if (untyped) untyped.setColor('#ef4444');
    if (typed) typed.setColor('#ef4444');
  }

  fadeUnselected(keepWordIndex: 1 | 2): void {
    const fadeUntyped = keepWordIndex === 1 ? this.word2Untyped : this.word1Untyped;
    const fadeTyped = keepWordIndex === 1 ? this.word2Typed : this.word1Typed;
    if (fadeUntyped) fadeUntyped.setAlpha(0.2);
    if (fadeTyped) fadeTyped.setAlpha(0.2);
  }

  clearWords(): void {
    if (this.word1Untyped?.active) this.word1Untyped.destroy();
    if (this.word1Typed?.active) this.word1Typed.destroy();
    if (this.word2Untyped?.active) this.word2Untyped.destroy();
    if (this.word2Typed?.active) this.word2Typed.destroy();
  }

  destroy(): void {
    if (this.upperSp) this.upperSp.destroy();
    if (this.lowerSp) this.lowerSp.destroy();
    if (this.word1Untyped?.active) this.word1Untyped.destroy();
    if (this.word1Typed?.active) this.word1Typed.destroy();
    if (this.word2Untyped?.active) this.word2Untyped.destroy();
    if (this.word2Typed?.active) this.word2Typed.destroy();
  }
}