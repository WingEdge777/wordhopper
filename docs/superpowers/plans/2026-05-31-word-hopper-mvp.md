# Word Hopper MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable endless runner + typing game where players type words to control jump height and dodge plant obstacles.

**Architecture:** Phaser 3 Canvas game with TypeScript. Pure logic systems (WordSpawner, ScoreSystem, SpeedManager, TypingSystem) are framework-independent and fully unit-tested. Phaser scenes handle rendering and orchestration. Entities (Player, Obstacle) bridge systems and scenes.

**Tech Stack:** Phaser 3, TypeScript (strict), Vite, Vitest, Playwright

---

## File Structure

```
word-hopper/
├── public/
│   ├── assets/
│   │   ├── sprites/          # placeholder sprites
│   │   ├── audio/            # placeholder audio
│   │   └── fonts/            # pixel font
│   └── index.html
├── src/
│   ├── main.ts               # Phaser game config
│   ├── scenes/
│   │   ├── BootScene.ts      # preload
│   │   ├── MenuScene.ts      # title + difficulty
│   │   ├── GameScene.ts      # gameplay orchestration
│   │   └── DeathScene.ts     # score screen
│   ├── entities/
│   │   ├── Player.ts         # character + jump physics
│   │   └── Obstacle.ts       # plant obstacle group
│   ├── systems/
│   │   ├── TypingSystem.ts   # input + prefix match
│   │   ├── WordSpawner.ts    # word pair generation
│   │   ├── ObstacleSpawner.ts # plant + gap generation
│   │   ├── ScoreSystem.ts    # scoring
│   │   └── SpeedManager.ts   # staged acceleration
│   ├── data/
│   │   ├── words-easy.json
│   │   ├── words-medium.json
│   │   └── words-hard.json
│   └── config/
│       └── constants.ts
├── tests/
│   ├── WordSpawner.test.ts
│   ├── ScoreSystem.test.ts
│   ├── SpeedManager.test.ts
│   └── TypingSystem.test.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `public/index.html`
- Create: `src/main.ts`

- [ ] **Step 1: Initialize project and install dependencies**

```bash
cd /home/zhu/wsl-workspace/me/idea/word-hopper
npm init -y
npm install phaser@3
npm install -D typescript vite vitest @types/node
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["node"]
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    open: true,
  },
});
```

- [ ] **Step 4: Create public/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Word Hopper</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1a1a2e; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: hidden; }
    canvas { image-rendering: pixelated; }
  </style>
</head>
<body>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 5: Create src/main.ts (minimal Phaser boot)**

```ts
import Phaser from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  width: 800,
  height: 450,
  parent: document.body,
  backgroundColor: '#1a1a2e',
  scene: {
    create() {
      const text = this.add.text(400, 225, 'Word Hopper', {
        fontSize: '32px',
        color: '#4ecdc4',
        fontFamily: 'monospace',
      });
      text.setOrigin(0.5);
    },
  },
};

new Phaser.Game(config);
```

- [ ] **Step 6: Verify dev server works**

Run: `npx vite --host`
Expected: Browser opens, shows "Word Hopper" text on dark background. Kill server after verifying.

- [ ] **Step 7: Update package.json scripts**

Replace the "scripts" section:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: project scaffolding with Phaser 3 + TypeScript + Vite"
```

---

### Task 2: Constants Config

**Files:**
- Create: `src/config/constants.ts`

- [ ] **Step 1: Create constants.ts**

```ts
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 450;
export const PLAYER_X = 80;
export const PLAYER_HEIGHT = 32;
export const PLAYER_WIDTH = 24;
export const GROUND_Y = CANVAS_HEIGHT - 35;

export const INITIAL_SCROLL_SPEED = 200;
export const MAX_SPEED_MULTIPLIER = 2.5;

export const GRAVITY = 1200;

export const GAP_MIN = 2.5 * PLAYER_HEIGHT;
export const GAP_MAX = 4.5 * PLAYER_HEIGHT;

export const SINGLE_OBSTACLE_CHANCE = 0.3;

export const TYPING_WINDOW_PER_CHAR = 0.25;
export const DECISION_BUFFER = 0.8;
export const SPACING_SAFETY_FACTOR = 1.3;

export const SPEED_PHASE1_END = 500;
export const SPEED_PHASE2_END = 1500;
export const SPEED_PHASE2_INTERVAL = 3;
export const SPEED_INCREMENT = 0.01;

export const BASE_SCORE_PER_TICK = 1;
export const WORD_BONUS_MULTIPLIER = 10;

export const WRONG_LETTER_FLASH_MS = 200;

export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_CONFIG: Record<Difficulty, { minLen: number; maxLen: number; wordFile: string }> = {
  easy: { minLen: 3, maxLen: 5, wordFile: 'words-easy.json' },
  medium: { minLen: 6, maxLen: 10, wordFile: 'words-medium.json' },
  hard: { minLen: 11, maxLen: Infinity, wordFile: 'words-hard.json' },
};

export enum PlantType {
  Cactus = 'cactus',
  Bramble = 'bramble',
  Mushroom = 'mushroom',
  VenusFlytrap = 'venus_flytrap',
  TreeStump = 'tree_stump',
  HangingVines = 'hanging_vines',
}

export enum ObstacleLayout {
  UpperLower = 'upper_lower',
  UpperOnly = 'upper_only',
  LowerOnly = 'lower_only',
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/config/constants.ts
git commit -m "feat: game constants and type definitions"
```

---

### Task 3: WordSpawner

**Files:**
- Create: `src/systems/WordSpawner.ts`
- Create: `tests/WordSpawner.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { WordSpawner } from '../src/systems/WordSpawner';
import { Difficulty } from '../src/config/constants';

describe('WordSpawner', () => {
  let spawner: WordSpawner;

  beforeEach(() => {
    spawner = new WordSpawner();
  });

  it('should load easy word list', async () => {
    await spawner.loadWords('easy');
    const pair = spawner.generatePair();
    expect(pair).toBeDefined();
    expect(pair.word1.length).toBeGreaterThanOrEqual(3);
    expect(pair.word1.length).toBeLessThanOrEqual(5);
    expect(pair.word2.length).toBeGreaterThanOrEqual(3);
    expect(pair.word2.length).toBeLessThanOrEqual(5);
  });

  it('should guarantee different first letters', async () => {
    await spawner.loadWords('easy');
    for (let i = 0; i < 50; i++) {
      const pair = spawner.generatePair();
      expect(pair.word1[0]).not.toBe(pair.word2[0]);
    }
  });

  it('should generate medium words for medium difficulty', async () => {
    await spawner.loadWords('medium');
    const pair = spawner.generatePair();
    expect(pair.word1.length).toBeGreaterThanOrEqual(6);
    expect(pair.word1.length).toBeLessThanOrEqual(10);
  });

  it('should generate hard words for hard difficulty', async () => {
    await spawner.loadWords('hard');
    const pair = spawner.generatePair();
    expect(pair.word1.length).toBeGreaterThanOrEqual(11);
  });

  it('should return a single word for single-obstacle layouts', async () => {
    await spawner.loadWords('easy');
    const word = spawner.generateSingle();
    expect(word).toBeDefined();
    expect(word.length).toBeGreaterThanOrEqual(3);
    expect(word.length).toBeLessThanOrEqual(5);
  });

  it('should not repeat the same word consecutively', async () => {
    await spawner.loadWords('easy');
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const pair = spawner.generatePair();
      results.add(pair.word1);
      results.add(pair.word2);
    }
    expect(results.size).toBeGreaterThan(5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/WordSpawner.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement WordSpawner**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/WordSpawner.test.ts`
Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/systems/WordSpawner.ts tests/WordSpawner.test.ts
git commit -m "feat: WordSpawner with different-first-letter guarantee"
```

---

### Task 4: ScoreSystem

**Files:**
- Create: `src/systems/ScoreSystem.ts`
- Create: `tests/ScoreSystem.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { ScoreSystem } from '../src/systems/ScoreSystem';

describe('ScoreSystem', () => {
  it('should accumulate base score per tick', () => {
    const score = new ScoreSystem();
    score.addTick();
    score.addTick();
    score.addTick();
    expect(score.getScore()).toBe(3);
  });

  it('should add word bonus scaled by speed and word length', () => {
    const score = new ScoreSystem();
    score.addWordBonus('leaf', 1.0);
    expect(score.getScore()).toBe(40);
  });

  it('should scale word bonus by current speed', () => {
    const score = new ScoreSystem();
    score.addWordBonus('adventure', 2.0);
    expect(score.getScore()).toBe(10 * 9 * 2.0);
  });

  it('should track words typed count', () => {
    const score = new ScoreSystem();
    score.addWordBonus('cat', 1.0);
    score.addWordBonus('dog', 1.0);
    expect(score.getWordsTyped()).toBe(2);
  });

  it('should track total chars typed for WPM', () => {
    const score = new ScoreSystem();
    score.addWordBonus('leaf', 1.0);
    score.addWordBonus('spring', 1.0);
    expect(score.getTotalChars()).toBe(4 + 6);
  });

  it('should track best word', () => {
    const score = new ScoreSystem();
    score.addWordBonus('cat', 1.0);
    score.addWordBonus('adventure', 1.0);
    expect(score.getBestWord()).toBe('adventure');
  });

  it('should reset all state', () => {
    const score = new ScoreSystem();
    score.addTick();
    score.addWordBonus('cat', 1.0);
    score.reset();
    expect(score.getScore()).toBe(0);
    expect(score.getWordsTyped()).toBe(0);
    expect(score.getTotalChars()).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/ScoreSystem.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement ScoreSystem**

```ts
import { BASE_SCORE_PER_TICK, WORD_BONUS_MULTIPLIER } from '../config/constants';

export class ScoreSystem {
  private score = 0;
  private wordsTyped = 0;
  private totalChars = 0;
  private bestWord = '';

  addTick(): void {
    this.score += BASE_SCORE_PER_TICK;
  }

  addWordBonus(word: string, speedMultiplier: number): void {
    const bonus = WORD_BONUS_MULTIPLIER * word.length * speedMultiplier;
    this.score += Math.round(bonus);
    this.wordsTyped++;
    this.totalChars += word.length;
    if (word.length > this.bestWord.length) {
      this.bestWord = word;
    }
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

  getWPM(elapsedSeconds: number): number {
    if (elapsedSeconds <= 0) return 0;
    return Math.round((this.totalChars / 5) / (elapsedSeconds / 60));
  }

  reset(): void {
    this.score = 0;
    this.wordsTyped = 0;
    this.totalChars = 0;
    this.bestWord = '';
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/ScoreSystem.test.ts`
Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/systems/ScoreSystem.ts tests/ScoreSystem.test.ts
git commit -m "feat: ScoreSystem with base score, word bonus, and stats tracking"
```

---

### Task 5: SpeedManager

**Files:**
- Create: `src/systems/SpeedManager.ts`
- Create: `tests/SpeedManager.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { SpeedManager } from '../src/systems/SpeedManager';

describe('SpeedManager', () => {
  it('should return initial speed at start', () => {
    const mgr = new SpeedManager();
    expect(mgr.getSpeed()).toBe(200);
    expect(mgr.getSpeedMultiplier()).toBe(1.0);
  });

  it('should not increase speed before 500m', () => {
    const mgr = new SpeedManager();
    mgr.onObstacleCleared(100);
    mgr.onObstacleCleared(200);
    mgr.onObstacleCleared(300);
    expect(mgr.getSpeedMultiplier()).toBe(1.0);
  });

  it('should increase speed every 3 obstacles between 500-1500m', () => {
    const mgr = new SpeedManager();
    mgr.updateDistance(600);
    mgr.onObstacleCleared(600);
    mgr.onObstacleCleared(620);
    expect(mgr.getSpeedMultiplier()).toBe(1.0);
    mgr.onObstacleCleared(640);
    expect(mgr.getSpeedMultiplier()).toBeCloseTo(1.01, 4);
  });

  it('should increase speed every obstacle after 1500m', () => {
    const mgr = new SpeedManager();
    mgr.updateDistance(1600);
    mgr.onObstacleCleared(1600);
    expect(mgr.getSpeedMultiplier()).toBeCloseTo(1.01, 4);
    mgr.onObstacleCleared(1620);
    expect(mgr.getSpeedMultiplier()).toBeCloseTo(1.02, 4);
  });

  it('should cap speed at 2.5x', () => {
    const mgr = new SpeedManager();
    mgr.updateDistance(9999);
    for (let i = 0; i < 500; i++) {
      mgr.onObstacleCleared(9999);
    }
    expect(mgr.getSpeedMultiplier()).toBeLessThanOrEqual(2.5);
  });

  it('should compute compression factor', () => {
    const mgr = new SpeedManager();
    expect(mgr.getCompressionFactor()).toBe(1.0);
    mgr.updateDistance(9999);
    for (let i = 0; i < 300; i++) {
      mgr.onObstacleCleared(9999);
    }
    const factor = mgr.getCompressionFactor();
    expect(factor).toBeLessThan(1.0);
    expect(factor).toBeCloseTo(1.0 / Math.sqrt(mgr.getSpeedMultiplier()), 4);
  });

  it('should reset', () => {
    const mgr = new SpeedManager();
    mgr.updateDistance(9999);
    mgr.onObstacleCleared(9999);
    mgr.reset();
    expect(mgr.getSpeed()).toBe(200);
    expect(mgr.getSpeedMultiplier()).toBe(1.0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/SpeedManager.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement SpeedManager**

```ts
import {
  INITIAL_SCROLL_SPEED,
  MAX_SPEED_MULTIPLIER,
  SPEED_INCREMENT,
  SPEED_PHASE1_END,
  SPEED_PHASE2_END,
  SPEED_PHASE2_INTERVAL,
} from '../config/constants';

export class SpeedManager {
  private multiplier = 1.0;
  private distance = 0;
  private obstaclesSinceLastIncrement = 0;

  getSpeed(): number {
    return INITIAL_SCROLL_SPEED * this.multiplier;
  }

  getSpeedMultiplier(): number {
    return this.multiplier;
  }

  getCompressionFactor(): number {
    return 1.0 / Math.sqrt(this.multiplier);
  }

  updateDistance(distance: number): void {
    this.distance = distance;
  }

  onObstacleCleared(distance: number): void {
    this.distance = distance;
    this.obstaclesSinceLastIncrement++;

    if (this.multiplier >= MAX_SPEED_MULTIPLIER) return;

    if (this.distance >= SPEED_PHASE2_END) {
      this.multiplier += SPEED_INCREMENT;
    } else if (this.distance >= SPEED_PHASE1_END) {
      if (this.obstaclesSinceLastIncrement >= SPEED_PHASE2_INTERVAL) {
        this.multiplier += SPEED_INCREMENT;
        this.obstaclesSinceLastIncrement = 0;
      }
    }

    if (this.multiplier > MAX_SPEED_MULTIPLIER) {
      this.multiplier = MAX_SPEED_MULTIPLIER;
    }
  }

  reset(): void {
    this.multiplier = 1.0;
    this.distance = 0;
    this.obstaclesSinceLastIncrement = 0;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/SpeedManager.test.ts`
Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/systems/SpeedManager.ts tests/SpeedManager.test.ts
git commit -m "feat: SpeedManager with staged acceleration and compression factor"
```

---

### Task 6: TypingSystem

**Files:**
- Create: `src/systems/TypingSystem.ts`
- Create: `tests/TypingSystem.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { TypingSystem } from '../src/systems/TypingSystem';

describe('TypingSystem', () => {
  it('should auto-select word by first letter', () => {
    const typing = new TypingSystem();
    typing.setWords('leaf', 'run');
    const result = typing.onKeyPress('l');
    expect(result.selectedWord).toBe('leaf');
    expect(result.charIndex).toBe(1);
    expect(result.completed).toBe(false);
  });

  it('should advance through word on correct letters', () => {
    const typing = new TypingSystem();
    typing.setWords('leaf', 'run');
    typing.onKeyPress('l');
    const result = typing.onKeyPress('e');
    expect(result.charIndex).toBe(2);
    expect(result.completed).toBe(false);
  });

  it('should complete word on last correct letter', () => {
    const typing = new TypingSystem();
    typing.setWords('cat', 'dog');
    typing.onKeyPress('c');
    typing.onKeyPress('a');
    const result = typing.onKeyPress('t');
    expect(result.completed).toBe(true);
    expect(result.selectedWord).toBe('cat');
  });

  it('should reset on wrong letter', () => {
    const typing = new TypingSystem();
    typing.setWords('leaf', 'run');
    typing.onKeyPress('l');
    const result = typing.onKeyPress('x');
    expect(result.wrong).toBe(true);
    expect(result.charIndex).toBe(0);
    expect(result.selectedWord).toBe('');
  });

  it('should allow switching to other word after wrong letter', () => {
    const typing = new TypingSystem();
    typing.setWords('leaf', 'run');
    typing.onKeyPress('l');
    typing.onKeyPress('x');
    const result = typing.onKeyPress('r');
    expect(result.selectedWord).toBe('run');
    expect(result.charIndex).toBe(1);
  });

  it('should allow switching word before starting', () => {
    const typing = new TypingSystem();
    typing.setWords('leaf', 'run');
    typing.onKeyPress('r');
    expect(typing.getSelectedWord()).toBe('run');
    expect(typing.getCharIndex()).toBe(1);
  });

  it('should return progress for rendering', () => {
    const typing = new TypingSystem();
    typing.setWords('leaf', 'run');
    typing.onKeyPress('l');
    typing.onKeyPress('e');
    const progress = typing.getProgress();
    expect(progress).toEqual({
      word1: 'leaf',
      word2: 'run',
      selectedWord: 'leaf',
      correctChars: 2,
      wrong: false,
    });
  });

  it('should reset state for new word pair', () => {
    const typing = new TypingSystem();
    typing.setWords('leaf', 'run');
    typing.onKeyPress('l');
    typing.setWords('cat', 'dog');
    expect(typing.getSelectedWord()).toBe('');
    expect(typing.getCharIndex()).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/TypingSystem.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement TypingSystem**

```ts
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

    this.selectedWord = '';
    this.charIndex = 0;
    this.wrong = true;
    return this.makeResult(true);
  }

  getSelectedWord(): string {
    return this.selectedWord;
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

  private makeResult(wrong: boolean, completed = false): TypingResult {
    return {
      selectedWord: this.selectedWord,
      charIndex: this.charIndex,
      completed,
      wrong,
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/TypingSystem.test.ts`
Expected: All 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/systems/TypingSystem.ts tests/TypingSystem.test.ts
git commit -m "feat: TypingSystem with prefix match, wrong reset, and word switch"
```

---

### Task 7: BootScene + Asset Placeholders

**Files:**
- Create: `src/scenes/BootScene.ts`
- Create: placeholder asset directories

- [ ] **Step 1: Create asset directories**

```bash
mkdir -p public/assets/sprites public/assets/audio public/assets/fonts
```

- [ ] **Step 2: Create BootScene**

```ts
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const { width, height } = this.cameras.main;
    const barWidth = width * 0.6;
    const barHeight = 20;
    const x = (width - barWidth) / 2;
    const y = height / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRect(0, 0, width, height);

    const bar = this.add.graphics();
    const text = this.add.text(width / 2, y - 30, 'Loading...', {
      fontSize: '16px',
      color: '#4ecdc4',
      fontFamily: 'monospace',
    });
    text.setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0x4ecdc4, 1);
      bar.fillRect(x, y, barWidth * value, barHeight);
    });

    this.load.on('complete', () => {
      bar.destroy();
      bg.destroy();
      text.destroy();
    });
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
```

- [ ] **Step 3: Update main.ts to use BootScene**

```ts
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config/constants';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  parent: document.body,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
    },
  },
  scene: [BootScene],
};

new Phaser.Game(config);
```

- [ ] **Step 4: Verify boot scene renders**

Run: `npx vite --host`
Expected: Loading bar appears, then scene transitions (will error on MenuScene — that's fine for now). Kill server.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/BootScene.ts src/main.ts public/assets/
git commit -m "feat: BootScene with loading bar"
```

---

### Task 8: MenuScene

**Files:**
- Create: `src/scenes/MenuScene.ts`

- [ ] **Step 1: Create MenuScene**

```ts
import Phaser from 'phaser';
import { Difficulty } from '../config/constants';

export class MenuScene extends Phaser.Scene {
  private selectedDifficulty: Difficulty = 'easy';
  private difficultyTexts: Record<Difficulty, Phaser.GameObjects.Text> = {} as any;
  private startText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    this.add.text(width / 2, height * 0.2, 'WORD HOPPER', {
      fontSize: '40px',
      color: '#4ecdc4',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.35, 'Type to survive. Jump to thrive.', {
      fontSize: '14px',
      color: '#86868b',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const difficulties: { key: Difficulty; label: string; color: string }[] = [
      { key: 'easy', label: 'Easy (3-5)', color: '#2ecc71' },
      { key: 'medium', label: 'Medium (6-10)', color: '#ffd93d' },
      { key: 'hard', label: 'Hard (10+)', color: '#e74c3c' },
    ];

    difficulties.forEach(({ key, label, color }, i) => {
      const text = this.add.text(width / 2, height * 0.5 + i * 40, label, {
        fontSize: '20px',
        color,
        fontFamily: 'monospace',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      text.on('pointerdown', () => {
        this.selectedDifficulty = key;
        this.updateHighlight();
      });

      this.difficultyTexts[key] = text;
    });

    this.startText = this.add.text(width / 2, height * 0.78, 'Press SPACE or click to START', {
      fontSize: '16px',
      color: '#86868b',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.startText.on('pointerdown', () => {
      this.startGame();
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      this.startGame();
    });

    this.updateHighlight();
  }

  private updateHighlight(): void {
    const colors: Record<Difficulty, string> = {
      easy: '#2ecc71',
      medium: '#ffd93d',
      hard: '#e74c3c',
    };
    (Object.keys(this.difficultyTexts) as Difficulty[]).forEach((key) => {
      const text = this.difficultyTexts[key];
      if (key === this.selectedDifficulty) {
        text.setAlpha(1);
        text.setFontSize(24);
      } else {
        text.setAlpha(0.4);
        text.setFontSize(20);
      }
    });
  }

  private startGame(): void {
    this.scene.start('GameScene', { difficulty: this.selectedDifficulty });
  }
}
```

- [ ] **Step 2: Register MenuScene in main.ts**

Update `src/main.ts` — import and add MenuScene:

```ts
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config/constants';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  parent: document.body,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
    },
  },
  scene: [BootScene, MenuScene],
};

new Phaser.Game(config);
```

- [ ] **Step 3: Verify menu renders**

Run: `npx vite --host`
Expected: Title, difficulty buttons, click to select, SPACE/click starts (will error on GameScene — that's fine). Kill server.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/MenuScene.ts src/main.ts
git commit -m "feat: MenuScene with difficulty selection"
```

---

### Task 9: Player Entity

**Files:**
- Create: `src/entities/Player.ts`

- [ ] **Step 1: Implement Player**

```ts
import Phaser from 'phaser';
import { PLAYER_X, PLAYER_HEIGHT, PLAYER_WIDTH, GROUND_Y, GRAVITY } from '../config/constants';

export class Player {
  private sprite: Phaser.GameObjects.Rectangle;
  private velocityY = 0;
  private isGrounded = true;

  constructor(scene: Phaser.Scene) {
    this.sprite = scene.add.rectangle(
      PLAYER_X,
      GROUND_Y - PLAYER_HEIGHT / 2,
      PLAYER_WIDTH,
      PLAYER_HEIGHT,
      0x4ecdc4
    );
    this.sprite.setOrigin(0.5, 1);
  }

  update(deltaMs: number): void {
    const dt = deltaMs / 1000;

    if (!this.isGrounded) {
      this.velocityY += GRAVITY * dt;
      this.sprite.y += this.velocityY * dt;

      if (this.sprite.y >= GROUND_Y) {
        this.sprite.y = GROUND_Y;
        this.velocityY = 0;
        this.isGrounded = true;
      }
    }
  }

  jumpTo(targetY: number): void {
    const height = GROUND_Y - targetY;
    if (height <= 0) return;

    const initialVelocity = -Math.sqrt(2 * GRAVITY * height);
    this.velocityY = initialVelocity;
    this.isGrounded = false;
    this.sprite.y = GROUND_Y;
  }

  jumpToWord(wordY: number): void {
    this.jumpTo(wordY);
  }

  getY(): number {
    return this.sprite.y;
  }

  getIsGrounded(): boolean {
    return this.isGrounded;
  }

  getSprite(): Phaser.GameObjects.Rectangle {
    return this.sprite;
  }

  getBounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.sprite.x - PLAYER_WIDTH / 2,
      this.sprite.y - PLAYER_HEIGHT,
      PLAYER_WIDTH,
      PLAYER_HEIGHT
    );
  }

  reset(): void {
    this.sprite.y = GROUND_Y;
    this.velocityY = 0;
    this.isGrounded = true;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/entities/Player.ts
git commit -m "feat: Player entity with jump-to-height physics"
```

---

### Task 10: Obstacle Entity

**Files:**
- Create: `src/entities/Obstacle.ts`

- [ ] **Step 1: Implement Obstacle**

```ts
import Phaser from 'phaser';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  GAP_MIN,
  GAP_MAX,
  SINGLE_OBSTACLE_CHANCE,
  PlantType,
  ObstacleLayout,
} from '../config/constants';

export interface ObstacleConfig {
  layout: ObstacleLayout;
  plantType: PlantType;
  gapY: number;
  gapHeight: number;
  x: number;
  word1: string;
  word1Y: number;
  word2: string;
  word2Y: number;
}

export class Obstacle {
  private upperRect: Phaser.GameObjects.Rectangle | null = null;
  private lowerRect: Phaser.GameObjects.Rectangle | null = null;
  private word1Text: Phaser.GameObjects.Text;
  private word2Text: Phaser.GameObjects.Text | null = null;
  private config: ObstacleConfig;
  private scrollSpeed: number;
  private active = true;

  constructor(scene: Phaser.Scene, config: ObstacleConfig, scrollSpeed: number) {
    this.config = config;
    this.scrollSpeed = scrollSpeed;

    const plantColor = this.getPlantColor(config.plantType);

    if (config.layout !== ObstacleLayout.LowerOnly) {
      const upperHeight = config.gapY - config.gapHeight / 2;
      this.upperRect = scene.add.rectangle(
        config.x,
        upperHeight / 2,
        30,
        upperHeight,
        plantColor
      );
    }

    if (config.layout !== ObstacleLayout.UpperOnly) {
      const lowerTop = config.gapY + config.gapHeight / 2;
      const lowerHeight = CANVAS_HEIGHT - lowerTop;
      this.lowerRect = scene.add.rectangle(
        config.x,
        lowerTop + lowerHeight / 2 - 35,
        30,
        lowerHeight,
        plantColor
      );
    }

    this.word1Text = scene.add.text(config.x, config.word1Y, config.word1, {
      fontSize: '14px',
      color: '#4ecdc4',
      fontFamily: 'monospace',
    });
    this.word1Text.setOrigin(0.5);

    if (config.word2) {
      this.word2Text = scene.add.text(config.x, config.word2Y, config.word2, {
        fontSize: '14px',
        color: '#ffd93d',
        fontFamily: 'monospace',
      });
      this.word2Text.setOrigin(0.5);
    }
  }

  update(dt: number): void {
    const dx = this.scrollSpeed * dt;
    this.config.x -= dx;

    if (this.upperRect) this.upperRect.x -= dx;
    if (this.lowerRect) this.lowerRect.x -= dx;
    this.word1Text.x -= dx;
    if (this.word2Text) this.word2Text.x -= dx;

    if (this.config.x < -50) {
      this.active = false;
    }
  }

  getX(): number {
    return this.config.x;
  }

  isActive(): boolean {
    return this.active;
  }

  getConfig(): ObstacleConfig {
    return this.config;
  }

  highlightWord(wordIndex: 1 | 2, charIndex: number): void {
    const text = wordIndex === 1 ? this.word1Text : this.word2Text;
    if (!text) return;

    const word = wordIndex === 1 ? this.config.word1 : this.config.word2;
    const green = word.slice(0, charIndex);
    const rest = word.slice(charIndex);
    text.setText(`${green}|${rest}`);
    text.setColor('#2ecc71');
  }

  flashWrong(wordIndex: 1 | 2): void {
    const text = wordIndex === 1 ? this.word1Text : this.word2Text;
    if (!text) return;
    text.setColor('#e74c3c');
  }

  fadeUnselected(keepWordIndex: 1 | 2): void {
    const fadeText = keepWordIndex === 1 ? this.word2Text : this.word1Text;
    if (fadeText) fadeText.setAlpha(0.2);
  }

  clearWords(): void {
    this.word1Text.destroy();
    if (this.word2Text) this.word2Text.destroy();
  }

  destroy(): void {
    if (this.upperRect) this.upperRect.destroy();
    if (this.lowerRect) this.lowerRect.destroy();
    if (this.word1Text && this.word1Text.active) this.word1Text.destroy();
    if (this.word2Text && this.word2Text.active) this.word2Text.destroy();
  }

  getUpperBounds(): Phaser.Geom.Rectangle | null {
    if (!this.upperRect) return null;
    const w = 30, h = this.config.gapY - this.config.gapHeight / 2;
    return new Phaser.Geom.Rectangle(this.config.x - w / 2, 0, w, h);
  }

  getLowerBounds(): Phaser.Geom.Rectangle | null {
    if (!this.lowerRect) return null;
    const lowerTop = this.config.gapY + this.config.gapHeight / 2;
    const w = 30;
    const h = CANVAS_HEIGHT - lowerTop;
    return new Phaser.Geom.Rectangle(this.config.x - w / 2, lowerTop, w, h);
  }

  private getPlantColor(type: PlantType): number {
    const colors: Record<PlantType, number> = {
      [PlantType.Cactus]: 0x2ecc71,
      [PlantType.Bramble]: 0x2d5016,
      [PlantType.Mushroom]: 0xe17055,
      [PlantType.VenusFlytrap]: 0x27ae60,
      [PlantType.TreeStump]: 0x8b4513,
      [PlantType.HangingVines]: 0x6ab04c,
    };
    return colors[type];
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/entities/Obstacle.ts
git commit -m "feat: Obstacle entity with plant types, gap, and word rendering"
```

---

### Task 11: ObstacleSpawner

**Files:**
- Create: `src/systems/ObstacleSpawner.ts`

- [ ] **Step 1: Implement ObstacleSpawner**

```ts
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  PLAYER_X,
  GAP_MIN,
  GAP_MAX,
  PLAYER_HEIGHT,
  SINGLE_OBSTACLE_CHANCE,
  TYPING_WINDOW_PER_CHAR,
  DECISION_BUFFER,
  SPACING_SAFETY_FACTOR,
  PlantType,
  ObstacleLayout,
  Difficulty,
  DIFFICULTY_CONFIG,
} from '../config/constants';
import { ObstacleConfig } from '../entities/Obstacle';
import { WordSpawner } from './WordSpawner';
import { SpeedManager } from './SpeedManager';

const PLANT_TYPES = Object.values(PlantType);

export class ObstacleSpawner {
  private wordSpawner: WordSpawner;
  private speedManager: SpeedManager;
  private lastObstacleX = CANVAS_WIDTH;
  private difficulty: Difficulty = 'easy';

  constructor(wordSpawner: WordSpawner, speedManager: SpeedManager) {
    this.wordSpawner = wordSpawner;
    this.speedManager = speedManager;
  }

  setDifficulty(difficulty: Difficulty): void {
    this.difficulty = difficulty;
  }

  canSpawn(currentRightEdge: number): boolean {
    return currentRightEdge <= this.lastObstacleX - this.getMinSpacing();
  }

  generate(currentSpeed: number): ObstacleConfig {
    const layout = this.pickLayout();
    const gapHeight = this.randomRange(GAP_MIN, GAP_MAX);
    const gapY = this.computeGapY(layout, gapHeight);
    const plantType = PLANT_TYPES[Math.floor(Math.random() * PLANT_TYPES.length)];

    const x = CANVAS_WIDTH + 50;

    let word1: string;
    let word2 = '';
    let word1Y: number;
    let word2Y = 0;

    if (layout === ObstacleLayout.UpperLower) {
      const pair = this.wordSpawner.generatePair();
      word1 = pair.word1;
      word2 = pair.word2;
      word1Y = gapY - gapHeight / 4;
      word2Y = gapY + gapHeight / 4;
    } else {
      word1 = this.wordSpawner.generateSingle();
      if (layout === ObstacleLayout.UpperOnly) {
        word1Y = gapY + gapHeight / 3;
      } else {
        word1Y = gapY - gapHeight / 3;
      }
    }

    this.lastObstacleX = x;

    return {
      layout,
      plantType,
      gapY,
      gapHeight,
      x,
      word1,
      word1Y,
      word2,
      word2Y,
    };
  }

  onObstaclePassed(x: number): void {
    this.lastObstacleX = x;
  }

  private getMinSpacing(): number {
    const config = DIFFICULTY_CONFIG[this.difficulty];
    const avgCharCount = (config.minLen + Math.min(config.maxLen, 15)) / 2;
    const typingWindow = avgCharCount * TYPING_WINDOW_PER_CHAR + DECISION_BUFFER;
    const speed = this.speedManager.getSpeed();
    const compression = this.speedManager.getCompressionFactor();
    return speed * typingWindow * SPACING_SAFETY_FACTOR * compression;
  }

  private pickLayout(): ObstacleLayout {
    if (Math.random() < SINGLE_OBSTACLE_CHANCE) {
      return Math.random() < 0.5 ? ObstacleLayout.UpperOnly : ObstacleLayout.LowerOnly;
    }
    return ObstacleLayout.UpperLower;
  }

  private computeGapY(layout: ObstacleLayout, gapHeight: number): number {
    const minY = gapHeight / 2 + 20;
    const maxY = CANVAS_HEIGHT - 35 - gapHeight / 2 - 10;

    if (layout === ObstacleLayout.UpperOnly) {
      return this.randomRange(minY, minY + (maxY - minY) * 0.4);
    }
    if (layout === ObstacleLayout.LowerOnly) {
      return this.randomRange(minY + (maxY - minY) * 0.6, maxY);
    }
    return this.randomRange(minY, maxY);
  }

  private randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  reset(): void {
    this.lastObstacleX = CANVAS_WIDTH;
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/systems/ObstacleSpawner.ts
git commit -m "feat: ObstacleSpawner with spacing formula and random layouts"
```

---

### Task 12: GameScene (Core Integration)

**Files:**
- Create: `src/scenes/GameScene.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Create GameScene**

```ts
import Phaser from 'phaser';
import { Difficulty, PLAYER_X, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants';
import { Player } from '../entities/Player';
import { Obstacle, ObstacleConfig } from '../entities/Obstacle';
import { TypingSystem } from '../systems/TypingSystem';
import { WordSpawner } from '../systems/WordSpawner';
import { ScoreSystem } from '../systems/ScoreSystem';
import { SpeedManager } from '../systems/SpeedManager';
import { ObstacleSpawner } from '../systems/ObstacleSpawner';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private obstacles: Obstacle[] = [];
  private typingSystem = new TypingSystem();
  private wordSpawner = new WordSpawner();
  private scoreSystem = new ScoreSystem();
  private speedManager = new SpeedManager();
  private obstacleSpawner!: ObstacleSpawner;
  private difficulty: Difficulty = 'easy';
  private scoreText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private ground!: Phaser.GameObjects.Rectangle;
  private distance = 0;
  private alive = true;
  private tickAccumulator = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  async init(data: { difficulty: Difficulty }): Promise<void> {
    this.difficulty = data.difficulty || 'easy';
    await this.wordSpawner.loadWords(this.difficulty);
  }

  create(): void {
    this.alive = true;
    this.distance = 0;
    this.obstacles = [];
    this.scoreSystem.reset();
    this.speedManager.reset();
    this.typingSystem = new TypingSystem();
    this.obstacleSpawner = new ObstacleSpawner(this.wordSpawner, this.speedManager);
    this.obstacleSpawner.setDifficulty(this.difficulty);

    this.add.rectangle(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0x1a1a2e).setOrigin(0);

    this.ground = this.add.rectangle(
      CANVAS_WIDTH / 2,
      GROUND_Y + 17,
      CANVAS_WIDTH,
      35,
      0x2d3436
    );
    this.add.rectangle(CANVAS_WIDTH / 2, GROUND_Y + 1, CANVAS_WIDTH, 2, 0x636e72);

    this.player = new Player(this);

    const hudBg = this.add.rectangle(CANVAS_WIDTH - 80, 30, 150, 45, 0x000000, 0.6);
    hudBg.setOrigin(0.5);
    this.scoreText = this.add.text(CANVAS_WIDTH - 140, 18, 'Score: 0', {
      fontSize: '14px',
      color: '#4ecdc4',
      fontFamily: 'monospace',
    });
    this.speedText = this.add.text(CANVAS_WIDTH - 140, 36, 'Speed: 1.0x', {
      fontSize: '14px',
      color: '#ffd93d',
      fontFamily: 'monospace',
    });

    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (!this.alive) return;
      if (event.key.length !== 1) return;
      this.handleTyping(event.key);
    });

    this.spawnObstacle();
  }

  update(_time: number, delta: number): void {
    if (!this.alive) return;

    const dt = delta / 1000;
    const speed = this.speedManager.getSpeed();

    this.distance += speed * dt;
    this.speedManager.updateDistance(this.distance);

    this.player.update(delta);

    this.tickAccumulator += dt;
    if (this.tickAccumulator >= 0.1) {
      this.scoreSystem.addTick();
      this.tickAccumulator -= 0.1;
    }

    for (const obstacle of this.obstacles) {
      obstacle.update(dt);
    }

    this.checkCollisions();
    this.cleanupObstacles();
    this.checkSpawn();
    this.updateHUD();
  }

  private handleTyping(key: string): void {
    const result = this.typingSystem.onKeyPress(key);

    if (result.wrong) {
      const nearest = this.getNearestObstacle();
      if (nearest) {
        const wordIdx = this.typingSystem.getProgress().selectedWord
          ? (nearest.getConfig().word1 === this.typingSystem.getProgress().selectedWord ? 1 : 2)
          : 1;
        nearest.flashWrong(wordIdx);
      }
      return;
    }

    const nearest = this.getNearestObstacle();
    if (!nearest) return;

    const config = nearest.getConfig();
    const wordIdx = config.word1 === result.selectedWord ? 1 : 2;
    nearest.highlightWord(wordIdx, result.charIndex);

    if (result.charIndex === 1) {
      nearest.fadeUnselected(wordIdx);
    }

    if (result.completed) {
      const targetY = wordIdx === 1 ? config.word1Y : config.word2Y;
      this.player.jumpToWord(targetY);
      this.scoreSystem.addWordBonus(result.selectedWord, this.speedManager.getSpeedMultiplier());
      nearest.clearWords();

      this.typingSystem.setWords('', '');
      this.time.delayedCall(300, () => {
        this.spawnObstacle();
      });
    }
  }

  private spawnObstacle(): void {
    const speed = this.speedManager.getSpeed();
    const config = this.obstacleSpawner.generate(speed);
    const obstacle = new Obstacle(this, config, speed);
    this.obstacles.push(obstacle);

    if (config.word2) {
      this.typingSystem.setWords(config.word1, config.word2);
    } else {
      this.typingSystem.setSingleWord(config.word1);
    }
  }

  private getNearestObstacle(): Obstacle | null {
    const upcoming = this.obstacles.filter(
      (o) => o.isActive() && o.getX() > PLAYER_X - 10
    );
    if (upcoming.length === 0) return null;
    upcoming.sort((a, b) => a.getX() - b.getX());
    return upcoming[0];
  }

  private checkCollisions(): void {
    const playerBounds = this.player.getBounds();

    for (const obstacle of this.obstacles) {
      if (!obstacle.isActive()) continue;
      if (obstacle.getX() < PLAYER_X - 30 || obstacle.getX() > PLAYER_X + 30) continue;

      const upper = obstacle.getUpperBounds();
      const lower = obstacle.getLowerBounds();

      if (upper && Phaser.Geom.Rectangle.Overlaps(playerBounds, upper)) {
        this.die();
        return;
      }
      if (lower && Phaser.Geom.Rectangle.Overlaps(playerBounds, lower)) {
        this.die();
        return;
      }
    }
  }

  private die(): void {
    this.alive = false;
    this.player.destroy();
    this.time.delayedCall(500, () => {
      this.scene.start('DeathScene', {
        score: this.scoreSystem.getScore(),
        wordsTyped: this.scoreSystem.getWordsTyped(),
        wpm: this.scoreSystem.getWPM(this.distance / this.speedManager.getSpeed()),
        bestWord: this.scoreSystem.getBestWord(),
        difficulty: this.difficulty,
      });
    });
  }

  private cleanupObstacles(): void {
    this.obstacles = this.obstacles.filter((o) => {
      if (!o.isActive()) {
        o.destroy();
        return false;
      }
      return true;
    });
  }

  private checkSpawn(): void {
    const rightEdge = Math.max(...this.obstacles.map((o) => o.getX()), 0);
    if (this.obstacleSpawner.canSpawn(rightEdge)) {
      this.spawnObstacle();
    }
  }

  private updateHUD(): void {
    this.scoreText.setText(`Score: ${this.scoreSystem.getScore().toLocaleString()}`);
    this.speedText.setText(`Speed: ${this.speedManager.getSpeedMultiplier().toFixed(1)}x`);
  }
}
```

- [ ] **Step 2: Register GameScene in main.ts**

```ts
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config/constants';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  parent: document.body,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
    },
  },
  scene: [BootScene, MenuScene, GameScene],
};

new Phaser.Game(config);
```

- [ ] **Step 3: Verify game boots and is playable**

Run: `npx vite --host`
Expected: Title → select difficulty → start → character appears, obstacles scroll, typing works, jumping works, collision kills.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameScene.ts src/main.ts
git commit -m "feat: GameScene with full gameplay loop"
```

---

### Task 13: DeathScene

**Files:**
- Create: `src/scenes/DeathScene.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Create DeathScene**

```ts
import Phaser from 'phaser';
import { Difficulty } from '../config/constants';

export interface DeathData {
  score: number;
  wordsTyped: number;
  wpm: number;
  bestWord: string;
  difficulty: Difficulty;
}

export class DeathScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DeathScene' });
  }

  create(data: DeathData): void {
    const { width, height } = this.cameras.main;

    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

    this.add.text(width / 2, height * 0.15, 'GAME OVER', {
      fontSize: '36px',
      color: '#e74c3c',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const stats = [
      `Score: ${data.score.toLocaleString()}`,
      `Words Typed: ${data.wordsTyped}`,
      `WPM: ${data.wpm}`,
      `Best Word: ${data.bestWord || '—'}`,
      `Difficulty: ${data.difficulty}`,
    ];

    stats.forEach((line, i) => {
      this.add.text(width / 2, height * 0.35 + i * 32, line, {
        fontSize: '18px',
        color: '#f5f5f7',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    });

    const restartText = this.add.text(width / 2, height * 0.82, 'Press SPACE to restart', {
      fontSize: '16px',
      color: '#86868b',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard!.on('keydown-SPACE', () => {
      this.scene.start('MenuScene');
    });
  }
}
```

- [ ] **Step 2: Register DeathScene in main.ts**

```ts
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { DeathScene } from './scenes/DeathScene';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config/constants';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  parent: document.body,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
    },
  },
  scene: [BootScene, MenuScene, GameScene, DeathScene],
};

new Phaser.Game(config);
```

- [ ] **Step 3: Verify full loop: menu → game → death → menu**

Run: `npx vite --host`
Expected: Full game loop works. Die → score screen → SPACE → back to menu.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/DeathScene.ts src/main.ts
git commit -m "feat: DeathScene with score stats and restart"
```

---

### Task 14: Run All Tests & Final Verification

**Files:**
- No new files

- [ ] **Step 1: Run unit tests**

Run: `npx vitest run`
Expected: All tests pass (WordSpawner, ScoreSystem, SpeedManager, TypingSystem).

- [ ] **Step 2: Run TypeScript type check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Build for production**

Run: `npx vite build`
Expected: Build succeeds, output in `dist/`.

- [ ] **Step 4: Manual playtest checklist**

Run: `npx vite --host`, then verify:

- [ ] Title screen renders
- [ ] Can select Easy/Medium/Hard
- [ ] SPACE or click starts game
- [ ] Character appears on ground, facing right
- [ ] Obstacles scroll from right to left
- [ ] Words appear in obstacle gaps, scroll with them
- [ ] Typing first letter selects word, letter turns green
- [ ] Wrong letter flashes red, resets
- [ ] Can switch to other word after mistake
- [ ] Completing word makes character jump to word height
- [ ] Hitting obstacle = death → score screen
- [ ] Score screen shows stats
- [ ] SPACE returns to menu
- [ ] Speed increases over distance
- [ ] Upper-only obstacles can be skipped (no jump, no bonus)
- [ ] Lower-only obstacles must be typed or death

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: Word Hopper MVP complete — playable endless runner + typing game"
```
