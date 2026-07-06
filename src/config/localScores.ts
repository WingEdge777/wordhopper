import type { Difficulty } from '../config/constants';

const BEST_KEY_PREFIX = 'word-hopper-best-';
const SYNC_KEY_PREFIX = 'word-hopper-leaderboard-synced-';

export interface LocalBestRecord {
  difficulty: Difficulty;
  score: number;
}

export function getLocalBestScore(difficulty: Difficulty): number {
  try {
    return parseInt(localStorage.getItem(`${BEST_KEY_PREFIX}${difficulty}`) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function setLocalBestScore(difficulty: Difficulty, score: number): void {
  try {
    localStorage.setItem(`${BEST_KEY_PREFIX}${difficulty}`, score.toString());
  } catch {
    // noop
  }
}

export function isLocalBestSynced(difficulty: Difficulty): boolean {
  try {
    return localStorage.getItem(`${SYNC_KEY_PREFIX}${difficulty}`) === '1';
  } catch {
    return false;
  }
}

export function markLocalBestSynced(difficulty: Difficulty): void {
  try {
    localStorage.setItem(`${SYNC_KEY_PREFIX}${difficulty}`, '1');
  } catch {
    // noop
  }
}

export function getUnsyncedLocalBests(): LocalBestRecord[] {
  const difficulties: Difficulty[] = ['chill', 'easy', 'medium', 'hard'];
  return difficulties.flatMap((difficulty) => {
    const score = getLocalBestScore(difficulty);
    if (score <= 0 || isLocalBestSynced(difficulty)) {
      return [];
    }
    return [{ difficulty, score }];
  });
}

export function markAllLocalBestsSynced(): void {
  const difficulties: Difficulty[] = ['chill', 'easy', 'medium', 'hard'];
  for (const difficulty of difficulties) {
    if (getLocalBestScore(difficulty) > 0) {
      markLocalBestSynced(difficulty);
    }
  }
}
