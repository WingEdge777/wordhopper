import type { Difficulty } from '../config/constants';
import { getUnsyncedLocalBests, markLocalBestSynced } from '../config/localScores';

export interface LeaderboardEntry {
  rank: number;
  nickname: string;
  score: number;
  wpm: number;
  best_word: string;
  updated_at: string;
}

export interface LeaderboardResponse {
  difficulty: Difficulty;
  entries: LeaderboardEntry[];
}

export interface SubmitScorePayload {
  nickname: string;
  difficulty: Difficulty;
  score: number;
  wpm: number;
  best_word: string;
}

const API_BASE = '/api';

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchLeaderboard(
  difficulty: Difficulty,
  limit = 50,
): Promise<LeaderboardResponse> {
  const params = new URLSearchParams({
    difficulty,
    limit: limit.toString(),
  });
  return parseJson<LeaderboardResponse>(
    await fetch(`${API_BASE}/leaderboard?${params.toString()}`),
  );
}

export async function submitScore(payload: SubmitScorePayload): Promise<boolean> {
  const response = await fetch(`${API_BASE}/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname: payload.nickname,
      difficulty: payload.difficulty,
      score: payload.score,
      wpm: payload.wpm,
      best_word: payload.best_word,
    }),
  });
  if (!response.ok) {
    return false;
  }
  const data = await response.json() as { accepted?: boolean };
  return Boolean(data.accepted);
}

export async function bootstrapLocalScores(nickname: string): Promise<number> {
  const records = getUnsyncedLocalBests();
  if (records.length === 0) {
    return 0;
  }

  const response = await fetch(`${API_BASE}/scores/bootstrap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname,
      records: records.map((record) => ({
        difficulty: record.difficulty,
        score: record.score,
        wpm: 0,
        best_word: '',
      })),
    }),
  });
  if (!response.ok) {
    return 0;
  }

  const data = await response.json() as { accepted?: number };
  for (const record of records) {
    markLocalBestSynced(record.difficulty);
  }
  return data.accepted ?? 0;
}

export async function syncAndFetchLeaderboard(
  nickname: string,
  difficulty: Difficulty,
): Promise<LeaderboardResponse> {
  try {
    await bootstrapLocalScores(nickname);
  } catch {
    // Leaderboard can still render cached server data when bootstrap fails.
  }
  return fetchLeaderboard(difficulty);
}
