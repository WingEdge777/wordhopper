import { describe, expect, it } from 'vitest';
import { DAILY_DIFFICULTY, createDailyRng, getDailySeed, getUtcChallengeDate } from '../src/config/daily';
import { WordSpawner } from '../src/systems/WordSpawner';
import { ObstacleSpawner } from '../src/systems/ObstacleSpawner';
import { SpeedManager } from '../src/systems/SpeedManager';

describe('daily challenge seed', () => {
  it('uses easy difficulty', () => {
    expect(DAILY_DIFFICULTY).toBe('easy');
  });

  it('produces a stable seed for a date', () => {
    expect(getDailySeed('2026-08-07')).toBe(getDailySeed('2026-08-07'));
    expect(getDailySeed('2026-08-07')).not.toBe(getDailySeed('2026-08-08'));
  });

  it('yields the same first words for the same date', () => {
    const a = new WordSpawner();
    const b = new WordSpawner();
    a.setRng(createDailyRng('2026-08-07'));
    b.setRng(createDailyRng('2026-08-07'));
    a.loadWords('easy');
    b.loadWords('easy');

    const wordsA = [a.generateSingle(), a.generateSingle(), a.generateSingle()];
    const wordsB = [b.generateSingle(), b.generateSingle(), b.generateSingle()];
    expect(wordsA).toEqual(wordsB);
    expect(wordsA.every((w) => w.length >= 3 && w.length <= 5)).toBe(true);
  });

  it('keeps shared rng sequences aligned across spawners', () => {
    const date = getUtcChallengeDate(new Date('2026-08-07T12:00:00Z'));
    const run = () => {
      const rng = createDailyRng(date);
      const words = new WordSpawner();
      words.setRng(rng);
      words.loadWords('easy');
      const obstacles = new ObstacleSpawner(words, new SpeedManager());
      obstacles.setDifficulty('easy');
      obstacles.setRng(rng);
      return [obstacles.generate(200).word1, obstacles.generate(200).word1];
    };

    expect(run()).toEqual(run());
  });
});
