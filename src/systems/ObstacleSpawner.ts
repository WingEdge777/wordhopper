import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  PLAYER_X,
  GAP_MIN,
  GAP_MAX,
  PLAYER_HEIGHT,
  SINGLE_OBSTACLE_CHANCE,
  TYPING_WINDOW_PER_CHAR,
  DECISION_BUFFER,
  SPACING_SAFETY_FACTOR,
  ObstacleType,
  ObstacleLayout,
  Difficulty,
  DIFFICULTY_CONFIG,
} from '../config/constants';
import { ObstacleConfig } from '../entities/Obstacle';
import { WordSpawner } from './WordSpawner';
import { SpeedManager } from './SpeedManager';

const OBSTACLE_TYPES = Object.values(ObstacleType);

export class ObstacleSpawner {
  private wordSpawner: WordSpawner;
  private speedManager: SpeedManager;
  private lastObstacleX = CANVAS_WIDTH;
  private difficulty: Difficulty = 'easy';

  constructor(wordSpawner: WordSpawner, speedManager: SpeedManager) {
    this.wordSpawner = wordSpawner;
    this.speedManager = speedManager;
  }

  setDifficulty(difficulty: Difficulty): void {
    this.difficulty = difficulty;
  }

  canSpawn(currentRightEdge: number): boolean {
    return currentRightEdge <= this.lastObstacleX - this.getMinSpacing();
  }

  generate(currentSpeed: number): ObstacleConfig {
    const layout = this.pickLayout();
    const gapHeight = this.randomRange(GAP_MIN, GAP_MAX);
    const gapY = this.computeGapY(layout, gapHeight);
    const obstacleType = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];

    const x = CANVAS_WIDTH + 50;

    let word1: string;
    let word2 = '';
    let word1Y: number;
    let word2Y = 0;

    if (layout === ObstacleLayout.UpperLower) {
      const pair = this.wordSpawner.generatePair();
      word1 = pair.word1;
      word2 = pair.word2;
      word1Y = gapY - gapHeight / 4;
      word2Y = gapY + gapHeight / 4;
    } else {
      word1 = this.wordSpawner.generateSingle();
      if (layout === ObstacleLayout.UpperOnly) {
        word1Y = gapY + gapHeight / 3;
      } else {
        word1Y = gapY - gapHeight / 3;
      }
    }

    this.lastObstacleX = x;

    return {
      layout,
      obstacleType,
      gapY,
      gapHeight,
      x,
      word1,
      word1Y,
      word2,
      word2Y,
    };
  }

  onObstaclePassed(x: number): void {
    this.lastObstacleX = x;
  }

  private getMinSpacing(): number {
    const config = DIFFICULTY_CONFIG[this.difficulty];
    const avgCharCount = (config.minLen + Math.min(config.maxLen, 15)) / 2;
    const typingWindow = avgCharCount * TYPING_WINDOW_PER_CHAR + DECISION_BUFFER;
    const speed = this.speedManager.getSpeed();
    const compression = this.speedManager.getCompressionFactor();
    return speed * typingWindow * SPACING_SAFETY_FACTOR * compression;
  }

  private pickLayout(): ObstacleLayout {
    if (Math.random() < SINGLE_OBSTACLE_CHANCE) {
      return Math.random() < 0.5 ? ObstacleLayout.UpperOnly : ObstacleLayout.LowerOnly;
    }
    return ObstacleLayout.UpperLower;
  }

  private computeGapY(layout: ObstacleLayout, gapHeight: number): number {
    const minY = gapHeight / 2 + 20;
    const maxY = CANVAS_HEIGHT - 35 - gapHeight / 2 - 10;

    if (layout === ObstacleLayout.UpperOnly) {
      return this.randomRange(minY, minY + (maxY - minY) * 0.4);
    }
    if (layout === ObstacleLayout.LowerOnly) {
      return this.randomRange(minY + (maxY - minY) * 0.6, maxY);
    }
    return this.randomRange(minY, maxY);
  }

  private randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  reset(): void {
    this.lastObstacleX = CANVAS_WIDTH;
  }
}