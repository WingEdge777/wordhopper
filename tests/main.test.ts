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
      body: {},
      fonts: {
        ready: Promise.resolve(),
      },
      getElementById: vi.fn((id: string) => {
        if (id === 'game-shell') return { id };
        if (id === 'mobile-blocker') return { style: { display: 'none' } };
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
    const getRenderResolution = mainModule.getRenderResolution as ((dpr?: number) => number) | undefined;

    expect(typeof getRenderResolution).toBe('function');
    expect(getRenderResolution?.(3)).toBe(2);
    expect(getRenderResolution?.(1.5)).toBe(1.5);
  });

  it('builds a fixed-size game config mounted into the game shell', async () => {
    mockBrowserEnvironment(2);

    const mainModule = await import('../src/main') as Record<string, unknown>;
    const createGameConfig = mainModule.createGameConfig as ((parent: HTMLElement, devicePixelRatio?: number) => Record<string, unknown>) | undefined;
    const gameShell = document.getElementById('game-shell') as HTMLElement;

    expect(typeof createGameConfig).toBe('function');

    const config = createGameConfig?.(gameShell, 2);

    expect(config).toMatchObject({
      width: 800,
      height: 450,
      parent: gameShell,
      resolution: 2,
      autoRound: false,
      scale: {
        mode: 'FIT',
        autoCenter: 'CENTER_BOTH',
        width: 800,
        height: 450,
      },
    });
  });
});
