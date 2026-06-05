import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  default: {
    Scene: class {},
  },
}));

const originalWindow = globalThis.window;
const originalNavigator = globalThis.navigator;

function setWindowLocation(search: string): void {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      location: {
        search,
        origin: 'https://example.com',
        pathname: '/game',
        href: `https://example.com/game${search}`,
      },
      history: {
        replaceState: vi.fn(),
      },
    },
  });
}

function setNavigator(value: Navigator): void {
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value,
  });
}

afterEach(() => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: originalWindow,
  });
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: originalNavigator,
  });
  vi.restoreAllMocks();
});

describe('parseShareParams', () => {
  it('accepts score=0 share links', async () => {
    setWindowLocation('?s=0&w=0&bw=&d=easy');

    const { parseShareParams } = await import('../src/scenes/ShareCardScene');

    expect(parseShareParams()).toEqual({
      score: 0,
      wpm: 0,
      bestWord: '',
      difficulty: 'easy',
    });
  });
});

describe('shareResult', () => {
  it('returns true when clipboard copy succeeds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator({
      clipboard: { writeText },
      share,
    } as unknown as Navigator);

    const deathModule = await import('../src/scenes/DeathScene');
    const copied = await (deathModule as { shareResult: (data: { title: string; url: string }) => Promise<boolean> }).shareResult({
      title: 'Word Hopper',
      url: 'https://example.com/game?s=12',
    });

    expect(copied).toBe(true);
    expect(writeText).toHaveBeenCalledWith('https://example.com/game?s=12');
    expect(share).not.toHaveBeenCalled();
  });

  it('falls back to navigator.share when clipboard API is unavailable', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator({
      share,
    } as unknown as Navigator);

    const deathModule = await import('../src/scenes/DeathScene');
    const copied = await (deathModule as { shareResult: (data: { title: string; url: string }) => Promise<boolean> }).shareResult({
      title: 'Word Hopper',
      url: 'https://example.com/game?s=0',
    });

    expect(copied).toBe(false);
    expect(share).toHaveBeenCalledWith({
      title: 'Word Hopper',
      url: 'https://example.com/game?s=0',
    });
  });

  it('falls back to navigator.share when clipboard copy fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator({
      clipboard: { writeText },
      share,
    } as unknown as Navigator);

    const deathModule = await import('../src/scenes/DeathScene');
    const copied = await (deathModule as { shareResult: (data: { title: string; url: string }) => Promise<boolean> }).shareResult({
      title: 'Word Hopper',
      url: 'https://example.com/game?s=5',
    });

    expect(copied).toBe(false);
    expect(writeText).toHaveBeenCalledWith('https://example.com/game?s=5');
    expect(share).toHaveBeenCalledWith({
      title: 'Word Hopper',
      url: 'https://example.com/game?s=5',
    });
  });
});
