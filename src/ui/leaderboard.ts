import type { Difficulty } from '../config/constants';
import { formatDailyTitle, getUtcChallengeDate } from '../config/daily';
import { getNickname } from '../config/nickname';
import { reconcileLocalBestFromEntries } from '../config/localScores';
import {
  fetchDailyLeaderboard,
  getCachedDailyLeaderboard,
  isDailyLeaderboardCacheFresh,
} from '../api/daily';
import {
  getCachedLeaderboard,
  isLeaderboardCacheFresh,
  loadLeaderboardForDifficulty,
  prefetchLeaderboards,
  type LeaderboardEntry,
} from '../api/leaderboard';
import { playSfx } from '../audio/SoundManager';

const DIFFICULTIES: Difficulty[] = ['chill', 'easy', 'medium', 'hard'];
export type LeaderboardTab = 'daily' | Difficulty;

const ALL_TABS: LeaderboardTab[] = ['daily', ...DIFFICULTIES];

/** Inject overlay markup when a cached index.html predates the leaderboard UI. */
export function ensureLeaderboardDom(): HTMLElement {
  const existing = document.getElementById('leaderboard-panel');
  if (existing) {
    ensureDailyTab(existing);
    return existing;
  }

  const panel = document.createElement('div');
  panel.id = 'leaderboard-panel';
  panel.hidden = true;

  const backdrop = document.createElement('div');
  backdrop.id = 'lb-backdrop';

  const card = document.createElement('div');
  card.className = 'lb-card';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-labelledby', 'lb-title');

  const header = document.createElement('div');
  header.className = 'lb-header';

  const title = document.createElement('h2');
  title.id = 'lb-title';
  title.textContent = 'Leaderboard';

  const closeBtn = document.createElement('button');
  closeBtn.id = 'lb-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close leaderboard');
  closeBtn.textContent = '×';

  header.append(title, closeBtn);

  const tabs = document.createElement('div');
  tabs.className = 'lb-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Leaderboard boards');

  for (const tab of ALL_TABS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lb-tab';
    button.dataset.lbTab = tab;
    button.setAttribute('role', 'tab');
    button.textContent = tab === 'daily' ? 'DAILY' : tab.toUpperCase();
    if (tab === 'easy') {
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');
    }
    tabs.appendChild(button);
  }

  const listHead = document.createElement('div');
  listHead.className = 'lb-list-head';
  listHead.setAttribute('aria-hidden', 'true');
  for (const label of ['#', 'Player', 'Score', 'WPM']) {
    const span = document.createElement('span');
    span.textContent = label;
    listHead.appendChild(span);
  }

  const list = document.createElement('ol');
  list.id = 'lb-list';
  list.className = 'lb-list';

  const status = document.createElement('p');
  status.id = 'lb-status';
  status.className = 'lb-status';

  card.append(header, tabs, listHead, list, status);
  panel.append(backdrop, card);
  document.body.appendChild(panel);
  return panel;
}

function ensureDailyTab(panel: HTMLElement): void {
  if (typeof panel.querySelector !== 'function') return;
  const tabs = panel.querySelector('.lb-tabs');
  if (!tabs || tabs.querySelector('[data-lb-tab="daily"]')) return;

  // Migrate legacy difficulty-only tabs.
  tabs.querySelectorAll<HTMLButtonElement>('[data-lb-difficulty]').forEach((tab) => {
    if (!tab.dataset.lbTab) {
      tab.dataset.lbTab = tab.dataset.lbDifficulty;
    }
  });

  const daily = document.createElement('button');
  daily.type = 'button';
  daily.className = 'lb-tab';
  daily.dataset.lbTab = 'daily';
  daily.setAttribute('role', 'tab');
  daily.textContent = 'DAILY';
  tabs.insertBefore(daily, tabs.firstChild);
}

let panel: HTMLElement | null = null;
let listEl: HTMLElement | null = null;
let statusEl: HTMLElement | null = null;
let activeTab: LeaderboardTab = 'easy';
let isOpen = false;
let loadToken = 0;
let prefetchStarted = false;

function getPanel(): HTMLElement | null {
  if (!panel) {
    panel = document.getElementById('leaderboard-panel');
  }
  return panel;
}

function focusGameInput(): void {
  const gameInput = document.getElementById('game-input') as HTMLInputElement | null;
  gameInput?.focus();
}

function blurGameInput(): void {
  const gameInput = document.getElementById('game-input') as HTMLInputElement | null;
  gameInput?.blur();
}

function setPhaserInputEnabled(enabled: boolean): void {
  window.__wordhopper_setGameInputEnabled?.(enabled);
}

function setStatus(message: string): void {
  if (statusEl) {
    statusEl.textContent = message;
  }
}

function renderEntries(entries: LeaderboardEntry[], options?: { reconcileDifficulty?: Difficulty }): void {
  if (!listEl) return;

  if (options?.reconcileDifficulty) {
    reconcileLocalBestFromEntries(options.reconcileDifficulty, getNickname(), entries);
  }

  listEl.replaceChildren();
  if (entries.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'lb-empty-row';
    empty.textContent = activeTab === 'daily'
      ? 'No daily scores yet. Be the first!'
      : 'No scores yet. Be the first!';
    listEl.appendChild(empty);
    return;
  }

  const currentNickname = getNickname();
  for (const entry of entries) {
    const row = document.createElement('li');
    row.className = 'lb-row';
    if (entry.nickname === currentNickname) {
      row.classList.add('lb-row-self');
    }

    const rank = document.createElement('span');
    rank.className = 'lb-rank';
    if (entry.rank === 1) {
      rank.textContent = '🥇';
      rank.classList.add('lb-rank-medal');
      rank.setAttribute('aria-label', 'Rank 1');
    } else if (entry.rank === 2) {
      rank.textContent = '🥈';
      rank.classList.add('lb-rank-medal');
      rank.setAttribute('aria-label', 'Rank 2');
    } else if (entry.rank === 3) {
      rank.textContent = '🥉';
      rank.classList.add('lb-rank-medal');
      rank.setAttribute('aria-label', 'Rank 3');
    } else {
      rank.textContent = `#${entry.rank}`;
    }

    const name = document.createElement('span');
    name.className = 'lb-name';
    name.textContent = entry.nickname;

    const score = document.createElement('span');
    score.className = 'lb-score';
    score.textContent = entry.score.toLocaleString();

    const wpm = document.createElement('span');
    wpm.className = 'lb-wpm';
    wpm.textContent = `${entry.wpm} WPM`;

    row.append(rank, name, score, wpm);
    listEl.appendChild(row);
  }
}

function showCachedEntries(difficulty: Difficulty): boolean {
  const cached = getCachedLeaderboard(difficulty);
  if (!cached) return false;
  renderEntries(cached.entries, { reconcileDifficulty: difficulty });
  setStatus(`${cached.entries.length} player${cached.entries.length === 1 ? '' : 's'}`);
  return true;
}

function updateTabs(): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>('[data-lb-tab]');
  tabs.forEach((tab) => {
    const selected = tab.dataset.lbTab === activeTab;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', selected ? 'true' : 'false');
  });

  const title = document.getElementById('lb-title');
  if (title) {
    title.textContent = activeTab === 'daily'
      ? formatDailyTitle(getUtcChallengeDate())
      : 'Leaderboard';
  }
}

function warmRemainingLeaderboards(current: Difficulty): void {
  if (prefetchStarted) return;
  prefetchStarted = true;
  const others = DIFFICULTIES.filter((d) => d !== current);
  void prefetchLeaderboards(getNickname(), others);
}

async function loadDailyBoard(): Promise<void> {
  const token = ++loadToken;
  activeTab = 'daily';
  updateTabs();

  const date = getUtcChallengeDate();
  const fresh = isDailyLeaderboardCacheFresh(date);
  const cached = getCachedDailyLeaderboard(date);
  if (cached) {
    renderEntries(cached.entries);
    setStatus(
      cached.entries.length === 0
        ? 'Be the first today!'
        : `${cached.entries.length} player${cached.entries.length === 1 ? '' : 's'} today`,
    );
    if (fresh) return;
  } else {
    setStatus('Loading...');
    if (listEl) listEl.replaceChildren();
  }

  try {
    const data = await fetchDailyLeaderboard(date, 50, { refresh: !fresh });
    if (!isOpen || token !== loadToken) return;
    renderEntries(data.entries);
    setStatus(
      data.entries.length === 0
        ? 'Be the first today!'
        : `${data.entries.length} player${data.entries.length === 1 ? '' : 's'} today`,
    );
  } catch {
    if (!isOpen || token !== loadToken) return;
    if (!cached) {
      setStatus('Could not load daily board');
      if (listEl) {
        listEl.replaceChildren();
        const error = document.createElement('li');
        error.className = 'lb-empty-row';
        error.textContent = 'Server unavailable. Try again later.';
        listEl.appendChild(error);
      }
    }
  }
}

async function loadClassicBoard(difficulty: Difficulty): Promise<void> {
  const token = ++loadToken;
  activeTab = difficulty;
  updateTabs();

  const hasFreshCache = isLeaderboardCacheFresh(difficulty);
  if (hasFreshCache) {
    showCachedEntries(difficulty);
    return;
  }

  const hasStaleCache = showCachedEntries(difficulty);
  if (!hasStaleCache) {
    setStatus('Loading...');
    if (listEl) listEl.replaceChildren();
  }

  try {
    const data = await loadLeaderboardForDifficulty(
      getNickname(),
      difficulty,
      { refresh: !hasFreshCache },
    );
    if (!isOpen || token !== loadToken) return;
    renderEntries(data.entries, { reconcileDifficulty: difficulty });
    setStatus(`${data.entries.length} player${data.entries.length === 1 ? '' : 's'}`);
    warmRemainingLeaderboards(difficulty);
  } catch {
    if (!isOpen || token !== loadToken) return;
    if (!hasStaleCache) {
      setStatus('Could not load leaderboard');
      if (listEl) {
        listEl.replaceChildren();
        const error = document.createElement('li');
        error.className = 'lb-empty-row';
        error.textContent = 'Server unavailable. Try again later.';
        listEl.appendChild(error);
      }
    }
  }
}

async function loadBoard(tab: LeaderboardTab): Promise<void> {
  if (tab === 'daily') {
    await loadDailyBoard();
    return;
  }
  await loadClassicBoard(tab);
}

export function closeLeaderboard(): void {
  const element = getPanel();
  if (!element || !isOpen) return;

  isOpen = false;
  element.hidden = true;
  document.body.classList.remove('leaderboard-open');
  setPhaserInputEnabled(true);
  focusGameInput();
  playSfx('ui', 0.35);
}

export function openLeaderboard(tab: LeaderboardTab = activeTab): void {
  const element = getPanel();
  if (!element) return;

  const wasOpen = isOpen;
  isOpen = true;
  element.hidden = false;
  document.body.classList.add('leaderboard-open');
  blurGameInput();
  setPhaserInputEnabled(false);
  if (!wasOpen) {
    playSfx('ui', 0.35);
  }
  void loadBoard(tab);
}

export function setupLeaderboardOverlay(): void {
  ensureLeaderboardDom();
  panel = document.getElementById('leaderboard-panel');
  listEl = document.getElementById('lb-list');
  statusEl = document.getElementById('lb-status');
  const closeBtn = document.getElementById('lb-close');
  const backdrop = document.getElementById('lb-backdrop');

  closeBtn?.addEventListener('click', closeLeaderboard);
  backdrop?.addEventListener('click', closeLeaderboard);
  panel?.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-lb-tab]').forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      const tab = tabBtn.dataset.lbTab as LeaderboardTab | undefined;
      if (!tab || !ALL_TABS.includes(tab)) return;
      if (tab === activeTab) return;
      playSfx('ui', 0.35);
      void loadBoard(tab);
    });
  });

  // Legacy difficulty tabs (cached index.html).
  document.querySelectorAll<HTMLButtonElement>('[data-lb-difficulty]').forEach((tabBtn) => {
    if (tabBtn.dataset.lbTab) return;
    tabBtn.addEventListener('click', () => {
      const difficulty = tabBtn.dataset.lbDifficulty as Difficulty | undefined;
      if (!difficulty || !DIFFICULTIES.includes(difficulty)) return;
      if (difficulty === activeTab) return;
      playSfx('ui', 0.35);
      void loadClassicBoard(difficulty);
    });
  });

  window.addEventListener('keydown', (event: KeyboardEvent) => {
    if (!isOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeLeaderboard();
    }
  });

  window.__wordhopper_showLeaderboard = (tab?: LeaderboardTab) => {
    openLeaderboard(tab ?? (activeTab === 'daily' ? 'easy' : activeTab));
  };
  window.__wordhopper_closeLeaderboard = closeLeaderboard;
}
