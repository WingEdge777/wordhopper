import { describe, it, expect } from 'vitest';
import { ScoreSystem } from '../src/systems/ScoreSystem';

describe('ScoreSystem', () => {
  it('should accumulate base score per tick', () => {
    const score = new ScoreSystem();
    score.addTick();
    score.addTick();
    score.addTick();
    expect(score.getScore()).toBe(3);
  });

  it('should add word bonus scaled by speed and word length', () => {
    const score = new ScoreSystem();
    score.addWordBonus('leaf', 1.0);
    expect(score.getScore()).toBe(40);
  });

  it('should scale word bonus by current speed', () => {
    const score = new ScoreSystem();
    score.addWordBonus('adventure', 2.0);
    expect(score.getScore()).toBe(10 * 9 * 2.0);
  });

  it('should track words typed count', () => {
    const score = new ScoreSystem();
    score.addWordBonus('cat', 1.0);
    score.addWordBonus('dog', 1.0);
    expect(score.getWordsTyped()).toBe(2);
  });

  it('should track total chars typed for WPM', () => {
    const score = new ScoreSystem();
    score.addWordBonus('leaf', 1.0);
    score.addWordBonus('spring', 1.0);
    expect(score.getTotalChars()).toBe(4 + 6);
  });

  it('should track best word', () => {
    const score = new ScoreSystem();
    score.addWordBonus('cat', 1.0);
    score.addWordBonus('adventure', 1.0);
    expect(score.getBestWord()).toBe('adventure');
  });

  it('should reset all state', () => {
    const score = new ScoreSystem();
    score.addTick();
    score.addWordBonus('cat', 1.0);
    score.reset();
    expect(score.getScore()).toBe(0);
    expect(score.getWordsTyped()).toBe(0);
    expect(score.getTotalChars()).toBe(0);
  });
});
