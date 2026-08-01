import type { Difficulty } from '../config/constants';
import type { GameMode } from '../config/daily';
import { apiUrl } from '../config/api';

export interface RunSession {
  run_id: string;
  expires_at: string;
  mode?: GameMode;
  challenge_date?: string;
}

export interface StartRunOptions {
  difficulty: Difficulty;
  mode?: GameMode;
  challengeDate?: string;
}

export interface FinishRunPayload {
  run_id: string;
  nickname: string;
  difficulty: Difficulty;
  score: number;
  wpm: number;
  words_typed: number;
  total_chars: number;
  max_combo: number;
  duration_sec: number;
  best_word: string;
  mode?: GameMode;
  challenge_date?: string;
}

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

export async function startRun(options: StartRunOptions | Difficulty): Promise<RunSession> {
  const payload = typeof options === 'string'
    ? { difficulty: options, mode: 'classic' as const, challenge_date: '' }
    : {
        difficulty: options.difficulty,
        mode: options.mode ?? 'classic',
        challenge_date: options.challengeDate ?? '',
      };

  return parseJson<RunSession>(
    await fetch(apiUrl('/runs/start'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  );
}

export async function finishRun(payload: FinishRunPayload): Promise<boolean> {
  const response = await fetch(apiUrl('/runs/finish'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      mode: payload.mode ?? 'classic',
      challenge_date: payload.challenge_date ?? '',
    }),
  });
  if (!response.ok) {
    return false;
  }
  const data = await parseJson<{ accepted?: boolean }>(response);
  return Boolean(data.accepted);
}
