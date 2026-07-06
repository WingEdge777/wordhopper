import type { Difficulty } from '../config/constants';
import { apiUrl } from '../config/api';

export interface RunSession {
  run_id: string;
  expires_at: string;
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

export async function startRun(difficulty: Difficulty): Promise<RunSession> {
  return parseJson<RunSession>(
    await fetch(apiUrl('/runs/start'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty }),
    }),
  );
}

export async function finishRun(payload: FinishRunPayload): Promise<boolean> {
  const response = await fetch(apiUrl('/runs/finish'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    return false;
  }
  const data = await parseJson<{ accepted?: boolean }>(response);
  return Boolean(data.accepted);
}
