import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  dismissNicknameHint,
  ensureNickname,
  generateNickname,
  getNickname,
  NICKNAME_MAX_LEN,
  normalizeNickname,
  setNickname,
  shouldShowNicknameHint,
} from '../src/config/nickname';

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

describe('generateNickname', () => {
  it('should produce a non-empty name within max length', () => {
    const nickname = generateNickname();
    expect(nickname.length).toBeGreaterThan(0);
    expect(nickname.length).toBeLessThanOrEqual(NICKNAME_MAX_LEN);
  });
});

describe('normalizeNickname', () => {
  it('should trim and cap length', () => {
    expect(normalizeNickname('  Alice  ')).toBe('Alice');
    expect(normalizeNickname('a'.repeat(20)).length).toBe(NICKNAME_MAX_LEN);
  });

  it('should generate a nickname when input is blank', () => {
    expect(normalizeNickname('')).toMatch(/^[A-Z]/);
    expect(normalizeNickname('   ')).toMatch(/^[A-Z]/);
  });
});

describe('ensureNickname', () => {
  it('should create and persist a nickname on first visit', () => {
    const first = ensureNickname();
    expect(first.isNew).toBe(true);
    expect(first.nickname.length).toBeGreaterThan(0);

    const second = ensureNickname();
    expect(second.isNew).toBe(false);
    expect(second.nickname).toBe(first.nickname);
  });
});

describe('setNickname', () => {
  it('should persist a custom nickname', () => {
    expect(setNickname('Typer')).toBe('Typer');
    expect(getNickname()).toBe('Typer');
  });

  it('should regenerate when cleared', () => {
    setNickname('Typer');
    const regenerated = setNickname('');
    expect(regenerated).not.toBe('Typer');
    expect(getNickname()).toBe(regenerated);
  });
});

describe('nickname hint', () => {
  it('should show hint only before dismissal', () => {
    expect(shouldShowNicknameHint()).toBe(true);
    dismissNicknameHint();
    expect(shouldShowNicknameHint()).toBe(false);
  });
});
