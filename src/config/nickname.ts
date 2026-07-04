const NICKNAME_KEY = 'word-hopper-nickname';
const HINT_KEY = 'word-hopper-nickname-hint-seen';
export const NICKNAME_MAX_LEN = 16;

const ADJECTIVES = ['Swift', 'Lucky', 'Bouncy', 'Clever', 'Mighty', 'Happy', 'Quick', 'Brave'];
const NOUNS = ['Hamster', 'Hopper', 'Runner', 'Typer', 'Jumper', 'Player', 'Champ', 'Star'];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function generateNickname(): string {
  const suffix = Math.floor(Math.random() * 90) + 10;
  return `${pick(ADJECTIVES)}${pick(NOUNS)}${suffix}`;
}

function readStoredNickname(): string | null {
  try {
    const raw = localStorage.getItem(NICKNAME_KEY);
    if (!raw) return null;
    const trimmed = raw.trim();
    return trimmed ? trimmed.slice(0, NICKNAME_MAX_LEN) : null;
  } catch {
    return null;
  }
}

function writeNickname(nickname: string): void {
  try {
    localStorage.setItem(NICKNAME_KEY, nickname);
  } catch {
    // noop
  }
}

export function normalizeNickname(raw: string): string {
  const trimmed = raw.trim().slice(0, NICKNAME_MAX_LEN);
  return trimmed || generateNickname();
}

export function getNickname(): string {
  return readStoredNickname() || generateNickname();
}

export function setNickname(raw: string): string {
  const nickname = normalizeNickname(raw);
  writeNickname(nickname);
  return nickname;
}

export function ensureNickname(): { nickname: string; isNew: boolean } {
  const stored = readStoredNickname();
  if (stored) {
    return { nickname: stored, isNew: false };
  }
  const nickname = generateNickname();
  writeNickname(nickname);
  return { nickname, isNew: true };
}

export function shouldShowNicknameHint(): boolean {
  try {
    return !localStorage.getItem(HINT_KEY);
  } catch {
    return false;
  }
}

export function dismissNicknameHint(): void {
  try {
    localStorage.setItem(HINT_KEY, '1');
  } catch {
    // noop
  }
}
