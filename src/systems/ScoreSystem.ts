import { BASE_SCORE_PER_TICK, WORD_SCORE_PER_CHAR, COMBO_BONUS, PERFECT_MULTIPLIER } from '../config/constants';

export class ScoreSystem {
  private score = 0;
  private wordsTyped = 0;
  private totalChars = 0;
  private bestWord = '';
  private combo = 0;
  private maxCombo = 0;

  addTick(): void {
    this.score += BASE_SCORE_PER_TICK;
  }

  addWordBonus(word: string, speedMultiplier: number, perfect: boolean): void {
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    const base = WORD_SCORE_PER_CHAR * word.length * speedMultiplier;
    const comboAdd = this.combo * COMBO_BONUS;
    const bonus = (base + comboAdd) * (perfect ? PERFECT_MULTIPLIER : 1.0);
    this.score += Math.round(bonus);
    this.wordsTyped++;
    this.totalChars += word.length;
    if (word.length > this.bestWord.length) {
      this.bestWord = word;
    }
  }

  breakCombo(): void {
    this.combo = 0;
  }

  getCombo(): number {
    return this.combo;
  }

  getScore(): number {
    return this.score;
  }

  getWordsTyped(): number {
    return this.wordsTyped;
  }

  getTotalChars(): number {
    return this.totalChars;
  }

  getBestWord(): string {
    return this.bestWord;
  }

  getMaxCombo(): number {
    return this.maxCombo;
  }

  getWPM(elapsedSeconds: number): number {
    if (elapsedSeconds <= 0) return 0;
    return Math.round((this.totalChars / 5) / (elapsedSeconds / 60));
  }

  reset(): void {
    this.score = 0;
    this.wordsTyped = 0;
    this.totalChars = 0;
    this.bestWord = '';
    this.combo = 0;
    this.maxCombo = 0;
  }
}
