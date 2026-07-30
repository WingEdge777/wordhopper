import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyServerBest,
  getLocalBestScore,
  getLocalBestStats,
  getUnsyncedLocalBests,
  isLocalBestSynced,
  markLocalBestSynced,
  reconcileLocalBestFromEntries,
  setLocalBestScore,
} from '../src/config/localScores';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => { storage.delete(key); },
    clear: () => { storage.clear(); },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('localScores', () => {
  it('tracks best scores and sync flags per difficulty', () => {
    setLocalBestScore('easy', 916, 42, 'planet');
    expect(getLocalBestScore('easy')).toBe(916);
    expect(getLocalBestStats('easy')).toEqual({ score: 916, wpm: 42, bestWord: 'planet' });
    expect(isLocalBestSynced('easy')).toBe(false);
    expect(getUnsyncedLocalBests()).toEqual([
      { difficulty: 'easy', score: 916, wpm: 42, bestWord: 'planet' },
    ]);

    markLocalBestSynced('easy');
    expect(isLocalBestSynced('easy')).toBe(true);
    expect(getUnsyncedLocalBests()).toEqual([]);
  });

  it('reads legacy score-only local bests', () => {
    storage.set('word-hopper-best-easy', '916');
    expect(getLocalBestStats('easy')).toEqual({ score: 916, wpm: 0, bestWord: '' });
  });

  it('raises local best when server score is higher', () => {
    setLocalBestScore('hard', 100, 20, 'cat');
    expect(isLocalBestSynced('hard')).toBe(false);

    const changed = reconcileLocalBestFromEntries('hard', 'SwiftPlayer71', [
      {
        nickname: 'SwiftPlayer71',
        score: 300,
        wpm: 32,
        best_word: 'enterprise',
      },
    ]);

    expect(changed).toBe(true);
    expect(getLocalBestStats('hard')).toEqual({
      score: 300,
      wpm: 32,
      bestWord: 'enterprise',
    });
    expect(isLocalBestSynced('hard')).toBe(true);
  });

  it('keeps a higher local best when server is behind', () => {
    setLocalBestScore('hard', 584, 40, 'enterprise');
    const changed = reconcileLocalBestFromEntries('hard', 'SwiftPlayer71', [
      {
        nickname: 'SwiftPlayer71',
        score: 186,
        wpm: 32,
        best_word: 'enterprise',
      },
    ]);

    expect(changed).toBe(false);
    expect(getLocalBestScore('hard')).toBe(584);
    expect(isLocalBestSynced('hard')).toBe(false);
  });

  it('marks equal scores as synced without lowering local', () => {
    setLocalBestScore('easy', 200, 25, 'cat');
    const changed = reconcileLocalBestFromEntries('easy', 'Alice', [
      { nickname: 'Alice', score: 200, wpm: 25, best_word: 'cat' },
    ]);
    expect(changed).toBe(true);
    expect(getLocalBestScore('easy')).toBe(200);
    expect(isLocalBestSynced('easy')).toBe(true);
  });

  it('does nothing when nickname is missing from leaderboard', () => {
    setLocalBestScore('hard', 584, 40, 'enterprise');
    const changed = reconcileLocalBestFromEntries('hard', 'SwiftPlayer71', [
      { nickname: 'Other', score: 900, wpm: 50, best_word: 'alpha' },
    ]);
    expect(changed).toBe(false);
    expect(getLocalBestScore('hard')).toBe(584);
    expect(isLocalBestSynced('hard')).toBe(false);
  });

  it('applyServerBest marks the difficulty synced', () => {
    applyServerBest('easy', 200, 25, 'cat');
    expect(getLocalBestStats('easy')).toEqual({ score: 200, wpm: 25, bestWord: 'cat' });
    expect(isLocalBestSynced('easy')).toBe(true);
  });
});
