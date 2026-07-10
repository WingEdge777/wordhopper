import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isMuted, setMuted, toggleMuted } from '../src/audio/SoundManager';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => { storage.delete(key); },
    clear: () => { storage.clear(); },
  });
  setMuted(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SoundManager mute', () => {
  it('persists mute state', () => {
    expect(isMuted()).toBe(false);
    setMuted(true);
    expect(isMuted()).toBe(true);
    expect(storage.get('word-hopper-muted')).toBe('1');
    expect(toggleMuted()).toBe(false);
    expect(storage.get('word-hopper-muted')).toBe('0');
  });
});
