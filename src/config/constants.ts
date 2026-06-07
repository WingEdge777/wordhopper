export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 450;
export const PLAYER_X = 80;
export const PLAYER_HEIGHT = 56;
export const PLAYER_WIDTH = 44;
export const PLAYER_COLLISION_SHRINK = 0.6;
export const OBSTACLE_BODY_WIDTH = 30;
export const OBSTACLE_VISUAL_WIDTH = 40;
export const GROUND_HEIGHT = 35;
export const GROUND_Y = CANVAS_HEIGHT - GROUND_HEIGHT;

export const INITIAL_SCROLL_SPEED = 200;
export const MAX_SPEED_MULTIPLIER = 2.5;

export const GRAVITY = 1200;

export const SINGLE_OBSTACLE_CHANCE = 0.15;

export const TYPING_WINDOW_PER_CHAR = 0.25;
export const DECISION_BUFFER = 0.8;
export const SPACING_SAFETY_FACTOR = 1.3;

export const SPEED_INCREMENT = 0.01;

export const BASE_SCORE_PER_TICK = 1;
export const WORD_SCORE_PER_CHAR = 5;
export const COMBO_BONUS = 3;
export const PERFECT_MULTIPLIER = 1.2;

export type Difficulty = 'chill' | 'easy' | 'medium' | 'hard';

export const DIFFICULTY_CONFIG: Record<Difficulty, { minLen: number; maxLen: number; wordFile: string; speedMultiplier: number; gapMin: number; gapMax: number }> = {
  chill: { minLen: 3, maxLen: 5, wordFile: 'words-easy.json', speedMultiplier: 0.5, gapMin: 2.5, gapMax: 3.5 },
  easy: { minLen: 3, maxLen: 5, wordFile: 'words-easy.json', speedMultiplier: 1.0, gapMin: 2.0, gapMax: 3.0 },
  medium: { minLen: 6, maxLen: 8, wordFile: 'words-medium.json', speedMultiplier: 1.0, gapMin: 2.0, gapMax: 3.0 },
  hard: { minLen: 8, maxLen: Infinity, wordFile: 'words-hard.json', speedMultiplier: 1.0, gapMin: 2.0, gapMax: 3.0 },
};

export enum ObstacleType {
  Mushroom = 'mushroom',
  Stump = 'stump',
  Bush = 'bush',
  Flowers = 'flowers',
}

export enum ObstacleLayout {
  UpperLower = 'upper_lower',
  UpperOnly = 'upper_only',
  LowerOnly = 'lower_only',
}

export const SPRITE_KEYS = {
  PLAYER_RUN: 'hamster-run',
  PLAYER_JUMP: 'hamster-jump',
  PLAYER_DEAD: 'hamster-dead',
  PLAYER_RUN_ANIM: 'hamster-run',
  OBSTACLE_MUSHROOM: 'obstacle-mushroom',
  OBSTACLE_STUMP: 'obstacle-stump',
  OBSTACLE_BUSH: 'obstacle-bush',
  OBSTACLE_FLOWERS: 'obstacle-flowers',
  BG_SKY: 'background-sky',
  BG_GROUND: 'background-ground',
} as const;

export const OBSTACLE_SPRITES: Record<ObstacleType, string> = {
  [ObstacleType.Mushroom]: SPRITE_KEYS.OBSTACLE_MUSHROOM,
  [ObstacleType.Stump]: SPRITE_KEYS.OBSTACLE_STUMP,
  [ObstacleType.Bush]: SPRITE_KEYS.OBSTACLE_BUSH,
  [ObstacleType.Flowers]: SPRITE_KEYS.OBSTACLE_FLOWERS,
};