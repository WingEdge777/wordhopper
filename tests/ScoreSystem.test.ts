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

  it('should add word bonus scaled by speed, word length and combo', () => {
    const score = new ScoreSystem();
    score.addWordBonus('leaf', 1.0, false);
    expect(score.getScore()).toBe(40);
  });

  it('should scale word bonus by current speed', () => {
    const score = new ScoreSystem();
    score.addWordBonus('adventure', 2.0, false);
    expect(score.getScore()).toBe(10 * 9 * 2.0);
  });

  it('should apply combo multiplier', () => {
    const score = new ScoreSystem();
    score.addWordBonus('cat', 1.0, false);
    score.addWordBonus('cat', 1.0, false);
    expect(score.getScore()).toBe(10 * 3 * 1 + 10 * 3 * 2);
  });

  it('should apply perfect 1.5x multiplier', () => {
    const score = new ScoreSystem();
    score.addWordBonus('cat', 1.0, true);
    expect(score.getScore()).toBe(Math.round(10 * 3 * 1 * 1.5));
  });

  it('should track words typed count', () => {
    const score = new ScoreSystem();
    score.addWordBonus('cat', 1.0, false);
    score.addWordBonus('dog', 1.0, false);
    expect(score.getWordsTyped()).toBe(2);
  });

  it('should track total chars typed for WPM', () => {
    const score = new ScoreSystem();
    score.addWordBonus('leaf', 1.0, false);
    score.addWordBonus('spring', 1.0, false);
    expect(score.getTotalChars()).toBe(4 + 6);
  });

  it('should track best word', () => {
    const score = new ScoreSystem();
    score.addWordBonus('cat', 1.0, false);
    score.addWordBonus('adventure', 1.0, false);
    expect(score.getBestWord()).toBe('adventure');
  });

  it('should break combo', () => {
    const score = new ScoreSystem();
    score.addWordBonus('cat', 1.0, false);
    score.addWordBonus('cat', 1.0, false);
    expect(score.getCombo()).toBe(2);
    score.breakCombo();
    expect(score.getCombo()).toBe(0);
  });

  it('should reset all state including combo', () => {
    const score = new ScoreSystem();
    score.addTick();
    score.addWordBonus('cat', 1.0, false);
    score.reset();
    expect(score.getScore()).toBe(0);
    expect(score.getWordsTyped()).toBe(0);
    expect(score.getTotalChars()).toBe(0);
    expect(score.getCombo()).toBe(0);
  });
});
