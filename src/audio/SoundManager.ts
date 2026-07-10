import type Phaser from 'phaser';

export type SfxKey = 'word' | 'wrong' | 'perfect' | 'good' | 'die' | 'newBest' | 'ui';

const MUTE_KEY = 'word-hopper-muted';
const SFX_KEYS: SfxKey[] = ['word', 'wrong', 'perfect', 'good', 'die', 'newBest', 'ui'];

let game: Phaser.Game | null = null;
let muted = readMuted();

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeMuted(value: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0');
  } catch {
    // noop
  }
}

export function preloadSfx(scene: Phaser.Scene): void {
  for (const key of SFX_KEYS) {
    scene.load.audio(key, `assets/audio/${key}.ogg`);
  }
}

export function bindSoundGame(phaserGame: Phaser.Game): void {
  game = phaserGame;
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  writeMuted(value);
  if (!game?.sound) return;
  game.sound.mute = value;
}

export function toggleMuted(): boolean {
  setMuted(!muted);
  return muted;
}

/** Call after a user gesture so browsers unlock AudioContext. */
export function unlockAudio(): void {
  if (!game?.sound) return;
  const sound = game.sound;
  if (sound.locked) {
    sound.unlock();
  }
}

export function playSfx(key: SfxKey, volume = 0.55): void {
  if (!game?.sound || muted) return;
  try {
    unlockAudio();
    if (!game.cache?.audio?.exists?.(key)) return;
    game.sound.play(key, { volume });
  } catch {
    // Ignore autoplay / missing-cache failures.
  }
}

export function setupMuteToggle(): void {
  const btn = document.getElementById('mute-btn') as HTMLButtonElement | null;
  if (!btn) return;

  const syncLabel = (): void => {
    btn.textContent = muted ? 'Sound: Off' : 'Sound: On';
    btn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    btn.title = muted ? 'Unmute sound effects' : 'Mute sound effects';
  };

  syncLabel();
  btn.addEventListener('click', () => {
    unlockAudio();
    toggleMuted();
    syncLabel();
    if (!muted) playSfx('ui', 0.4);
  });
}
