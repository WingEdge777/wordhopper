import { Difficulty, DIFFICULTY_CONFIG } from '../config/constants';

export interface WordPair {
  word1: string;
  word2: string;
}

export class WordSpawner {
  private words: string[] = [];
  private lastWord1 = '';
  private lastWord2 = '';

  async loadWords(difficulty: Difficulty): Promise<void> {
    const config = DIFFICULTY_CONFIG[difficulty];
    const data = await import(`../data/${config.wordFile}`);
    const allWords: string[] = data.default || data;
    this.words = allWords.filter(
      (w) => w.length >= config.minLen && w.length <= config.maxLen
    );
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
