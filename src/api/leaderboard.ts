import type { Difficulty } from '../config/constants';
import { apiUrl } from '../config/api';
import { finishRun } from './runs';
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

const CACHE_TTL_MS = 60_000;
const cache = new Map<Difficulty, { fetchedAt: number; data: LeaderboardResponse }>();
let bootstrapPromise: Promise<number> | null = null;

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

export function getCachedLeaderboard(difficulty: Difficulty): LeaderboardResponse | null {
  return cache.get(difficulty)?.data ?? null;
}

export function isLeaderboardCacheFresh(difficulty: Difficulty): boolean {
  const entry = cache.get(difficulty);
  if (!entry) return false;
  return Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}

export function invalidateLeaderboardCache(difficulty?: Difficulty): void {
  if (difficulty) {
    cache.delete(difficulty);
    return;
  }
  cache.clear();
}

export function resetLeaderboardSession(): void {
  cache.clear();
  bootstrapPromise = null;
}

export function ensureBootstrapLocalScores(nickname: string): Promise<number> {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapLocalScores(nickname).catch(() => 0);
  }
  return bootstrapPromise;
}

export async function fetchLeaderboard(
  difficulty: Difficulty,
  limit = 50,
  options?: { refresh?: boolean },
): Promise<LeaderboardResponse> {
  if (!options?.refresh && isLeaderboardCacheFresh(difficulty)) {
    return cache.get(difficulty)!.data;
  }

  const params = new URLSearchParams({
    difficulty,
    limit: limit.toString(),
  });
  const data = await parseJson<LeaderboardResponse>(
    await fetch(apiUrl(`/leaderboard?${params.toString()}`)),
  );
  cache.set(difficulty, { fetchedAt: Date.now(), data });
  return data;
}

export async function prefetchLeaderboards(
  nickname: string,
  difficulties: Difficulty[],
): Promise<void> {
  await ensureBootstrapLocalScores(nickname);
  await Promise.allSettled(
    difficulties.map((difficulty) => fetchLeaderboard(difficulty, 50, { refresh: true })),
  );
}

export async function submitScore(payload: SubmitScorePayload): Promise<boolean> {
  const accepted = await finishRun({
    run_id: payload.run_id,
    nickname: payload.nickname,
    difficulty: payload.difficulty,
    score: payload.score,
    wpm: payload.wpm,
    words_typed: payload.words_typed,
    total_chars: payload.total_chars,
    max_combo: payload.max_combo,
    duration_sec: payload.duration_sec,
    best_word: payload.best_word,
  });
  if (accepted) {
    invalidateLeaderboardCache(payload.difficulty);
  }
  return accepted;
}

function isCompleteBootstrapRecord(record: { score: number; wpm: number }): boolean {
  return record.score > 0 && record.wpm > 0;
}

/** Must stay in sync with server score_validation.BOOTSTRAP_MAX_SCORE */
const BOOTSTRAP_MAX_SCORE = 500;

export async function bootstrapLocalScores(nickname: string): Promise<number> {
  const records = getUnsyncedLocalBests();
  if (records.length === 0) {
    return 0;
  }

  // Incomplete local history (e.g. legacy score-only / wpm=0) is never uploaded.
  const complete = records.filter(isCompleteBootstrapRecord);
  const incomplete = records.filter((record) => !isCompleteBootstrapRecord(record));
  for (const record of incomplete) {
    markLocalBestSynced(record.difficulty);
  }

  // Over-max scores can only sync via authenticated finish_run, not bootstrap.
  const bootstrappable = complete.filter((record) => record.score <= BOOTSTRAP_MAX_SCORE);
  if (bootstrappable.length === 0) {
    return 0;
  }

  const response = await fetch(apiUrl('/scores/bootstrap'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname,
      records: bootstrappable.map((record) => ({
        difficulty: record.difficulty,
        score: record.score,
        wpm: record.wpm,
        best_word: record.bestWord,
      })),
    }),
  });
  if (!response.ok) {
    return 0;
  }

  const data = await response.json() as {
    accepted?: number;
    difficulties?: string[];
  };
  const acceptedDifficulties = new Set(data.difficulties ?? []);
  // Only mark difficulties the server actually accepted (rejected scores stay unsynced).
  for (const record of bootstrappable) {
    if (acceptedDifficulties.has(record.difficulty)) {
      markLocalBestSynced(record.difficulty);
      invalidateLeaderboardCache(record.difficulty);
    }
  }
  return data.accepted ?? acceptedDifficulties.size;
}

export async function loadLeaderboardForDifficulty(
  nickname: string,
  difficulty: Difficulty,
  options?: { refresh?: boolean },
): Promise<LeaderboardResponse> {
  if (!options?.refresh && isLeaderboardCacheFresh(difficulty)) {
    return cache.get(difficulty)!.data;
  }
  await ensureBootstrapLocalScores(nickname);
  return fetchLeaderboard(difficulty, 50, options);
}

/** @deprecated use loadLeaderboardForDifficulty */
export async function syncAndFetchLeaderboard(
  nickname: string,
  difficulty: Difficulty,
): Promise<LeaderboardResponse> {
  return loadLeaderboardForDifficulty(nickname, difficulty, { refresh: true });
}
