import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { finishRun, startRun } from '../src/api/runs';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE', '/api');
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('runs api', () => {
  it('starts a run session', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      run_id: 'run-1',
      expires_at: '2099-01-01T00:00:00+00:00',
    }));

    const session = await startRun('easy');
    expect(session.run_id).toBe('run-1');
    expect(fetch).toHaveBeenCalledWith('/api/runs/start', expect.objectContaining({ method: 'POST' }));
  });

  it('finishes a run session', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ accepted: true }));

    const accepted = await finishRun({
      run_id: 'run-1',
      nickname: 'Alice',
      difficulty: 'easy',
      score: 500,
      wpm: 40,
      words_typed: 10,
      total_chars: 50,
      max_combo: 5,
      duration_sec: 60,
      best_word: 'planet',
    });

    expect(accepted).toBe(true);
    expect(fetch).toHaveBeenCalledWith('/api/runs/finish', expect.objectContaining({ method: 'POST' }));
  });
});
