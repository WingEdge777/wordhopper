import { afterEach, describe, expect, it, vi } from 'vitest';
import { ensureLeaderboardDom } from '../src/ui/leaderboard';

describe('leaderboard ui', () => {
  afterEach(() => {
    document.getElementById('leaderboard-panel')?.remove();
    vi.resetModules();
  });

  it('creates overlay markup when index.html is stale', () => {
    expect(document.getElementById('leaderboard-panel')).toBeNull();

    const panel = ensureLeaderboardDom();

    expect(panel.id).toBe('leaderboard-panel');
    expect(document.getElementById('lb-list')).not.toBeNull();
    expect(document.getElementById('lb-status')).not.toBeNull();
    expect(document.querySelectorAll('[data-lb-tab]')).toHaveLength(5);
    expect(document.querySelector('[data-lb-tab="daily"]')).not.toBeNull();
  });

  it('reuses existing overlay markup', () => {
    const first = ensureLeaderboardDom();
    const second = ensureLeaderboardDom();

    expect(second).toBe(first);
    expect(document.querySelectorAll('#leaderboard-panel')).toHaveLength(1);
  });
});
