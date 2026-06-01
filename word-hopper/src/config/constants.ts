export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 450;
export const PLAYER_X = 80;
export const PLAYER_HEIGHT = 32;
export const PLAYER_WIDTH = 24;
export const PLAYER_COLLISION_SHRINK = 0.6;
export const GROUND_Y = CANVAS_HEIGHT - 35;

export const INITIAL_SCROLL_SPEED = 200;
export const MAX_SPEED_MULTIPLIER = 2.5;

export const GRAVITY = 1200;

export const GAP_MIN = 3.5 * PLAYER_HEIGHT;
export const GAP_MAX = 5.5 * PLAYER_HEIGHT;

export const SINGLE_OBSTACLE_CHANCE = 0.3;

export const TYPING_WINDOW_PER_CHAR = 0.25;
export const DECISION_BUFFER = 0.8;
export const SPACING_SAFETY_FACTOR = 1.3;

export const SPEED_PHASE1_END = 500;
export const SPEED_PHASE2_END = 1500;
export const SPEED_PHASE2_INTERVAL = 3;
export const SPEED_INCREMENT = 0.01;

export const BASE_SCORE_PER_TICK = 1;
export const WORD_BONUS_MULTIPLIER = 10;

export const WRONG_LETTER_FLASH_MS = 200;

export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_CONFIG: Record<Difficulty, { minLen: number; maxLen: number; wordFile: string }> = {
  easy: { minLen: 3, maxLen: 5, wordFile: 'words-easy.json' },
  medium: { minLen: 6, maxLen: 10, wordFile: 'words-medium.json' },
  hard: { minLen: 11, maxLen: Infinity, wordFile: 'words-hard.json' },
};

export enum PlantType {
  Cactus = 'cactus',
  Bramble = 'bramble',
  Mushroom = 'mushroom',
  VenusFlytrap = 'venus_flytrap',
  TreeStump = 'tree_stump',
  HangingVines = 'hanging_vines',
}

export enum ObstacleLayout {
  UpperLower = 'upper_lower',
  UpperOnly = 'upper_only',
  LowerOnly = 'lower_only',
}
