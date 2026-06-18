export interface TypingResult {
  selectedWord: string;
  charIndex: number;
  completed: boolean;
  wrong: boolean;
}

export interface TypingProgress {
  word1: string;
  word2: string;
  selectedWord: string;
  correctChars: number;
  wrong: boolean;
}

export class TypingSystem {
  private word1 = '';
  private word2 = '';
  private selectedWord = '';
  private charIndex = 0;
  private wrong = false;

  setWords(word1: string, word2: string): void {
    this.word1 = word1;
    this.word2 = word2;
    this.selectedWord = '';
    this.charIndex = 0;
    this.wrong = false;
  }

  setSingleWord(word: string): void {
    this.word1 = word;
    this.word2 = '';
    this.selectedWord = '';
    this.charIndex = 0;
    this.wrong = false;
  }

  onKeyPress(key: string): TypingResult {
    const lowerKey = key.toLowerCase();

    if (this.selectedWord === '') {
      if (lowerKey === this.word1[0]) {
        this.selectedWord = this.word1;
        this.charIndex = 1;
        this.wrong = false;
        return this.makeResult(false);
      }
      if (lowerKey === this.word2[0]) {
        this.selectedWord = this.word2;
        this.charIndex = 1;
        this.wrong = false;
        return this.makeResult(false);
      }
      this.wrong = true;
      return this.makeResult(true);
    }

    const expected = this.selectedWord[this.charIndex];
    if (lowerKey === expected) {
      this.charIndex++;
      this.wrong = false;
      const completed = this.charIndex >= this.selectedWord.length;
      return this.makeResult(false, completed);
    }

    if (this.charIndex === 0) {
      if (lowerKey === this.word1[0]) {
        this.selectedWord = this.word1;
        this.charIndex = 1;
        this.wrong = false;
        return this.makeResult(false);
      }
      if (this.word2 && lowerKey === this.word2[0]) {
        this.selectedWord = this.word2;
        this.charIndex = 1;
        this.wrong = false;
        return this.makeResult(false);
      }
    }

    this.charIndex = 0;
    this.wrong = true;
    return this.makeResult(true);
  }

  getSelectedWord(): string {
    return this.selectedWord;
  }

  hasWords(): boolean {
    return this.word1 !== '' || this.word2 !== '';
  }

  clear(): void {
    this.word1 = '';
    this.word2 = '';
    this.selectedWord = '';
    this.charIndex = 0;
    this.wrong = false;
  }

  getCharIndex(): number {
    return this.charIndex;
  }

  getProgress(): TypingProgress {
    return {
      word1: this.word1,
      word2: this.word2,
      selectedWord: this.selectedWord,
      correctChars: this.charIndex,
      wrong: this.wrong,
    };
  }

  private makeResult(wrong: boolean, completed = false, selectedWord?: string): TypingResult {
    return {
      selectedWord: selectedWord ?? this.selectedWord,
      charIndex: this.charIndex,
      completed,
      wrong,
    };
  }
}
