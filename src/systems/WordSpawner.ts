import { Difficulty } from '../config/constants';
import easyWords from '../data/words-easy.json';
import mediumWords from '../data/words-medium.json';
import hardWords from '../data/words-hard.json';

export interface WordPair {
  word1: string;
  word2: string;
}

const WORD_CACHE: Record<Difficulty, string[]> = {
  easy: (easyWords as string[]).filter((w) => w.length >= 3 && w.length <= 5),
  medium: (mediumWords as string[]).filter((w) => w.length >= 6 && w.length <= 8),
  hard: (hardWords as string[]).filter((w) => w.length >= 8),
};

export class WordSpawner {
  private words: string[] = [];
  private lastWord1 = '';
  private lastWord2 = '';

  loadWords(difficulty: Difficulty): void {
    this.words = WORD_CACHE[difficulty] || [];
  }

  generatePair(): WordPair {
    const word1 = this.pickRandom(this.lastWord1);
    let word2 = this.pickRandom(this.lastWord2);

    let attempts = 0;
    while (word2[0] === word1[0] && attempts < 100) {
      word2 = this.pickRandom(this.lastWord2);
      attempts++;
    }

    this.lastWord1 = word1;
    this.lastWord2 = word2;
    return { word1, word2 };
  }

  generateSingle(): string {
    const word = this.pickRandom(this.lastWord1);
    this.lastWord1 = word;
    return word;
  }

  private pickRandom(exclude: string): string {
    if (this.words.length <= 1) return this.words[0] || '';
    let candidate: string;
    let attempts = 0;
    do {
      candidate = this.words[Math.floor(Math.random() * this.words.length)];
      attempts++;
    } while (candidate === exclude && attempts < 50);
    return candidate;
  }
}
