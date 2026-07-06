import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getLocalBestScore,
  getLocalBestStats,
  getUnsyncedLocalBests,
  isLocalBestSynced,
  markLocalBestSynced,
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
});
