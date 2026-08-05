import { apiUrl } from '../config/api';
import { getUtcChallengeDate } from '../config/daily';
import type { LeaderboardEntry } from './leaderboard';

export interface DailyLeaderboardResponse {
  challenge_date: string;
  entries: LeaderboardEntry[];
}

/** Match classic leaderboard cache window. */
const CACHE_TTL_MS = 60_000;
const DEFAULT_LIMIT = 50;

let cache: { date: string; fetchedAt: number; data: DailyLeaderboardResponse } | null = null;
let inflight: Promise<DailyLeaderboardResponse> | null = null;

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error('Invalid API response');
  }
  return response.json() as Promise<T>;
}

export function getCachedDailyLeaderboard(
  challengeDate = getUtcChallengeDate(),
): DailyLeaderboardResponse | null {
  if (!cache || cache.date !== challengeDate) return null;
  return cache.data;
}

export function isDailyLeaderboardCacheFresh(
  challengeDate = getUtcChallengeDate(),
): boolean {
  if (!cache || cache.date !== challengeDate) return false;
  return Date.now() - cache.fetchedAt < CACHE_TTL_MS;
}

export function invalidateDailyLeaderboardCache(): void {
  cache = null;
  inflight = null;
}

export async function fetchDailyLeaderboard(
  challengeDate = getUtcChallengeDate(),
  limit = DEFAULT_LIMIT,
  options?: { refresh?: boolean },
): Promise<DailyLeaderboardResponse> {
  if (
    !options?.refresh
    && cache
    && cache.date === challengeDate
    && Date.now() - cache.fetchedAt < CACHE_TTL_MS
  ) {
    return cache.data;
  }

  // Deduplicate concurrent fetches (menu strip + board open).
  if (!options?.refresh && inflight) {
    return inflight;
  }

  const request = (async () => {
    const params = new URLSearchParams({
      date: challengeDate,
      // Always fetch a full page so menu strip and board share one cache.
      limit: Math.max(limit, DEFAULT_LIMIT).toString(),
    });
    const data = await parseJson<DailyLeaderboardResponse>(
      await fetch(apiUrl(`/daily/leaderboard?${params.toString()}`)),
    );
    cache = { date: challengeDate, fetchedAt: Date.now(), data };
    return data;
  })();

  inflight = request;
  try {
    return await request;
  } finally {
    if (inflight === request) {
      inflight = null;
    }
  }
}

/** Warm cache on menu — safe to fire-and-forget. */
export function prefetchDailyLeaderboard(
  challengeDate = getUtcChallengeDate(),
): Promise<DailyLeaderboardResponse> {
  return fetchDailyLeaderboard(challengeDate, DEFAULT_LIMIT);
}
