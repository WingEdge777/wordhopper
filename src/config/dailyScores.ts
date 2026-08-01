const DAILY_BEST_PREFIX = 'word-hopper-daily-best-';

export function getDailyLocalBest(challengeDate: string): number {
  try {
    const raw = localStorage.getItem(`${DAILY_BEST_PREFIX}${challengeDate}`);
    const score = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(score) && score > 0 ? score : 0;
  } catch {
    return 0;
  }
}

export function setDailyLocalBest(challengeDate: string, score: number): void {
  if (score <= 0) return;
  try {
    const prev = getDailyLocalBest(challengeDate);
    if (score > prev) {
      localStorage.setItem(`${DAILY_BEST_PREFIX}${challengeDate}`, String(score));
    }
  } catch {
    // noop
  }
}
