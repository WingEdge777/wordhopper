import type { Difficulty } from './constants';
import { createSeededRng, hashStringToSeed } from './rng';

/** Daily Challenge always uses easy word length / speed. */
export const DAILY_DIFFICULTY: Difficulty = 'easy';

export type GameMode = 'classic' | 'daily';

/** UTC calendar date YYYY-MM-DD. */
export function getUtcChallengeDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function getDailySeed(challengeDate = getUtcChallengeDate()): number {
  return hashStringToSeed(`wordhopper-daily-${challengeDate}`);
}

export function createDailyRng(challengeDate = getUtcChallengeDate()) {
  return createSeededRng(getDailySeed(challengeDate));
}

export function formatDailyTitle(challengeDate = getUtcChallengeDate()): string {
  return `Daily ${challengeDate.slice(5)}`;
}
