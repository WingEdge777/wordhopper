import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bootstrapLocalScores,
  fetchLeaderboard,
  submitScore,
  syncAndFetchLeaderboard,
} from '../src/api/leaderboard';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
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
});

describe('leaderboard api', () => {
  it('submits a score payload', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ accepted: true }), { status: 200 }),
    );

    const accepted = await submitScore({
      nickname: 'Alice',
      difficulty: 'easy',
      score: 916,
      wpm: 17,
      best_word: 'canon',
    });

    expect(accepted).toBe(true);
    expect(fetch).toHaveBeenCalledWith('/api/scores', expect.objectContaining({ method: 'POST' }));
  });

  it('bootstraps unsynced local bests', async () => {
    storage.set('word-hopper-best-easy', '916');
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ accepted: 1 }), { status: 200 }),
    );

    const accepted = await bootstrapLocalScores('Alice');
    expect(accepted).toBe(1);
    expect(storage.get('word-hopper-leaderboard-synced-easy')).toBe('1');
  });

  it('fetches leaderboard entries', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({
        difficulty: 'easy',
        entries: [{ rank: 1, nickname: 'Alice', score: 916, wpm: 17, best_word: 'canon', updated_at: 't' }],
      }), { status: 200 }),
    );

    const data = await fetchLeaderboard('easy');
    expect(data.entries).toHaveLength(1);
    expect(data.entries[0].nickname).toBe('Alice');
  });

  it('bootstraps before fetching leaderboard', async () => {
    storage.set('word-hopper-best-medium', '500');
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ accepted: 1 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ difficulty: 'medium', entries: [] }), { status: 200 }));

    await syncAndFetchLeaderboard('Bob', 'medium');

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(1, '/api/scores/bootstrap', expect.any(Object));
    expect(fetch).toHaveBeenNthCalledWith(2, '/api/leaderboard?difficulty=medium&limit=50');
  });
});
