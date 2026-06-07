import { describe, it, expect } from 'vitest';
import { getTranslation } from '../src/data/translations';

describe('getTranslation', () => {
  it('returns short Chinese gloss for common words', () => {
    expect(getTranslation('the')).toBe('那');
    expect(getTranslation('hello')).toBe('喂，嘿');
    expect(getTranslation('beautiful')).toBe('美丽');
  });

  it('is case-insensitive', () => {
    expect(getTranslation('Hello')).toBe(getTranslation('hello'));
  });

  it('returns undefined for unknown words', () => {
    expect(getTranslation('notarealwordxyz')).toBeUndefined();
  });
});
