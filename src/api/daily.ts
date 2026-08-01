import { apiUrl } from '../config/api';
import { getUtcChallengeDate } from '../config/daily';
import type { LeaderboardEntry } from './leaderboard';

export interface DailyLeaderboardResponse {
  challenge_date: string;
  entries: LeaderboardEntry[];
}

const CACHE_TTL_MS = 30_000;
let cache: { date: string; fetchedAt: number; data: DailyLeaderboardResponse } | null = null;

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

export function invalidateDailyLeaderboardCache(): void {
  cache = null;
}

export async function fetchDailyLeaderboard(
  challengeDate = getUtcChallengeDate(),
  limit = 10,
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

  const params = new URLSearchParams({
    date: challengeDate,
    limit: limit.toString(),
  });
  const data = await parseJson<DailyLeaderboardResponse>(
    await fetch(apiUrl(`/daily/leaderboard?${params.toString()}`)),
  );
  cache = { date: challengeDate, fetchedAt: Date.now(), data };
  return data;
}
