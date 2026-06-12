import {
  CANVAS_WIDTH,
  GROUND_Y,
  GRAVITY,
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
  private difficulty: Difficulty = 'easy';

  constructor(wordSpawner: WordSpawner, speedManager: SpeedManager) {
    this.wordSpawner = wordSpawner;
    this.speedManager = speedManager;
  }

  setDifficulty(difficulty: Difficulty): void {
    this.difficulty = difficulty;
  }

  canSpawn(currentRightEdge: number): boolean {
    if (currentRightEdge <= 0) return true;
    return currentRightEdge <= CANVAS_WIDTH - this.getMinSpacing();
  }

  generate(currentSpeed: number, tutorial = false): ObstacleConfig {
    const layout = this.pickLayout();
    const diffConfig = DIFFICULTY_CONFIG[this.difficulty];
    const gapMin = tutorial ? diffConfig.gapMax * PLAYER_HEIGHT : diffConfig.gapMin * PLAYER_HEIGHT;
    const gapMax = tutorial ? diffConfig.gapMax * 1.5 * PLAYER_HEIGHT : diffConfig.gapMax * PLAYER_HEIGHT;
    const gapHeight = this.randomRange(gapMin, gapMax);
    const gapY = this.computeGapY(layout, gapHeight);
    const obstacleType = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];

    const x = tutorial ? CANVAS_WIDTH * 0.6 : CANVAS_WIDTH + 50;

    let word1: string;
    let word2 = '';
    let word1Y: number;
    let word2Y = 0;

    if (layout === ObstacleLayout.UpperLower) {
      const pair = this.wordSpawner.generatePair();
      const topWord = pair.word1.length >= pair.word2.length ? pair.word1 : pair.word2;
      const bottomWord = pair.word1.length >= pair.word2.length ? pair.word2 : pair.word1;
      word1 = topWord;
      word2 = bottomWord;
      word1Y = gapY - gapHeight / 6;
      word2Y = gapY + gapHeight / 6;
    } else {
      word1 = this.wordSpawner.generateSingle();
      if (layout === ObstacleLayout.UpperOnly) {
        word1Y = gapY + gapHeight / 3;
      } else {
        word1Y = gapY - gapHeight / 3;
      }
    }

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

  private getMinSpacing(): number {
    const config = DIFFICULTY_CONFIG[this.difficulty];
    const avgCharCount = (config.minLen + Math.min(config.maxLen, 15)) / 2;
    const typingWindow = avgCharCount * TYPING_WINDOW_PER_CHAR + DECISION_BUFFER;
    const maxJumpHeight = GROUND_Y - (config.gapMin * PLAYER_HEIGHT / 2 + 20);
    const jumpTime = 2 * Math.sqrt(2 * maxJumpHeight / GRAVITY);
    const speed = this.speedManager.getSpeed();
    return speed * (jumpTime + typingWindow) * SPACING_SAFETY_FACTOR;
  }

  private pickLayout(): ObstacleLayout {
    if (Math.random() < SINGLE_OBSTACLE_CHANCE) {
      return Math.random() < 0.5 ? ObstacleLayout.UpperOnly : ObstacleLayout.LowerOnly;
    }
    return ObstacleLayout.UpperLower;
  }

  private computeGapY(layout: ObstacleLayout, gapHeight: number): number {
    const minY = gapHeight / 2 + 20;
    const maxY = GROUND_Y - gapHeight / 2 - 10;

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
}