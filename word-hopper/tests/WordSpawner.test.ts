import { describe, it, expect, beforeEach } from 'vitest';
import { WordSpawner } from '../src/systems/WordSpawner';
import { Difficulty } from '../src/config/constants';

describe('WordSpawner', () => {
  let spawner: WordSpawner;

  beforeEach(() => {
    spawner = new WordSpawner();
  });

  it('should load easy word list', async () => {
    await spawner.loadWords('easy');
    const pair = spawner.generatePair();
    expect(pair).toBeDefined();
    expect(pair.word1.length).toBeGreaterThanOrEqual(3);
    expect(pair.word1.length).toBeLessThanOrEqual(5);
    expect(pair.word2.length).toBeGreaterThanOrEqual(3);
    expect(pair.word2.length).toBeLessThanOrEqual(5);
  });

  it('should guarantee different first letters', async () => {
    await spawner.loadWords('easy');
    for (let i = 0; i < 50; i++) {
      const pair = spawner.generatePair();
      expect(pair.word1[0]).not.toBe(pair.word2[0]);
    }
  });

  it('should generate medium words for medium difficulty', async () => {
    await spawner.loadWords('medium');
    const pair = spawner.generatePair();
    expect(pair.word1.length).toBeGreaterThanOrEqual(6);
    expect(pair.word1.length).toBeLessThanOrEqual(10);
  });

  it('should generate hard words for hard difficulty', async () => {
    await spawner.loadWords('hard');
    const pair = spawner.generatePair();
    expect(pair.word1.length).toBeGreaterThanOrEqual(11);
  });

  it('should return a single word for single-obstacle layouts', async () => {
    await spawner.loadWords('easy');
    const word = spawner.generateSingle();
    expect(word).toBeDefined();
    expect(word.length).toBeGreaterThanOrEqual(3);
    expect(word.length).toBeLessThanOrEqual(5);
  });

  it('should not repeat the same word consecutively', async () => {
    await spawner.loadWords('easy');
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const pair = spawner.generatePair();
      results.add(pair.word1);
      results.add(pair.word2);
    }
    expect(results.size).toBeGreaterThan(5);
  });
});
