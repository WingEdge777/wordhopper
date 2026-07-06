import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getLocalBestScore,
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
    setLocalBestScore('easy', 916);
    expect(getLocalBestScore('easy')).toBe(916);
    expect(isLocalBestSynced('easy')).toBe(false);
    expect(getUnsyncedLocalBests()).toEqual([{ difficulty: 'easy', score: 916 }]);

    markLocalBestSynced('easy');
    expect(isLocalBestSynced('easy')).toBe(true);
    expect(getUnsyncedLocalBests()).toEqual([]);
  });
});
