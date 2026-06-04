import { describe, it, expect } from 'vitest';
import { TypingSystem } from '../src/systems/TypingSystem';

describe('TypingSystem', () => {
  it('should auto-select word by first letter', () => {
    const typing = new TypingSystem();
    typing.setWords('leaf', 'run');
    const result = typing.onKeyPress('l');
    expect(result.selectedWord).toBe('leaf');
    expect(result.charIndex).toBe(1);
    expect(result.completed).toBe(false);
  });

  it('should advance through word on correct letters', () => {
    const typing = new TypingSystem();
    typing.setWords('leaf', 'run');
    typing.onKeyPress('l');
    const result = typing.onKeyPress('e');
    expect(result.charIndex).toBe(2);
    expect(result.completed).toBe(false);
  });

  it('should complete word on last correct letter', () => {
    const typing = new TypingSystem();
    typing.setWords('cat', 'dog');
    typing.onKeyPress('c');
    typing.onKeyPress('a');
    const result = typing.onKeyPress('t');
    expect(result.completed).toBe(true);
    expect(result.selectedWord).toBe('cat');
  });

  it('should reset on wrong letter', () => {
    const typing = new TypingSystem();
    typing.setWords('leaf', 'run');
    typing.onKeyPress('l');
    const result = typing.onKeyPress('x');
    expect(result.wrong).toBe(true);
    expect(result.charIndex).toBe(0);
    expect(result.selectedWord).toBe('leaf');
  });

  it('should allow switching to other word after wrong letter', () => {
    const typing = new TypingSystem();
    typing.setWords('leaf', 'run');
    typing.onKeyPress('l');
    typing.onKeyPress('x');
    const result = typing.onKeyPress('r');
    expect(result.selectedWord).toBe('run');
    expect(result.charIndex).toBe(1);
  });

  it('should allow switching word before starting', () => {
    const typing = new TypingSystem();
    typing.setWords('leaf', 'run');
    typing.onKeyPress('r');
    expect(typing.getSelectedWord()).toBe('run');
    expect(typing.getCharIndex()).toBe(1);
  });

  it('should return progress for rendering', () => {
    const typing = new TypingSystem();
    typing.setWords('leaf', 'run');
    typing.onKeyPress('l');
    typing.onKeyPress('e');
    const progress = typing.getProgress();
    expect(progress).toEqual({
      word1: 'leaf',
      word2: 'run',
      selectedWord: 'leaf',
      correctChars: 2,
      wrong: false,
    });
  });

  it('should reset state for new word pair', () => {
    const typing = new TypingSystem();
    typing.setWords('leaf', 'run');
    typing.onKeyPress('l');
    typing.setWords('cat', 'dog');
    expect(typing.getSelectedWord()).toBe('');
    expect(typing.getCharIndex()).toBe(0);
  });
});
