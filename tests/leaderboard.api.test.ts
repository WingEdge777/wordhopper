import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bootstrapLocalScores,
  fetchLeaderboard,
  loadLeaderboardForDifficulty,
  resetLeaderboardSession,
  submitScore,
  syncAndFetchLeaderboard,
} from '../src/api/leaderboard';

const storage = new Map<string, string>();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  storage.clear();
  resetLeaderboardSession();
  vi.stubEnv('VITE_API_BASE', '/api');
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => { storage.delete(key); },
    clear: () => { storage.clear(); },
  });
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('leaderboard api', () => {
  it('submits a score payload via run finish', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ accepted: true }));

    const accepted = await submitScore({
      run_id: 'abc123',
      nickname: 'Alice',
      difficulty: 'easy',
      score: 916,
      wpm: 17,
      words_typed: 20,
      total_chars: 85,
      max_combo: 8,
      duration_sec: 120,
      best_word: 'canon',
    });

    expect(accepted).toBe(true);
    expect(fetch).toHaveBeenCalledWith('/api/runs/finish', expect.objectContaining({ method: 'POST' }));
  });

  it('bootstraps unsynced local bests', async () => {
    storage.set('word-hopper-best-easy', JSON.stringify({ score: 400, wpm: 42, bestWord: 'planet' }));
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      accepted: 1,
      difficulties: ['easy'],
    }));

    const accepted = await bootstrapLocalScores('Alice');
    expect(accepted).toBe(1);
    expect(storage.get('word-hopper-leaderboard-synced-easy')).toBe('1');
    expect(fetch).toHaveBeenCalledWith('/api/scores/bootstrap', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        nickname: 'Alice',
        records: [{ difficulty: 'easy', score: 400, wpm: 42, best_word: 'planet' }],
      }),
    }));
  });

  it('does not mark rejected bootstrap scores as synced', async () => {
    storage.set('word-hopper-best-hard', JSON.stringify({ score: 400, wpm: 40, bestWord: 'enterprise' }));
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      accepted: 0,
      difficulties: [],
    }));

    const accepted = await bootstrapLocalScores('Swift');
    expect(accepted).toBe(0);
    expect(storage.get('word-hopper-leaderboard-synced-hard')).toBeUndefined();
  });

  it('skips bootstrap for scores above the bootstrap cap', async () => {
    storage.set('word-hopper-best-hard', JSON.stringify({ score: 584, wpm: 40, bestWord: 'enterprise' }));

    const accepted = await bootstrapLocalScores('Swift');
    expect(accepted).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
    expect(storage.get('word-hopper-leaderboard-synced-hard')).toBeUndefined();
  });

  it('fetches leaderboard entries', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      difficulty: 'easy',
      entries: [{ rank: 1, nickname: 'Alice', score: 916, wpm: 17, best_word: 'canon', updated_at: 't' }],
    }));

    const data = await fetchLeaderboard('easy', 50, { refresh: true });
    expect(data.entries).toHaveLength(1);
    expect(data.entries[0].nickname).toBe('Alice');
  });

  it('uses cache on repeated fetches', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      difficulty: 'easy',
      entries: [],
    }));

    await fetchLeaderboard('easy', 50, { refresh: true });
    await fetchLeaderboard('easy');

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('skips incomplete local bests during bootstrap', async () => {
    storage.set('word-hopper-best-medium', '500');

    const accepted = await bootstrapLocalScores('Bob');
    expect(accepted).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
    expect(storage.get('word-hopper-leaderboard-synced-medium')).toBe('1');
  });

  it('bootstraps before fetching leaderboard', async () => {
    storage.set(
      'word-hopper-best-medium',
      JSON.stringify({ score: 400, wpm: 30, bestWord: 'mountain' }),
    );
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ accepted: 1, difficulties: ['medium'] }))
      .mockResolvedValueOnce(jsonResponse({ difficulty: 'medium', entries: [] }));

    await syncAndFetchLeaderboard('Bob', 'medium');

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(1, '/api/scores/bootstrap', expect.any(Object));
    expect(fetch).toHaveBeenNthCalledWith(2, '/api/leaderboard?difficulty=medium&limit=50');
  });

  it('bootstrap runs once per session', async () => {
    storage.set(
      'word-hopper-best-medium',
      JSON.stringify({ score: 400, wpm: 30, bestWord: 'mountain' }),
    );
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ accepted: 1, difficulties: ['medium'] }))
      .mockResolvedValueOnce(jsonResponse({ difficulty: 'medium', entries: [] }))
      .mockResolvedValueOnce(jsonResponse({ difficulty: 'easy', entries: [] }));

    await loadLeaderboardForDifficulty('Bob', 'medium', { refresh: true });
    await loadLeaderboardForDifficulty('Bob', 'easy', { refresh: true });

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch).toHaveBeenNthCalledWith(1, '/api/scores/bootstrap', expect.any(Object));
  });

  it('reconciles local best when loading a leaderboard', async () => {
    storage.set('word-hopper-best-hard', JSON.stringify({ score: 584, wpm: 40, bestWord: 'enterprise' }));
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      difficulty: 'hard',
      entries: [{
        rank: 14,
        nickname: 'Swift',
        score: 186,
        wpm: 32,
        best_word: 'enterprise',
        updated_at: 't',
      }],
    }));

    await loadLeaderboardForDifficulty('Swift', 'hard', { refresh: true });

    expect(JSON.parse(storage.get('word-hopper-best-hard')!)).toEqual({
      score: 186,
      wpm: 32,
      bestWord: 'enterprise',
    });
    expect(storage.get('word-hopper-leaderboard-synced-hard')).toBe('1');
  });
});
