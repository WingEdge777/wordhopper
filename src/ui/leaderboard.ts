import type { Difficulty } from '../config/constants';
import { getNickname } from '../config/nickname';
import { syncAndFetchLeaderboard, type LeaderboardEntry } from '../api/leaderboard';

const DIFFICULTIES: Difficulty[] = ['chill', 'easy', 'medium', 'hard'];

let panel: HTMLElement | null = null;
let listEl: HTMLElement | null = null;
let statusEl: HTMLElement | null = null;
let activeDifficulty: Difficulty = 'easy';
let isOpen = false;
let loadToken = 0;

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

function updateTabs(): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>('[data-lb-difficulty]');
  tabs.forEach((tab) => {
    const selected = tab.dataset.lbDifficulty === activeDifficulty;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', selected ? 'true' : 'false');
  });
}

async function loadLeaderboard(difficulty: Difficulty): Promise<void> {
  const token = ++loadToken;
  activeDifficulty = difficulty;
  updateTabs();
  setStatus('Loading...');
  if (listEl) {
    listEl.replaceChildren();
  }

  try {
    const data = await syncAndFetchLeaderboard(getNickname(), difficulty);
    if (!isOpen || token !== loadToken) return;
    renderEntries(data.entries);
    setStatus(`${data.entries.length} player${data.entries.length === 1 ? '' : 's'}`);
  } catch {
    if (!isOpen || token !== loadToken) return;
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

export function closeLeaderboard(): void {
  const element = getPanel();
  if (!element) return;

  isOpen = false;
  element.hidden = true;
  document.body.classList.remove('leaderboard-open');
  focusGameInput();
}

export function openLeaderboard(difficulty: Difficulty = activeDifficulty): void {
  const element = getPanel();
  if (!element) return;

  isOpen = true;
  element.hidden = false;
  document.body.classList.add('leaderboard-open');
  void loadLeaderboard(difficulty);
}

export function setupLeaderboardOverlay(): void {
  panel = document.getElementById('leaderboard-panel');
  listEl = document.getElementById('lb-list');
  statusEl = document.getElementById('lb-status');
  const closeBtn = document.getElementById('lb-close');
  const backdrop = document.getElementById('lb-backdrop');

  closeBtn?.addEventListener('click', closeLeaderboard);
  backdrop?.addEventListener('click', closeLeaderboard);

  document.querySelectorAll<HTMLButtonElement>('[data-lb-difficulty]').forEach((tab) => {
    tab.addEventListener('click', () => {
      const difficulty = tab.dataset.lbDifficulty as Difficulty | undefined;
      if (!difficulty || !DIFFICULTIES.includes(difficulty)) return;
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
