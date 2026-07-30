import type { Difficulty } from '../config/constants';

const BEST_KEY_PREFIX = 'word-hopper-best-';
const SYNC_KEY_PREFIX = 'word-hopper-leaderboard-synced-';

export interface LocalBestStats {
  score: number;
  wpm: number;
  bestWord: string;
}

export interface LocalBestRecord extends LocalBestStats {
  difficulty: Difficulty;
}

function bestKey(difficulty: Difficulty): string {
  return `${BEST_KEY_PREFIX}${difficulty}`;
}

function parseStoredBest(raw: string | null): LocalBestStats | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'number' && parsed > 0) {
      return { score: parsed, wpm: 0, bestWord: '' };
    }
    if (typeof parsed === 'object' && parsed !== null) {
      const record = parsed as Partial<LocalBestStats>;
      if (typeof record.score === 'number' && record.score > 0) {
        return {
          score: record.score,
          wpm: typeof record.wpm === 'number' ? record.wpm : 0,
          bestWord: typeof record.bestWord === 'string' ? record.bestWord : '',
        };
      }
    }
  } catch {
    const legacyScore = parseInt(raw, 10);
    if (legacyScore > 0) {
      return { score: legacyScore, wpm: 0, bestWord: '' };
    }
  }
  return null;
}

export function getLocalBestStats(difficulty: Difficulty): LocalBestStats {
  try {
    return parseStoredBest(localStorage.getItem(bestKey(difficulty))) ?? {
      score: 0,
      wpm: 0,
      bestWord: '',
    };
  } catch {
    return { score: 0, wpm: 0, bestWord: '' };
  }
}

export function getLocalBestScore(difficulty: Difficulty): number {
  return getLocalBestStats(difficulty).score;
}

export function setLocalBestScore(
  difficulty: Difficulty,
  score: number,
  wpm = 0,
  bestWord = '',
): void {
  try {
    localStorage.setItem(
      bestKey(difficulty),
      JSON.stringify({ score, wpm, bestWord }),
    );
    localStorage.removeItem(`${SYNC_KEY_PREFIX}${difficulty}`);
  } catch {
    // noop
  }
}

/** Raise local best to a server entry (never used to lower a personal best). */
export function applyServerBest(
  difficulty: Difficulty,
  score: number,
  wpm = 0,
  bestWord = '',
): void {
  if (score <= 0) return;
  try {
    localStorage.setItem(
      bestKey(difficulty),
      JSON.stringify({ score, wpm, bestWord }),
    );
    markLocalBestSynced(difficulty);
  } catch {
    // noop
  }
}

/**
 * Local personal BEST is authoritative (never lowered).
 * Only adopt a server entry when it is strictly higher, or equal (mark synced).
 */
export function reconcileLocalBestFromEntries(
  difficulty: Difficulty,
  nickname: string,
  entries: Array<{ nickname: string; score: number; wpm: number; best_word: string }>,
): boolean {
  const mine = entries.find((entry) => entry.nickname === nickname);
  if (!mine || mine.score <= 0) return false;

  const local = getLocalBestStats(difficulty);
  if (mine.score > local.score) {
    applyServerBest(difficulty, mine.score, mine.wpm, mine.best_word);
    return true;
  }

  if (mine.score === local.score) {
    const alreadyMatched =
      local.wpm === mine.wpm
      && local.bestWord === mine.best_word
      && isLocalBestSynced(difficulty);
    if (alreadyMatched) return false;
    applyServerBest(
      difficulty,
      mine.score,
      mine.wpm || local.wpm,
      mine.best_word || local.bestWord,
    );
    return true;
  }

  // local > server: keep the personal best; leave unsynced so uploads can catch up
  return false;
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
    const stats = getLocalBestStats(difficulty);
    if (stats.score <= 0 || isLocalBestSynced(difficulty)) {
      return [];
    }
    return [{ difficulty, ...stats }];
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
