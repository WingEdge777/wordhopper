import { describe, it, expect, beforeEach } from 'vitest';
import { WordSpawner } from '../src/systems/WordSpawner';
import { Difficulty } from '../src/config/constants';

describe('WordSpawner', () => {
  let spawner: WordSpawner;

  beforeEach(() => {
    spawner = new WordSpawner();
  });

  it('should load easy word list', () => {
    spawner.loadWords('easy');
    const pair = spawner.generatePair();
    expect(pair).toBeDefined();
    expect(pair.word1.length).toBeGreaterThanOrEqual(3);
    expect(pair.word1.length).toBeLessThanOrEqual(5);
    expect(pair.word2.length).toBeGreaterThanOrEqual(3);
    expect(pair.word2.length).toBeLessThanOrEqual(5);
  });

  it('should guarantee different first letters', () => {
    spawner.loadWords('easy');
    for (let i = 0; i < 50; i++) {
      const pair = spawner.generatePair();
      expect(pair.word1[0]).not.toBe(pair.word2[0]);
    }
  });

  it('should generate medium words for medium difficulty', () => {
    spawner.loadWords('medium');
    const pair = spawner.generatePair();
    expect(pair.word1.length).toBeGreaterThanOrEqual(6);
    expect(pair.word1.length).toBeLessThanOrEqual(10);
  });

  it('should generate hard words for hard difficulty', () => {
    spawner.loadWords('hard');
    const pair = spawner.generatePair();
    expect(pair.word1.length).toBeGreaterThanOrEqual(8);
  });

  it('should return a single word for single-obstacle layouts', () => {
    spawner.loadWords('easy');
    const word = spawner.generateSingle();
    expect(word).toBeDefined();
    expect(word.length).toBeGreaterThanOrEqual(3);
    expect(word.length).toBeLessThanOrEqual(5);
  });

  it('should not repeat words until the deck is exhausted', () => {
    spawner.loadWords('easy');
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const word = spawner.generateSingle();
      expect(seen.has(word)).toBe(false);
      seen.add(word);
    }
  });

  it('should not repeat words within a shuffled pair batch', () => {
    spawner.loadWords('easy');
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const pair = spawner.generatePair();
      expect(seen.has(pair.word1)).toBe(false);
      expect(seen.has(pair.word2)).toBe(false);
      seen.add(pair.word1);
      seen.add(pair.word2);
    }
  });
});
