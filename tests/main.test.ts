import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  default: {
    AUTO: 'AUTO',
    Scale: {
      FIT: 'FIT',
      CENTER_BOTH: 'CENTER_BOTH',
    },
    Game: class {},
    Scene: class {},
  },
}));

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;
const originalNavigator = globalThis.navigator;

function mockBrowserEnvironment(devicePixelRatio: number): void {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      innerWidth: 1440,
      devicePixelRatio,
      addEventListener: vi.fn(),
      setTimeout: vi.fn(),
    },
  });

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      userAgent: 'Desktop Browser',
    },
  });

  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      body: { classList: { add: vi.fn(), remove: vi.fn() } },
      fonts: {
        ready: Promise.resolve(),
        load: vi.fn().mockResolvedValue([]),
      },
      querySelectorAll: vi.fn(() => []),
      getElementById: vi.fn((id: string) => {
        if (id === 'game-shell') return { id, style: {}, querySelector: vi.fn() };
        if (id === 'mobile-blocker') return { style: { display: 'none' } };
        if (id === 'nickname-input') return { value: '', addEventListener: vi.fn() };
        if (id === 'nickname-hint') return { hidden: true };
        if (id === 'leaderboard-panel') return { hidden: true, addEventListener: vi.fn() };
        if (id === 'lb-list') return { replaceChildren: vi.fn(), appendChild: vi.fn() };
        if (id === 'lb-status') return { textContent: '' };
        if (id === 'lb-close') return { addEventListener: vi.fn() };
        if (id === 'lb-backdrop') return { addEventListener: vi.fn() };
        return null;
      }),
    },
  });
}

afterEach(() => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: originalWindow,
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: originalDocument,
  });
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: originalNavigator,
  });
  vi.resetModules();
});

describe('main game config', () => {
  it('caps render resolution at 2x for high DPI displays', async () => {
    mockBrowserEnvironment(3);

    const mainModule = await import('../src/main') as Record<string, unknown>;
    const getDisplaySize = mainModule.getDisplaySize as ((viewportWidth?: number) => { width: number; height: number }) | undefined;
    const getRenderResolution = mainModule.getRenderResolution as ((dpr?: number) => number) | undefined;
    const getRenderSize = mainModule.getRenderSize as ((displayWidth?: number, displayHeight?: number, dpr?: number) => { width: number; height: number }) | undefined;

    expect(typeof getDisplaySize).toBe('function');
    expect(typeof getRenderResolution).toBe('function');
    expect(typeof getRenderSize).toBe('function');
    expect(getDisplaySize?.(1440)).toEqual({ width: 1008, height: 567 });
    expect(getRenderResolution?.(3)).toBe(2);
    expect(getRenderResolution?.(1.5)).toBe(1.5);
    expect(getRenderSize?.(1008, 567, 3)).toEqual({ width: 1600, height: 900 });
  });

  it('snaps fractional render scale to integer zoom for crisp rendering', async () => {
    mockBrowserEnvironment(1.75);

    const mainModule = await import('../src/main') as Record<string, unknown>;
    const getRenderScale = mainModule.getRenderScale as ((displayWidth?: number, displayHeight?: number, dpr?: number) => number) | undefined;
    const getRenderSize = mainModule.getRenderSize as ((displayWidth?: number, displayHeight?: number, dpr?: number) => { width: number; height: number }) | undefined;

    expect(getRenderScale?.(768, 432, 1.75)).toBe(2);
    expect(getRenderSize?.(768, 432, 1.75)).toEqual({ width: 1600, height: 900 });
  });

  it('builds a fixed-size game config mounted into the game shell', async () => {
    mockBrowserEnvironment(2);

    const mainModule = await import('../src/main') as Record<string, unknown>;
    const createGameConfig = mainModule.createGameConfig as ((parent: HTMLElement, viewportWidth?: number, devicePixelRatio?: number) => Record<string, unknown>) | undefined;
    const gameShell = document.getElementById('game-shell') as HTMLElement;

    expect(typeof createGameConfig).toBe('function');

    const config = createGameConfig?.(gameShell, 1440, 2);

    expect(config).toMatchObject({
      width: 1600,
      height: 900,
      parent: gameShell,
      autoRound: false,
      scale: {
        mode: 'FIT',
        autoCenter: 'CENTER_BOTH',
        width: 1600,
        height: 900,
      },
    });
  });
});
