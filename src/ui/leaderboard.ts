import type { Difficulty } from '../config/constants';
import { getNickname } from '../config/nickname';
import {
  getCachedLeaderboard,
  isLeaderboardCacheFresh,
  loadLeaderboardForDifficulty,
  prefetchLeaderboards,
  type LeaderboardEntry,
} from '../api/leaderboard';
import { playSfx } from '../audio/SoundManager';

const DIFFICULTIES: Difficulty[] = ['chill', 'easy', 'medium', 'hard'];

/** Inject overlay markup when a cached index.html predates the leaderboard UI. */
export function ensureLeaderboardDom(): HTMLElement {
  const existing = document.getElementById('leaderboard-panel');
  if (existing) return existing;

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
  tabs.setAttribute('aria-label', 'Difficulty');

  for (const difficulty of DIFFICULTIES) {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'lb-tab';
    tab.dataset.lbDifficulty = difficulty;
    tab.setAttribute('role', 'tab');
    tab.textContent = difficulty.toUpperCase();
    if (difficulty === 'easy') {
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
    }
    tabs.appendChild(tab);
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

let panel: HTMLElement | null = null;
let listEl: HTMLElement | null = null;
let statusEl: HTMLElement | null = null;
let activeDifficulty: Difficulty = 'easy';
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

function renderEntries(entries: LeaderboardEntry[]): void {
  if (!listEl) return;

  listEl.replaceChildren();
  if (entries.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'lb-empty-row';
    empty.textContent = 'No scores yet. Be the first!';
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
    rank.textContent = `#${entry.rank}`;

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
  renderEntries(cached.entries);
  setStatus(`${cached.entries.length} player${cached.entries.length === 1 ? '' : 's'}`);
  return true;
}

function updateTabs(): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>('[data-lb-difficulty]');
  tabs.forEach((tab) => {
    const selected = tab.dataset.lbDifficulty === activeDifficulty;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', selected ? 'true' : 'false');
  });
}

function warmRemainingLeaderboards(current: Difficulty): void {
  if (prefetchStarted) return;
  prefetchStarted = true;
  const others = DIFFICULTIES.filter((d) => d !== current);
  void prefetchLeaderboards(getNickname(), others);
}

async function loadLeaderboard(difficulty: Difficulty): Promise<void> {
  const token = ++loadToken;
  activeDifficulty = difficulty;
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
    renderEntries(data.entries);
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

export function closeLeaderboard(): void {
  const element = getPanel();
  if (!element) return;

  isOpen = false;
  element.hidden = true;
  document.body.classList.remove('leaderboard-open');
  setPhaserInputEnabled(true);
  focusGameInput();
}

export function openLeaderboard(difficulty: Difficulty = activeDifficulty): void {
  const element = getPanel();
  if (!element) return;

  isOpen = true;
  element.hidden = false;
  document.body.classList.add('leaderboard-open');
  blurGameInput();
  setPhaserInputEnabled(false);
  playSfx('ui', 0.35);
  void loadLeaderboard(difficulty);
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

  document.querySelectorAll<HTMLButtonElement>('[data-lb-difficulty]').forEach((tab) => {
    tab.addEventListener('click', () => {
      const difficulty = tab.dataset.lbDifficulty as Difficulty | undefined;
      if (!difficulty || !DIFFICULTIES.includes(difficulty)) return;
      if (difficulty === activeDifficulty) return;
      playSfx('ui', 0.35);
      void loadLeaderboard(difficulty);
    });
  });

  window.addEventListener('keydown', (event: KeyboardEvent) => {
    if (!isOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeLeaderboard();
    }
  });

  window.__wordhopper_showLeaderboard = (difficulty?: Difficulty) => {
    openLeaderboard(difficulty ?? activeDifficulty);
  };
  window.__wordhopper_closeLeaderboard = closeLeaderboard;
}
