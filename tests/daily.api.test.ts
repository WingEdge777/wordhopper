import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchDailyLeaderboard,
  invalidateDailyLeaderboardCache,
  isDailyLeaderboardCacheFresh,
} from '../src/api/daily';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  invalidateDailyLeaderboardCache();
  vi.stubEnv('VITE_API_BASE', '/api');
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('daily leaderboard api', () => {
  it('caches responses so repeat opens skip the network', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({
      challenge_date: '2026-08-07',
      entries: [{ rank: 1, nickname: 'Alice', score: 100, wpm: 20, best_word: 'cat', updated_at: 't' }],
    }));

    await fetchDailyLeaderboard('2026-08-07');
    await fetchDailyLeaderboard('2026-08-07');

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(isDailyLeaderboardCacheFresh('2026-08-07')).toBe(true);
  });

  it('deduplicates concurrent fetches', async () => {
    let resolveFetch: ((value: Response) => void) | null = null;
    vi.mocked(fetch).mockImplementation(() => new Promise((resolve) => {
      resolveFetch = resolve;
    }));

    const a = fetchDailyLeaderboard('2026-08-07');
    const b = fetchDailyLeaderboard('2026-08-07');
    resolveFetch?.(jsonResponse({
      challenge_date: '2026-08-07',
      entries: [],
    }));

    await Promise.all([a, b]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
